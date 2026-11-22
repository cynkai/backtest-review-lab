// Run: java Check.java (JDK 17+)
class Check {
    public static void main(String[] args) {
        // One completed round trip. Prices and fees are in cents.
        int shares = 1;
        int buy = 10_000, sell = 10_800;
        int entryFee = 125, exitFee = 175;

        int gross = shares * (sell - buy);
        int fees = entryFee + exitFee;
        int net = gross - fees;
        if (gross != 800 || fees != 300 || net != 500) {
            throw new AssertionError("Round trip does not reconcile");
        }
        System.out.printf("Gross: %d cents%nFees: %d cents%nNet: %d cents%n", gross, fees, net);
    }
}
