(() => {
  const ledger = [
    { id: "A", net: 4, kept: true },
    { id: "B", net: 4, kept: true },
    { id: "C", net: 20, kept: false },
    { id: "D", net: -3, kept: true },
    { id: "E", net: -3, kept: false }
  ];
  const kept = ledger.filter(trade => trade.kept);
  const winRate = trades => (100 * trades.filter(trade => trade.net > 0).length / trades.length).toFixed(1) + "%";
  const signed = amount => amount >= 0 ? "+" + amount : "−" + Math.abs(amount);
  const ledgerRows = excluded => ledger.map(trade => [
    trade.id, signed(trade.net), trade.kept ? signed(trade.net) : excluded
  ]);
  const candle = { open: 100, high: 108, low: 92, close: 103 };
  const entry = 100;
  const stop = 95;
  const target = 105;
  const candleRow = [candle.open, candle.high, candle.low, candle.close].map(String);

  const receipt = { quantity: 1, buyCents: 10000, sellCents: 10800, buyFeeCents: 125, sellFeeCents: 175 };
  const dollars = cents => (cents / 100).toFixed(2);
  const receiptRows = (buy, sell) => [
    [buy, String(receipt.quantity), dollars(receipt.buyCents), dollars(receipt.buyFeeCents)],
    [sell, String(receipt.quantity), dollars(receipt.sellCents), dollars(receipt.sellFeeCents)]
  ];

  window.PILOT_CASES = [
    {
      id: "filter",
      data: { trades: ledger },
      correct: "revise",
      title: { ko: "승률이 오른 필터", en: "The higher win rate" },
      category: { ko: "거래 원장", en: "Trade ledger" },
      claim: {
        ko: "“진입 필터를 추가하자 승률이 올랐습니다. 같은 기간의 순손익도 개선됐습니다.”",
        en: "“Adding an entry filter raised our win rate. It also improved our net profit over the same period.”"
      },
      summary: {
        ko: [["기존 승률", winRate(ledger)], ["필터 적용 후", winRate(kept)]],
        en: [["Original win rate", winRate(ledger)], ["With filter", winRate(kept)]]
      },
      evidenceTitle: { ko: "거래 5건의 원장", en: "Five-trade ledger" },
      evidenceNote: {
        ko: "각 금액은 비용을 반영한 순손익(달러)입니다. 두 버전의 비교 기간과 거래당 투입금은 같습니다. ‘제외’는 필터로 진입하지 않은 거래입니다.",
        en: "Amounts are net P&L in dollars after costs. Both versions use the same period and position size per trade. “Skipped” means the filter blocked the entry."
      },
      columns: {
        ko: ["거래", "기존 ($)", "필터 적용 후 ($)"],
        en: ["Trade", "Original ($)", "With filter ($)"]
      },
      rows: { ko: ledgerRows("제외"), en: ledgerRows("Skipped") },
      reason: {
        ko: "승률은 3승 5전에서 2승 3전으로 올랐습니다. 하지만 필터가 3달러 손실을 피하면서 20달러 이익도 놓쳤습니다. 순손익은 22달러에서 5달러로 줄었으므로 이 기간의 순손익이 개선됐다는 문장을 고쳐야 합니다.",
        en: "The win rate did rise, from 3 wins in 5 trades to 2 in 3. But the filter avoided a $3 loss and gave up a $20 gain. Net profit fell from $22 to $5, so the claim about this period’s net profit needs a correction."
      }
    },
    {
      id: "candle",
      data: { bar: candle, entry, stop, target },
      correct: "evidence",
      title: { ko: "한 봉 안의 두 주문", en: "Two orders, one candle" },
      category: { ko: "체결 순서", en: "Order execution" },
      claim: {
        ko: "“이 5분봉에서는 105달러 익절가에 먼저 닿았습니다. 이 거래를 익절로 기록했습니다.”",
        en: "“During this five-minute bar, price reached the $105 target first. We recorded a take-profit exit.”"
      },
      summary: {
        ko: [["봉 주기", "5분"], ["롱 진입가", "$" + entry]],
        en: [["Bar interval", "5 min"], ["Long entry", "$" + entry]]
      },
      evidenceTitle: { ko: "5분봉과 주문 조건", en: "Five-minute bar and order terms" },
      evidenceNote: {
        ko: "봉이 열릴 때 이미 100달러에 매수한 1주를 보유 중입니다. 손절가 95달러와 익절가 105달러는 모두 활성 상태이며, 먼저 닿은 가격에 체결되면 다른 주문은 취소됩니다. 가격은 연속적으로 움직였고, 기록에는 아래 네 가격만 남았습니다.",
        en: "At the open we already hold one share bought at $100. Both exits are active: a $95 stop and a $105 target. The first level touched fills and cancels the other. Price moves continuously. Only the four prices below were recorded."
      },
      columns: {
        ko: ["시가 ($)", "고가 ($)", "저가 ($)", "종가 ($)"],
        en: ["Open ($)", "High ($)", "Low ($)", "Close ($)"]
      },
      rows: { ko: [candleRow], en: [candleRow] },
      reason: {
        ko: "100 → 108 → 92 → 103이면 105달러 익절이 먼저입니다. 100 → 92 → 108 → 103이면 95달러 손절이 먼저입니다. 두 경로는 같은 5분봉을 만듭니다. 실제 순서를 판정하려면 두 가격에 처음 닿은 시각을 구분할 수 있는 기록이 필요합니다.",
        en: "On the path 100 → 108 → 92 → 103, the $105 target fills first. On 100 → 92 → 108 → 103, the $95 stop fills first. Both paths produce this bar. Ask for a time-ordered record detailed enough to identify the first touch."
      }
    },
    {
      id: "fees",
      data: receipt,
      correct: "approve",
      title: { ko: "두 장의 체결 명세서", en: "The round-trip receipt" },
      category: { ko: "거래 비용", en: "Trading costs" },
      claim: {
        ko: "“한 주를 100달러에 사서 108달러에 팔았습니다. 매수·매도 수수료를 모두 내고 남은 돈은 5달러입니다.”",
        en: "“We bought one share at $100 and sold it at $108. After both commissions, we made $5 on the round trip.”"
      },
      summary: {
        ko: [["거래 수량", receipt.quantity + "주"], ["매매 차익", "$" + dollars(receipt.quantity * (receipt.sellCents - receipt.buyCents))]],
        en: [["Position size", receipt.quantity + " share"], ["Gross profit", "$" + dollars(receipt.quantity * (receipt.sellCents - receipt.buyCents))]]
      },
      evidenceTitle: { ko: "매수·매도 체결 내역", en: "Buy and sell confirmations" },
      evidenceNote: {
        ko: "매수와 매도가 모두 표시된 가격에 체결됐습니다. 수수료는 주문당 한 번씩 별도 청구됐고, 이 거래에 발생한 비용은 두 건이 전부입니다.",
        en: "Both orders filled at the prices shown. The broker charged one commission per order, billed separately. These were the only costs on this trade."
      },
      columns: {
        ko: ["주문", "수량", "체결가 ($)", "수수료 ($)"],
        en: ["Side", "Shares", "Fill ($)", "Fee ($)"]
      },
      rows: {
        ko: receiptRows("매수", "매도"),
        en: receiptRows("Buy", "Sell")
      },
      reason: {
        ko: "매수 때 101.25달러가 나갔고 매도 때 106.25달러가 들어왔습니다. 두 현금 흐름의 차이는 정확히 5달러입니다. 여기서 수수료를 또 빼면 같은 비용을 두 번 계산합니다.",
        en: "The buy took $101.25 out of the account. The sale put $106.25 back in. The difference is exactly $5. Subtracting commissions again would charge the same two fees twice."
      }
    }
  ];
})();
