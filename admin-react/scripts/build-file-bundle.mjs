import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, "../src");
const outputDir = resolve(here, "../../admin-react-dist");
const rootJsDir = resolve(here, "../../js");
const preambleCachePath = resolve(here, "./react-runtime-preamble.js");

const HTML_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
  middot: "\u00B7",
  times: "\u00D7",
  rarr: "\u2192",
  larr: "\u2190",
  mdash: "\u2014",
  ndash: "\u2013",
  bull: "\u2022",
  copy: "\u00A9",
  reg: "\u00AE"
};

function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (full, name) => (name in HTML_ENTITIES ? HTML_ENTITIES[name] : full));
}

function cleanJsxText(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines.length === 1) {
    return decodeHtmlEntities(lines[0]);
  }
  const cleaned = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\t/g, " ");
    if (i !== 0) line = line.replace(/^ +/, "");
    if (i !== lines.length - 1) line = line.replace(/ +$/, "");
    if (line.length > 0) cleaned.push(line);
  }
  return decodeHtmlEntities(cleaned.join(" "));
}

function readBalancedBraces(code, startIdx) {
  // startIdx points at '{'
  let depth = 0;
  let i = startIdx;
  const len = code.length;
  while (i < len) {
    const ch = code[i];
    if (ch === "'" || ch === '"') {
      const quote = ch;
      i++;
      while (i < len && code[i] !== quote) {
        if (code[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }
    if (ch === "`") {
      i++;
      while (i < len && code[i] !== "`") {
        if (code[i] === "\\") {
          i += 2;
          continue;
        }
        if (code[i] === "$" && code[i + 1] === "{") {
          const inner = readBalancedBraces(code, i + 1);
          i = inner.end;
          continue;
        }
        i++;
      }
      i++;
      continue;
    }
    if (ch === "/" && code[i + 1] === "/") {
      i += 2;
      while (i < len && code[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && code[i + 1] === "*") {
      i += 2;
      while (i < len && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return { content: code.slice(startIdx + 1, i), end: i + 1 };
      }
    }
    i++;
  }
  throw new Error(`Unbalanced '{' starting near: ${code.slice(startIdx, startIdx + 80)}`);
}

function isJsxStartAllowed(prevNonWsChar, prevWord) {
  if (!prevNonWsChar) return true;
  if ("([{:;,?=!&|+-~^".includes(prevNonWsChar)) return true;
  if (prevNonWsChar === ">" && prevWord === "=>") return true;
  if (["return", "case", "throw", "else", "yield", "await"].includes(prevWord)) return true;
  return false;
}

function parseJsxElement(code, startIdx) {
  let i = startIdx; // points at '<'
  const len = code.length;
  i++; // skip '<'

  // Fragment <> ... </>
  if (code[i] === ">") {
    i++; // skip '>'
    const childrenResult = parseJsxChildren(code, i, "");
    const args = ["React.Fragment", "null", ...childrenResult.children];
    return {
      expr: `React.createElement(${args.join(", ")})`,
      end: childrenResult.end
    };
  }

  // Read tag name
  const tagMatch = code.slice(i).match(/^[A-Za-z_$][A-Za-z0-9_$.-]*/);
  if (!tagMatch) {
    throw new Error(`Invalid JSX tag at ${code.slice(startIdx, startIdx + 60)}`);
  }
  const tagName = tagMatch[0];
  i += tagName.length;
  const tagExpr = /^[a-z]/.test(tagName) ? JSON.stringify(tagName) : tagName;

  // Read attributes
  const propEntries = [];
  const spreads = [];

  while (i < len) {
    while (i < len && /\s/.test(code[i])) i++;
    if (code[i] === "/" && code[i + 1] === ">") {
      i += 2;
      const propsExpr = buildPropsExpr(propEntries, spreads);
      return {
        expr: `React.createElement(${tagExpr}, ${propsExpr})`,
        end: i
      };
    }
    if (code[i] === ">") {
      i++;
      const childrenResult = parseJsxChildren(code, i, tagName);
      const propsExpr = buildPropsExpr(propEntries, spreads);
      const args = [tagExpr, propsExpr, ...childrenResult.children];
      return {
        expr: `React.createElement(${args.join(", ")})`,
        end: childrenResult.end
      };
    }
    if (code[i] === "/" && code[i + 1] === "*") {
      i += 2;
      while (i < len && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (code[i] === "{") {
      const braced = readBalancedBraces(code, i);
      const trimmed = braced.content.trim();
      if (trimmed.startsWith("...")) {
        spreads.push(transformJsxInJs(trimmed.slice(3)));
      }
      i = braced.end;
      continue;
    }

    const attrMatch = code.slice(i).match(/^[A-Za-z_:][A-Za-z0-9_:.-]*/);
    if (!attrMatch) {
      throw new Error(`Unexpected token in JSX attributes of <${tagName}> near: ${code.slice(i, i + 60)}`);
    }
    const attrName = attrMatch[0];
    i += attrName.length;
    while (i < len && /\s/.test(code[i])) i++;

    if (code[i] === "=") {
      i++;
      while (i < len && /\s/.test(code[i])) i++;
      if (code[i] === '"' || code[i] === "'") {
        const quote = code[i];
        let strVal = "";
        i++;
        while (i < len && code[i] !== quote) {
          if (code[i] === "\\") {
            strVal += code[i] + code[i + 1];
            i += 2;
          } else {
            strVal += code[i];
            i++;
          }
        }
        i++;
        propEntries.push(`${JSON.stringify(attrName)}: ${JSON.stringify(decodeHtmlEntities(strVal))}`);
      } else if (code[i] === "{") {
        const braced = readBalancedBraces(code, i);
        const valExpr = transformJsxInJs(braced.content.trim());
        propEntries.push(`${JSON.stringify(attrName)}: (${valExpr})`);
        i = braced.end;
      } else {
        throw new Error(`Unsupported JSX attribute value for ${attrName} near ${code.slice(i, i + 40)}`);
      }
    } else {
      propEntries.push(`${JSON.stringify(attrName)}: true`);
    }
  }

  throw new Error(`Unclosed JSX opening tag <${tagName}>`);
}

function buildPropsExpr(propEntries, spreads) {
  if (propEntries.length === 0 && spreads.length === 0) return "null";
  if (spreads.length === 0) {
    return `{ ${propEntries.join(", ")} }`;
  }
  const parts = [...spreads.map((s) => `(${s})`)];
  if (propEntries.length > 0) {
    parts.push(`{ ${propEntries.join(", ")} }`);
  }
  return `Object.assign({}, ${parts.join(", ")})`;
}

function parseJsxChildren(code, startIdx, closingTagName) {
  let i = startIdx;
  const len = code.length;
  const children = [];

  while (i < len) {
    // Check for closing tag </...>
    if (code[i] === "<" && code[i + 1] === "/") {
      i += 2;
      while (i < len && /\s/.test(code[i])) i++;
      const closeMatch = code.slice(i).match(/^[A-Za-z_$][A-Za-z0-9_$.-]*/);
      const foundClose = closeMatch ? closeMatch[0] : "";
      if (foundClose) i += foundClose.length;
      while (i < len && /\s/.test(code[i])) i++;
      if (code[i] !== ">") {
        throw new Error(`Expected '>' in closing tag </${foundClose}> near ${code.slice(i, i + 40)}`);
      }
      i++;
      if (foundClose !== closingTagName) {
        throw new Error(`Mismatched JSX closing tag: expected </${closingTagName}>, got </${foundClose}>`);
      }
      return { children, end: i };
    }

    // Check for child JSX element
    if (code[i] === "<" && (code[i + 1] === ">" || /[A-Za-z_$]/.test(code[i + 1] || ""))) {
      const childEl = parseJsxElement(code, i);
      children.push(childEl.expr);
      i = childEl.end;
      continue;
    }

    // Check for { expression }
    if (code[i] === "{") {
      const braced = readBalancedBraces(code, i);
      i = braced.end;
      // Strip block comments inside { /* ... */ }
      const withoutComments = braced.content
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
        .trim();
      if (withoutComments.length > 0) {
        children.push(`(${transformJsxInJs(braced.content.trim())})`);
      }
      continue;
    }

    // Otherwise read plain JSX text until next '<' or '{'
    let textStart = i;
    while (i < len && code[i] !== "<" && code[i] !== "{") {
      i++;
    }
    const rawText = code.slice(textStart, i);
    const cleaned = cleanJsxText(rawText);
    if (cleaned.length > 0) {
      children.push(JSON.stringify(cleaned));
    }
  }

  throw new Error(`Unclosed JSX element <${closingTagName}>`);
}

export function transformJsxInJs(code) {
  let out = "";
  let i = 0;
  const len = code.length;
  let prevNonWsChar = "";
  let prevWord = "";

  while (i < len) {
    const ch = code[i];

    // Line comment
    if (ch === "/" && code[i + 1] === "/") {
      const start = i;
      i += 2;
      while (i < len && code[i] !== "\n") i++;
      out += code.slice(start, i);
      continue;
    }

    // Block comment
    if (ch === "/" && code[i + 1] === "*") {
      const start = i;
      i += 2;
      while (i < len && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      out += code.slice(start, i);
      continue;
    }

    // Single or double quoted string
    if (ch === "'" || ch === '"') {
      const quote = ch;
      const start = i;
      i++;
      while (i < len && code[i] !== quote) {
        if (code[i] === "\\") i++;
        i++;
      }
      i++;
      out += code.slice(start, i);
      prevNonWsChar = quote;
      prevWord = "";
      continue;
    }

    // Template literal
    if (ch === "`") {
      out += "`";
      i++;
      while (i < len && code[i] !== "`") {
        if (code[i] === "\\") {
          out += code[i] + (code[i + 1] || "");
          i += 2;
          continue;
        }
        if (code[i] === "$" && code[i + 1] === "{") {
          const braced = readBalancedBraces(code, i + 1);
          out += "${" + transformJsxInJs(braced.content) + "}";
          i = braced.end;
          continue;
        }
        out += code[i];
        i++;
      }
      if (i < len && code[i] === "`") {
        out += "`";
        i++;
      }
      prevNonWsChar = "`";
      prevWord = "";
      continue;
    }

    // Regex literal check (when '/' follows operator/punctuation)
    if (
      ch === "/" &&
      code[i + 1] !== "/" &&
      code[i + 1] !== "*" &&
      isJsxStartAllowed(prevNonWsChar, prevWord)
    ) {
      const start = i;
      i++;
      let inCharClass = false;
      while (i < len) {
        if (code[i] === "\\") {
          i += 2;
          continue;
        }
        if (code[i] === "[") inCharClass = true;
        else if (code[i] === "]") inCharClass = false;
        else if (code[i] === "/" && !inCharClass) {
          i++;
          while (i < len && /[gimsuy]/.test(code[i])) i++;
          break;
        } else if (code[i] === "\n") {
          break;
        }
        i++;
      }
      out += code.slice(start, i);
      prevNonWsChar = "/";
      prevWord = "";
      continue;
    }

    // Potential JSX element start
    if (
      ch === "<" &&
      (code[i + 1] === ">" || /[A-Za-z_$]/.test(code[i + 1] || "")) &&
      isJsxStartAllowed(prevNonWsChar, prevWord)
    ) {
      const parsed = parseJsxElement(code, i);
      out += parsed.expr;
      i = parsed.end;
      prevNonWsChar = ")";
      prevWord = "";
      continue;
    }

    // Identifier / keyword tracking
    if (/[A-Za-z_$]/.test(ch)) {
      const match = code.slice(i).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
      const word = match[0];
      out += word;
      i += word.length;
      prevNonWsChar = word[word.length - 1];
      prevWord = word;
      continue;
    }

    if (ch === "=" && code[i + 1] === ">") {
      out += "=>";
      i += 2;
      prevNonWsChar = ">";
      prevWord = "=>";
      continue;
    }

    if (!/\s/.test(ch)) {
      prevNonWsChar = ch;
      prevWord = "";
    }

    out += ch;
    i++;
  }

  return out;
}

function stripImportsAndExports(code) {
  let transformed = code;

  // Replace import.meta references safely for IIFE browser runtime
  transformed = transformed.replace(/\btypeof\s+import\.meta\s*!==\s*["']undefined["']/g, "true");
  transformed = transformed.replace(/\bimport\.meta\.env\b/g, "(window.__VITE_ENV__ || {})");
  transformed = transformed.replace(/\bimport\.meta\b/g, "({ env: window.__VITE_ENV__ || {} })");

  // Remove multi-line and single-line ES imports
  transformed = transformed.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, "");
  transformed = transformed.replace(/^\s*import\s+['"][^'"]+['"]\s*;?\s*$/gm, "");

  // Convert `export default function Name` -> `function Name`
  transformed = transformed.replace(/^\s*export\s+default\s+function\s+/gm, "function ");
  // Convert `export default Identifier;` -> ``
  transformed = transformed.replace(/^\s*export\s+default\s+[A-Za-z0-9_$]+\s*;?\s*$/gm, "");
  // Convert `export function` / `export async function` / `export const` / `export let`
  transformed = transformed.replace(/^\s*export\s+(async\s+function|function|const|let|var)\s+/gm, "$1 ");

  return transformed;
}

async function getReactPreamble() {
  try {
    await access(preambleCachePath);
    return await readFile(preambleCachePath, "utf8");
  } catch {
    const existingAdminBundle = await readFile(resolve(outputDir, "assets/admin.js"), "utf8");
    const markerIdx = existingAdminBundle.indexOf("// src/main.jsx");
    if (markerIdx === -1) {
      throw new Error("Could not find // src/main.jsx marker in admin.js to extract React 19 preamble");
    }
    const preamble = existingAdminBundle.slice(0, markerIdx);
    await writeFile(preambleCachePath, preamble, "utf8");
    return preamble;
  }
}

async function compileModuleList(modulePaths) {
  const chunks = [];
  for (const relPath of modulePaths) {
    const absPath = resolve(srcDir, relPath);
    const raw = await readFile(absPath, "utf8");
    const withoutImports = stripImportsAndExports(raw);
    const compiled = transformJsxInJs(withoutImports);
    chunks.push(`  // src/${relPath}\n${compiled}`);
  }
  return chunks.join("\n\n");
}

await mkdir(resolve(outputDir, "assets"), { recursive: true });
await mkdir(rootJsDir, { recursive: true });

const reactPreamble = await getReactPreamble();
const reactAliases = `
  var React = __toESM(require_react(), 1);
  var { useState, useEffect, useMemo, useCallback, useRef, Fragment, StrictMode } = React;
  var ReactDOM = __toESM(require_react_dom(), 1);
  var { createPortal } = ReactDOM;
  var ReactDOMClient = __toESM(require_client(), 1);
  var { createRoot } = ReactDOMClient;
  var logo = "../public/images/alaska-logo.png";
`;

// 1b. Build js/vendor-case-status.bundle.js
const vcsModulesCode = await compileModuleList([
  "services/vendorCaseStatusService.js",
  "pages/VendorCaseStatus.jsx",
  "vendor-case-status-main.jsx"
]);

const vcsBundle = `${reactPreamble}\n${reactAliases}\n${vcsModulesCode}\n})();\n`;
new vm.Script(vcsBundle, { filename: "vendor-case-status.bundle.js" });
await writeFile(resolve(rootJsDir, "vendor-case-status.bundle.js"), vcsBundle, "utf8");

// 1c. Build js/reports.bundle.js (and js/reports.js)
const reportsModulesCode = await compileModuleList([
  "services/reportsService.js",
  "components/reports/ReportHeader.jsx",
  "components/reports/ReportKpiCards.jsx",
  "components/reports/ApplicationHealth.jsx",
  "components/reports/SeverityOverview.jsx",
  "components/reports/VendorInsights.jsx",
  "components/reports/OperationalResponseOverview.jsx",
  "components/reports/DataQualitySummary.jsx",
  "pages/Reports.jsx",
  "reports-main.jsx"
]);

const reportsBundle = `${reactPreamble}\n${reactAliases}\n${reportsModulesCode}\n})();\n`;
new vm.Script(reportsBundle, { filename: "reports.bundle.js" });
await writeFile(resolve(rootJsDir, "reports.bundle.js"), reportsBundle, "utf8");
await writeFile(resolve(rootJsDir, "reports.js"), reportsBundle, "utf8");

// 1d. Build js/favorites.bundle.js (and js/favorites.js)
const favoritesModulesCode = await compileModuleList([
  "services/favoritesService.js",
  "components/favorites/FavoritesHeader.jsx",
  "components/favorites/FavoritesSummaryCards.jsx",
  "components/favorites/FavoriteResourceCard.jsx",
  "components/favorites/FavoritesEmptyState.jsx",
  "components/favorites/FavoriteDetailsModal.jsx",
  "pages/Favorites.jsx",
  "favorites-main.jsx"
]);

const favoritesBundle = `${reactPreamble}\n${reactAliases}\n${favoritesModulesCode}\n})();\n`;
new vm.Script(favoritesBundle, { filename: "favorites.bundle.js" });
await writeFile(resolve(rootJsDir, "favorites.bundle.js"), favoritesBundle, "utf8");
await writeFile(resolve(rootJsDir, "favorites.js"), favoritesBundle, "utf8");

// Syntax-verify ground-stops.js and vendors.js as well
const groundStopsJs = await readFile(resolve(rootJsDir, "ground-stops.js"), "utf8");
new vm.Script(groundStopsJs, { filename: "ground-stops.js" });
const vendorsJs = await readFile(resolve(rootJsDir, "vendors.js"), "utf8");
new vm.Script(vendorsJs, { filename: "vendors.js" });

// 2. Build admin-react-dist/assets/admin.js
const adminModulesCode = (
  await compileModuleList([
    "Login.jsx",
    "VendorEditor.jsx",
    "App.jsx"
  ])
).replace("function Login(", "var LoginScreen = Login;\nfunction Login(")
 .replace(/\bconst ADMINS\s*=/g, "var ADMINS =");
const motionJs = await readFile(resolve(rootJsDir, "motion.js"), "utf8");

const adminBundle = `${reactPreamble}\n${reactAliases}\n${adminModulesCode}\n\n  // ../js/motion.js\n${motionJs}\n\n  // src/main.jsx\n  createRoot(document.getElementById("root")).render(React.createElement(StrictMode, null, React.createElement(App, null)));\n})();\n`;
new vm.Script(adminBundle, { filename: "admin.js" });
await writeFile(resolve(outputDir, "assets/admin.js"), adminBundle, "utf8");

// 2b. Build admin-react-dist/assets/admin.css
const stylesCss = (await readFile(resolve(srcDir, "styles.css"), "utf8")).replace(
  /url\(["']?\.\.\/\.\.\/public\/images\/dashboard-bg\.png["']?\)/g,
  'url("./dashboard-bg.png")'
);
const loginCss = await readFile(resolve(srcDir, "login.css"), "utf8");
const adminUiCss = (await readFile(resolve(srcDir, "admin-ui.css"), "utf8")).replace(
  /url\(["']?\.\.\/\.\.\/public\/images\/dashboard-bg\.png["']?\)/g,
  'url("./dashboard-bg.png")'
);
const designTokensCss = await readFile(resolve(here, "../../css/design-tokens.css"), "utf8");
const airlineAdminCss = (await readFile(resolve(srcDir, "airline-admin.css"), "utf8")).replace(
  /^@import\s+["']\.\.\/\.\.\/css\/design-tokens\.css["'];?\s*/m,
  ""
);

const adminCssBundle = [
  "/* src/styles.css */",
  stylesCss.trim(),
  "",
  "/* src/login.css */",
  loginCss.trim(),
  "",
  "/* src/admin-ui.css */",
  adminUiCss.trim(),
  "",
  "/* ../css/design-tokens.css */",
  designTokensCss.trim(),
  "",
  "/* src/airline-admin.css */",
  airlineAdminCss.trim(),
  ""
].join("\n");

await writeFile(resolve(outputDir, "assets/admin.css"), adminCssBundle, "utf8");

// 3. Update admin-react-dist/index.html
await writeFile(
  resolve(outputDir, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Production Operations | Admin</title>
    <link rel="icon" type="image/png" href="../public/images/favicon.png" />
    <link rel="stylesheet" href="./assets/admin.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="../js/data/master-data.js"></script>
    <script src="../js/ground-stop-app-keys.js"></script>
    <script src="./assets/admin.js"></script>
  </body>
</html>
`,
  "utf8"
);

console.log("Successfully built and syntax-verified js/vendor-case-status.bundle.js, js/reports.bundle.js, js/favorites.bundle.js, and admin-react-dist/assets/admin.js!");
