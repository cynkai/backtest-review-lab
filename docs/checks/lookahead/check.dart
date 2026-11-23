// Run: dart run check.dart (Dart 3.0+)
String yesNo(bool value) => value ? 'yes' : 'no';

void main() {
  const previousClose = 100;
  const officialClose = 104;
  const thresholdPercent = 3;

  // Minutes since midnight, all in the exchange's local time.
  const orderCutoff = 15 * 60 + 55;
  const closeAvailable = 16 * 60;

  final scaledGain = 100 * (officialClose - previousClose);
  final buySignal = scaledGain >= thresholdPercent * previousClose;
  final minutesAfterCutoff = closeAvailable - orderCutoff;
  final eligible = buySignal && minutesAfterCutoff <= 0;

  final returnPercent = (scaledGain / previousClose).toStringAsFixed(1);
  print('Close-to-close return: $returnPercent%');
  print('Buy signal: ${yesNo(buySignal)}');
  print(
    'Signal availability relative to cutoff (minutes): $minutesAfterCutoff',
  );
  print('Same-close fill eligible: ${yesNo(eligible)}');
}
