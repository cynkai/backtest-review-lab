// Run: rustc check.rs -o check && ./check
fn main() {
    // (Net P&L in USD, kept by the new filter), in trade order A through E.
    let ledger = [(4, true), (4, true), (20, false), (-3, true), (-3, false)];
    let original: Vec<i32> = ledger.iter().map(|&(pnl, _)| pnl).collect();
    let filtered: Vec<i32> = ledger
        .iter()
        .filter_map(|&(pnl, keep)| keep.then_some(pnl))
        .collect();

    let stats = |trades: &[i32]| {
        let wins = trades.iter().filter(|&&pnl| pnl > 0).count();
        (wins, trades.len(), trades.iter().sum::<i32>())
    };
    let (wins_a, count_a, net_a) = stats(&original);
    let (wins_b, count_b, net_b) = stats(&filtered);
    assert_eq!((wins_a, count_a, net_a), (3, 5, 22));
    assert_eq!((wins_b, count_b, net_b), (2, 3, 5));

    println!("Original: {wins_a}/{count_a} wins, net {net_a} USD");
    println!("Filtered: {wins_b}/{count_b} wins, net {net_b} USD");
    println!("Change in net profit: {} USD", net_b - net_a);
}
