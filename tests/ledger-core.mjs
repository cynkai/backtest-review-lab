import assert from "node:assert/strict";
import "../docs/ledger-core.js";

const { review } = globalThis.LEDGER_AUDIT;
const header = "gross,fees,kept\n";
const zero = { count: 0, wins: 0, gross: 0, fees: 0, net: 0, drawdown: 0 };

const mixed = review(header + "-2.00,0.25,1\n10.1,0.10,0\n7.00,1.25,1\n-1.1,0,0\n2,3.05,1");
assert.deepEqual(mixed, {
  trades: 5,
  all: { count: 5, wins: 2, gross: 1600, fees: 465, net: 1135, drawdown: 225 },
  kept: { count: 3, wins: 1, gross: 700, fees: 455, net: 245, drawdown: 225 },
  missedGains: 1000,
  avoidedLosses: 110
});
assert.equal(mixed.kept.net - mixed.all.net, mixed.avoidedLosses - mixed.missedGains);

const reordered = '\uFEFF\r\n' +
  '"kept","broker,note",fees,gross\r\n' +
  '"1","first\r\nthen ""quoted""",0.01,0.3\r\n\r\n' +
  '0,,0.05,0.04\r\n';
assert.deepEqual(review(reordered), {
  trades: 2,
  all: { count: 2, wins: 1, gross: 34, fees: 6, net: 28, drawdown: 1 },
  kept: { count: 1, wins: 1, gross: 30, fees: 1, net: 29, drawdown: 0 },
  missedGains: 0,
  avoidedLosses: 1
});
assert.deepEqual(review(header + "-0,0.00,0"), {
  trades: 1, all: { ...zero, count: 1 }, kept: zero, missedGains: 0, avoidedLosses: 0
});
assert.equal(review(header + "4,0,1\n-3,0,0\n-2,0,1\n7,0,1").all.drawdown, 500);
assert.equal(review(header + "4,0,1\n-3,0,0\n-2,0,1\n7,0,1").kept.drawdown, 200);
assert.equal(review(header + "0.10,0,1\n0.20,0.30,1").all.net, 0);

function rejects(input, code, line) {
  assert.throws(() => review(input), error => error instanceof Error && error.code === code && error.line === line);
}

rejects("\uFEFF\n\n", "empty");
rejects(header + "\n", "empty");
rejects("gross,fee,kept\n1,0,1", "header", 1);
rejects("\ngross,fees,kept,extra,extra\n1,0,1,a,b", "header", 2);
rejects("gross,fees,kept,\n1,0,1,", "header", 1);
rejects(header + "1,0", "shape", 2);
rejects(header + "1,0,1,", "shape", 2);
rejects(header + '1,0,"1', "syntax", 2);
rejects(header + '1,"0"after,1', "syntax", 2);
rejects(header + '1,0",1', "syntax", 2);
rejects("gross,fees,kept\r1,0,1", "syntax", 1);
rejects(reordered + '1,"last",0,broken', "gross", 7);
for (const value of ["1.005", "1e2", "+1", " 1", "1.", ".1", '"1\n"', "1000000000.01"]) {
  rejects(header + value + ",0,1", "gross", 2);
}
for (const value of ["-0", "-1", "0.001", "1000000000.01", "NaN"]) {
  rejects(header + "1," + value + ",1", "fees", 2);
}
for (const value of ["", "2", "00", " 1", "yes"]) {
  rejects(header + "1,0," + value, "kept", 2);
}

const limitHeader = "gross,fees,kept,note\n";
const exactLength = limitHeader + "0,0,1," + "a".repeat(1_000_000 - limitHeader.length - 6);
assert.equal(review(exactLength).trades, 1);
rejects(exactLength + "a", "tooLarge");
const exactTrades = header + "-1000000000,1000000000.00,1\n".repeat(10_000);
const atCapacity = review(exactTrades);
assert.equal(atCapacity.trades, 10_000);
assert.equal(atCapacity.kept.net, -2_000_000_000_000_000);
assert.equal(atCapacity.all.drawdown, 2_000_000_000_000_000);
rejects(exactTrades + "0,0,1", "tooMany", 10_002);

console.log("Ledger CSV, integer-cent totals, drawdowns, exclusions, error lines and limits passed.");
