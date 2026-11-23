// Run: go run check.go 11010 (optional A–E mask; 1 keeps a trade).
package main

import (
	"fmt"
	"os"
	"strings"
)

type totals struct{ wins, trades, net int }

func (t *totals) add(pnl int) {
	t.trades++
	t.net += pnl
	if pnl > 0 {
		t.wins++
	}
}

func main() {
	mask := "11010"
	if len(os.Args) > 1 {
		mask = os.Args[1]
	}
	if len(os.Args) > 2 || len(mask) != 5 || strings.Trim(mask, "01") != "" {
		fmt.Fprintln(os.Stderr, "Expected one optional five-digit A-E mask, e.g. 11010")
		os.Exit(1)
	}

	// Trade A through E, net P&L in USD after costs.
	ledger := [...]int{4, 4, 20, -3, -3}
	var original, filtered totals
	for i, pnl := range ledger {
		original.add(pnl)
		if mask[i] == '1' {
			filtered.add(pnl)
		}
	}

	fmt.Printf("Original: %d/%d wins, net %d USD\n", original.wins, original.trades, original.net)
	fmt.Printf("Filtered: %d/%d wins, net %d USD\n", filtered.wins, filtered.trades, filtered.net)
	fmt.Printf("Change in net profit: %d USD\n", filtered.net-original.net)
}
