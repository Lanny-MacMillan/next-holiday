export function toPlain<T>(data: T): T {
	return JSON.parse(
		JSON.stringify(data, (_k, v) => {
			if (typeof v === "bigint") return v.toString();
			// Handle Prisma Decimal objects
			if (
				v &&
				typeof v === "object" &&
				v.constructor &&
				v.constructor.name === "Decimal"
			) {
				return v.toString();
			}
			return v;
		})
	);
}
