// Run: java Check.java [exit-fee-cents] (JDK 17+)
class Check {
    public static void main(String[] args) {
        if (args.length > 1 || (args.length == 1 && !args[0].matches("0|[1-9][0-9]{0,2}|1000"))) {
            System.err.println("Expected one optional exit fee in whole cents from 0 to 1000.");
            System.exit(2);
        }
        int exitFee = args.length == 0 ? 175 : Integer.parseInt(args[0]);

        // One completed round trip. Prices and fees are in cents.
        int shares = 1;
        int buy = 10_000, sell = 10_800;
        int entryFee = 125;
        int gross = shares * (sell - buy);
        int fees = entryFee + exitFee;
        int net = gross - fees;
        System.out.printf("Gross: %d cents%nFees: %d cents%nNet: %d cents%n", gross, fees, net);
    }
}
