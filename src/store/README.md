# Redux Store Setup

### node v20.9.0

This project uses Redux Toolkit with Redux Thunk middleware for state management.

## Structure

```
src/store/
├── index.ts          # Main store configuration
├── provider.tsx      # Redux Provider component
├── hooks.ts          # Typed Redux hooks
└── slices/           # Feature slices
    ├── addressBookSlice.ts
    ├── cardsSlice.ts
    ├── giftListSlice.ts
    └── tasksSlice.ts
```

## Features

### Address Book Slice

- Manage contacts with CRUD operations
- Async thunks for API calls
- Loading and error states
- Selected contact management

### Cards Slice

- Manage greeting cards
- Send card functionality
- Design and recipient tracking
- Async operations for card management

### Gift List Slice

- Track gift purchases
- Mark gifts as purchased
- Price and store information
- Recipient management

### Tasks Slice

- Holiday task management
- Priority levels (low, medium, high)
- Task categories (shopping, decorating, cooking, cleaning, other)
- Completion tracking

## Usage

### In Components

```tsx
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts, addContact } from "@/store/slices/addressBookSlice";

function MyComponent() {
	const dispatch = useAppDispatch();
	const { contacts, loading } = useAppSelector((state) => state.addressBook);

	useEffect(() => {
		dispatch(fetchContacts());
	}, [dispatch]);

	const handleAddContact = (contactData) => {
		dispatch(addContact(contactData));
	};

	return (
		<div>
			{loading
				? "Loading..."
				: contacts.map((contact) => <div key={contact.id}>{contact.name}</div>)}
		</div>
	);
}
```

### Available Actions

Each slice provides the following async thunks:

**Address Book:**

- `fetchContacts()` - Load all contacts
- `addContact(contact)` - Add new contact
- `updateContact(contact)` - Update existing contact
- `deleteContact(id)` - Delete contact

**Cards:**

- `fetchCards()` - Load all cards
- `addCard(card)` - Add new card
- `updateCard(card)` - Update existing card
- `deleteCard(id)` - Delete card
- `sendCard(id)` - Mark card as sent

**Gift List:**

- `fetchGifts()` - Load all gifts
- `addGift(gift)` - Add new gift
- `updateGift(gift)` - Update existing gift
- `deleteGift(id)` - Delete gift
- `markGiftAsPurchased(id)` - Mark gift as purchased

**Tasks:**

- `fetchTasks()` - Load all tasks
- `addTask(task)` - Add new task
- `updateTask(task)` - Update existing task
- `deleteTask(id)` - Delete task
- `toggleTaskCompletion(id)` - Toggle task completion

### State Structure

```typescript
interface RootState {
	addressBook: {
		contacts: Contact[];
		loading: boolean;
		error: string | null;
		selectedContact: Contact | null;
	};
	cards: {
		cards: Card[];
		loading: boolean;
		error: string | null;
		selectedCard: Card | null;
	};
	giftList: {
		gifts: Gift[];
		loading: boolean;
		error: string | null;
		selectedGift: Gift | null;
	};
	tasks: {
		tasks: Task[];
		loading: boolean;
		error: string | null;
		selectedTask: Task | null;
	};
}
```

## Middleware

The store is configured with Redux Thunk middleware by default (included in Redux Toolkit). This allows for async actions and side effects.

## Provider Setup

The Redux Provider is configured in `src/app/layout.tsx` to wrap the entire application, making the store available to all components.
