// Run with Zig 0.15.2: zig run check.zig
const std = @import("std");

pub fn main() !void {
    const previous_close: i32 = 100;
    const official_close: i32 = 104;
    const threshold_percent: i32 = 3;

    // Minutes since midnight, all in the exchange's local time.
    const order_cutoff: i32 = 15 * 60 + 55;
    const close_available: i32 = 16 * 60;

    const scaled_gain = 100 * (official_close - previous_close);
    const return_percent = @as(f64, @floatFromInt(scaled_gain)) / @as(f64, @floatFromInt(previous_close));
    const buy_signal = scaled_gain >= threshold_percent * previous_close;
    const minutes_after_cutoff = close_available - order_cutoff;
    const eligible = buy_signal and minutes_after_cutoff <= 0;

    var buffer: [256]u8 = undefined;
    var output = std.fs.File.stdout().writer(&buffer);
    const stdout = &output.interface;
    try stdout.print("Close-to-close return: {d:.1}%\n", .{return_percent});
    try stdout.print("Buy signal: {s}\n", .{if (buy_signal) "yes" else "no"});
    try stdout.print("Signal availability relative to cutoff (minutes): {d}\n", .{minutes_after_cutoff});
    try stdout.print("Same-close fill eligible: {s}\n", .{if (eligible) "yes" else "no"});
    try stdout.flush();
}
