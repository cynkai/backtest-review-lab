# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
# Run with python3 check.py or uv run check.py.

def main() -> None:
    # One completed round trip. Prices and fees are in cents.
    shares = 1
    buy, sell = 10_000, 10_800
    entry_fee, exit_fee = 125, 175

    gross = shares * (sell - buy)
    fees = entry_fee + exit_fee
    net = gross - fees
    assert (gross, fees, net) == (800, 300, 500)
    print(f"Gross: {gross} cents")
    print(f"Fees: {fees} cents")
    print(f"Net: {net} cents")


if __name__ == "__main__":
    main()
