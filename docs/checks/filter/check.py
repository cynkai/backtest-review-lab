# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
# Run: python3 check.py 11010 (optional A–E mask; 1 keeps a trade).
import sys


def main() -> None:
    args = sys.argv[1:]
    mask = args[0] if args else "11010"
    if len(args) > 1 or len(mask) != 5 or any(bit not in "01" for bit in mask):
        raise SystemExit("Expected one optional five-digit A-E mask, e.g. 11010")

    # Trade A through E, net P&L in USD after costs.
    original = [4, 4, 20, -3, -3]
    filtered = [pnl for pnl, bit in zip(original, mask) if bit == "1"]
    original_wins = sum(pnl > 0 for pnl in original)
    filtered_wins = sum(pnl > 0 for pnl in filtered)
    original_net = sum(original)
    filtered_net = sum(filtered)

    print(f"Original: {original_wins}/{len(original)} wins, net {original_net} USD")
    print(f"Filtered: {filtered_wins}/{len(filtered)} wins, net {filtered_net} USD")
    print(f"Change in net profit: {filtered_net - original_net} USD")


if __name__ == "__main__":
    main()
