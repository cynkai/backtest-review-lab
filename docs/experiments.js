(() => {
  "use strict";

  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function dollars(value, decimals = 0, signed = true) {
    const sign = value < 0 ? "−" : signed && value > 0 ? "+" : "";
    return sign + "$" + Math.abs(value).toFixed(decimals);
  }

  function button(text, action, click) {
    const control = node("button", text, "experiment-button");
    control.type = "button";
    control.dataset.action = action;
    control.addEventListener("click", click);
    return control;
  }

  function amountRow(list, label, key, total = false) {
    const row = node("div", "", total ? "experiment-total" : "");
    const amount = node("dd");
    amount.dataset.value = key;
    row.append(node("dt", label), amount);
    list.append(row);
    return amount;
  }

  function filterWorksheet(controls, statement, trades, argument, ko, onChange) {
    const group = node("fieldset", "", "experiment-trades");
    group.append(node("legend", ko ? "포함할 거래" : "Trades to include"));
    const strip = node("div", "", "experiment-strip");
    const metrics = node("dl", "", "experiment-stats");
    const keptStat = amountRow(metrics, ko ? "포함 건수" : "Trades kept", "kept");
    const winsStat = amountRow(metrics, ko ? "승률" : "Win rate", "wins");
    const reset = button(ko ? "원래 필터로" : "Restore original filter", "reset", () => {
      for (const [i, input] of inputs.entries()) input.checked = trades[i].kept;
      update();
    });
    const inputs = trades.map((trade, i) => {
      const label = node("label", "", "experiment-trade");
      const input = node("input");
      input.type = "checkbox";
      input.checked = argument[i] === "1";
      input.dataset.trade = trade.id;
      const heading = node("span", trade.id, "experiment-trade-id");
      const amount = node("span", dollars(trade.net), "experiment-trade-pnl");
      label.append(input, heading, amount);
      input.addEventListener("change", update);
      strip.append(label);
      return input;
    });
    group.append(strip);
    controls.append(group, metrics, reset);
    const baseNet = trades.reduce((sum, trade) => sum + trade.net, 0);
    amountRow(statement, ko ? "전체 거래 순손익" : "Net from all trades", "baseline").textContent = dollars(baseNet);
    const forgone = amountRow(statement, ko ? "제외한 이익" : "Gains given up", "excluded-gains");
    const avoided = amountRow(statement, ko ? "피한 손실" : "Losses avoided", "avoided-losses");
    const netStat = amountRow(statement, ko ? "선택한 거래 순손익" : "Net from selection", "net", true);
    const deltaStat = amountRow(statement, ko ? "전체 대비 차이" : "Change from all trades", "delta");

    function update() {
      let kept = 0, wins = 0, net = 0, excludedGains = 0, avoidedLosses = 0;
      for (const [i, trade] of trades.entries()) {
        if (inputs[i].checked) {
          kept++;
          if (trade.net > 0) wins++;
          net += trade.net;
        } else if (trade.net > 0) {
          excludedGains += trade.net;
        } else {
          avoidedLosses -= trade.net;
        }
      }
      keptStat.textContent = kept + " / " + trades.length;
      winsStat.textContent = kept ? (100 * wins / kept).toFixed(1) + "%" : (ko ? "해당 없음" : "N/A");
      forgone.textContent = dollars(-excludedGains);
      avoided.textContent = dollars(avoidedLosses);
      netStat.textContent = dollars(net);
      deltaStat.textContent = dollars(net - baseNet);
      const mask = inputs.map(input => input.checked ? "1" : "0").join("");
      if (mask !== argument) onChange(mask);
      argument = mask;
    }
    update();
  }

  function feeWorksheet(controls, statement, data, argument, ko, onChange) {
    const gross = data.quantity * (data.sellCents - data.buyCents);
    const breakEven = gross - data.buyFeeCents;
    const usd = cents => dollars(cents / 100, 2, false);
    const label = node("label", "", "experiment-fee-label");
    const feeReadout = node("strong");
    label.htmlFor = "experiment-exit-fee";
    label.append(node("span", ko ? "매도 수수료" : "Exit commission"), feeReadout);
    const input = node("input");
    input.id = label.htmlFor;
    input.type = "range";
    input.min = "0";
    input.max = "1000";
    input.step = "1";
    input.value = argument;
    input.dataset.exitFee = "";
    input.setAttribute("aria-label", ko ? "매도 수수료" : "Exit commission");
    const scale = node("div", "", "experiment-range-labels");
    scale.setAttribute("aria-hidden", "true");
    scale.append(node("span", usd(0)), node("span", usd(Number(input.max))));
    const presets = node("div", "", "experiment-presets");
    function preset(text, action, cents) {
      return button(text, action, () => {
        input.value = String(cents);
        update();
      });
    }
    presets.append(
      preset((ko ? "원래 수수료 " : "Original fee ") + usd(data.sellFeeCents), "reset", data.sellFeeCents),
      preset((ko ? "손익분기 " : "Break even at ") + usd(breakEven), "breakeven", breakEven)
    );
    controls.append(label, input, scale, presets);
    amountRow(statement, ko ? "매매 차익" : "Gross profit", "gross").textContent = dollars(gross / 100, 2);
    amountRow(statement, ko ? "매수 수수료" : "Entry commission", "entry-fee").textContent = dollars(-data.buyFeeCents / 100, 2);
    const exit = amountRow(statement, ko ? "매도 수수료" : "Exit commission", "exit-fee");
    const net = amountRow(statement, ko ? "수수료 반영 순손익" : "Net after commissions", "net", true);

    function update() {
      const cents = Number(input.value);
      feeReadout.textContent = usd(cents);
      input.setAttribute("aria-valuetext", usd(cents));
      exit.textContent = dollars(-cents / 100, 2);
      net.textContent = dollars((gross - data.buyFeeCents - cents) / 100, 2);
      if (argument !== input.value) onChange(input.value);
      argument = input.value;
    }
    input.addEventListener("input", update);
    update();
  }

  window.renderExperiment = (container, item, lang, argument, onChange) => {
    const ko = lang === "ko";
    const filter = item.id === "filter";
    const title = filter ? (ko ? "어떤 거래를 남길까?" : "Which trades would you keep?")
      : (ko ? "수수료가 얼마면 이익이 사라질까?" : "What fee wipes out the gain?");
    const sheet = node("div", "", "experiment");
    sheet.dataset.experiment = item.id;
    const header = node("h3", title);
    header.id = "experiment-title";
    container.setAttribute("aria-labelledby", header.id);
    const body = node("div", "", "experiment-body");
    const controls = node("div", "", "experiment-controls");
    const statement = node("dl", "", "experiment-statement");
    statement.setAttribute("aria-live", "polite");
    statement.setAttribute("aria-atomic", "true");
    if (filter) filterWorksheet(controls, statement, item.data.trades, argument, ko, onChange);
    else feeWorksheet(controls, statement, item.data, argument, ko, onChange);
    body.append(controls, statement);
    sheet.append(header, body);
    container.replaceChildren(sheet);
  };
})();
