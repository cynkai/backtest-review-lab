// Run: go run check.go [exit-fee-cents]
package main

import (
	"fmt"
	"os"
	"strconv"
)

func main() {
	exitFee := 175
	if len(os.Args) > 1 {
		raw := os.Args[1]
		n, err := strconv.Atoi(raw)
		if len(os.Args) != 2 || err != nil || n < 0 || n > 1000 || strconv.Itoa(n) != raw {
			fmt.Fprintln(os.Stderr, "Expected one optional exit fee in whole cents from 0 to 1000.")
			os.Exit(2)
		}
		exitFee = n
	}

	// One completed round trip. Prices and fees are in cents.
	shares := 1
	buy, sell := 10_000, 10_800
	entryFee := 125
	gross := shares * (sell - buy)
	fees := entryFee + exitFee
	net := gross - fees
	fmt.Printf("Gross: %d cents\nFees: %d cents\nNet: %d cents\n", gross, fees, net)
}
