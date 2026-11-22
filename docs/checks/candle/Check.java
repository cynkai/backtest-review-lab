// Run: java Check.java (JDK 17+)
import java.util.Arrays;

class Check {
    static String firstExit(int[] path) {
        // Both orders are active from the open. Segments are continuous.
        for (int price : path) {
            if (price >= 105) return "target";
            if (price <= 95) return "stop";
        }
        return "neither";
    }

    static int[] ohlc(int[] path) {
        var stats = Arrays.stream(path).summaryStatistics();
        return new int[]{path[0], stats.getMax(), stats.getMin(), path[path.length - 1]};
    }

    public static void main(String[] args) {
        int[] highFirst = {100, 108, 92, 103};
        int[] lowFirst = {100, 92, 108, 103};
        int[] bar = ohlc(highFirst);
        String first = firstExit(highFirst), second = firstExit(lowFirst);
        if (!Arrays.equals(bar, ohlc(lowFirst))
                || !Arrays.equals(bar, new int[]{100, 108, 92, 103})
                || !first.equals("target") || !second.equals("stop")) {
            throw new AssertionError("Paths must give the same bar and different first fills");
        }
        System.out.printf("Bar (O/H/L/C): %d/%d/%d/%d%n", bar[0], bar[1], bar[2], bar[3]);
        System.out.println("High first: " + first);
        System.out.println("Low first: " + second);
    }
}
