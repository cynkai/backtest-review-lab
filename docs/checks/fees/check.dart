// Run: dart run check.dart (Dart 3.0+)
void main() {
  // One completed round trip. Prices and fees are in cents.
  const shares = 1;
  const buy = 10000;
  const sell = 10800;
  const entryFee = 125;
  const exitFee = 175;

  final gross = shares * (sell - buy);
  final fees = entryFee + exitFee;
  final net = gross - fees;
  if ((gross, fees, net) != (800, 300, 500)) {
    throw StateError('Cash flow does not match the two fills');
  }

  print('Gross: $gross cents');
  print('Fees: $fees cents');
  print('Net: $net cents');
}
