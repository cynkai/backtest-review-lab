# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
# Run: python3 check.py [exit-fee-cents]
import re
import sys


def main(args: list[str]) -> None:
    if len(args) > 1 or (args and not re.fullmatch(r"0|[1-9][0-9]{0,2}|1000", args[0])):
        raise SystemExit("Expected one optional exit fee in whole cents from 0 to 1000.")
    exit_fee = int(args[0]) if args else 175

    # One completed round trip. Prices and fees are in cents.
    shares = 1
    buy, sell = 10_000, 10_800
    entry_fee = 125

    gross = shares * (sell - buy)
    fees = entry_fee + exit_fee
    net = gross - fees
    assert net == (shares * sell - exit_fee) - (shares * buy + entry_fee)
    print(f"Gross: {gross} cents")
    print(f"Fees: {fees} cents")
    print(f"Net: {net} cents")


if __name__ == "__main__":
    main(sys.argv[1:])
