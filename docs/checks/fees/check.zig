// Run with Zig 0.15.2: zig run check.zig -- [exit-fee-cents]
const std = @import("std");

fn readExitFee() !i32 {
    var args = try std.process.argsWithAllocator(std.heap.page_allocator);
    defer args.deinit();
    _ = args.skip(); // executable name
    const raw = args.next() orelse return 175;
    if (args.next() != null or raw.len == 0 or raw.len > 4 or (raw.len > 1 and raw[0] == '0')) {
        return error.InvalidExitFee;
    }
    for (raw) |digit| if (!std.ascii.isDigit(digit)) return error.InvalidExitFee;
    const cents = try std.fmt.parseInt(i32, raw, 10);
    if (cents > 1000) return error.InvalidExitFee;
    return cents;
}

pub fn main() !void {
    const exit_fee = readExitFee() catch {
        std.debug.print("Expected one optional exit fee in whole cents from 0 to 1000.\n", .{});
        std.process.exit(2);
    };

    // One completed round trip. Prices and fees are in cents.
    const shares: i32 = 1;
    const buy: i32 = 10_000;
    const sell: i32 = 10_800;
    const entry_fee: i32 = 125;
    const gross = shares * (sell - buy);
    const fees = entry_fee + exit_fee;
    const net = gross - fees;

    var buffer: [256]u8 = undefined;
    var output = std.fs.File.stdout().writer(&buffer);
    const stdout = &output.interface;
    try stdout.print("Gross: {d} cents\nFees: {d} cents\nNet: {d} cents\n", .{ gross, fees, net });
    try stdout.flush();
}
