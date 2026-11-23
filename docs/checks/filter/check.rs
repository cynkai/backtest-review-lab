// Run: rustc check.rs -o check && ./check 11010 (optional A–E mask; 1 keeps a trade).
use std::{env, process::ExitCode};

fn main() -> ExitCode {
    let mut args = env::args().skip(1);
    let mask = args.next().unwrap_or_else(|| String::from("11010"));
    if args.next().is_some()
        || mask.len() != 5
        || !mask.bytes().all(|bit| matches!(bit, b'0' | b'1'))
    {
        eprintln!("Expected one optional five-digit A-E mask, e.g. 11010");
        return ExitCode::FAILURE;
    }

    // Trade A through E, net P&L in USD after costs.
    let original = [4, 4, 20, -3, -3];
    let filtered: Vec<i32> = original
        .iter()
        .zip(mask.bytes())
        .filter_map(|(&pnl, bit)| (bit == b'1').then_some(pnl))
        .collect();
    let stats = |trades: &[i32]| {
        let wins = trades.iter().filter(|&&pnl| pnl > 0).count();
        (wins, trades.len(), trades.iter().sum::<i32>())
    };
    let (wins_a, count_a, net_a) = stats(&original);
    let (wins_b, count_b, net_b) = stats(&filtered);
    println!("Original: {wins_a}/{count_a} wins, net {net_a} USD");
    println!("Filtered: {wins_b}/{count_b} wins, net {net_b} USD");
    println!("Change in net profit: {} USD", net_b - net_a);
    ExitCode::SUCCESS
}
