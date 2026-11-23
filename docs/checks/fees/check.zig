// Run with Zig 0.15.2: zig run check.zig
const std = @import("std");

pub fn main() !void {
    // One completed round trip. Prices and fees are in cents.
    const shares: i32 = 1;
    const buy: i32 = 10_000;
    const sell: i32 = 10_800;
    const entry_fee: i32 = 125;
    const exit_fee: i32 = 175;

    const gross = shares * (sell - buy);
    const fees = entry_fee + exit_fee;
    const net = gross - fees;

    var buffer: [256]u8 = undefined;
    var output = std.fs.File.stdout().writer(&buffer);
    const stdout = &output.interface;
    try stdout.print("Gross: {d} cents\nFees: {d} cents\nNet: {d} cents\n", .{ gross, fees, net });
    try stdout.flush();
}
