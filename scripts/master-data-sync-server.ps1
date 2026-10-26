$ErrorActionPreference = "Continue"
$port = 47832
$prefix = "http://localhost:$port/"
$projectRoot = Split-Path -Parent $PSScriptRoot
$targetPath = Join-Path $projectRoot "js\data\master-data.js"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Output "Master Data Sync Server listening on $prefix -> $targetPath"
} catch {
    Write-Error "Failed to start listener on $prefix : $_"
    exit 1
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "*")
        $response.Headers.Add("Access-Control-Allow-Private-Network", "true")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.Close()
            continue
        }

        if ($request.HttpMethod -eq "GET" -and $request.Url.AbsolutePath -eq "/health") {
            $bytes = $utf8NoBom.GetBytes('{"ok":true}')
            $response.ContentType = "application/json; charset=utf-8"
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ($request.HttpMethod -eq "POST" -and $request.Url.AbsolutePath -eq "/save-master-data") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()

            if ($body -and $body.Contains("window.masterData = defaultData;")) {
                [System.IO.File]::WriteAllText($targetPath, $body, $utf8NoBom)
                $bytes = $utf8NoBom.GetBytes('{"ok":true,"saved":true}')
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $bytes = $utf8NoBom.GetBytes('{"ok":false,"error":"Invalid master-data.js payload"}')
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 400
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $response.Close()
            continue
        }

        $response.StatusCode = 404
        $response.Close()
    } catch {
        # Ignore transient request errors and continue listening
    }
}
