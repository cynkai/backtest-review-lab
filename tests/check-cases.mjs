import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const context = { window: {} };
const docs = fileURLToPath(new URL("../docs/", import.meta.url));
runInNewContext(readFileSync(join(docs, "cases.js"), "utf8"), context);
const cases = context.window.PILOT_CASES;
const verdicts = { filter: "revise", candle: "evidence", fees: "approve" };

function expectedFromEvidence(item) {
  switch (item.id) {
    case "filter": {
      const original = item.data.trades;
      const filtered = original.filter(trade => trade.kept);
      const net = trades => trades.reduce((sum, trade) => sum + trade.net, 0);
      const stats = trades => {
        const wins = trades.filter(trade => trade.net > 0).length;
        return `${wins}/${trades.length} wins, net ${net(trades)} USD`;
      };
      return [`Original: ${stats(original)}`, `Filtered: ${stats(filtered)}`,
        `Change in net profit: ${net(filtered) - net(original)} USD`].join("\n");
    }
    case "candle": {
      const { bar, entry, target, stop } = item.data;
      assert.equal(bar.open, entry);
      assert.ok(bar.low <= stop && stop < bar.open && bar.open < target && target <= bar.high);
      return `Bar (O/H/L/C): ${bar.open}/${bar.high}/${bar.low}/${bar.close}\nHigh first: target\nLow first: stop`;
    }
    case "fees": {
      const { quantity, buyCents, sellCents, buyFeeCents, sellFeeCents } = item.data;
      const gross = quantity * (sellCents - buyCents);
      const fees = buyFeeCents + sellFeeCents;
      return `Gross: ${gross} cents\nFees: ${fees} cents\nNet: ${gross - fees} cents`;
    }
    default:
      throw new Error("Missing reference calculation for " + item.id);
  }
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { encoding: "utf8", env });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, [command, ...args, result.stderr].join(" "));
  return result.stdout.trim().replaceAll("\r\n", "\n");
}

const selected = process.argv[2] ?? "python";
const languages = ["python", "rust", "go", "java"];
if (process.argv.length > 3 || (selected !== "all" && !languages.includes(selected))) {
  throw new Error("Usage: node tests/check-cases.mjs [python|rust|go|java|all]");
}
assert.deepEqual(Array.from(cases, item => item.id).sort(), Object.keys(verdicts).sort());
const scratch = mkdtempSync(join(tmpdir(), "backtest-checks-"));
try {
  const runners = {
    python: dir => run("python3", [join(dir, "check.py")]),
    rust: dir => {
      const exe = join(scratch, process.platform === "win32" ? "check.exe" : "check");
      run("rustc", ["--edition=2021", "-D", "warnings", join(dir, "check.rs"), "-o", exe]);
      return run(exe, []);
    },
    go: dir => run("go", ["run", join(dir, "check.go")], {
      ...process.env, GOTELEMETRY: "off", GOTOOLCHAIN: "local", GOPROXY: "off",
      GOCACHE: process.env.GOCACHE || join(scratch, "go-cache")
    }),
    java: dir => run("java", [join(dir, "Check.java")])
  };
  for (const item of cases) {
    assert.equal(item.correct, verdicts[item.id]);
    for (const lang of ["ko", "en"]) {
      for (const key of ["title", "claim", "reason", "evidenceTitle", "evidenceNote"]) {
        assert.ok(item[key][lang].trim(), key + " missing in " + lang);
      }
      assert.ok(item.rows[lang].length > 0);
      for (const row of item.rows[lang]) assert.equal(row.length, item.columns[lang].length);
      assert.equal(item.summary[lang].length, 2);
    }
    const expected = expectedFromEvidence(item);
    for (const language of selected === "all" ? languages : [selected]) {
      const actual = runners[language](join(docs, "checks", item.id));
      assert.equal(actual, expected, item.id + " / " + language);
      console.log(`PASS ${item.id} / ${language}`);
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
