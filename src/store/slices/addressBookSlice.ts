import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null; // Note: DB uses postalCode, not zipCode
  relationship?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface AddressBookState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  selectedContact: Contact | null;
  initialized: boolean;
}

const initialState: AddressBookState = {
  contacts: [],
  loading: false,
  error: null,
  selectedContact: null,
  initialized: false,
};

// Async thunks
export const fetchContacts = createAsyncThunk(
  'addressBook/fetchContacts',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentContacts = state.addressBook.contacts;
    const isInitialized = state.addressBook.initialized;

    // Get contacts from home data if available
    const homeContacts = state.home?.data?.contacts;

    // Check if we already have contacts and home data is available
    if (isInitialized && currentContacts.length > 0) {
      return currentContacts;
    }
    if (homeContacts && homeContacts.length > 0) {
      // Convert Date objects to strings for consistency with API responses
      const convertedContacts = homeContacts.map((contact: any) => ({
        ...contact,
        createdAt:
          contact.createdAt instanceof Date
            ? contact.createdAt.toISOString()
            : contact.createdAt,
        updatedAt:
          contact.updatedAt instanceof Date
            ? contact.updatedAt.toISOString()
            : contact.updatedAt,
      }));
      return convertedContacts;
    }

    // If no home data available, return empty array instead of making unauthenticated API call
    // The contacts will be loaded properly when the user navigates to the address book page
    return [];
  },
);

export const addContact = createAsyncThunk(
  'addressBook/addContact',
  async (
    contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> & {
      auth0User?: any;
    },
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if auth0User is provided
    if (contact.auth0User) {
      headers['x-test-user'] = JSON.stringify({
        sub: contact.auth0User.sub,
        email: contact.auth0User.email,
        name: contact.auth0User.name,
      });
    }

    // Real API call
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...contact,
        zipCode: contact.postalCode, // Convert postalCode to zipCode for API
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add contact');
    }

    const result = await response.json();
    const contactData = result.data || result; // Handle both {data: contact} and direct contact response
    return contactData;
  },
);

export const updateContact = createAsyncThunk(
  'addressBook/updateContact',
  async (contact: Contact & { auth0User?: any }) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if auth0User is provided
    if (contact.auth0User) {
      headers['x-test-user'] = JSON.stringify({
        sub: contact.auth0User.sub,
        email: contact.auth0User.email,
        name: contact.auth0User.name,
      });
    }

    // Real API call
    const response = await fetch(`/api/contacts/${contact.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...contact,
        zipCode: contact.postalCode, // Convert postalCode to zipCode for API
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update contact');
    }

    const result = await response.json();
    const contactData = result.data || result; // Handle both {data: contact} and direct contact response
    return contactData;
  },
);

export const deleteContact = createAsyncThunk(
  'addressBook/deleteContact',
  async (request: { contactId: string; auth0User?: any }) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if auth0User is provided
    if (request.auth0User) {
      headers['x-test-user'] = JSON.stringify({
        sub: request.auth0User.sub,
        email: request.auth0User.email,
        name: request.auth0User.name,
      });
    }

    // Real API call
    const response = await fetch(`/api/contacts/${request.contactId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete contact');
    }

    return request.contactId;
  },
);

const addressBookSlice = createSlice({
  name: 'addressBook',
  initialState,
  reducers: {
    setSelectedContact: (state, action: PayloadAction<Contact | null>) => {
      state.selectedContact = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    resetContacts: state => {
      state.initialized = false;
      state.contacts = [];
    },
  },
  extraReducers: builder => {
    builder
      // Fetch contacts
      .addCase(fetchContacts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload;
        state.initialized = true; // Set initialized to true on successful fetch
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch contacts';
      })
      // Add contact
      .addCase(addContact.pending, state => {
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
      .addCase(updateContact.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contacts.findIndex(
          contact => contact.id === action.payload.id,
        );
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update contact';
      })
      // Delete contact
      .addCase(deleteContact.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = state.contacts.filter(
          contact => contact.id !== action.payload,
        );
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete contact';
      });
  },
});

export const { setSelectedContact, clearError, resetContacts } =
  addressBookSlice.actions;
export default addressBookSlice.reducer;
