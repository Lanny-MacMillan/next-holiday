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

// Gifts form configuration
export const giftsFormConfig: FormConfig = {
	title: "Add New Gift",
	fields: [
		{
			id: "name",
			type: "text",
			placeholder: "Gift Name*",
			required: true,
		},
		{
			id: "recipient",
			type: "text",
			placeholder: "Recipient*",
			required: true,
		},
		{
			id: "description",
			type: "text",
			placeholder: "Description",
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

export const editGiftsFormConfig: FormConfig = {
	...giftsFormConfig,
	title: "Edit Gift",
	submitText: "Update Gift",
};

// Helper function to get form config based on type and mode
export function getFormConfig(
	type: "cards" | "tasks" | "gifts",
	mode: "add" | "edit" = "add"
): FormConfig {
	const configs = {
		cards: mode === "add" ? cardsFormConfig : editCardsFormConfig,
		tasks: mode === "add" ? tasksFormConfig : editTasksFormConfig,
		gifts: mode === "add" ? giftsFormConfig : editGiftsFormConfig,
	};

	return configs[type];
}
