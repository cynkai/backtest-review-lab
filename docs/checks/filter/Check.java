// Run: java Check.java (JDK 17+)
import java.util.List;

class Check {
    record Trade(int pnl, boolean kept) {}

    public static void main(String[] args) {
        // Net P&L in USD and whether the filter kept the trade, A through E.
        var original = List.of(new Trade(4, true), new Trade(4, true),
                new Trade(20, false), new Trade(-3, true), new Trade(-3, false));
        var filtered = original.stream().filter(Trade::kept).toList();
        int originalNet = original.stream().mapToInt(Trade::pnl).sum();
        int filteredNet = filtered.stream().mapToInt(Trade::pnl).sum();
        long originalWins = original.stream().filter(t -> t.pnl() > 0).count();
        long filteredWins = filtered.stream().filter(t -> t.pnl() > 0).count();
        if (originalNet != 22 || filteredNet != 5 || originalWins != 3
                || filteredWins != 2 || original.size() != 5 || filtered.size() != 3) {
            throw new AssertionError("Totals differ from the ledger");
        }

        System.out.printf("Original: %d/%d wins, net %d USD%n", originalWins, original.size(), originalNet);
        System.out.printf("Filtered: %d/%d wins, net %d USD%n", filteredWins, filtered.size(), filteredNet);
        System.out.printf("Change in net profit: %d USD%n", filteredNet - originalNet);
    }
}
