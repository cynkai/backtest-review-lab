// Run with Zig 0.15.2: zig run check.zig -- 11010 (optional A–E mask; 1 keeps a trade).
const std = @import("std");

const Totals = struct {
    wins: usize = 0,
    trades: usize = 0,
    net: i32 = 0,

    fn record(self: *Totals, pnl: i32) void {
        self.trades += 1;
        self.net += pnl;
        if (pnl > 0) self.wins += 1;
    }
};

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    var args = try std.process.argsWithAllocator(allocator);
    defer args.deinit();
    _ = args.skip();
    const mask = args.next() orelse "11010";
    if (args.next() != null or mask.len != 5 or
        std.mem.indexOfNone(u8, mask, "01") != null)
    {
        std.debug.print("Expected one optional five-digit A-E mask, e.g. 11010\n", .{});
        std.process.exit(1);
    }

    // Trade A through E, net P&L in USD after costs.
    const ledger = [_]i32{ 4, 4, 20, -3, -3 };
    var original = Totals{};
    var filtered = Totals{};
    for (ledger, mask) |pnl, bit| {
        original.record(pnl);
        if (bit == '1') filtered.record(pnl);
    }

    var buffer: [256]u8 = undefined;
    var output = std.fs.File.stdout().writer(&buffer);
    const stdout = &output.interface;
    try stdout.print("Original: {d}/{d} wins, net {d} USD\n", .{ original.wins, original.trades, original.net });
    try stdout.print("Filtered: {d}/{d} wins, net {d} USD\n", .{ filtered.wins, filtered.trades, filtered.net });
    try stdout.print("Change in net profit: {d} USD\n", .{filtered.net - original.net});
    try stdout.flush();
}
