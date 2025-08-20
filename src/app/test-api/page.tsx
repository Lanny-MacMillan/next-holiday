"use client";

import { useState } from "react";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import {
	transformGiftPayload,
	transformCardPayload,
	transformTaskPayload,
	transformGuestPayload,
} from "@/utils/formTransformers";

export default function TestApiPage() {
	const { holidayId, mutation, type, isLoading, error, auth0User } =
		useFormModalMutation();
	const [testResult, setTestResult] = useState<string>("");

	const testGiftCreation = async () => {
		if (!holidayId || !mutation) {
			setTestResult("No holiday ID or mutation available");
			return;
		}

		try {
			const testValues = {
				description: "Test Gift",
				recipient: "Test Recipient",
				price: "25.99",
				store: "Test Store",
				productLink: "https://example.com",
				notes: "Test notes",
			};

			const contacts = [{ id: "test-contact-id", name: "Test Recipient" }];

			let payload;
			switch (type) {
				case "gift":
					payload = transformGiftPayload(testValues, contacts);
					break;
				case "card":
					payload = transformCardPayload(testValues, contacts);
					break;
				case "task":
					payload = transformTaskPayload(testValues, window.location.pathname);
					break;
				case "guest":
					payload = transformGuestPayload(testValues, contacts);
					break;
				default:
					setTestResult("Unknown type");
					return;
			}

			const result = await mutation({ holidayId, payload, auth0User }).unwrap();
			setTestResult(
				`Success! Created ${type}: ${JSON.stringify(result, null, 2)}`
			);
		} catch (error: any) {
			setTestResult(`Error: ${error.message || JSON.stringify(error)}`);
		}
	};

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">API Test Page</h1>

			<div className="mb-4">
				<p>
					<strong>Holiday ID:</strong> {holidayId || "Not found"}
				</p>
				<p>
					<strong>Type:</strong> {type || "Unknown"}
				</p>
				<p>
					<strong>Loading:</strong> {isLoading ? "Yes" : "No"}
				</p>
				{error && (
					<p>
						<strong>Error:</strong> {JSON.stringify(error)}
					</p>
				)}
			</div>

			<button
				onClick={testGiftCreation}
				disabled={!holidayId || !mutation || isLoading}
				className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
			>
				Test {type} Creation
			</button>

			{testResult && (
				<div className="mt-4 p-4 bg-gray-100 rounded">
					<pre className="whitespace-pre-wrap">{testResult}</pre>
				</div>
			)}
		</div>
	);
}
