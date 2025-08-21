import { FormField } from "@/components/modals/FormModal";

export interface FormConfig {
	title: string;
	fields: FormField[];
	submitText: string;
	cancelText: string;
	cardClassName: string;
	submitButtonColor: string;
	showAddressBook?: boolean;
	customTitle?: string;
	customFieldLabel?: string;
	customSubmitText?: string;
}

// Cards form configuration
export const cardsFormConfig: FormConfig = {
	title: "Add New Card",
	fields: [
		{
			id: "recipient",
			type: "text",
			placeholder: "Recipient*",
			required: true,
		},
		{
			id: "address",
			type: "text",
			placeholder: "Address (optional)",
		},
		{
			id: "message",
			type: "textarea",
			placeholder: "Message*",
			required: true,
			rows: 3,
		},
	],
	submitText: "Add Card",
	cancelText: "Cancel",
	cardClassName: "card card-cards",
	submitButtonColor: "#ef4444", // Red
	showAddressBook: true,
};

// Tasks form configuration
export const tasksFormConfig: FormConfig = {
	title: "Add New Task",
	fields: [
		{
			id: "title",
			type: "text",
			placeholder: "Task Title*",
			required: true,
		},
		{
			id: "description",
			type: "textarea",
			placeholder: "Description",
			rows: 2,
		},
		{
			id: "priority",
			type: "select",
			placeholder: "Priority",
			options: [
				{ value: "low", label: "Low Priority" },
				{ value: "medium", label: "Medium Priority" },
				{ value: "high", label: "High Priority" },
			],
		},
		{
			id: "assignedTo",
			type: "text",
			placeholder: "Assigned To",
		},
		{
			id: "dueDate",
			type: "date",
			placeholder: "Due Date",
		},
	],
	submitText: "Add Task",
	cancelText: "Cancel",
	cardClassName: "bg-white dark:bg-gray-800 rounded-lg shadow-lg",
	submitButtonColor: "#22c55e", // Green
};

// Events form configuration
export const eventsFormConfig: FormConfig = {
	title: "Add New Event Task",
	fields: [
		{
			id: "title",
			type: "text",
			placeholder: "Event Task Title*",
			required: true,
		},
		{
			id: "description",
			type: "textarea",
			placeholder: "Description",
			rows: 2,
		},
		{
			id: "priority",
			type: "select",
			placeholder: "Priority",
			options: [
				{ value: "low", label: "Low Priority" },
				{ value: "medium", label: "Medium Priority" },
				{ value: "high", label: "High Priority" },
			],
		},
		{
			id: "assignedTo",
			type: "text",
			placeholder: "Assigned To",
		},
		{
			id: "dueDate",
			type: "date",
			placeholder: "Due Date",
		},
	],
	submitText: "Add Event Task",
	cancelText: "Cancel",
	cardClassName: "bg-white dark:bg-gray-800 rounded-lg shadow-lg",
	submitButtonColor: "#3b82f6", // Blue for events
};

// Gifts form configuration
export const giftsFormConfig: FormConfig = {
	title: "Add New Gift",
	fields: [
		{
			id: "recipient",
			type: "text",
			placeholder: "Recipient*",
			required: true,
		},
		{
			id: "description",
			type: "text",
			placeholder: "Gift",
		},
		{
			id: "price",
			type: "number",
			placeholder: "Price",
			step: "0.01",
		},
		{
			id: "store",
			type: "text",
			placeholder: "Store",
		},
		{
			id: "productLink",
			type: "url",
			placeholder: "Product Link (optional)",
		},
		{
			id: "notes",
			type: "textarea",
			placeholder: "Notes",
			rows: 2,
		},
	],
	submitText: "Add Gift",
	cancelText: "Cancel",
	cardClassName: "card",
	submitButtonColor: "#eab308", // Yellow
	showAddressBook: true,
};

// Supplies form configuration (for New Year supplies-list)
export const suppliesFormConfig: FormConfig = {
	title: "Add New Supply Item",
	fields: [
		{
			id: "recipient",
			type: "text",
			placeholder: "Recipient*",
			required: true,
		},
		{
			id: "giftName",
			type: "text",
			placeholder: "Supply Item",
		},
		{
			id: "description",
			type: "text",
			placeholder: "Description (optional)",
		},
		{
			id: "price",
			type: "number",
			placeholder: "Price",
			step: "0.01",
		},
		{
			id: "store",
			type: "text",
			placeholder: "Store",
		},
		{
			id: "product_link",
			type: "url",
			placeholder: "Product Link (optional)",
		},
		{
			id: "notes",
			type: "textarea",
			placeholder: "Notes",
			rows: 2,
		},
	],
	submitText: "Add Supply Item",
	cancelText: "Cancel",
	cardClassName: "card",
	submitButtonColor: "#f59e0b", // Amber for New Year
	showAddressBook: true,
};

// Edit configurations (for editing existing items)
export const editCardsFormConfig: FormConfig = {
	...cardsFormConfig,
	title: "Edit Card",
	submitText: "Update Card",
};

export const editTasksFormConfig: FormConfig = {
	...tasksFormConfig,
	title: "Edit Task",
	submitText: "Update Task",
};

export const editEventsFormConfig: FormConfig = {
	...eventsFormConfig,
	title: "Edit Event Task",
	submitText: "Update Event Task",
};

export const editGiftsFormConfig: FormConfig = {
	...giftsFormConfig,
	title: "Edit Gift",
	submitText: "Update Gift",
};

export const editSuppliesFormConfig: FormConfig = {
	...suppliesFormConfig,
	title: "Edit Supply Item",
	submitText: "Update Supply Item",
};

// Guest list form configuration
export const guestsFormConfig: FormConfig = {
	title: "Add New Guest",
	fields: [
		{
			id: "name",
			type: "text",
			placeholder: "Guest Name*",
			required: true,
		},
		{
			id: "email",
			type: "email",
			placeholder: "Email",
		},
		{
			id: "phone",
			type: "tel",
			placeholder: "Phone",
		},
		{
			id: "address",
			type: "text",
			placeholder: "Address",
		},
		{
			id: "rsvpStatus",
			type: "select",
			placeholder: "RSVP Status",
			options: [
				{ value: "pending", label: "Pending" },
				{ value: "confirmed", label: "Confirmed" },
				{ value: "declined", label: "Declined" },
			],
		},
		{
			id: "numberOfGuests",
			type: "number",
			placeholder: "Number of Guests*",
			required: true,
			min: "1",
		},
		{
			id: "dietaryRestrictions",
			type: "text",
			placeholder: "Dietary Restrictions",
		},
		{
			id: "bringingDish",
			type: "text",
			placeholder: "Dish They're Bringing",
		},
		{
			id: "notes",
			type: "textarea",
			placeholder: "Notes",
			rows: 2,
		},
	],
	submitText: "Add Guest",
	cancelText: "Cancel",
	cardClassName: "card",
	submitButtonColor: "#f97316", // Orange for thanksgiving
	showAddressBook: true,
};

export const editGuestsFormConfig: FormConfig = {
	...guestsFormConfig,
	title: "Edit Guest",
	submitText: "Update Guest",
};

// Helper function to get form config based on type and mode
// Optional parameters:
// - customTitle: Override the modal title (e.g., "Edit Date Idea" instead of "Edit Task")
// - customFieldLabel: Override the title field placeholder (e.g., "Date Idea Title*" instead of "Task Title*")
// - customSubmitText: Override the submit button text (e.g., "Update Date" instead of "Update Task")
// Address book form configuration
export const addressBookFormConfig: FormConfig = {
	title: "Add New Contact",
	fields: [
		{
			id: "name",
			type: "text",
			placeholder: "Name*",
			required: true,
		},
		{
			id: "email",
			type: "email",
			placeholder: "Email (optional)",
		},
		{
			id: "phone",
			type: "tel",
			placeholder: "Phone*",
			required: true,
		},
		{
			id: "streetAddress",
			type: "text",
			placeholder: "Street Address*",
			required: true,
		},
		{
			id: "city",
			type: "text",
			placeholder: "City*",
			required: true,
		},
		{
			id: "state",
			type: "select",
			placeholder: "State*",
			required: true,
			options: [
				{ value: "AL", label: "Alabama" },
				{ value: "AK", label: "Alaska" },
				{ value: "AZ", label: "Arizona" },
				{ value: "AR", label: "Arkansas" },
				{ value: "CA", label: "California" },
				{ value: "CO", label: "Colorado" },
				{ value: "CT", label: "Connecticut" },
				{ value: "DE", label: "Delaware" },
				{ value: "FL", label: "Florida" },
				{ value: "GA", label: "Georgia" },
				{ value: "HI", label: "Hawaii" },
				{ value: "ID", label: "Idaho" },
				{ value: "IL", label: "Illinois" },
				{ value: "IN", label: "Indiana" },
				{ value: "IA", label: "Iowa" },
				{ value: "KS", label: "Kansas" },
				{ value: "KY", label: "Kentucky" },
				{ value: "LA", label: "Louisiana" },
				{ value: "ME", label: "Maine" },
				{ value: "MD", label: "Maryland" },
				{ value: "MA", label: "Massachusetts" },
				{ value: "MI", label: "Michigan" },
				{ value: "MN", label: "Minnesota" },
				{ value: "MS", label: "Mississippi" },
				{ value: "MO", label: "Missouri" },
				{ value: "MT", label: "Montana" },
				{ value: "NE", label: "Nebraska" },
				{ value: "NV", label: "Nevada" },
				{ value: "NH", label: "New Hampshire" },
				{ value: "NJ", label: "New Jersey" },
				{ value: "NM", label: "New Mexico" },
				{ value: "NY", label: "New York" },
				{ value: "NC", label: "North Carolina" },
				{ value: "ND", label: "North Dakota" },
				{ value: "OH", label: "Ohio" },
				{ value: "OK", label: "Oklahoma" },
				{ value: "OR", label: "Oregon" },
				{ value: "PA", label: "Pennsylvania" },
				{ value: "RI", label: "Rhode Island" },
				{ value: "SC", label: "South Carolina" },
				{ value: "SD", label: "South Dakota" },
				{ value: "TN", label: "Tennessee" },
				{ value: "TX", label: "Texas" },
				{ value: "UT", label: "Utah" },
				{ value: "VT", label: "Vermont" },
				{ value: "VA", label: "Virginia" },
				{ value: "WA", label: "Washington" },
				{ value: "WV", label: "West Virginia" },
				{ value: "WI", label: "Wisconsin" },
				{ value: "WY", label: "Wyoming" },
			],
		},
		{
			id: "zipCode",
			type: "text",
			placeholder: "Zip Code*",
			required: true,
		},
		{
			id: "relationship",
			type: "select",
			placeholder: "Relationship (Optional)",
			options: [
				{ value: "Spouse / Partner", label: "Spouse / Partner" },
				{ value: "Child", label: "Child" },
				{ value: "Parent", label: "Parent" },
				{ value: "Sibling", label: "Sibling" },
				{ value: "Grandparent", label: "Grandparent" },
				{ value: "Grandchild", label: "Grandchild" },
				{ value: "Aunt / Uncle", label: "Aunt / Uncle" },
				{ value: "Cousin", label: "Cousin" },
				{ value: "In-law", label: "In-law" },
				{ value: "Friend", label: "Friend" },
				{ value: "Family Friend", label: "Family Friend" },
				{ value: "Neighbor", label: "Neighbor" },
				{ value: "Co-worker", label: "Co-worker" },
				{ value: "Teacher", label: "Teacher" },
				{ value: "Coach", label: "Coach" },
				{ value: "Godparent / Godchild", label: "Godparent / Godchild" },
				{ value: "Other", label: "Other" },
			],
		},
		{
			id: "notes",
			type: "textarea",
			placeholder: "Notes",
			rows: 2,
		},
	],
	submitText: "Add Contact",
	cancelText: "Cancel",
	cardClassName: "card card-address",
	submitButtonColor: "#ec4899", // Pink
};

export const editAddressBookFormConfig: FormConfig = {
	...addressBookFormConfig,
	title: "Edit Contact",
	submitText: "Update Contact",
};

export function getFormConfig(
	type:
		| "cards"
		| "tasks"
		| "events"
		| "gifts"
		| "guests"
		| "addressBook"
		| "supplies",
	mode: "add" | "edit" = "add",
	customTitle?: string,
	customFieldLabel?: string,
	customSubmitText?: string
): FormConfig {
	const configs = {
		cards: mode === "add" ? cardsFormConfig : editCardsFormConfig,
		tasks: mode === "add" ? tasksFormConfig : editTasksFormConfig,
		events: mode === "add" ? eventsFormConfig : editEventsFormConfig,
		gifts: mode === "add" ? giftsFormConfig : editGiftsFormConfig,
		supplies: mode === "add" ? suppliesFormConfig : editSuppliesFormConfig,
		guests: mode === "add" ? guestsFormConfig : editGuestsFormConfig,
		addressBook:
			mode === "add" ? addressBookFormConfig : editAddressBookFormConfig,
	};

	const baseConfig = configs[type];

	// If custom values are provided, create a modified config
	if (customTitle || customFieldLabel || customSubmitText) {
		const modifiedConfig = { ...baseConfig };

		if (customTitle) {
			modifiedConfig.title = customTitle;
		}

		if (customFieldLabel) {
			// Update the title field placeholder if it exists
			modifiedConfig.fields = baseConfig.fields.map((field) => {
				if (field.id === "title") {
					return {
						...field,
						placeholder: customFieldLabel,
					};
				}
				return field;
			});
		}

		if (customSubmitText) {
			modifiedConfig.submitText = customSubmitText;
		}

		return modifiedConfig;
	}

	return baseConfig;
}
