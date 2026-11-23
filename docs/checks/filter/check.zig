// Run with Zig 0.15.2: zig run check.zig
const std = @import("std");

const Trade = struct { net: i32, kept: bool };

const Totals = struct {
    wins: usize = 0,
    trades: usize = 0,
    net: i32 = 0,

    fn record(self: *Totals, trade: Trade) void {
        self.trades += 1;
        self.net += trade.net;
        if (trade.net > 0) self.wins += 1;
    }
};

pub fn main() !void {
    // The ledger already includes costs. The new filter skips C and E.
    const ledger = [_]Trade{
        .{ .net = 4, .kept = true },
        .{ .net = 4, .kept = true },
        .{ .net = 20, .kept = false },
        .{ .net = -3, .kept = true },
        .{ .net = -3, .kept = false },
    };
    var original = Totals{};
    var filtered = Totals{};
    for (ledger) |trade| {
        original.record(trade);
        if (trade.kept) filtered.record(trade);
    }

    var buffer: [256]u8 = undefined;
    var output = std.fs.File.stdout().writer(&buffer);
    const stdout = &output.interface;
    try stdout.print("Original: {d}/{d} wins, net {d} USD\n", .{ original.wins, original.trades, original.net });
    try stdout.print("Filtered: {d}/{d} wins, net {d} USD\n", .{ filtered.wins, filtered.trades, filtered.net });
    try stdout.print("Change in net profit: {d} USD\n", .{filtered.net - original.net});
    try stdout.flush();
}
