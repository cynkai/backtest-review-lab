// Run: rustc check.rs -o check && ./check
fn yes_no(value: bool) -> &'static str {
    if value { "yes" } else { "no" }
}

fn main() {
    let previous_close = 100;
    let official_close = 104;
    let threshold_percent = 3;

    // Minutes since midnight, all in the exchange's local time.
    let order_cutoff = 15 * 60 + 55;
    let close_available = 16 * 60;

    let scaled_gain = 100 * (official_close - previous_close);
    let buy_signal = scaled_gain >= threshold_percent * previous_close;
    let minutes_after_cutoff = close_available - order_cutoff;
    let eligible = buy_signal && minutes_after_cutoff <= 0;

    let return_percent = f64::from(scaled_gain) / f64::from(previous_close);
    println!("Close-to-close return: {return_percent:.1}%");
    println!("Buy signal: {}", yes_no(buy_signal));
    println!("Signal availability relative to cutoff (minutes): {minutes_after_cutoff}");
    println!("Same-close fill eligible: {}", yes_no(eligible));
}
