import { NextRequest } from "next/server";

/**
 * POST /api/payment
 * Process payment for subscription upgrade (TEST MODE)
 * In test mode, this endpoint simulates payment processing without actually charging
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { cardNumber, expiryDate, cvv, cardholderName, amount } = body;

		// Check if this is test mode (environment variable)
		const isTestMode = process.env.PAYMENT_TEST_MODE === "true" || process.env.NODE_ENV === "development";

		// Validate required fields based on mode
		if (isTestMode) {
			// Test mode: Only require cardholder name
			if (!cardholderName || !amount) {
				return Response.json(
					{ error: "Cardholder name is required in test mode" },
					{ status: 400 }
				);
			}
		} else {
			// Production mode: Validate all fields
			if (!cardNumber || !expiryDate || !cvv || !cardholderName || !amount) {
				return Response.json(
					{ error: "All payment fields are required" },
					{ status: 400 }
				);
			}
		}

		if (isTestMode) {
			// Test mode: Always succeed after a short delay to simulate processing
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			return Response.json({
				success: true,
				paymentId: `test_payment_${Date.now()}`,
				amount: amount,
				testMode: true,
				message: "Payment processed successfully (TEST MODE)"
			});
		} else {
			// Production mode: Integrate with actual payment processor
			// TODO: Implement actual payment processing (Stripe, Square, etc.)
			return Response.json(
				{ error: "Payment processing not implemented for production" },
				{ status: 501 }
			);
		}
	} catch (error) {
		console.error("Payment processing error:", error);
		return Response.json(
			{ error: "Internal server error during payment processing" },
			{ status: 500 }
		);
	}
}