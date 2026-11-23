// Run: java Check.java 11010 (JDK 17+, optional A–E mask; 1 keeps a trade).
import java.util.Arrays;
import java.util.stream.IntStream;

class Check {
    public static void main(String[] args) {
        String mask = args.length == 0 ? "11010" : args[0];
        if (args.length > 1 || !mask.matches("[01]{5}")) {
            System.err.println("Expected one optional five-digit A-E mask, e.g. 11010");
            System.exit(1);
        }

        // Trade A through E, net P&L in USD after costs.
        int[] original = {4, 4, 20, -3, -3};
        int[] filtered = IntStream.range(0, original.length)
                .filter(i -> mask.charAt(i) == '1').map(i -> original[i]).toArray();
        int originalNet = Arrays.stream(original).sum();
        int filteredNet = Arrays.stream(filtered).sum();
        long originalWins = Arrays.stream(original).filter(pnl -> pnl > 0).count();
        long filteredWins = Arrays.stream(filtered).filter(pnl -> pnl > 0).count();

        System.out.printf("Original: %d/%d wins, net %d USD%n", originalWins, original.length, originalNet);
        System.out.printf("Filtered: %d/%d wins, net %d USD%n", filteredWins, filtered.length, filteredNet);
        System.out.printf("Change in net profit: %d USD%n", filteredNet - originalNet);
    }
}
