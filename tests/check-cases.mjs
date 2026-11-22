import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";

const context = { window: {} };
const casesPath = new URL("../docs/cases.js", import.meta.url);
runInNewContext(readFileSync(casesPath, "utf8"), context);
const cases = context.window.PILOT_CASES;
const outcomes = new Map([
  ["filter", ["revise", "Change in net profit: -17"]],
  ["candle", ["evidence", "target stop"]]
]);
assert.equal(cases.length, outcomes.size);
assert.equal(new Set(cases.map(c => c.id)).size, cases.length);
for (const item of cases) {
  const [verdict, expectedOutput] = outcomes.get(item.id);
  assert.equal(item.correct, verdict);
  for (const lang of ["ko", "en"]) {
    for (const key of ["title", "claim", "reason", "evidenceTitle", "evidenceNote"]) {
      assert.ok(item[key][lang].trim(), key + " missing in " + lang);
    }
    for (const row of item.rows[lang]) assert.equal(row.length, item.columns[lang].length);
    assert.equal(item.summary[lang].length, 2);
  }
  const result = spawnSync("python3", ["-c", item.check], { encoding: "utf8" });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), expectedOutput);
  console.log("Verified " + item.id + " — " + expectedOutput);
}
