import { ok, badRequest, created } from "@/lib/http";

describe("HTTP Helpers", () => {
	it("should return ok response", () => {
		const response = ok({ message: "success" });
		expect(response.status).toBe(200);
	});

	it("should return created response", () => {
		const response = created({ id: "123" });
		expect(response.status).toBe(201);
	});

	it("should return bad request response", () => {
		const response = badRequest("Invalid input");
		expect(response.status).toBe(400);
	});
});

describe("Basic Math", () => {
	it("should add two numbers", () => {
		expect(1 + 2).toBe(3);
	});

	it("should multiply two numbers", () => {
		expect(3 * 4).toBe(12);
	});
});
