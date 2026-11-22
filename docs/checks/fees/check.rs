// Run: rustc check.rs -o check && ./check
fn main() {
    // One completed round trip. Prices and fees are in cents.
    let shares = 1;
    let (buy, sell) = (10_000, 10_800);
    let (entry_fee, exit_fee) = (125, 175);

    let gross = shares * (sell - buy);
    let fees = entry_fee + exit_fee;
    let net = gross - fees;
    assert_eq!((gross, fees, net), (800, 300, 500));
    println!("Gross: {gross} cents");
    println!("Fees: {fees} cents");
    println!("Net: {net} cents");
}
