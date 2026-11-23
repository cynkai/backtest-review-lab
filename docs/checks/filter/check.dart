// Run: dart run check.dart 11010 (Dart 3.0+, optional A–E mask; 1 keeps a trade).
import 'dart:io';

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

void main(List<String> args) {
  final mask = args.isEmpty ? '11010' : args.first;
  if (args.length > 1 || mask.length != 5 || mask.contains(RegExp('[^01]'))) {
    stderr.writeln('Expected one optional five-digit A-E mask, e.g. 11010');
    exitCode = 1;
    return;
  }

  // Trade A through E, net P&L in USD after costs.
  const ledger = [4, 4, 20, -3, -3];
  final kept = [
    for (var i = 0; i < ledger.length; i++)
      if (mask[i] == '1') ledger[i],
  ];
  final original = summarize(ledger);
  final filtered = summarize(kept);

  print(
    'Original: ${original.wins}/${original.trades} wins, net ${original.net} USD',
  );
  print(
    'Filtered: ${filtered.wins}/${filtered.trades} wins, net ${filtered.net} USD',
  );
  print('Change in net profit: ${filtered.net - original.net} USD');
}
