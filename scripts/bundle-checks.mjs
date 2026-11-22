import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const directory = fileURLToPath(new URL("../docs/checks/", import.meta.url));
const output = new URL("../docs/check-sources.js", import.meta.url);
const names = { python: "check.py", rust: "check.rs", go: "check.go", java: "Check.java" };
const sources = {};
for (const folder of readdirSync(directory, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort()) {
  sources[folder] = {};
  for (const [language, filename] of Object.entries(names)) {
    sources[folder][language] = readFileSync(join(directory, folder, filename), "utf8");
  }
}
const content = "// Generated from docs/checks by scripts/bundle-checks.mjs.\nwindow.CHECK_SOURCES = " + JSON.stringify(sources, null, 2) + ";\n";
if (process.argv.includes("--check")) {
  if (content !== readFileSync(output, "utf8")) throw new Error("Run node scripts/bundle-checks.mjs to refresh the offline code previews.");
} else {
  writeFileSync(output, content);
}
