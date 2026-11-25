import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const docs = resolve(fileURLToPath(new URL("../docs/", import.meta.url)));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const file = resolve(docs, pathname === "/" ? "index.html" : "." + pathname);
  if (!file.startsWith(docs + sep)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const content = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "text/plain" }).end(content);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500).end();
  }
});

async function verifyQuestionCard(page, language) {
  const card = page.locator("#share-card");
  assert.equal(await card.getAttribute("download"), "backtest-lookahead-" + language + ".png");
  const response = await page.request.get(new URL(await card.getAttribute("href"), page.url()).href);
  assert.equal(response.ok(), true, "missing look-ahead card for " + language);
  assert.equal((await response.body()).subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
}

async function verifyHostedReview(page, origin) {
  await page.goto(origin + "/?case=filter&lang=en");
  assert.equal(await page.locator("h1").textContent(), "The higher win rate");
  assert.equal(await page.locator("#case-links a").count(), 4);
  assert.equal(await page.locator("#result").isHidden(), true);
  const progress = page.locator("#progress-count");
  const reviewButton = page.locator("#view-review");
  assert.equal(await progress.textContent(), "0 of 4 reviewed");
  assert.equal(await reviewButton.isHidden(), true);
  await page.getByRole("button", { name: "Copy case link" }).click();
  const copyField = page.locator("#copy-fallback");
  await copyField.waitFor({ state: "visible" });
  assert.equal(await copyField.inputValue(), origin + "/?case=filter&lang=en");

  await page.getByText("View evidence · Five-trade ledger").click();
  assert.equal(await page.locator("#evidence-table tbody tr").count(), 5);
  assert.equal(await page.locator("#evidence-table").isVisible(), true);
  await page.getByRole("link", { name: /Two orders, one candle/ }).click();
  await page.clock.fastForward(60_000);
  await page.goBack();
  assert.equal(await page.locator("#evidence-table").isVisible(), true);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  assert.equal(await progress.textContent(), "1 of 4 reviewed");
  assert.equal(await reviewButton.isHidden(), true);
  assert.equal(await page.locator("#result-tag").textContent(), "The reviewer made a different call");
  assert.match(await page.locator("#result-title").textContent(), /Request changes/);
  assert.equal(await page.locator("#choices button[aria-pressed=true]").textContent(), "Approve");
  assert.equal(await page.locator("#choices button:disabled").count(), 3);
  await page.getByRole("button", { name: "Copy my pilot result" }).click();
  await copyField.waitFor({ state: "visible" });
  const report = await copyField.inputValue();
  assert.match(report, /Pilot result · v3 · filter/);
  assert.match(report, /Source table opened before verdict: Yes/);
  const activeSeconds = report.match(/Active seconds to first verdict: (\d+)/);
  assert.ok(activeSeconds && Number(activeSeconds[1]) < 60, "time spent on the candle case must be excluded");

  await page.getByRole("link", { name: "한국어", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("lang"), "ko");
  assert.equal(await page.locator("#choices button[aria-pressed=true]").textContent(), "승인");
  assert.equal(await page.locator("#evidence-table").isVisible(), true);
  await page.goBack();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  assert.equal(await page.locator("#choices button[aria-pressed=true]").textContent(), "Approve");

  await page.locator("#next").click();
  assert.equal(new URL(page.url()).searchParams.get("case"), "candle");
  const replay = page.locator("#candle-replay");
  assert.equal(await replay.isHidden(), true);
  await page.getByRole("button", { name: "Request more evidence", exact: true }).click();
  assert.equal(await progress.textContent(), "2 of 4 reviewed");
  assert.equal(await replay.isVisible(), true);
  assert.match(await replay.getByRole("status").textContent(), /\$105 target first/);
  await replay.getByRole("radio", { name: "Low first" }).check();
  assert.match(await replay.getByRole("status").textContent(), /\$95 stop first/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true,
    "the candle replay must fit the narrow viewport");

  await page.locator("#next").click();
  assert.equal(new URL(page.url()).searchParams.get("case"), "fees");
  assert.equal(await replay.isHidden(), true);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  assert.equal(await progress.textContent(), "3 of 4 reviewed");
  assert.equal(await reviewButton.isHidden(), true);
  assert.match(await page.locator("#result-title").textContent(), /Approve/);
  await page.locator("#next").click();
  assert.equal(new URL(page.url()).searchParams.get("case"), "lookahead");
  assert.equal(await page.locator("h1").textContent(), "The closing-price signal");
  assert.equal(await page.locator("#result").isHidden(), true);
  await verifyQuestionCard(page, "en");

  await page.getByRole("link", { name: "한국어", exact: true }).click();
  assert.equal(await page.locator("h1").textContent(), "종가로 낸 매수 신호");
  await verifyQuestionCard(page, "ko");

  await page.locator("#evidence-title").click();
  assert.match(await page.locator("#evidence-table").textContent(), /15:55.*16:00/);
  await page.getByRole("button", { name: "수정 요청", exact: true }).click();
  assert.match(await page.locator("#result-title").textContent(), /수정 요청/);
  await page.locator("#python-title").click();
  const picker = page.locator("#check-language");
  assert.deepEqual(await picker.locator("option").allTextContents(), ["Go", "Rust", "Dart", "Zig 0.15.2", "Python", "Java"]);
  assert.equal(await picker.inputValue(), "go");
  const sources = { go: "check.go", rust: "check.rs", dart: "check.dart", zig: "check.zig", python: "check.py", java: "Check.java" };
  for (const [language, file] of Object.entries(sources)) {
    await picker.selectOption(language);
    const source = page.locator("#check-source");
    assert.equal(await source.getAttribute("download"), file);
    const response = await page.request.get(new URL(await source.getAttribute("href"), page.url()).href);
    assert.equal(response.ok(), true);
    assert.equal(await page.locator("#check").textContent(), await response.text());
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true,
    "the expanded evidence and code must fit the narrow viewport");

  assert.equal(await progress.textContent(), "4개 중 4개 검토 완료");
  assert.equal(await page.locator("#next").isHidden(), true);
  const review = page.getByRole("dialog");
  await reviewButton.click();
  assert.equal(await review.isVisible(), true);
  assert.equal(await review.evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth), true,
    "the completed review must fit the narrow viewport");
  assert.equal(await review.locator("#session-score").textContent(), "4개 중 3개 판정 일치");
  const verdicts = await review.locator("#session-rows tr").evaluateAll(rows =>
    rows.map(row => Array.from(row.cells).slice(1, 3).map(cell => cell.textContent)));
  assert.deepEqual(verdicts, [
    ["승인", "수정 요청"],
    ["추가 자료 요청", "추가 자료 요청"],
    ["승인", "승인"],
    ["수정 요청", "수정 요청"]
  ]);

  await review.locator("#copy-session").click();
  const exportField = review.locator("#session-copy-fallback");
  await exportField.waitFor({ state: "visible" });
  const exported = await exportField.inputValue();
  const [header, ...rows] = exported.trimEnd().split("\n");
  assert.equal(header, "case_id\tfirst_verdict\treviewer_verdict\tactive_seconds\tevidence_opened");
  const records = rows.map(row => row.split("\t"));
  assert.deepEqual(records.map(([id, first, reviewer, seconds, opened]) => {
    assert.match(seconds, /^\d+$/);
    return [id, first, reviewer, opened];
  }), [
    ["filter", "approve", "revise", "true"],
    ["candle", "evidence", "evidence", "false"],
    ["fees", "approve", "approve", "false"],
    ["lookahead", "revise", "revise", "true"]
  ]);
  assert.equal(records[0][3], activeSeconds[1]);
  await page.context().setOffline(true);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    review.getByRole("link", { name: "결과 다운로드 (TSV)" }).click()
  ]);
  assert.equal(download.suggestedFilename(), "backtest-review-results.tsv");
  assert.equal(await readFile(await download.path(), "utf8"), exported);
  await page.context().setOffline(false);
  await review.locator("#close-review").click();
  assert.equal(await review.isHidden(), true);
  assert.equal(await reviewButton.evaluate(button => button === document.activeElement), true);

  await page.getByRole("link", { name: "EN", exact: true }).click();
  assert.equal(await progress.textContent(), "4 of 4 reviewed");
  await reviewButton.click();
  assert.equal(await review.locator("#session-score").textContent(), "3 of 4 verdicts matched");
  assert.equal(await review.getByRole("link", { name: "Download results (TSV)" }).isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await review.isHidden(), true);
}

async function verifyExperiments(page, origin) {
  await page.goto(origin + "/?case=filter&lang=en");
  assert.equal(await page.locator("#experiment").isHidden(), true);
  assert.equal(await page.locator("#ledger-review").isHidden(), true);
  await page.getByRole("button", { name: "Request changes", exact: true }).click();
  assert.equal(await page.locator("#ledger-review").getAttribute("href"), "ledger.html?lang=en");
  const sheet = page.locator("#experiment");
  const value = key => sheet.locator('[data-value="' + key + '"]').textContent();
  assert.equal(await value("net"), "+$5");
  await sheet.locator('[data-trade="C"]').check();
  assert.equal(await value("net"), "+$25");
  assert.equal(await value("delta"), "+$3");
  assert.equal(await value("wins"), "75.0%");
  await page.locator("#python-title").click();
  const commands = {
    go: "go run check.go 11110", rust: "rustc check.rs -o check && ./check 11110",
    dart: "dart run check.dart 11110", zig: "zig run check.zig -- 11110",
    python: "python3 check.py 11110", java: "java Check.java 11110"
  };
  for (const [key, command] of Object.entries(commands)) {
    await page.locator("#check-language").selectOption(key);
    assert.equal(await page.locator("#check-command").textContent(), command);
  }
  await page.locator("#copy-command").click();
  assert.equal(await page.locator("#command-fallback").inputValue(), commands.java);
  await page.locator("#korean").click();
  assert.equal(await value("net"), "+$25");
  assert.equal(await page.locator("#ledger-review").getAttribute("href"), "ledger.html?lang=ko");
  assert.equal(await page.locator("#choices [aria-pressed=true]").textContent(), "수정 요청");
  for (const input of await sheet.getByRole("checkbox").all()) await input.uncheck();
  assert.equal(await value("wins"), "해당 없음");
  assert.equal(await value("net"), "$0");
  assert.equal(await value("delta"), "−$22");
  await sheet.locator('[data-action="reset"]').click();
  assert.equal(await value("net"), "+$5");

  await page.locator('#case-links a[href*="case=fees"]').click();
  assert.equal(await sheet.isHidden(), true);
  await page.getByRole("button", { name: "승인", exact: true }).click();
  assert.equal(await value("net"), "+$5.00");
  await sheet.locator('[data-action="breakeven"]').click();
  assert.equal(await value("net"), "$0.00");
  await sheet.getByRole("slider").press("ArrowRight");
  assert.equal(await value("net"), "−$0.01");
  await page.locator("#english").click();
  assert.equal(await value("net"), "−$0.01");
  await page.locator("#python-title").click();
  await page.locator("#check-language").selectOption("zig");
  assert.equal(await page.locator("#check-command").textContent(), "zig run check.zig -- 676");
  await page.locator('#case-links a[href*="case=filter"]').click();
  await page.locator('#case-links a[href*="case=fees"]').click();
  assert.equal(await value("net"), "−$0.01");
  await sheet.getByRole("slider").press("End");
  assert.equal(await value("net"), "−$3.25");
  await sheet.locator('[data-action="reset"]').click();
  assert.equal(await value("net"), "+$5.00");
  assert.equal(await page.locator("#progress-count").textContent(), "2 of 4 reviewed");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}

async function verifyLedgerAudit(page, url, fileMode = false) {
  await page.goto(url);
  assert.equal(await page.locator("h1").textContent(), "Audit your trade ledger");
  const results = page.locator("#ledger-results");
  const text = page.locator("#ledger-text");
  const error = page.locator("#ledger-error");
  const metric = (key, column) => {
    const row = results.locator('[data-metric="' + key + '"]');
    return column ? row.locator('[data-column="' + column + '"]') : row;
  };
  assert.equal(await results.isHidden(), true);
  await page.locator("#load-sample").click();
  assert.equal(await results.isVisible(), true);
  assert.equal(await metric("net", "all").textContent(), "22.00");
  assert.equal(await metric("net", "kept").textContent(), "5.00");
  assert.equal(await metric("win-rate", "all").textContent(), "60.0%");
  assert.equal(await metric("drawdown", "all").textContent(), "6.00");
  assert.match(await metric("missed-gains").textContent(), /20\.00/);
  assert.match(await metric("avoided-losses").textContent(), /3\.00/);
  if (fileMode) {
    await page.locator("#ledger-ko").click();
    assert.equal(await page.locator("h1").textContent(), "내 거래 원장 검토");
    assert.equal(await metric("net", "kept").textContent(), "5.00");
    return;
  }
  const sample = await page.request.get(new URL("sample-ledger.csv", url).href);
  assert.equal(sample.ok(), true);
  assert.equal((await text.inputValue()).trim(), (await sample.text()).trim());
  await page.locator("#ledger-ko").click();
  assert.equal(await page.locator("h1").textContent(), "내 거래 원장 검토");
  assert.equal(await metric("net", "kept").textContent(), "5.00");
  await page.goBack();
  assert.equal(await page.locator("h1").textContent(), "Audit your trade ledger");
  assert.equal(await metric("net", "kept").textContent(), "5.00");

  const requests = [];
  const remember = request => requests.push(request.url());
  page.on("request", remember);
  await page.context().setOffline(true);
  try {
    await text.fill("gross,fees,kept\n1.00,broken,1");
    assert.equal(await results.isHidden(), true);
    await page.locator("#audit-ledger").click();
    assert.equal(await error.isVisible(), true);
    assert.match(await error.textContent(), /2/);
    assert.equal(await results.isHidden(), true);
    await page.locator("#ledger-file").setInputFiles({
      name: "local-trades.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("gross,fees,kept\n-2.00,0.25,0\n3.00,0.25,0\n")
    });
    await page.waitForFunction(() => document.getElementById("ledger-text").value.includes("-2.00"));
    await page.locator("#audit-ledger").click();
    assert.equal(await metric("net", "all").textContent(), "0.50");
    assert.equal(await metric("net", "kept").textContent(), "0.00");
    assert.equal(await metric("drawdown", "all").textContent(), "2.25");
    assert.equal(await metric("win-rate", "kept").textContent(), "—");
    await page.locator("#ledger-file").setInputFiles({
      name: "invalid-utf8.csv",
      mimeType: "text/csv",
      buffer: Buffer.from([0xC3, 0x28])
    });
    await error.waitFor({ state: "visible" });
    assert.match(await error.textContent(), /UTF-8/);
    assert.equal(await text.inputValue(), "");
    assert.equal(await results.isHidden(), true);
    await page.locator("#ledger-clear").click();
    assert.equal(await text.inputValue(), "");
    assert.equal(await results.isHidden(), true);
    assert.equal(await error.isHidden(), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(requests, []);
  } finally {
    await page.context().setOffline(false);
    page.off("request", remember);
  }
}

async function verifyOfflineReview(page) {
  try {
    await page.goto(new URL("../docs/index.html?case=filter&lang=en", import.meta.url).href);
  } catch (error) {
    if (!error.message.includes("net::ERR_BLOCKED_BY_ADMINISTRATOR")) throw error;
    console.log("Skipped file:// review: Chromium is blocked by administrator policy.");
    return;
  }
  await page.getByRole("button", { name: "Request changes", exact: true }).click();
  await page.locator("#next").click();
  assert.equal(await page.locator("h1").textContent(), "Two orders, one candle");
  await page.getByRole("link", { name: "한국어", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("lang"), "ko");
  await page.locator("#case-links a").first().click();
  assert.equal(await page.locator("#choices button[aria-pressed=true]").textContent(), "수정 요청");
  await verifyLedgerAudit(page, new URL("../docs/ledger.html?lang=en", import.meta.url).href, true);
  console.log("Offline browser review passed.");
}

await new Promise((done, fail) => server.once("error", fail).listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(5000);
  await page.clock.install();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { value: undefined });
  });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await verifyHostedReview(page, "http://127.0.0.1:" + server.address().port);
  assert.deepEqual(pageErrors, []);
  console.log("Hosted browser review passed.");
  await verifyExperiments(page, "http://127.0.0.1:" + server.address().port);
  console.log("Filter and commission experiments passed.");
  await verifyLedgerAudit(page, "http://127.0.0.1:" + server.address().port + "/ledger.html?lang=en");
  console.log("CSV trade review passed.");
  await verifyOfflineReview(page);
  assert.deepEqual(pageErrors, []);
} finally {
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
