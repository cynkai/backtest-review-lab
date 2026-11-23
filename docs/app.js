"use strict";

const labels = {
  en: {
    index: "Case index", skip: "Skip to case", instruction: "Make your call, then check it in Python, Rust, Go or Java.",
    claim: "The author’s claim", evidence: "View evidence", choice: "Your verdict",
    approve: "Approve", revise: "Request changes", evidenceChoice: "Request more evidence",
    matched: "You and the reviewer agree", different: "The reviewer made a different call",
    rationale: "Reviewer’s verdict", codeTitle: "Reproduce this review", codeLabel: "Language", download: "Download",
    card: "Save question card (PNG)", share: "Copy case link",
    shared: "Unsolved link copied.", fallback: "Select and copy the text below.", report: "Copy my pilot result",
    reported: "Result copied. You can send it to the person who invited you.", feedback: "Give feedback on GitHub",
    next: "Next case", revisit: "Back to case", time: "Active seconds to first verdict", opened: "Source table opened before verdict",
    first: "First verdict", caseWord: "Case", yes: "Yes", no: "No", answerClip: "Pilot result", manual: "Text to copy"
  },
  ko: {
    index: "문제 목록", skip: "문제로 건너뛰기", instruction: "먼저 판정해 보세요. 풀이는 Python, Rust, Go, Java로 검산할 수 있습니다.",
    claim: "작성자의 주장", evidence: "근거 열기", choice: "나의 판정",
    approve: "승인", revise: "수정 요청", evidenceChoice: "추가 자료 요청",
    matched: "검토자와 같은 판정을 내렸습니다", different: "검토자는 다르게 판단했습니다",
    rationale: "검토 결과", codeTitle: "내 컴퓨터에서 검산하기", codeLabel: "코드 언어", download: "소스 받기",
    card: "문제 카드 저장 (PNG)", share: "문제 링크 복사",
    shared: "정답 없는 링크를 복사했습니다.", fallback: "아래 텍스트를 선택해 복사해 주세요.", report: "내 파일럿 결과 복사",
    reported: "결과를 복사했습니다. 초대한 사람에게 직접 보낼 수 있습니다.", feedback: "GitHub에 의견 남기기",
    next: "다음 문제", revisit: "다시 보기", time: "첫 판정까지 문제를 본 시간(초)", opened: "판정 전 원자료 열람",
    first: "첫 판정", caseWord: "문제", yes: "예", no: "아니오", answerClip: "파일럿 결과", manual: "복사할 텍스트"
  }
};
const programs = {
  python: { file: "check.py", command: "python3 check.py" },
  rust: { file: "check.rs", command: "rustc check.rs -o check && ./check" },
  go: { file: "check.go", command: "go run check.go" },
  java: { file: "Check.java", command: "java Check.java" }
};
const cases = window.PILOT_CASES;
const sessions = new Map();
const $ = id => document.getElementById(id);
const choices = ["approve", "revise", "evidence"];
let item, lang, ui, current;
let copyRequest = 0;
const choiceText = value => ui[value === "evidence" ? "evidenceChoice" : value];
function urlFor(id, language, share = false) {
  const url = share && !/^https?:$/.test(location.protocol) ? new URL("https://cynkai.github.io/backtest-review-lab/") : new URL(location.href);
  const route = new URLSearchParams({ case: id, lang: language });
  if (url.protocol === "file:") {
    // File URLs can change their fragment without reloading the local document.
    url.hash = "?" + route;
  } else {
    url.search = route;
    url.hash = "";
  }
  return url.href;
}
function pauseTimer() {
  if (current?.started == null) return;
  current.elapsed += performance.now() - current.started;
  current.started = null;
}
function resumeTimer() {
  if (!document.hidden && !current.answer && current.started === null) current.started = performance.now();
}
function recordEvidence() {
  current.expanded = $("evidence").open;
  if (current.expanded && !current.answer) current.sawEvidence = true;
}
function elm(tag, text, cls) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function routeLink(a, id, language) {
  a.href = urlFor(id, language);
  a.onclick = e => {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (a.href === location.href) return;
    const changed = id !== item.id;
    history.pushState(null, "", a.href);
    render();
    if (changed) { $("question").focus({preventScroll: true}); window.scrollTo(0, 0); }
  };
}
function renderProgram() {
  const language = $("check-language").value;
  const program = programs[language];
  $("check").textContent = window.CHECK_SOURCES[item.id][language];
  $("check-command").textContent = program.command;
  $("check-source").href = "checks/" + item.id + "/" + program.file;
  $("check-source").download = program.file;
  $("check-source").textContent = ui.download + " · " + program.file;
}
function renderResult() {
  const answer = current.answer;
  $("result").hidden = !answer;
  const replay = $("candle-replay");
  replay.hidden = !answer || item.id !== "candle";
  if (replay.hidden) replay.replaceChildren();
  if (!answer) return;
  $("result-tag").textContent = answer === item.correct ? ui.matched : ui.different;
  $("result-title").textContent = ui.rationale + " · " + choiceText(item.correct);
  $("reason").textContent = item.reason[lang];
  if (!replay.hidden) window.renderCandleReplay(replay, item.data, lang);
  $("python-title").textContent = ui.codeTitle;
  $("check-label").textContent = ui.codeLabel;
  renderProgram();
  const index = cases.indexOf(item);
  const later = [...cases.slice(index + 1), ...cases.slice(0, index)];
  const unsolved = later.find(c => !sessions.get(c.id)?.answer);
  const other = unsolved || later[0];
  $("next").textContent = (unsolved ? ui.next : ui.revisit) + " · " + other.title[lang];
  routeLink($("next"), other.id, lang);
  $("report").textContent = ui.report;
}
function renderChoices() {
  $("choices").replaceChildren(...choices.map(value => {
    const button = elm("button", choiceText(value), "choice");
    button.type = "button";
    if (current.answer) {
      button.disabled = true;
      button.setAttribute("aria-pressed", String(value === current.answer));
    }
    button.onclick = () => {
      if (current.answer) return;
      recordEvidence();
      pauseTimer();
      current.answer = value;
      current.seconds = Math.ceil(current.elapsed / 1000);
      renderChoices(); renderResult(); $("result").focus();
    };
    return button;
  }));
}
function render() {
  if (current) {
    recordEvidence();
    pauseTimer();
  }
  const route = location.protocol === "file:" && location.hash.startsWith("#?")
    ? location.hash.slice(2) : location.search;
  const p = new URLSearchParams(route);
  lang = ["ko", "en"].includes(p.get("lang")) ? p.get("lang") : (navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en");
  ui = labels[lang]; item = cases.find(c => c.id === p.get("case")) || cases[0];
  if (!sessions.has(item.id)) sessions.set(item.id, {started: null, elapsed: 0, answer: null, sawEvidence: false, expanded: false});
  current = sessions.get(item.id);
  resumeTimer();
  document.documentElement.lang = lang; document.title = item.title[lang] + " · Backtest Review Lab";
  $("english").setAttribute("aria-current", lang === "en" ? "true" : "false");
  $("korean").setAttribute("aria-current", lang === "ko" ? "true" : "false");
  routeLink($("home"), cases[0].id, lang); routeLink($("english"), item.id, "en"); routeLink($("korean"), item.id, "ko");
  $("skip").textContent = ui.skip; $("index-title").textContent = ui.index;
  $("case-links").replaceChildren(...cases.map((c, i) => {
    const a = elm("a", "", "case-tab");
    if (item === c) a.setAttribute("aria-current", "page");
    a.append(elm("span", "0" + (i + 1), "item-no"), elm("span", c.title[lang]));
    routeLink(a, c.id, lang); return a;
  }));
  const number = cases.indexOf(item) + 1;
  $("kicker").textContent = ui.caseWord + " " + String(number).padStart(2, "0") + "  /  " + item.category[lang];
  $("title").textContent = item.title[lang]; $("instruction").textContent = ui.instruction;
  $("claim-title").textContent = ui.claim; $("claim").textContent = item.claim[lang];
  $("metrics").replaceChildren(...item.summary[lang].map(([label,value]) => {
    const m = elm("div", "", "metric"); m.append(elm("span", label, "metric-label"), elm("strong", value, "metric-value")); return m;
  }));
  window.renderExhibit($("exhibit"), item.id, lang);
  $("evidence-title").textContent = ui.evidence + " · " + item.evidenceTitle[lang];
  $("evidence-note").textContent = item.evidenceNote[lang];
  const table = $("evidence-table"); table.replaceChildren();
  const head = table.createTHead().insertRow();
  for (const text of item.columns[lang]) { const th = elm("th", text); th.scope = "col"; head.append(th); }
  const body = table.createTBody();
  for (const row of item.rows[lang]) { const tr = body.insertRow(); for (const text of row) tr.insertCell().textContent = text; }
  $("evidence").open = current.expanded; $("python").open = false;
  $("decision-title").textContent = ui.choice; renderChoices(); renderResult();
  $("share-card").textContent = ui.card;
  $("share-card").href = "cards/" + item.id + "-" + lang + ".png";
  $("share-card").download = "backtest-" + item.id + "-" + lang + ".png";
  copyRequest++;
  $("share").textContent = ui.share; $("copy-status").textContent = ""; $("copy-fallback").hidden = true;
  $("copy-fallback").setAttribute("aria-label", ui.manual); $("feedback").textContent = ui.feedback;
  $("source").textContent = lang === "ko" ? "GitHub에서 스타 남기기" : "Star on GitHub";
}
async function copy(text, success) {
  const request = ++copyRequest;
  $("copy-fallback").hidden = true;
  $("copy-status").textContent = "";
  try {
    await navigator.clipboard.writeText(text);
    if (request === copyRequest) $("copy-status").textContent = success;
  } catch {
    if (request !== copyRequest) return;
    const field = $("copy-fallback");
    field.value = text; field.hidden = false; field.focus(); field.select();
    $("copy-status").textContent = ui.fallback;
  }
}
$("evidence").addEventListener("toggle", recordEvidence);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseTimer();
  else resumeTimer();
});
$("check-language").onchange = renderProgram;
$("skip").onclick = event => {
  event.preventDefault();
  $("question").focus();
  $("question").scrollIntoView();
};
$("share").onclick = () => copy(urlFor(item.id, lang, true), ui.shared);
$("report").onclick = () => {
  const lines = [ui.answerClip + " · v3 · " + item.id, ui.first + ": " + choiceText(current.answer), ui.time + ": " + current.seconds,
    ui.opened + ": " + (current.sawEvidence ? ui.yes : ui.no)];
  copy(lines.join("\n"), ui.reported);
};
window.addEventListener("popstate", render);
render();
