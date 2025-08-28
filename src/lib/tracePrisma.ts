/**
 * Prisma tracing utility for data flow audit
 * Logs all Prisma operations with model, action, and where keys
 */

import { PrismaClient } from "@prisma/client";

interface PrismaTraceData {
	timestamp: string;
	model: string;
	action: string;
	whereKeys: string[];
	args: any;
	duration?: number;
}

let isTracingEnabled = false;

/**
 * Extract relevant where keys from Prisma query args
 */
function extractWhereKeys(args: any): string[] {
	const keys: string[] = [];

	if (args?.where) {
		Object.keys(args.where).forEach((key) => {
			const value = args.where[key];
			if (typeof value === "string" || typeof value === "number") {
				keys.push(`${key}:${value}`);
			} else if (value && typeof value === "object") {
				// Handle nested where conditions
				if (value.in && Array.isArray(value.in)) {
					keys.push(`${key}:in[${value.in.length}]`);
				} else if (value.contains) {
					keys.push(`${key}:contains`);
				} else {
					keys.push(`${key}:object`);
				}
			}
		});
	}

	if (args?.id) {
		keys.push(`id:${args.id}`);
	}

	if (args?.ids && Array.isArray(args.ids)) {
		keys.push(`ids:${args.ids.length}`);
	}

	return keys;
}

/**
 * Log a Prisma trace
 */
function logPrismaTrace(data: PrismaTraceData): void {
	const whereStr =
		data.whereKeys.length > 0 ? ` | where: ${data.whereKeys.join(", ")}` : "";
	const durationStr = data.duration ? ` | duration: ${data.duration}ms` : "";

	console.info(
		`[prisma] ${data.model}.${data.action}${whereStr}${durationStr}`
	);
}

/**
 * Install Prisma tracing middleware
 */
export function installPrismaTracer(prisma: PrismaClient): void {
	// Check if tracing is enabled
	if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_TRACE === "0") {
		return;
	}

	if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
		return;
	}

	// Prevent double installation
	if (isTracingEnabled) {
		return;
	}

	// Check if $use method exists (some Prisma clients don't have middleware support)
	if (typeof prisma.$use !== "function") {
		console.warn(
			"[trace] Prisma client doesn't support middleware, skipping Prisma tracer"
		);
		return;
	}

	prisma.$use(async (params: any, next: any) => {
		const startTime = Date.now();

		const traceData: PrismaTraceData = {
			timestamp: new Date().toISOString(),
			model: params.model || "unknown",
			action: params.action,
			whereKeys: extractWhereKeys(params.args),
			args: params.args,
		};

		try {
			const result = await next(params);
			traceData.duration = Date.now() - startTime;
			logPrismaTrace(traceData);
			return result;
		} catch (error) {
			traceData.duration = Date.now() - startTime;
			logPrismaTrace(traceData);
			console.error(
				`[prisma] Error in ${params.model}.${params.action}:`,
				error
			);
			throw error;
		}
	});

	isTracingEnabled = true;
	console.info("[trace] Prisma tracer installed");
}

/**
 * Check if Prisma tracing is currently enabled
 */
export function isPrismaTracingEnabled(): boolean {
	return isTracingEnabled;
}
