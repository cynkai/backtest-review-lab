# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
# Run with python3 check.py or uv run check.py.

def main() -> None:
    previous_close = 100
    official_close = 104
    threshold_percent = 3

    # Minutes since midnight, all in the exchange's local time.
    order_cutoff = 15 * 60 + 55
    close_available = 16 * 60

    scaled_gain = 100 * (official_close - previous_close)
    buy_signal = scaled_gain >= threshold_percent * previous_close
    minutes_after_cutoff = close_available - order_cutoff
    eligible = buy_signal and minutes_after_cutoff <= 0

    print(f"Close-to-close return: {scaled_gain / previous_close:.1f}%")
    print("Buy signal:", "yes" if buy_signal else "no")
    print("Signal availability relative to cutoff (minutes):", minutes_after_cutoff)
    print("Same-close fill eligible:", "yes" if eligible else "no")


if __name__ == "__main__":
    main()
