/**
 * Fetch tracing utility for data flow audit
 * Logs all fetch requests with method, URL, dedupe key, and call stack
 */

interface FetchTraceData {
	timestamp: string;
	method: string;
	url: string;
	dedupeKey: string;
	callStack: string;
	environment: "server" | "client";
}

let tracingEnabled = false;
let originalFetch: typeof fetch;

/**
 * Generate a dedupe key for a fetch request
 */
function generateDedupeKey(method: string, url: string, body?: string): string {
	const urlObj = new URL(
		url,
		typeof window !== "undefined" ? window.location.origin : "http://localhost"
	);
	const normalizedUrl = `${urlObj.pathname}${urlObj.search}`;
	const bodyHash = body ? btoa(body).slice(0, 8) : "";
	return `${method}:${normalizedUrl}:${bodyHash}`;
}

/**
 * Extract the first relevant call stack frame from the project
 */
function getRelevantCallStack(): string {
	const stack = new Error().stack || "";
	const lines = stack.split("\n");

	// Find the first frame that's in our project (not node_modules or internal)
	for (const line of lines) {
		if (line.includes("src/") && !line.includes("node_modules")) {
			// Extract just the file and line info
			const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
			if (match) {
				const [, functionName, filePath, line, column] = match;
				const fileName = filePath.split("/").pop() || filePath;
				return `${fileName}:${line}`;
			}
		}
	}

	return "unknown";
}

/**
 * Log a fetch trace
 */
function logFetchTrace(data: FetchTraceData): void {
	const prefix =
		data.environment === "server" ? "[fetch] (server)" : "[fetch] (client)";
	console.info(
		`${prefix} ${data.method} ${data.url} | dedupe: ${data.dedupeKey} | stack: ${data.callStack}`
	);
}

/**
 * Wrapped fetch function that traces requests
 */
async function tracedFetch(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<Response> {
	const method = init?.method || "GET";
	const url = typeof input === "string" ? input : input.toString();
	const body = init?.body ? String(init.body) : undefined;

	const traceData: FetchTraceData = {
		timestamp: new Date().toISOString(),
		method,
		url,
		dedupeKey: generateDedupeKey(method, url, body),
		callStack: getRelevantCallStack(),
		environment: typeof window !== "undefined" ? "client" : "server",
	};

	logFetchTrace(traceData);

	// Call the original fetch
	return originalFetch(input, init);
}

/**
 * Install the fetch tracer
 * Should be called early in the application lifecycle
 */
export function installFetchTracer(): void {
	// Check if tracing is enabled
	if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_TRACE === "0") {
		return;
	}

	if (
		typeof window !== "undefined" &&
		window.location.search.includes("trace=0")
	) {
		return;
	}

	// Prevent double installation
	if (tracingEnabled) {
		return;
	}

	// Store original fetch
	originalFetch = globalThis.fetch;

	// Replace with traced version
	globalThis.fetch = tracedFetch;

	tracingEnabled = true;

	if (typeof window !== "undefined") {
		console.info("[trace] Fetch tracer installed (client)");
	} else {
		console.info("[trace] Fetch tracer installed (server)");
	}
}

/**
 * Uninstall the fetch tracer
 */
export function uninstallFetchTracer(): void {
	if (!tracingEnabled || !originalFetch) {
		return;
	}

	globalThis.fetch = originalFetch;
	tracingEnabled = false;

	if (typeof window !== "undefined") {
		console.info("[trace] Fetch tracer uninstalled (client)");
	} else {
		console.info("[trace] Fetch tracer uninstalled (server)");
	}
}

/**
 * Check if tracing is currently enabled
 */
export function isTracingEnabled(): boolean {
	return tracingEnabled;
}
