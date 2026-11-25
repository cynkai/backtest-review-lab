(() => {
  "use strict";

  const maxInputLength = 1_000_000;
  const maxTrades = 10_000;
  const maxCents = 100_000_000_000;
  const amountPattern = /^-?[0-9]+(?:\.[0-9]{1,2})?$/;

  function fail(code, message, line) {
    const error = new Error(message);
    error.code = code;
    if (line !== undefined) error.line = line;
    throw error;
  }

  function* csvRows(csv) {
    let offset = csv.charCodeAt(0) === 0xFEFF ? 1 : 0;
    let line = 1;

    function consumeLineEnding() {
      if (csv[offset] === "\n") offset++;
      else if (csv[offset] === "\r" && csv[offset + 1] === "\n") offset += 2;
      else return false;
      line++;
      return true;
    }

    function readField(rowLine) {
      if (csv[offset] !== '"') {
        const start = offset;
        while (offset < csv.length && !",\r\n".includes(csv[offset])) {
          if (csv[offset] === '"') fail("syntax", "Unexpected quote in CSV field.", rowLine);
          offset++;
        }
        return csv.slice(start, offset);
      }
      let start = ++offset;
      let value = "";
      while (offset < csv.length) {
        if (csv[offset] === '"') {
          value += csv.slice(start, offset++);
          if (csv[offset] !== '"') return value;
          value += '"';
          start = ++offset;
        } else {
          if (csv[offset] === "\n") line++;
          offset++;
        }
      }
      fail("syntax", "Unclosed quote in CSV field.", rowLine);
    }

    while (offset < csv.length) {
      if (consumeLineEnding()) continue;
      const rowLine = line;
      const fields = [readField(rowLine)];
      while (csv[offset] === ",") {
        offset++;
        fields.push(readField(rowLine));
      }
      if (offset < csv.length && !consumeLineEnding()) {
        fail("syntax", "Expected a comma or line ending after the CSV field.", rowLine);
      }
      yield { fields, line: rowLine };
    }
  }

  function readCents(value, column, line) {
    const negative = value.startsWith("-");
    const message = column === "gross" ? "Gross must be a signed decimal amount with up to two decimal places."
      : "Fees must be a nonnegative decimal amount with up to two decimal places.";
    if (!amountPattern.test(value) || (column === "fees" && negative)) fail(column, message, line);
    const [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    if (cents > maxCents) fail(column, "Amount exceeds the per-trade limit of 1,000,000,000.", line);
    return negative && cents !== 0 ? -cents : cents;
  }

  function newLedger() {
    return { peak: 0, totals: { count: 0, wins: 0, gross: 0, fees: 0, net: 0, drawdown: 0 } };
  }

  function record(ledger, gross, fees) {
    const { totals } = ledger;
    const net = gross - fees;
    totals.count++;
    if (net > 0) totals.wins++;
    totals.gross += gross;
    totals.fees += fees;
    totals.net += net;
    ledger.peak = Math.max(ledger.peak, totals.net);
    totals.drawdown = Math.max(totals.drawdown, ledger.peak - totals.net);
  }

  function review(csvText) {
    if (csvText.length > maxInputLength) fail("tooLarge", "CSV text exceeds 1,000,000 characters.");
    const rows = csvRows(csvText);
    const header = rows.next().value;
    if (!header) fail("empty", "The CSV needs a header and at least one trade.");
    const names = header.fields;
    const columns = ["gross", "fees", "kept"].map(name => names.indexOf(name));
    if (columns.includes(-1) || names.some(name => !name.trim()) || new Set(names).size !== names.length) {
      fail("header", "The CSV needs unique column names and must include gross, fees and kept.", header.line);
    }

    const [grossIndex, feeIndex, keptIndex] = columns;
    const all = newLedger();
    const kept = newLedger();
    let missedGains = 0;
    let avoidedLosses = 0;
    for (const { fields, line } of rows) {
      if (all.totals.count === maxTrades) fail("tooMany", "The CSV exceeds 10,000 trades.", line);
      if (fields.length !== names.length) fail("shape", "The row has a different number of fields than the header.", line);
      const gross = readCents(fields[grossIndex], "gross", line);
      const fees = readCents(fields[feeIndex], "fees", line);
      const selection = fields[keptIndex];
      if (selection !== "0" && selection !== "1") fail("kept", "Kept must be 0 or 1.", line);
      record(all, gross, fees);
      if (selection === "1") {
        record(kept, gross, fees);
      } else {
        const net = gross - fees;
        missedGains += Math.max(0, net);
        avoidedLosses += Math.max(0, -net);
      }
    }
    if (!all.totals.count) fail("empty", "The CSV needs at least one trade.");
    return { trades: all.totals.count, all: all.totals, kept: kept.totals, missedGains, avoidedLosses };
  }

  globalThis.LEDGER_AUDIT = { review };
})();
