# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
# Run with python3 check.py or uv run check.py.

def main() -> None:
    # The ledger already includes costs. The new filter skips C and E.
    ledger = {"A": 4, "B": 4, "C": 20, "D": -3, "E": -3}
    filtered = [ledger[key] for key in ("A", "B", "D")]
    original = list(ledger.values())

    original_wins = sum(pnl > 0 for pnl in original)
    filtered_wins = sum(pnl > 0 for pnl in filtered)
    assert (original_wins, len(original), sum(original)) == (3, 5, 22)
    assert (filtered_wins, len(filtered), sum(filtered)) == (2, 3, 5)

    print(f"Original: {original_wins}/{len(original)} wins, net {sum(original)} USD")
    print(f"Filtered: {filtered_wins}/{len(filtered)} wins, net {sum(filtered)} USD")
    print(f"Change in net profit: {sum(filtered) - sum(original)} USD")


if __name__ == "__main__":
    main()
