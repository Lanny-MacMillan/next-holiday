export function toPlain<T>(data: T): T {
	return JSON.parse(
		JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
	);
}
