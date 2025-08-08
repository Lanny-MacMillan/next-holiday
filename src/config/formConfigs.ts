import { FormField } from "@/components/modals/FormModal";

export interface FormConfig {
	title: string;
	fields: FormField[];
	submitText: string;
	cancelText: string;
	cardClassName: string;
	submitButtonColor: string;
	showAddressBook?: boolean;
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
			id: "category",
			type: "text",
			placeholder: "Category",
		},
		{
			id: "dueDate",
			type: "date",
			placeholder: "Due Date",
		},
	],
	submitText: "Add Task",
	cancelText: "Cancel",
	cardClassName: "card card-tasks",
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
			id: "category",
			type: "text",
			placeholder: "Category",
		},
		{
			id: "dueDate",
			type: "date",
			placeholder: "Due Date",
		},
	],
	submitText: "Add Event Task",
	cancelText: "Cancel",
	cardClassName: "card card-tasks",
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
export function getFormConfig(
	type: "cards" | "tasks" | "events" | "gifts" | "guests",
	mode: "add" | "edit" = "add"
): FormConfig {
	const configs = {
		cards: mode === "add" ? cardsFormConfig : editCardsFormConfig,
		tasks: mode === "add" ? tasksFormConfig : editTasksFormConfig,
		events: mode === "add" ? eventsFormConfig : editEventsFormConfig,
		gifts: mode === "add" ? giftsFormConfig : editGiftsFormConfig,
		guests: mode === "add" ? guestsFormConfig : editGuestsFormConfig,
	};

	return configs[type];
}
