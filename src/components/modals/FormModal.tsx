import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
	isEmptyString,
	isEmptyNumber,
	isValidEmail,
} from "@/utils/formValidation";

export interface FormField {
	id: string;
	type:
		| "text"
		| "textarea"
		| "select"
		| "number"
		| "date"
		| "url"
		| "checkbox"
		| "email"
		| "tel";
	label?: string;
	placeholder?: string;
	required?: boolean;
	options?: { value: string; label: string }[];
	rows?: number;
	step?: string;
	min?: string;
	className?: string;
	style?: React.CSSProperties;
}

export interface FormModalProps {
	isOpen: boolean;
	title: string;
	fields: FormField[];
	initialValues?: Record<string, any>;
	onSubmit: (values: Record<string, any>) => void;
	onClose: () => void;
	loading?: boolean;
	submitText?: string;
	cancelText?: string;
	cardClassName?: string;
	submitButtonColor?: string;
	showAddressBook?: boolean;
	contacts?: any[];
	onAddressBookSelect?: (contact: any) => void;
}

export default function FormModal({
	isOpen,
	title,
	fields,
	initialValues = {},
	onSubmit,
	onClose,
	loading = false,
	submitText = "Submit",
	cancelText = "Cancel",
	cardClassName = "card",
	submitButtonColor = "#3b82f6",
	showAddressBook = false,
	contacts = [],
	onAddressBookSelect,
}: FormModalProps) {
	const [formValues, setFormValues] = useState<Record<string, any>>({});
	const [showAddressBookInternal, setShowAddressBookInternal] = useState(false);

	const handleAddressBookSelect = (contact: any) => {
		// Build full address from contact details
		const addressParts = [
			contact.streetAddress,
			contact.city,
			contact.state,
			contact.postalCode || contact.zipCode,
		].filter(Boolean);

		const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "";

		setFormValues((prev) => ({
			...prev,
			// Support both "recipient" (for cards) and "name" (for guests)
			recipient: contact.name,
			name: contact.name,
			address: fullAddress,
			email: contact.email || "",
			phone: contact.phone || "",
		}));
		setShowAddressBookInternal(false);
	};

	useEffect(() => {
		if (isOpen) {
			setFormValues(initialValues);
		}
	}, [isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Check if all required fields are filled
		const requiredFields = fields.filter((field) => field.required);
		const missingFields = requiredFields.filter((field) => {
			const value = formValues[field.id];
			// Handle different field types for validation
			if (field.type === "number") {
				return isEmptyNumber(value);
			}
			// For text-based fields, check if string is empty after trimming
			return isEmptyString(value);
		});

		if (missingFields.length > 0) {
			alert(
				`Please fill in all required fields: ${missingFields
					.map((f) => f.placeholder || f.id)
					.join(", ")}`
			);
			return;
		}

		// Validate email fields if they have values
		const emailFields = fields.filter((field) => field.type === "email");
		const invalidEmails = emailFields.filter((field) => {
			const value = formValues[field.id];
			// Only validate if email field has a value (since it's optional)
			return value && !isValidEmail(value);
		});

		if (invalidEmails.length > 0) {
			alert(
				`Please enter valid email addresses for: ${invalidEmails
					.map((f) => f.placeholder || f.id)
					.join(", ")}`
			);
			return;
		}

		onSubmit(formValues);
	};

	const handleClose = () => {
		setFormValues({});
		setShowAddressBookInternal(false);
		onClose();
	};

	const handleInputChange = (fieldId: string, value: any) => {
		// Find the field to determine its type
		const field = fields.find((f) => f.id === fieldId);

		// Convert value based on field type
		let processedValue = value;
		if (field?.type === "number") {
			processedValue = value === "" ? 0 : parseFloat(value) || 0;
		}

		setFormValues((prev) => ({
			...prev,
			[fieldId]: processedValue,
		}));
	};

	const renderField = (field: FormField) => {
		const commonProps = {
			className: `border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 w-full ${
				field.className || ""
			}`,
			style: {
				color: "#111827",
				backgroundColor: "white",
				...field.style,
			},
			placeholder: field.placeholder,
			required: field.required,
			value: formValues[field.id] || "",
			onChange: (
				e: React.ChangeEvent<
					HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
				>
			) => handleInputChange(field.id, e.target.value),
		};

		switch (field.type) {
			case "textarea":
				return <textarea {...commonProps} rows={field.rows || 3} />;
			case "select":
				return (
					<select {...commonProps}>
						{field.options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				);
			case "number":
				return (
					<input {...commonProps} type="number" step={field.step || "1"} />
				);
			case "date":
				return <input {...commonProps} type="date" />;
			case "url":
				return <input {...commonProps} type="url" />;
			case "checkbox":
				return (
					<div className="flex items-center">
						<input
							type="checkbox"
							id={field.id}
							checked={formValues[field.id] || false}
							onChange={(e) => handleInputChange(field.id, e.target.checked)}
							className="mr-2 accent-green-500"
						/>
						<label
							htmlFor={field.id}
							className="text-gray-700 dark:text-gray-300 text-sm"
						>
							{field.label}
						</label>
					</div>
				);
			default:
				return <input {...commonProps} type="text" />;
		}
	};

	if (!isOpen) return null;

	const modalContent = (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					handleClose();
				}
			}}
		>
			<div className="card rounded-lg p-4 sm:p-6 max-w-md mx-auto w-full max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-3 sm:mb-4">
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
						{title}
					</h3>
					<button
						onClick={handleClose}
						className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
					{fields.map((field) => (
						<div key={field.id}>
							{/* Special handling for address book integration */}
							{(field.id === "recipient" || field.id === "name") &&
								showAddressBook && (
									<div className="flex gap-2">
										<div className="flex-1">{renderField(field)}</div>
										<button
											type="button"
											onClick={() =>
												setShowAddressBookInternal(!showAddressBookInternal)
											}
											className="bg-blue-500 text-white px-2 sm:px-3 py-2 rounded text-xs sm:text-sm hover:bg-blue-600"
										>
											📖
										</button>
									</div>
								)}
							{/* Regular field rendering */}
							{!(
								(field.id === "recipient" || field.id === "name") &&
								showAddressBook
							) && renderField(field)}

							{/* Address Book Dropdown - positioned right after recipient/name field */}
							{(field.id === "recipient" || field.id === "name") &&
								showAddressBookInternal &&
								showAddressBook && (
									<div className="bg-gray-50 dark:bg-gray-700 rounded p-2 max-h-32 overflow-y-auto mt-2">
										<h4 className="text-xs sm:text-sm font-medium mb-1 text-gray-900 dark:text-white">
											From Address Book ({contacts.length} contacts):
										</h4>
										{contacts.length === 0 ? (
											<div className="text-xs text-gray-500 dark:text-gray-400 p-1">
												No contacts available. Add contacts in the Address Book
												first.
											</div>
										) : (
											contacts.map((contact: any) => (
												<button
													key={contact.id}
													type="button"
													onClick={() => {
														handleAddressBookSelect(contact);
													}}
													className="block w-full text-left text-xs sm:text-sm p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-gray-900 dark:text-white"
												>
													<div className="font-medium">{contact.name}</div>
													{contact.streetAddress && (
														<div className="text-xs text-gray-500">
															{contact.streetAddress}, {contact.city},{" "}
															{contact.state}{" "}
															{contact.postalCode || contact.zipCode}
														</div>
													)}
												</button>
											))
										)}
									</div>
								)}
						</div>
					))}

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
						>
							{cancelText}
						</button>
						<button
							type="submit"
							className="flex-1 text-white px-3 sm:px-4 py-2 rounded transition-colors text-sm sm:text-base"
							disabled={loading}
							style={{
								backgroundColor: submitButtonColor,
								opacity: loading ? 0.6 : 1,
								cursor: loading ? "not-allowed" : "pointer",
							}}
						>
							{loading ? "Processing..." : submitText}
						</button>
					</div>
				</form>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
