// Run: java Check.java (JDK 17+)
import java.util.Locale;

class Check {
    static String yesNo(boolean value) {
        return value ? "yes" : "no";
    }

    public static void main(String[] args) {
        int previousClose = 100;
        int officialClose = 104;
        int thresholdPercent = 3;

        // Minutes since midnight, all in the exchange's local time.
        int orderCutoff = 15 * 60 + 55;
        int closeAvailable = 16 * 60;

        int scaledGain = 100 * (officialClose - previousClose);
        boolean buySignal = scaledGain >= thresholdPercent * previousClose;
        int minutesAfterCutoff = closeAvailable - orderCutoff;
        boolean eligible = buySignal && minutesAfterCutoff <= 0;

        System.out.printf(Locale.ROOT, "Close-to-close return: %.1f%%%n", (double) scaledGain / previousClose);
        System.out.println("Buy signal: " + yesNo(buySignal));
        System.out.println("Signal availability relative to cutoff (minutes): " + minutesAfterCutoff);
        System.out.println("Same-close fill eligible: " + yesNo(eligible));
    }
}
