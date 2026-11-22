// Run: go run check.go
package main

import (
	"fmt"
	"log"
)

func main() {
	// One completed round trip. Prices and fees are in cents.
	shares := 1
	buy, sell := 10_000, 10_800
	entryFee, exitFee := 125, 175

	gross := shares * (sell - buy)
	fees := entryFee + exitFee
	net := gross - fees
	if gross != 800 || fees != 300 || net != 500 {
		log.Fatal("round trip does not reconcile")
	}
	fmt.Printf("Gross: %d cents\nFees: %d cents\nNet: %d cents\n", gross, fees, net)
}
