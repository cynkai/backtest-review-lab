// Run: rustc check.rs -o check && ./check [exit-fee-cents]
use std::env;

fn main() -> Result<(), &'static str> {
    let mut args = env::args_os().skip(1);
    let error = "Expected one optional exit fee in whole cents from 0 to 1000.";
    let exit_fee = match args.next() {
        None => 175,
        Some(arg) => {
            let raw = arg.to_str().ok_or(error)?;
            let n = raw.parse::<u16>().map_err(|_| error)?;
            if args.next().is_some() || n > 1000 || n.to_string() != raw {
                return Err(error);
            }
            i32::from(n)
        }
    };

    // One completed round trip. Prices and fees are in cents.
    let shares = 1;
    let (buy, sell) = (10_000, 10_800);
    let entry_fee = 125;
    let gross = shares * (sell - buy);
    let fees = entry_fee + exit_fee;
    let net = gross - fees;
    assert_eq!(net, (shares * sell - exit_fee) - (shares * buy + entry_fee));
    println!("Gross: {gross} cents");
    println!("Fees: {fees} cents");
    println!("Net: {net} cents");
    Ok(())
}
