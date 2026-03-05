import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface GraduationContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  relationship?: string;
  notes?: string;
  isCompleted?: boolean;
  isDeclined?: boolean;
  numberOfGuests?: number;
  dietaryRestrictions?: string;
  bringingDish?: string;
  createdAt: string;
  updatedAt: string;
}

interface GraduationAddressBookState {
  contacts: GraduationContact[];
  loading: boolean;
  error: string | null;
  selectedContact: GraduationContact | null;
  initialized: boolean;
}

const initialState: GraduationAddressBookState = {
  contacts: [],
  loading: false,
  error: null,
  selectedContact: null,
  initialized: false,
};

// Async thunks
export const fetchGraduationContacts = createAsyncThunk(
  'graduationAddressBook/fetchGraduationContacts',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentContacts = state.graduationAddressBook.contacts;
    const isInitialized = state.graduationAddressBook.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentContacts;
    }

    // Simulate API call
    const response = await new Promise<GraduationContact[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Family Member',
            email: 'family@email.com',
            phone: '555-0123',
            relationship: 'Family',
            notes: 'Graduation party guest',
            isCompleted: false,
            isDeclined: false,
            numberOfGuests: 3,
            dietaryRestrictions: 'Vegetarian',
            bringingDish: 'Graduation Cake',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'College Friend',
            email: 'friend@email.com',
            phone: '555-0456',
            relationship: 'Friend',
            notes: 'Will bring graduation gift',
            isCompleted: true,
            isDeclined: false,
            numberOfGuests: 2,
            dietaryRestrictions: '',
            bringingDish: 'Graduation Cookies',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Former Classmate',
            email: 'classmate@email.com',
            phone: '555-0789',
            relationship: 'Classmate',
            notes: 'Unable to attend due to prior commitment',
            isCompleted: false,
            isDeclined: true,
            numberOfGuests: 1,
            dietaryRestrictions: '',
            bringingDish: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addGraduationContact = createAsyncThunk(
  'graduationAddressBook/addGraduationContact',
  async (contact: Omit<GraduationContact, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newContact: GraduationContact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newContact;
  },
);

export const updateGraduationContact = createAsyncThunk(
  'graduationAddressBook/updateGraduationContact',
  async (contact: GraduationContact) => {
    // Simulate API call
    const updatedContact: GraduationContact = {
      ...contact,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedContact;
  },
);

export const deleteGraduationContact = createAsyncThunk(
  'graduationAddressBook/deleteGraduationContact',
  async (contactId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return contactId;
  },
);

const graduationAddressBookSlice = createSlice({
  name: 'graduationAddressBook',
  initialState,
  reducers: {
    setSelectedContact: (state, action: PayloadAction<GraduationContact | null>) => {
      state.selectedContact = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchGraduationContacts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGraduationContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload;
        state.initialized = true;
      })
      .addCase(fetchGraduationContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch graduation contacts';
      })
      .addCase(addGraduationContact.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addGraduationContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts.push(action.payload);
      })
      .addCase(addGraduationContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add graduation contact';
      })
      .addCase(updateGraduationContact.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGraduationContact.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contacts.findIndex(
          contact => contact.id === action.payload.id,
        );
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
      })
      .addCase(updateGraduationContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update graduation contact';
      })
      .addCase(deleteGraduationContact.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGraduationContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = state.contacts.filter(
          contact => contact.id !== action.payload,
        );
      })
      .addCase(deleteGraduationContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete graduation contact';
      });
  },
});

export const { setSelectedContact, clearError } = graduationAddressBookSlice.actions;
export default graduationAddressBookSlice.reducer;
