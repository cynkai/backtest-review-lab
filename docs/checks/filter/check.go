// Run: go run check.go
package main

import (
	"fmt"
	"log"
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
	// Net P&L in USD and whether the filter kept the trade, A through E.
	ledger := []struct {
		pnl  int
		kept bool
	}{{4, true}, {4, true}, {20, false}, {-3, true}, {-3, false}}

	var original, filtered totals
	for _, trade := range ledger {
		original.add(trade.pnl)
		if trade.kept {
			filtered.add(trade.pnl)
		}
	}
	if original != (totals{3, 5, 22}) || filtered != (totals{2, 3, 5}) {
		log.Fatal("totals differ from the ledger")
	}

	fmt.Printf("Original: %d/%d wins, net %d USD\n", original.wins, original.trades, original.net)
	fmt.Printf("Filtered: %d/%d wins, net %d USD\n", filtered.wins, filtered.trades, filtered.net)
	fmt.Printf("Change in net profit: %d USD\n", filtered.net-original.net)
}
