// Run: go run check.go (Go 1.21+)
package main

import (
	"fmt"
	"log"
)

func firstExit(path [4]int) string {
	// Both orders are active from the open. Segments are continuous.
	for _, price := range path {
		if price >= 105 {
			return "target"
		}
		if price <= 95 {
			return "stop"
		}
	}
	return "neither"
}

func ohlc(path [4]int) [4]int {
	high, low := path[0], path[0]
	for _, price := range path {
		high = max(high, price)
		low = min(low, price)
	}
	return [4]int{path[0], high, low, path[3]}
}

func main() {
	highFirst := [4]int{100, 108, 92, 103}
	lowFirst := [4]int{100, 92, 108, 103}
	bar := ohlc(highFirst)
	first, second := firstExit(highFirst), firstExit(lowFirst)
	if bar != ohlc(lowFirst) || bar != [4]int{100, 108, 92, 103} ||
		first != "target" || second != "stop" {
		log.Fatal("paths must give the same bar and different first fills")
	}
	fmt.Printf("Bar (O/H/L/C): %d/%d/%d/%d\n", bar[0], bar[1], bar[2], bar[3])
	fmt.Println("High first:", first)
	fmt.Println("Low first:", second)
}
