// Run: dart run check.dart (Dart 3.0+)
({int wins, int trades, int net}) summarize(Iterable<int> netResults) {
  var wins = 0;
  var trades = 0;
  var net = 0;
  for (final pnl in netResults) {
    if (pnl > 0) wins++;
    trades++;
    net += pnl;
  }
  return (wins: wins, trades: trades, net: net);
}

void main() {
  // The ledger already includes costs. The new filter skips C and E.
  const ledger = {'A': 4, 'B': 4, 'C': 20, 'D': -3, 'E': -3};
  const kept = {'A', 'B', 'D'};
  final filteredTrades = ledger.entries
      .where((trade) => kept.contains(trade.key))
      .map((trade) => trade.value);
  final original = summarize(ledger.values);
  final filtered = summarize(filteredTrades);
  if (original != (wins: 3, trades: 5, net: 22) ||
      filtered != (wins: 2, trades: 3, net: 5)) {
    throw StateError('Trade totals do not match the ledger');
  }

  print(
    'Original: ${original.wins}/${original.trades} wins, net ${original.net} USD',
  );
  print(
    'Filtered: ${filtered.wins}/${filtered.trades} wins, net ${filtered.net} USD',
  );
  print('Change in net profit: ${filtered.net - original.net} USD');
}
