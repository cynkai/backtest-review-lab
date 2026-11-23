// Run: dart run check.dart [exit-fee-cents] (Dart 3.0+)
import 'dart:io';

void main(List<String> args) {
  var exitFee = 175;
  if (args.isNotEmpty) {
    final raw = args.first;
    final n = int.tryParse(raw, radix: 10);
    if (args.length != 1 ||
        n == null ||
        n < 0 ||
        n > 1000 ||
        n.toString() != raw) {
      stderr.writeln(
        'Expected one optional exit fee in whole cents from 0 to 1000.',
      );
      exitCode = 2;
      return;
    }
    exitFee = n;
  }

  // One completed round trip. Prices and fees are in cents.
  const shares = 1;
  const buy = 10000;
  const sell = 10800;
  const entryFee = 125;
  const gross = shares * (sell - buy);
  final fees = entryFee + exitFee;
  final net = gross - fees;
  print('Gross: $gross cents');
  print('Fees: $fees cents');
  print('Net: $net cents');
}
