package utils

import "strconv"

func ParseUint(value string) uint {
	parsed, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0
	}
	return uint(parsed)
}

func UintToString(value uint) string {
	return strconv.FormatUint(uint64(value), 10)
}
