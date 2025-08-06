import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface BabyShowerContact {
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

interface BabyShowerAddressBookState {
	contacts: BabyShowerContact[];
	loading: boolean;
	error: string | null;
	selectedContact: BabyShowerContact | null;
	initialized: boolean;
}

const initialState: BabyShowerAddressBookState = {
	contacts: [],
	loading: false,
	error: null,
	selectedContact: null,
	initialized: false,
};

// Async thunks
export const fetchBabyShowerContacts = createAsyncThunk(
	"babyShowerAddressBook/fetchBabyShowerContacts",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentContacts = state.babyShowerAddressBook.contacts;
		const isInitialized = state.babyShowerAddressBook.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentContacts;
		}

		// Simulate API call
		const response = await new Promise<BabyShowerContact[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Friend",
						email: "friend@email.com",
						phone: "555-0123",
						relationship: "Friend",
						notes: "Baby shower guest",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addBabyShowerContact = createAsyncThunk(
	"babyShowerAddressBook/addBabyShowerContact",
	async (
		contact: Omit<BabyShowerContact, "id" | "createdAt" | "updatedAt">
	) => {
		// Simulate API call
		const newContact: BabyShowerContact = {
			...contact,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newContact;
	}
);

export const updateBabyShowerContact = createAsyncThunk(
	"babyShowerAddressBook/updateBabyShowerContact",
	async (contact: BabyShowerContact) => {
		// Simulate API call
		const updatedContact: BabyShowerContact = {
			...contact,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedContact;
	}
);

export const deleteBabyShowerContact = createAsyncThunk(
	"babyShowerAddressBook/deleteBabyShowerContact",
	async (contactId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return contactId;
	}
);

const babyShowerAddressBookSlice = createSlice({
	name: "babyShowerAddressBook",
	initialState,
	reducers: {
		setSelectedContact: (
			state,
			action: PayloadAction<BabyShowerContact | null>
		) => {
			state.selectedContact = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchBabyShowerContacts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchBabyShowerContacts.fulfilled, (state, action) => {
				state.loading = false;
				state.contacts = action.payload;
				state.initialized = true;
			})
			.addCase(fetchBabyShowerContacts.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch baby shower contacts";
			})
			.addCase(addBabyShowerContact.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addBabyShowerContact.fulfilled, (state, action) => {
				state.loading = false;
				state.contacts.push(action.payload);
			})
			.addCase(addBabyShowerContact.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to add baby shower contact";
			})
			.addCase(updateBabyShowerContact.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateBabyShowerContact.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.contacts.findIndex(
					(contact) => contact.id === action.payload.id
				);
				if (index !== -1) {
					state.contacts[index] = action.payload;
				}
			})
			.addCase(updateBabyShowerContact.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to update baby shower contact";
			})
			.addCase(deleteBabyShowerContact.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteBabyShowerContact.fulfilled, (state, action) => {
				state.loading = false;
				state.contacts = state.contacts.filter(
					(contact) => contact.id !== action.payload
				);
			})
			.addCase(deleteBabyShowerContact.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to delete baby shower contact";
			});
	},
});

export const { setSelectedContact, clearError } =
	babyShowerAddressBookSlice.actions;
export default babyShowerAddressBookSlice.reducer;
