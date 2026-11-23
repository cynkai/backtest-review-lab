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
  const [header, ...rows] = (await exportField.inputValue()).trimEnd().split("\n");
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
  await review.locator("#close-review").click();
  assert.equal(await review.isHidden(), true);
  assert.equal(await reviewButton.evaluate(button => button === document.activeElement), true);

  await page.getByRole("link", { name: "EN", exact: true }).click();
  assert.equal(await progress.textContent(), "4 of 4 reviewed");
  await reviewButton.click();
  assert.equal(await review.locator("#session-score").textContent(), "3 of 4 verdicts matched");
  await page.keyboard.press("Escape");
  assert.equal(await review.isHidden(), true);
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
  await verifyOfflineReview(page);
  assert.deepEqual(pageErrors, []);
} finally {
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
