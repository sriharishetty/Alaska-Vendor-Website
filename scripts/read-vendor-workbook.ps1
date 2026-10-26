param(
    [Parameter(Mandatory = $true)]
    [string]$WorkbookPath
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-ZipText([System.IO.Compression.ZipArchive]$archive, [string]$entryName) {
    $entry = $archive.GetEntry($entryName)
    if (-not $entry) { throw "Missing workbook entry: $entryName" }
    $reader = [System.IO.StreamReader]::new($entry.Open())
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Get-ColumnNumber([string]$reference) {
    $letters = ($reference -replace "\d", "")
    $number = 0
    foreach ($letter in $letters.ToCharArray()) { $number = ($number * 26) + ([int][char]$letter - [int][char]'A' + 1) }
    return $number
}

$archive = [System.IO.Compression.ZipFile]::OpenRead($WorkbookPath)
try {
    [xml]$sharedXml = Get-ZipText $archive "xl/sharedStrings.xml"
    $namespace = [System.Xml.XmlNamespaceManager]::new($sharedXml.NameTable)
    $namespace.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    $sharedStrings = @($sharedXml.SelectNodes("//x:si", $namespace) | ForEach-Object { $_.InnerText })

    [xml]$sheetXml = Get-ZipText $archive "xl/worksheets/sheet1.xml"
    $sheetNs = [System.Xml.XmlNamespaceManager]::new($sheetXml.NameTable)
    $sheetNs.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    $rows = @()

    foreach ($row in $sheetXml.SelectNodes("//x:sheetData/x:row", $sheetNs)) {
        if ([int]$row.r -lt 2 -or [int]$row.r -gt 39) { continue }
        $values = @{}
        foreach ($cell in $row.SelectNodes("x:c", $sheetNs)) {
            $column = Get-ColumnNumber $cell.r
            $valueNode = $cell.SelectSingleNode("x:v", $sheetNs)
            $value = ""
            if ($valueNode) {
                if ($cell.t -eq "s") { $value = $sharedStrings[[int]$valueNode.InnerText] }
                else { $value = $valueNode.InnerText }
            }
            $values[$column] = $value
        }
        $rows += [ordered]@{
            sourceRow = [int]$row.r
            systemName = $values[1]
            category = $values[2]
            vendorCompanyName = $values[3]
            prodOpsEscalationProcess = $values[4]
            contactNumbers = $values[5]
            emailAddress = $values[6]
            vendorPOC = $values[7]
            aagItsPOC = $values[8]
            aagItsTeam = $values[9]
            infoUpdatedDate = $values[11]
            infoUpdatedBy = $values[12]
            infoApprovedDate = $values[13]
            infoApprovedBy = $values[14]
        }
    }
    $rows | ConvertTo-Json -Depth 4
}
finally {
    $archive.Dispose()
}
