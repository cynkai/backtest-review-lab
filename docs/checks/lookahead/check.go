// Run: go run check.go (Go 1.21+)
package main

import "fmt"

func yesNo(value bool) string {
	if value {
		return "yes"
	}
	return "no"
}

func main() {
	const previousClose = 100
	const officialClose = 104
	const thresholdPercent = 3

	// Minutes since midnight, all in the exchange's local time.
	const orderCutoff = 15*60 + 55
	const closeAvailable = 16 * 60

	scaledGain := 100 * (officialClose - previousClose)
	buySignal := scaledGain >= thresholdPercent*previousClose
	minutesAfterCutoff := closeAvailable - orderCutoff
	eligible := buySignal && minutesAfterCutoff <= 0

	fmt.Printf("Close-to-close return: %.1f%%\n", float64(scaledGain)/previousClose)
	fmt.Println("Buy signal:", yesNo(buySignal))
	fmt.Println("Signal availability relative to cutoff (minutes):", minutesAfterCutoff)
	fmt.Println("Same-close fill eligible:", yesNo(eligible))
}
