export function dateOnlyToUTC(s: string) {
	// "YYYY-MM-DD" -> 00:00:00Z
	return new Date(`${s}T00:00:00.000Z`);
}

export function toDateOnlyString(d: Date | null) {
	if (!d) return null;
	return d.toISOString().slice(0, 10);
}
