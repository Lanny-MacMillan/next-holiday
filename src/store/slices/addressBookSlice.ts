import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AddressBookState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  selectedContact: Contact | null;
}

const initialState: AddressBookState = {
  contacts: [],
  loading: false,
  error: null,
  selectedContact: null,
};

// Async thunks
export const fetchContacts = createAsyncThunk(
	"addressBook/fetchContacts",
	async () => {
		// Simulate API call
		const response = await new Promise<Contact[]>((resolve) => {
			setTimeout(() => {
				resolve([]); // Start with empty list
			}, 500);
		});
		return response;
	}
);

export const addContact = createAsyncThunk(
  'addressBook/addContact',
  async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return newContact;
  }
);

export const updateContact = createAsyncThunk(
  'addressBook/updateContact',
  async (contact: Contact) => {
    // Simulate API call
    const updatedContact: Contact = {
      ...contact,
      updatedAt: new Date().toISOString(),
    };
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedContact;
  }
);

export const deleteContact = createAsyncThunk(
  'addressBook/deleteContact',
  async (contactId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return contactId;
  }
);

const addressBookSlice = createSlice({
  name: 'addressBook',
  initialState,
  reducers: {
    setSelectedContact: (state, action: PayloadAction<Contact | null>) => {
      state.selectedContact = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contacts
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch contacts';
      })
      // Add contact
      .addCase(addContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts.push(action.payload);
      })
      .addCase(addContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add contact';
      })
      // Update contact
      .addCase(updateContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contacts.findIndex(contact => contact.id === action.payload.id);
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update contact';
      })
      // Delete contact
      .addCase(deleteContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = state.contacts.filter(contact => contact.id !== action.payload);
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete contact';
      });
  },
});

export const { setSelectedContact, clearError } = addressBookSlice.actions;
export default addressBookSlice.reducer; 