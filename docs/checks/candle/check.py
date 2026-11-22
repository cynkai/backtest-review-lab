# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
# Run with python3 check.py or uv run check.py.

def first_exit(path: list[int]) -> str:
    # Both orders are active from the open. Segments are continuous.
    for price in path:
        if price >= 105:
            return "target"
        if price <= 95:
            return "stop"
    return "neither"


def ohlc(path: list[int]) -> tuple[int, int, int, int]:
    return path[0], max(path), min(path), path[-1]


def main() -> None:
    high_first = [100, 108, 92, 103]
    low_first = [100, 92, 108, 103]
    bar = ohlc(high_first)
    assert bar == ohlc(low_first) == (100, 108, 92, 103)
    exits = first_exit(high_first), first_exit(low_first)
    assert exits == ("target", "stop")
    print("Bar (O/H/L/C):", "/".join(map(str, bar)))
    print("High first:", exits[0])
    print("Low first:", exits[1])


if __name__ == "__main__":
    main()
