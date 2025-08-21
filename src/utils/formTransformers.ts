import { useAppSelector } from "@/store/hooks";

/**
 * Transform form values to gift API payload
 */
export function transformGiftPayload(
	values: Record<string, any>,
	contacts: any[]
) {
	const contact = contacts.find((c) => c.name === values.recipient);

	// Ensure recipient is selected from address book
	if (!contact) {
		throw new Error("Recipient must be selected from address book");
	}

	return {
		name: values.giftName || "",
		description: values.description || "",
		price: values.price ? parseFloat(values.price) : 0,
		store: values.store || "",
		product_link: values.product_link || "",
		notes: values.notes || "",
		contact_id: contact.id,
	};
}

/**
 * Transform form values to Thanksgiving shopping item API payload
 */
export function transformThanksgivingShoppingPayload(
	values: Record<string, any>
) {
	return {
		name: values.giftName || "",
		description: values.description || "",
		price: values.price ? parseFloat(values.price) : 0,
		store: values.store || "",
		product_link: values.product_link || "",
		notes: values.notes || "",
		contact_id: null, // No recipient needed for Thanksgiving shopping items
	};
}

/**
 * Transform form values to card API payload
 */
export function transformCardPayload(
	values: Record<string, any>,
	contacts: any[]
) {
	const contact = contacts.find((c) => c.name === values.recipient);

	return {
		recipient: values.recipient || "",
		message: values.message || "",
		address: values.address || "",
		contact_id: contact?.id || null,
	};
}

/**
 * Transform form values to task API payload
 */
export function transformTaskPayload(
	values: Record<string, any>,
	pathname: string
) {
	// Determine category based on route
	const pathSegments = pathname.split("/");
	const resourceType = pathSegments[2];

	let category = null;
	switch (resourceType) {
		case "events":
			category = "events";
			break;
		case "decorations":
			category = "decorations";
			break;
		case "candle-lighting":
			category = "candle-lighting";
			break;
		case "meal-planning":
			category = "meal-planning";
			break;
		case "decorations-checklist":
			category = "decorations-checklist";
			break;
		case "shopping-list":
			category = "shopping-list";
			break;
		case "basket-list":
			category = "basket-list";
			break;
		case "date-ideas":
			category = "date-ideas";
			break;
		case "reservations":
			category = "reservations";
			break;
		case "party-planning":
			category = "party-planning";
			break;
		case "costume-ideas":
			category = "costume-ideas";
			break;
		case "trick-or-treat-prep":
			category = "trick-or-treat-prep";
			break;
		case "resolutions":
			category = "resolutions";
			break;
		case "supplies-list":
			category = "supplies-list";
			break;
		case "games":
			category = "games";
			break;
		default:
			category = values.category || null;
	}

	return {
		title: values.title || values.description || "",
		description: values.description || "",
		priority: values.priority || "medium",
		category: category,
		due_date: values.due_date || values.dueDate || null,
		assigned_to: values.assigned_to || null,
	};
}

/**
 * Transform form values to guest list API payload
 */
export function transformGuestPayload(
	values: Record<string, any>,
	contacts: any[]
) {
	const contact = contacts.find(
		(c) => c.name === values.recipient || c.name === values.name
	);

	if (!contact) {
		throw new Error("Contact is required for guest list");
	}

	return {
		contact_id: contact.id,
		rsvp_status: values.rsvp_status || "pending",
		notes: values.notes || "",
	};
}
