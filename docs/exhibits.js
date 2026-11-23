(() => {
  "use strict";

  const ink = "var(--ink)";
  const muted = "var(--muted)";
  const rule = "var(--rule)";
  const accent = "var(--accent)";
  const mono = "var(--mono, monospace)";

  function element(tag, content, className) {
    const node = document.createElement(tag);
    node.textContent = content;
    if (className) node.className = className;
    return node;
  }

  function svgNode(tag, attributes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  }

  function chart(viewBox, label) {
    return svgNode("svg", { viewBox, role: "img", "aria-label": label, focusable: "false" });
  }

  function label(svg, x, y, value, options = {}) {
    const t = svgNode("text", { x, y, fill: ink, "font-size": 15, ...options });
    t.textContent = value;
    svg.append(t);
  }

  function line(svg, x1, y1, x2, y2, stroke, width = 1, extra = {}) {
    svg.append(svgNode("line", { x1, y1, x2, y2, stroke, "stroke-width": width, ...extra }));
  }

  function ledgerExhibit({ trades }, ko) {
    const first = ko ? "기존" : "Original";
    const second = ko ? "필터 적용" : "Filtered";
    const win = ko ? "이익" : "win";
    const loss = ko ? "손실" : "loss";
    const skipped = ko ? "제외" : "skipped";
    const description = trades.map(t => {
      const outcome = t.net > 0 ? win : loss;
      return t.id + " " + first + " " + outcome + ", " + second + " " + (t.kept ? outcome : skipped);
    }).join(". ");
    const plot = chart("0 0 330 100", description);
    line(plot, 0, 60, 330, 60, rule);
    label(plot, 0, 45, first, { fill: muted });
    label(plot, 0, 85, second, { fill: muted });
    trades.forEach((trade, index) => {
      const x = 93 + index * 53;
      label(plot, x, 16, trade.id, { fill: muted, "text-anchor": "middle", "font-family": mono, "font-size": 14 });
      for (const [cy, taken] of [[40, true], [80, trade.kept]]) {
        const positive = trade.net > 0;
        const color = positive ? ink : accent;
        plot.append(svgNode("rect", {
          x: x - 15, y: cy - 11, width: 30, height: 22, rx: 1,
          fill: taken ? "none" : "transparent", stroke: taken ? color : muted,
          "stroke-dasharray": taken ? "none" : "2.5 3"
        }));
        if (taken) {
          line(plot, x - 5, cy, x + 5, cy, color, 1.75);
          if (positive) line(plot, x, cy - 5, x, cy + 5, color, 1.75);
        }
      }
    });
    return {
      title: ko ? "거래별 승패" : "Five trades, side by side",
      plot,
      note: ko ? "＋ 이익　− 손실　점선은 필터로 제외된 거래" : "+ gain　− loss　Dashed cells are skipped trades."
    };
  }

  function candleExhibit({ bar, stop, target }, ko) {
    const fields = ko ? { high: "고가", low: "저가", open: "시가", close: "종가" }
      : { high: "High", low: "Low", open: "Open", close: "Close" };
    const stopLabel = ko ? "손절" : "Stop";
    const targetLabel = ko ? "익절" : "Target";
    const names = Object.entries(fields).map(([key, field]) => field + " $" + bar[key]);
    names.push(targetLabel + " $" + target, stopLabel + " $" + stop);
    const plot = chart("0 0 320 145", names.join(", "));
    const y = price => 16 + (bar.high - price) * 112 / (bar.high - bar.low);
    const x = 124;
    line(plot, x, y(bar.high), x, y(bar.low), ink, 2.5);
    for (const key of ["high", "low"]) line(plot, x - 5, y(bar[key]), x + 5, y(bar[key]), ink, 1.5);
    plot.append(svgNode("rect", {
      x: x - 15, y: Math.min(y(bar.open), y(bar.close)), width: 30, height: Math.abs(y(bar.close) - y(bar.open)),
      fill: "var(--paper)", stroke: ink, "stroke-width": 2.5
    }));
    for (const [key, name] of Object.entries(fields)) {
      const body = key === "open" || key === "close";
      line(plot, 83, y(bar[key]), x - (body ? 17 : 7), y(bar[key]), rule);
      label(plot, 78, y(bar[key]) + 5, name + " $" + bar[key], { "text-anchor": "end", fill: muted });
    }
    for (const [price, name] of [[target, targetLabel], [stop, stopLabel]]) {
      line(plot, x + 19, y(price), 205, y(price), accent, 1.5, { "stroke-dasharray": "4 3" });
      label(plot, 211, y(price) + 5, name + " $" + price, { fill: accent, "font-weight": 600 });
    }
    return {
      title: ko ? "5분봉과 청산 주문" : "The bar and its exit orders",
      plot,
      note: ko ? "점선은 봉이 열릴 때 활성 상태였던 두 청산 주문의 가격입니다." : "Dashed lines mark the two exit orders active at the opening price."
    };
  }

  function candleReplayPlot({ bar, stop, target }, highFirst, ko) {
    const prices = highFirst
      ? [bar.open, bar.high, bar.low, bar.close]
      : [bar.open, bar.low, bar.high, bar.close];
    const names = ko ? ["시가", "고가", "저가", "종가"] : ["Open", "High", "Low", "Close"];
    const sequence = highFirst ? names : [names[0], names[2], names[1], names[3]];
    const plot = chart("0 0 410 178", prices.map((price, i) => sequence[i] + " $" + price).join(", "));
    const xs = [30, 116, 202, 288];
    const y = price => 14 + (bar.high - price) * 110 / (bar.high - bar.low);
    const exit = highFirst ? target : stop;
    const exitX = xs[0] + (xs[1] - xs[0]) * (exit - bar.open) / (prices[1] - bar.open);

    for (const [price, name] of [[target, ko ? "익절" : "Target"], [stop, ko ? "손절" : "Stop"]]) {
      const color = price === exit ? accent : muted;
      line(plot, 14, y(price), 310, y(price), color, 1, { "stroke-dasharray": "5 4" });
      label(plot, 318, y(price) + 5, name + " $" + price, { fill: color });
    }

    plot.append(svgNode("polyline", {
      points: prices.map((price, i) => xs[i] + "," + y(price)).join(" "),
      fill: "none", stroke: ink, "stroke-width": 2, "stroke-linejoin": "round"
    }));
    plot.append(svgNode("circle", {
      cx: exitX, cy: y(exit), r: 5, fill: accent, stroke: "var(--sheet)", "stroke-width": 1.5
    }));

    prices.forEach((price, i) => {
      const x = xs[i];
      const centered = { "text-anchor": "middle" };
      plot.append(svgNode("circle", { cx: x, cy: y(price), r: 3, fill: ink }));
      label(plot, x, 150, sequence[i], { fill: muted, ...centered });
      label(plot, x, 169, "$" + price, { "font-family": mono, ...centered });
    });
    return plot;
  }

  window.renderCandleReplay = (container, data, lang) => {
    const ko = lang === "ko";
    const selected = container.querySelector("input:checked")?.value ?? "high";
    const heading = element("h3", ko ? "같은 봉, 다른 청산" : "Same bar, different exits", "replay-heading");
    const controls = element("div", "", "replay-controls");
    const fieldset = document.createElement("fieldset");
    fieldset.append(element("legend", ko ? "가격 경로 선택" : "Choose a price path"));
    const plot = element("div", "", "replay-plot");
    const summary = element("p", "", "replay-summary");
    summary.setAttribute("role", "status");
    const note = element("p", ko
      ? "두 경로 모두 같은 시가·고가·저가·종가를 만듭니다. 가로 위치는 순서만 나타냅니다."
      : "Both paths have the same open, high, low and close. Horizontal spacing shows order only.", "replay-note");

    function showPath(value) {
      const highFirst = value === "high";
      plot.replaceChildren(candleReplayPlot(data, highFirst, ko));
      summary.textContent = highFirst
        ? (ko ? "익절가 $" + data.target + "에 먼저 닿아 손절 주문이 취소됩니다."
          : "Price touches the $" + data.target + " target first, cancelling the stop.")
        : (ko ? "손절가 $" + data.stop + "에 먼저 닿아 익절 주문이 취소됩니다."
          : "Price touches the $" + data.stop + " stop first, cancelling the target.");
    }

    for (const [value, title] of [["high", ko ? "고가 먼저" : "High first"], ["low", ko ? "저가 먼저" : "Low first"]]) {
      const option = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "candle-path";
      input.value = value;
      input.checked = value === selected;
      input.addEventListener("change", () => showPath(value));
      option.append(input, " ", title);
      fieldset.append(option);
    }
    controls.append(fieldset);
    container.classList.add("candle-replay");
    container.replaceChildren(heading, controls, plot, summary, note);
    showPath(selected);
  };

  function feeExhibit(receipt, ko) {
    const plot = element("table", "", "fee-ticket");
    const title = ko ? "현금 입출금 내역" : "The cash ledger";
    plot.setAttribute("aria-label", title);
    const headers = ko ? ["주문", "거래 대금", "수수료"] : ["Side", "Trade value", "Commission"];
    const head = plot.createTHead().insertRow();
    for (const value of headers) {
      const th = element("th", value);
      th.scope = "col";
      head.append(th);
    }
    const currency = cents => "$" + (cents / 100).toFixed(2);
    const body = plot.createTBody();
    const orders = [
      [ko ? "매수" : "Buy", "−" + currency(receipt.quantity * receipt.buyCents), "−" + currency(receipt.buyFeeCents)],
      [ko ? "매도" : "Sell", "+" + currency(receipt.quantity * receipt.sellCents), "−" + currency(receipt.sellFeeCents)]
    ];
    for (const [side, value, fee] of orders) {
      const row = body.insertRow();
      const th = element("th", side);
      th.scope = "row";
      row.append(th);
      row.insertCell().textContent = value;
      row.insertCell().textContent = fee;
    }
    return {
      title, plot,
      note: ko ? "＋ 계좌에 들어온 돈　− 계좌에서 나간 돈" : "+ credited to the account　− debited from the account"
    };
  }

  function lookaheadExhibit({ orderCutoff, closeAvailable }, ko) {
    const events = [
      { x: 78, time: orderCutoff, name: ko ? "주문 마감" : "Order cutoff" },
      { x: 241, time: closeAvailable, name: ko ? "공식 종가 공개" : "Official close available" }
    ];
    const plot = chart("0 0 330 96", events.map(({ time, name }) => time + " " + name).join(", "));
    line(plot, 16, 51, 313, 51, muted);
    plot.append(svgNode("path", { d: "M307 46 L313 51 L307 56", fill: "none", stroke: muted }));
    for (const { x, time, name } of events) {
      label(plot, x, 31, time, { "font-family": mono, "font-size": 21, "text-anchor": "middle" });
      plot.append(svgNode("circle", { cx: x, cy: 51, r: 4, fill: ink }));
      label(plot, x, 80, name, { "text-anchor": "middle" });
    }
    return {
      title: ko ? "장 마감 전후 기록" : "Events around the close",
      plot,
      note: ko ? "시각은 거래소 현지 시간입니다." : "Times are local to the exchange."
    };
  }

  const exhibitFor = { filter: ledgerExhibit, candle: candleExhibit, fees: feeExhibit, lookahead: lookaheadExhibit };
  window.renderExhibit = (container, caseId, lang) => {
    const item = window.PILOT_CASES.find(c => c.id === caseId);
    const { title, plot, note } = exhibitFor[item.id](item.data, lang === "ko");
    const body = element("div", "", "exhibit-plot");
    body.append(plot);
    container.replaceChildren(element("figcaption", title, "exhibit-title"), body, element("p", note, "exhibit-note"));
  };
})();
