(() => {
  "use strict";

  const labels = {
    en: {
      skip: "Skip to the audit",
      back: "← Review a case",
      title: "Audit your trade ledger",
      intro: "Compare the trades your filter kept with the full ledger. The file and results stay in this browser tab.",
      input: "Trade data",
      file: "Choose a local CSV",
      fileHint: "UTF-8, up to 1 MB and 10,000 trades.",
      paste: "Or paste CSV",
      compare: "Compare trades",
      sample: "Load sample",
      clear: "Clear",
      format: "CSV format",
      guide: "List closed trades in close order. Use one account currency and a decimal point with up to two decimal places.",
      fieldGross: "Profit or loss before fees",
      fieldFees: "Total fees for that trade, zero or more",
      fieldKept: "Enter 1 to keep a trade or 0 to skip it",
      download: "Download sample CSV",
      comparison: "Ledger comparison",
      metricIntro: "Win rate uses profit after fees. Amounts use the currency of your CSV.",
      metric: "Measure", all: "All trades", kept: "Kept trades",
      count: "Trades", winRate: "Win rate", gross: "Gross P&L", fees: "Fees", net: "Net P&L", drawdown: "Max drawdown",
      missedGains: "Gains given up",
      avoidedLosses: "Losses avoided",
      drawdownNote: "Drawdown is the largest peak-to-trough drop in cumulative net P&L, starting at zero and counting trades in CSV order.",
      feedback: "Send feedback",
      reading: "Reading the local CSV…",
      ready: "CSV loaded. Select Compare trades to see the results.",
      line: number => "Line " + number + ". "
    },
    ko: {
      skip: "거래 검토로 건너뛰기",
      back: "← 검토 문제 풀기",
      title: "내 거래 원장 검토",
      intro: "전체 거래와 필터에 남긴 거래를 비교하세요. 파일과 결과는 이 브라우저 탭에만 남습니다.",
      input: "거래 기록",
      file: "내 컴퓨터에서 CSV 선택",
      fileHint: "UTF-8 형식, 최대 1MB와 거래 10,000건.",
      paste: "또는 CSV 붙여넣기",
      compare: "거래 비교",
      sample: "예제 불러오기",
      clear: "지우기",
      format: "CSV 형식",
      guide: "종료한 거래를 청산 순서대로 적으세요. 통화를 하나로 맞추고 소수점 아래 최대 두 자리까지 입력하세요.",
      fieldGross: "수수료 차감 전 손익",
      fieldFees: "거래에 든 총수수료, 0 이상",
      fieldKept: "포함할 거래는 1, 제외할 거래는 0",
      download: "예제 CSV 다운로드",
      comparison: "거래 원장 비교",
      metricIntro: "승률은 수수료를 뺀 뒤 이익이 난 거래의 비율입니다. 금액은 CSV에 사용한 통화 단위입니다.",
      metric: "항목", all: "전체 거래", kept: "포함 거래",
      count: "거래 수", winRate: "승률", gross: "수수료 차감 전 손익", fees: "수수료", net: "순손익", drawdown: "최대 낙폭",
      missedGains: "제외한 이익",
      avoidedLosses: "피한 손실",
      drawdownNote: "누적 순손익은 0에서 시작해 CSV 순서대로 더합니다. 최대 낙폭은 누적 순손익이 앞선 고점에서 가장 크게 떨어진 금액입니다.",
      feedback: "의견 보내기",
      reading: "CSV 파일을 읽고 있습니다…",
      ready: "CSV를 불러왔습니다. 거래 비교를 눌러 결과를 확인하세요.",
      line: number => number + "행. "
    }
  };
  const messages = {
    en: {
      tooLarge: "Use a file of up to 1 MB or paste up to 1,000,000 characters.",
      tooMany: "Use up to 10,000 trades.",
      header: "Include the gross, fees, and kept headers. Give each column a unique name.",
      empty: "Add a header and at least one trade.",
      shape: "Check that this record has the same number of fields as the header.",
      syntax: "Check the quotation marks around this CSV field.",
      gross: "Enter a gross amount between −1,000,000,000 and 1,000,000,000 with up to two decimal places.",
      fees: "Enter a fee between 0 and 1,000,000,000 with up to two decimal places.",
      kept: "Enter 1 to keep the trade or 0 to skip it.",
      fileRead: "This file could not be read as UTF-8. Save it as a UTF-8 CSV and try again.",
      unknown: "The audit could not run. Reload this page to try again."
    },
    ko: {
      tooLarge: "파일은 1MB 이하, 붙여넣는 텍스트는 100만 자 이하로 넣어 주세요.",
      tooMany: "거래를 10,000건 이하로 줄여 주세요.",
      header: "열 이름에 gross, fees, kept를 포함하고 서로 다른 이름을 사용해 주세요.",
      empty: "열 이름과 거래를 한 건 이상 입력해 주세요.",
      shape: "이 거래의 열 개수가 첫 행과 같은지 확인해 주세요.",
      syntax: "이 CSV 항목을 감싼 따옴표를 확인해 주세요.",
      gross: "수수료 차감 전 손익을 −10억부터 10억까지 소수점 아래 두 자리 이내로 입력해 주세요.",
      fees: "수수료를 0부터 10억까지 소수점 아래 두 자리 이내로 입력해 주세요.",
      kept: "포함할 거래는 1, 제외할 거래는 0을 입력해 주세요.",
      fileRead: "이 파일을 UTF-8로 읽을 수 없습니다. UTF-8 CSV로 저장한 뒤 다시 선택해 주세요.",
      unknown: "검토를 실행하지 못했습니다. 페이지를 새로 열고 다시 시도해 주세요."
    }
  };
  const sample = [
    "gross,fees,kept",
    "5.00,1.00,1",
    "5.00,1.00,1",
    "21.00,1.00,0",
    "-2.00,1.00,1",
    "-2.00,1.00,0",
    ""
  ].join("\n");
  const fileLimit = 1_000_000;
  const get = id => document.getElementById(id);
  const form = get("ledger-form");
  const fileInput = get("ledger-file");
  const textInput = get("ledger-text");
  const compareButton = get("audit-ledger");
  const results = get("ledger-results");
  const errorMessage = get("ledger-error");
  const statusMessage = get("ledger-status");
  const languageLinks = document.querySelectorAll("[data-language]");
  const metricRows = results.querySelectorAll("tr[data-metric]");
  const amountFields = {
    "missed-gains": results.querySelector('[data-metric="missed-gains"]'),
    "avoided-losses": results.querySelector('[data-metric="avoided-losses"]')
  };
  let language = "en";
  let result = null;
  let error = null;
  let status = null;
  let revision = 0;

  function showMessages() {
    const terms = labels[language];
    const line = error?.line ? terms.line(error.line) : "";
    errorMessage.textContent = error ? line + (messages[language][error.code] ?? messages[language].unknown) : "";
    statusMessage.textContent = status ? terms[status] : "";
    compareButton.disabled = status === "reading";
  }

  function showResults() {
    const cells = results.querySelectorAll("td, dd");
    results.hidden = result === null;
    if (result === null) {
      for (const cell of cells) cell.textContent = "";
      return;
    }

    const locale = language === "ko" ? "ko-KR" : "en-US";
    const units = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const count = new Intl.NumberFormat(locale);
    const percent = new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
    for (const row of metricRows) {
      const field = row.dataset.metric;
      for (const cell of row.querySelectorAll("[data-column]")) {
        const metric = result[cell.dataset.column];
        if (field === "count") {
          cell.textContent = count.format(metric.count);
        } else if (field === "win-rate") {
          cell.textContent = metric.count ? percent.format(metric.wins / metric.count) : "—";
        } else {
          cell.textContent = units.format(metric[field] / 100);
        }
      }
    }
    amountFields["missed-gains"].textContent = units.format(result.missedGains / 100);
    amountFields["avoided-losses"].textContent = units.format(result.avoidedLosses / 100);
  }

  function languageFromUrl() {
    return new URLSearchParams(location.search).get("lang") === "ko" ? "ko" : "en";
  }

  function setLanguage(next) {
    language = next;
    const terms = labels[language];
    document.documentElement.lang = language;
    document.title = terms.title + " · Backtest Review Lab";
    for (const element of document.querySelectorAll("[data-label]")) {
      element.textContent = terms[element.dataset.label];
    }
    const homeUrl = "index.html?case=filter&lang=" + language;
    get("ledger-home").href = homeUrl;
    get("ledger-back").href = homeUrl;
    get("ledger-languages").setAttribute("aria-label", language === "ko" ? "언어" : "Language");
    for (const link of languageLinks) {
      if (link.dataset.language === language) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    showMessages();
    showResults();
  }

  function resetReview(nextStatus = null) {
    revision++;
    result = null;
    error = null;
    status = nextStatus;
    textInput.removeAttribute("aria-invalid");
    showResults();
    showMessages();
  }

  function compare() {
    resetReview();
    try {
      result = globalThis.LEDGER_AUDIT.review(textInput.value);
    } catch (failure) {
      error = failure;
      if (failure.code) textInput.setAttribute("aria-invalid", "true");
    }
    showMessages();
    showResults();
    if (result) get("ledger-result-heading").focus();
  }

  async function loadFile() {
    const file = fileInput.files[0];
    if (!file) return;
    textInput.value = "";
    resetReview("reading");
    const requestedRevision = revision;
    if (file.size > fileLimit) {
      error = { code: "tooLarge" };
    } else {
      try {
        const bytes = await file.arrayBuffer();
        if (revision !== requestedRevision) return;
        textInput.value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        if (revision !== requestedRevision) return;
        error = { code: "fileRead" };
      }
    }
    fileInput.value = "";
    status = error ? null : "ready";
    showMessages();
  }

  textInput.addEventListener("input", () => {
    fileInput.value = "";
    resetReview();
  });
  fileInput.addEventListener("change", loadFile);
  get("load-sample").addEventListener("click", () => {
    fileInput.value = "";
    textInput.value = sample;
    compare();
  });
  get("ledger-clear").addEventListener("click", () => {
    fileInput.value = "";
    textInput.value = "";
    resetReview();
    textInput.focus();
  });
  compareButton.addEventListener("click", compare);
  form.addEventListener("submit", event => event.preventDefault());
  for (const link of languageLinks) {
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      const next = link.dataset.language;
      if (next === language) return;
      history.pushState(null, "", "?lang=" + next);
      setLanguage(next);
    });
  }
  window.addEventListener("popstate", () => setLanguage(languageFromUrl()));
  setLanguage(languageFromUrl());
})();
