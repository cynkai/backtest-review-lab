// Run: dart run check.dart (Dart 3.0+)
import 'dart:math';

String firstExit(List<int> path) {
  // Both orders are active from the open. Segments are continuous.
  for (final price in path) {
    if (price >= 105) return 'target';
    if (price <= 95) return 'stop';
  }
  return 'neither';
}

(int, int, int, int) ohlc(List<int> path) {
  return (path.first, path.reduce(max), path.reduce(min), path.last);
}

void main() {
  const highFirst = [100, 108, 92, 103];
  const lowFirst = [100, 92, 108, 103];
  final bar = ohlc(highFirst);
  final first = firstExit(highFirst);
  final second = firstExit(lowFirst);
  if (bar != ohlc(lowFirst) ||
      bar != (100, 108, 92, 103) ||
      first != 'target' ||
      second != 'stop') {
    throw StateError('Paths must give the same bar and different first fills');
  }

  final (open, high, low, close) = bar;
  print('Bar (O/H/L/C): $open/$high/$low/$close');
  print('High first: $first');
  print('Low first: $second');
}
