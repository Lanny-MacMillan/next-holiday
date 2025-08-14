// Mock NextResponse
class MockNextResponse {
	constructor(body, init = {}) {
		this.body = body;
		this.status = init.status || 200;
		this.headers = new Map(Object.entries(init.headers || {}));
	}

	static json(data, init = {}) {
		return new MockNextResponse(JSON.stringify(data), init);
	}

	async json() {
		return JSON.parse(this.body);
	}
}

// Mock NextRequest
class MockNextRequest {
	constructor(url, options = {}) {
		this.url = url;
		this.method = options.method || "GET";
		this.headers = new Map(Object.entries(options.headers || {}));
		this.body = options.body;
		this.nextUrl = {
			searchParams: new URLSearchParams(new URL(url).search),
		};
	}

	async json() {
		if (typeof this.body === "string") {
			return JSON.parse(this.body);
		}
		return this.body || {};
	}

	async text() {
		return typeof this.body === "string"
			? this.body
			: JSON.stringify(this.body);
	}
}

module.exports = {
	NextRequest: MockNextRequest,
	NextResponse: MockNextResponse,
	getSession: jest.fn(),
};
