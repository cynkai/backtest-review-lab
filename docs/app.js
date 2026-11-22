"use strict";

const labels = {
  en: {
    index: "Case index", skip: "Skip to case", instruction: "Inspect the evidence and decide whether the author’s claim holds.",
    claim: "The author’s claim", evidence: "View evidence", choice: "Your verdict",
    approve: "Approve", revise: "Request changes", evidenceChoice: "Request more evidence",
    matched: "Your verdict matches the evidence", different: "Compare your verdict with the evidence",
    rationale: "Reviewer’s verdict", python: "Reproduce with Python", share: "Copy unsolved case link",
    shared: "Unsolved link copied.", fallback: "Select and copy the text below.", report: "Copy my pilot result",
    reported: "Result copied. You can send it to the person who invited you.", feedback: "Give feedback on GitHub",
    next: "Try the other case", time: "Seconds to first verdict", opened: "Evidence opened before verdict",
    first: "First verdict", caseWord: "Case", yes: "Yes", no: "No", answerClip: "Pilot result", manual: "Text to copy"
  },
  ko: {
    index: "문제 목록", skip: "문제로 건너뛰기", instruction: "근거를 살펴보고 작성자의 주장이 타당한지 판정해 보세요.",
    claim: "작성자의 주장", evidence: "근거 열기", choice: "나의 판정",
    approve: "승인", revise: "수정 요청", evidenceChoice: "추가 자료 요청",
    matched: "근거에 맞는 판정입니다", different: "내 판정과 근거를 비교해 보세요",
    rationale: "해설의 판정", python: "Python으로 재현하기", share: "정답 없는 문제 링크 복사",
    shared: "정답 없는 링크를 복사했습니다.", fallback: "아래 텍스트를 선택해 복사해 주세요.", report: "내 파일럿 결과 복사",
    reported: "결과를 복사했습니다. 초대한 사람에게 직접 보낼 수 있습니다.", feedback: "GitHub에 의견 남기기",
    next: "다른 문제 풀기", time: "첫 판정까지 걸린 초", opened: "판정 전 근거 열람",
    first: "첫 판정", caseWord: "문제", yes: "예", no: "아니오", answerClip: "파일럿 결과", manual: "복사할 텍스트"
  }
};
const cases = window.PILOT_CASES;
const sessions = new Map();
const $ = id => document.getElementById(id);
const choices = ["approve", "revise", "evidence"];
let item, lang, ui, current;
const choiceText = value => ui[value === "evidence" ? "evidenceChoice" : value];
function urlFor(id, language, share = false) {
  const url = share && !/^https?:$/.test(location.protocol) ? new URL("https://cynkai.github.io/backtest-review-lab/") : new URL(location.href);
  url.search = ""; url.hash = "";
  url.searchParams.set("case", id); url.searchParams.set("lang", language);
  return url.href;
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
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || location.protocol === "file:") return;
    e.preventDefault();
    const changed = id !== item.id;
    history.pushState(null, "", a.href);
    render();
    if (changed) { $("question").focus({preventScroll: true}); window.scrollTo(0, 0); }
  };
}
function renderResult() {
  const answer = current.answer;
  $("result").hidden = !answer;
  if (!answer) return;
  $("result-tag").textContent = answer === item.correct ? ui.matched : ui.different;
  $("result-title").textContent = ui.rationale + " · " + choiceText(item.correct);
  $("reason").textContent = item.reason[lang];
  $("python-title").textContent = ui.python;
  $("check").textContent = item.check;
  const other = cases.find(c => c.id !== item.id);
  $("next").textContent = ui.next + " · " + other.title[lang];
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
      current.sawEvidence ||= $("evidence").open;
      current.answer = value;
      current.seconds = Math.max(0, Math.ceil((performance.now() - current.started) / 1000));
      renderChoices(); renderResult(); $("result").focus();
    };
    return button;
  }));
}
function render() {
  const p = new URL(location.href).searchParams;
  lang = ["ko", "en"].includes(p.get("lang")) ? p.get("lang") : (navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en");
  ui = labels[lang]; item = cases.find(c => c.id === p.get("case")) || cases[0];
  if (!sessions.has(item.id)) sessions.set(item.id, {started: performance.now(), answer: null, sawEvidence: false, expanded: false});
  current = sessions.get(item.id);
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
  $("kicker").textContent = ui.caseWord + " 0" + number + " / 02  ·  " + item.category[lang];
  $("title").textContent = item.title[lang]; $("instruction").textContent = ui.instruction;
  $("claim-title").textContent = ui.claim; $("claim").textContent = item.claim[lang];
  $("metrics").replaceChildren(...item.summary[lang].map(([label,value]) => {
    const m = elm("div", "", "metric"); m.append(elm("span", label, "metric-label"), elm("strong", value, "metric-value")); return m;
  }));
  $("evidence-title").textContent = ui.evidence + " · " + item.evidenceTitle[lang];
  $("evidence-note").textContent = item.evidenceNote[lang];
  const table = $("evidence-table"); table.replaceChildren();
  const head = table.createTHead().insertRow();
  for (const text of item.columns[lang]) { const th = elm("th", text); th.scope = "col"; head.append(th); }
  const body = table.createTBody();
  for (const row of item.rows[lang]) { const tr = body.insertRow(); for (const text of row) tr.insertCell().textContent = text; }
  $("evidence").open = current.expanded; $("python").open = false;
  $("decision-title").textContent = ui.choice; renderChoices(); renderResult();
  $("share").textContent = ui.share; $("copy-status").textContent = ""; $("copy-fallback").hidden = true;
  $("copy-fallback").setAttribute("aria-label", ui.manual); $("feedback").textContent = ui.feedback;
  $("source").textContent = lang === "ko" ? "GitHub에서 스타 남기기" : "Star on GitHub";
}
async function copy(text, success) {
  $("copy-fallback").hidden = true;
  try {
    await navigator.clipboard.writeText(text); $("copy-status").textContent = success;
  } catch {
    const field = $("copy-fallback");
    field.value = text; field.hidden = false; field.focus(); field.select();
    $("copy-status").textContent = ui.fallback;
  }
}
$("evidence").addEventListener("toggle", () => {
  current.expanded = $("evidence").open;
  if (current.expanded && !current.answer) current.sawEvidence = true;
});
$("share").onclick = () => copy(urlFor(item.id, lang, true), ui.shared);
$("report").onclick = () => {
  const lines = [ui.answerClip + " · " + item.id, ui.first + ": " + choiceText(current.answer), ui.time + ": " + current.seconds,
    ui.opened + ": " + (current.sawEvidence ? ui.yes : ui.no)];
  copy(lines.join("\n"), ui.reported);
};
window.addEventListener("popstate", render);
render();
