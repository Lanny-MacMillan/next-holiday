import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface BirthdayContact {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	relationship?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

interface BirthdayAddressBookState {
	contacts: BirthdayContact[];
	loading: boolean;
	error: string | null;
	selectedContact: BirthdayContact | null;
	initialized: boolean;
}

const initialState: BirthdayAddressBookState = {
	contacts: [],
	loading: false,
	error: null,
	selectedContact: null,
	initialized: false,
};

// Async thunks
export const fetchBirthdayContacts = createAsyncThunk(
	"birthdayAddressBook/fetchBirthdayContacts",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentContacts = state.birthdayAddressBook.contacts;
		const isInitialized = state.birthdayAddressBook.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentContacts;
		}

		// Simulate API call
		const response = await new Promise<BirthdayContact[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Sarah Johnson",
						email: "sarah@email.com",
						phone: "555-0123",
						relationship: "Friend",
						notes: "Birthday party guest",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addBirthdayContact = createAsyncThunk(
	"birthdayAddressBook/addBirthdayContact",
	async (contact: Omit<BirthdayContact, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newContact: BirthdayContact = {
			...contact,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newContact;
	}
);

export const updateBirthdayContact = createAsyncThunk(
	"birthdayAddressBook/updateBirthdayContact",
	async (contact: BirthdayContact) => {
		// Simulate API call
		const updatedContact: BirthdayContact = {
			...contact,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedContact;
	}
);

export const deleteBirthdayContact = createAsyncThunk(
	"birthdayAddressBook/deleteBirthdayContact",
	async (contactId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return contactId;
	}
);

const birthdayAddressBookSlice = createSlice({
	name: "birthdayAddressBook",
	initialState,
	reducers: {
		setSelectedContact: (
			state,
			action: PayloadAction<BirthdayContact | null>
		) => {
			state.selectedContact = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchBirthdayContacts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchBirthdayContacts.fulfilled, (state, action) => {
				state.loading = false;
				state.contacts = action.payload;
				state.initialized = true;
			})
			.addCase(fetchBirthdayContacts.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch birthday contacts";
			})
			.addCase(addBirthdayContact.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addBirthdayContact.fulfilled, (state, action) => {
				state.loading = false;
				state.contacts.push(action.payload);
			})
			.addCase(addBirthdayContact.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add birthday contact";
			})
			.addCase(updateBirthdayContact.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateBirthdayContact.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.contacts.findIndex(
					(contact) => contact.id === action.payload.id
				);
				if (index !== -1) {
					state.contacts[index] = action.payload;
				}
			})
			.addCase(updateBirthdayContact.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to update birthday contact";
			})
			.addCase(deleteBirthdayContact.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteBirthdayContact.fulfilled, (state, action) => {
				state.loading = false;
				state.contacts = state.contacts.filter(
					(contact) => contact.id !== action.payload
				);
			})
			.addCase(deleteBirthdayContact.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to delete birthday contact";
			});
	},
});

export const { setSelectedContact, clearError } =
	birthdayAddressBookSlice.actions;
export default birthdayAddressBookSlice.reducer;
