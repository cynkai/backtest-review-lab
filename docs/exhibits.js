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

  const exhibitFor = { filter: ledgerExhibit, candle: candleExhibit, fees: feeExhibit };
  window.renderExhibit = (container, caseId, lang) => {
    const item = window.PILOT_CASES.find(c => c.id === caseId);
    const { title, plot, note } = exhibitFor[item.id](item.data, lang === "ko");
    const body = element("div", "", "exhibit-plot");
    body.append(plot);
    container.replaceChildren(element("figcaption", title, "exhibit-title"), body, element("p", note, "exhibit-note"));
  };
})();
