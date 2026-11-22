// Run: rustc check.rs -o check && ./check
fn first_exit(path: &[i32; 4]) -> &'static str {
    // Both orders are active from the open. Segments are continuous.
    for &price in path {
        if price >= 105 {
            return "target";
        }
        if price <= 95 {
            return "stop";
        }
    }
    "neither"
}

fn ohlc(path: &[i32; 4]) -> [i32; 4] {
    let high = path.iter().copied().fold(path[0], i32::max);
    let low = path.iter().copied().fold(path[0], i32::min);
    [path[0], high, low, path[3]]
}

fn main() {
    let high_first = [100, 108, 92, 103];
    let low_first = [100, 92, 108, 103];
    let bar = ohlc(&high_first);
    assert_eq!(bar, ohlc(&low_first));
    assert_eq!(bar, [100, 108, 92, 103]);
    let (first, second) = (first_exit(&high_first), first_exit(&low_first));
    assert_eq!((first, second), ("target", "stop"));
    let [open, high, low, close] = bar;
    println!("Bar (O/H/L/C): {open}/{high}/{low}/{close}");
    println!("High first: {first}");
    println!("Low first: {second}");
}
