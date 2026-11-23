// Run with Zig 0.15.2: zig run check.zig
const std = @import("std");

const Bar = struct { open: i32, high: i32, low: i32, close: i32 };
const Exit = enum { target, stop, neither };

fn firstExit(path: []const i32) Exit {
    // Both orders are active from the open. Segments are continuous.
    for (path) |price| {
        if (price >= 105) return .target;
        if (price <= 95) return .stop;
    }
    return .neither;
}

fn ohlc(path: [4]i32) Bar {
    var high = path[0];
    var low = path[0];
    for (path) |price| {
        high = @max(high, price);
        low = @min(low, price);
    }
    return .{ .open = path[0], .high = high, .low = low, .close = path[3] };
}

pub fn main() !void {
    const high_first = [_]i32{ 100, 108, 92, 103 };
    const low_first = [_]i32{ 100, 92, 108, 103 };
    const bar = ohlc(high_first);
    if (!std.meta.eql(bar, ohlc(low_first))) return error.DifferentBars;

    var buffer: [256]u8 = undefined;
    var output = std.fs.File.stdout().writer(&buffer);
    const stdout = &output.interface;
    try stdout.print("Bar (O/H/L/C): {d}/{d}/{d}/{d}\n", .{ bar.open, bar.high, bar.low, bar.close });
    try stdout.print("High first: {s}\n", .{@tagName(firstExit(&high_first))});
    try stdout.print("Low first: {s}\n", .{@tagName(firstExit(&low_first))});
    try stdout.flush();
}
