/**
 * RTK Query tracing utility for data flow audit
 * Logs all RTK Query endpoint calls with endpoint name, args, and cache key
 */

import {
	BaseQueryFn,
	FetchArgs,
	FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

interface RTKTraceData {
	timestamp: string;
	endpointName: string;
	args: any;
	cacheKey: string;
	method: string;
	url: string;
}

/**
 * Generate a cache key for RTK Query
 */
function generateCacheKey(endpointName: string, args: any): string {
	try {
		const argsStr = JSON.stringify(args);
		return `${endpointName}:${btoa(argsStr).slice(0, 12)}`;
	} catch {
		return `${endpointName}:${Object.keys(args || {}).join(",")}`;
	}
}

/**
 * Log an RTK Query trace
 */
function logRTKTrace(data: RTKTraceData): void {
	console.info(
		`[rtk] ${data.endpointName} | ${data.method} ${data.url} | cache: ${data.cacheKey}`
	);
}

/**
 * Create a traced base query wrapper
 */
export function createTracedBaseQuery(
	baseQuery: BaseQueryFn<FetchArgs, any, FetchBaseQueryError>
): BaseQueryFn<FetchArgs, any, FetchBaseQueryError> {
	return async (args, api, extraOptions) => {
		// Extract endpoint name from the URL pattern
		// Since RTK Query doesn't provide endpoint name directly, we'll extract it from the URL
		let endpointName = "unknown";
		if (args.url) {
			// Extract the last part of the URL path as the endpoint name
			const urlParts = args.url.split("/");
			const lastPart = urlParts[urlParts.length - 1];

			// Map URL patterns to endpoint names
			if (lastPart === "gifts") {
				endpointName = "getGifts";
			} else if (lastPart === "guest-lists") {
				endpointName = "getGuestList";
			} else if (lastPart === "tasks") {
				endpointName = "getTasks";
			} else if (lastPart === "cards") {
				endpointName = "getCards";
			} else {
				// For other endpoints, use the last part of the URL
				endpointName = lastPart;
			}
		}

		const traceData: RTKTraceData = {
			timestamp: new Date().toISOString(),
			endpointName,
			args: args.params || args.body || {},
			cacheKey: generateCacheKey(endpointName, args.params || args.body || {}),
			method: args.method || "GET",
			url: args.url || "",
		};

		logRTKTrace(traceData);

		// Call the original base query
		return baseQuery(args, api, extraOptions);
	};
}

/**
 * Check if RTK tracing is enabled
 */
export function isRTKTracingEnabled(): boolean {
	if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_TRACE === "0") {
		return false;
	}

	if (
		typeof window !== "undefined" &&
		window.location.search.includes("trace=0")
	) {
		return false;
	}

	return true;
}
