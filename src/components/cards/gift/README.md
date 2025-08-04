# Gift Components

Modular, reusable components for displaying gift information across different holidays.

## GiftListCard Component

A component for displaying gift budget and list summary information.

## Features

- **Budget Tracking**: Shows spent amount, remaining budget, and progress bar
- **Gift List Summary**: Displays completion status and item counts
- **Theme Customization**: Supports different color schemes for each holiday
- **Responsive Design**: Works on mobile and desktop
- **Navigation**: Includes back arrow to return to holiday main page

## Props

```typescript
interface GiftListCardProps {
	holidayName: string; // Name of the holiday (e.g., "Christmas")
	budget: {
		spent: number; // Amount spent on gifts
		total: number; // Total budget allocated
		currency?: string; // Currency symbol (defaults to "$")
	};
	giftList: {
		totalItems: number; // Total number of gifts in list
		completedItems: number; // Number of completed gifts
	};
	theme?: {
		primaryColor?: string; // Main color for progress bars and accents
		accentColor?: string; // Secondary color for highlights
		backgroundColor?: string; // Background color of the card
	};
	className?: string; // Additional CSS classes
}
```

## Usage Examples

### Basic Usage

```tsx
import GiftListCard from "@/components/cards/gift/GiftListCard";

<GiftListCard
	holidayName="Christmas"
	budget={{
		spent: 199.99,
		total: 500,
	}}
	giftList={{
		totalItems: 5,
		completedItems: 2,
	}}
/>;
```

### With Custom Theme

```tsx
<GiftListCard
	holidayName="Valentine's Day"
	budget={{
		spent: 150.5,
		total: 300,
	}}
	giftList={{
		totalItems: 3,
		completedItems: 1,
	}}
	theme={{
		primaryColor: "#ec4899", // Pink
		accentColor: "#f43f5e", // Rose
	}}
/>
```

### With Real Data from Redux

```tsx
import { useAppSelector } from "@/store/hooks";

const gifts = useAppSelector((state: any) => state.giftList.gifts);

<GiftListCard
	holidayName="Christmas"
	budget={{
		spent: gifts.reduce((sum: number, gift: Gift) => sum + gift.price, 0),
		total: 500,
	}}
	giftList={{
		totalItems: gifts.length,
		completedItems: gifts.filter((gift: Gift) => gift.isCompleted).length,
	}}
	theme={{
		primaryColor: "#22c55e",
		accentColor: "#eab308",
	}}
/>;
```

## Holiday Theme Suggestions

### Christmas

- Primary: `#22c55e` (Green)
- Accent: `#eab308` (Yellow)

### Valentine's Day

- Primary: `#ec4899` (Pink)
- Accent: `#f43f5e` (Rose)

### Halloween

- Primary: `#f97316` (Orange)
- Accent: `#7c3aed` (Purple)

### Easter

- Primary: `#84cc16` (Lime green)
- Accent: `#fbbf24` (Amber)

### Thanksgiving

- Primary: `#f59e0b` (Amber)
- Accent: `#dc2626` (Red)

### New Year

- Primary: `#3b82f6` (Blue)
- Accent: `#fbbf24` (Gold)

## Integration

The component is designed to work seamlessly with the existing Redux store structure. It automatically calculates budget percentages and provides status messages based on spending levels.

## Accessibility

- Uses semantic HTML elements
- Includes proper ARIA labels
- Supports keyboard navigation
- High contrast color combinations
- Responsive design for all screen sizes

## GiftCardItem Component

A component for displaying individual gift items in a list format.

### Features

- **Gift Information Display**: Shows name, recipient, description, price, store, and notes
- **Completion Status**: Handles both incomplete and completed gift states
- **Interactive Elements**: Checkbox for completion, product links, and delete button
- **Theme Customization**: Supports different color schemes for each holiday
- **Responsive Design**: Works on mobile and desktop

### Props

```typescript
interface GiftCardItemProps {
	gift: Gift; // Gift object from Redux store
	isCompleted?: boolean; // Whether to show as completed (default: false)
	onToggle: (giftId: string) => void; // Function to handle completion toggle
	onEdit: (gift: Gift) => void; // Function to handle gift editing
	onDelete: (giftId: string) => void; // Function to handle gift deletion
	loading?: boolean; // Loading state for delete button
	theme?: {
		accentColor?: string; // Color for checkbox and accents
		hoverColor?: string; // Custom hover color classes
	};
}
```

### Usage Examples

#### Basic Usage

```tsx
import GiftCardItem from "@/components/cards/gift/GiftCardItem";

<GiftCardItem
	gift={gift}
	isCompleted={false}
	onToggle={handleToggleGift}
	onEdit={handleEditGift}
	onDelete={handleDeleteGift}
	loading={loading}
/>;
```

#### With Custom Theme

```tsx
<GiftCardItem
	gift={gift}
	isCompleted={true}
	onToggle={handleToggleGift}
	onEdit={handleEditGift}
	onDelete={handleDeleteGift}
	theme={{
		accentColor: "#ec4899", // Pink for Valentine's Day
		hoverColor: "hover:bg-pink-50 dark:hover:bg-pink-900/20",
	}}
/>
```

#### In a List

```tsx
<ul className="divide-y divide-gray-200 dark:divide-gray-700">
	{gifts.map((gift) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={gift.isCompleted}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={handleDeleteGift}
			loading={loading}
			theme={{
				accentColor: "#eab308", // Yellow for Christmas
			}}
		/>
	))}
</ul>
```

### Holiday Theme Suggestions

#### Christmas

- Accent: `#eab308` (Yellow)
- Hover: `hover:bg-yellow-50 dark:hover:bg-yellow-900/20`

#### Valentine's Day

- Accent: `#ec4899` (Pink)
- Hover: `hover:bg-pink-50 dark:hover:bg-pink-900/20`

#### Halloween

- Accent: `#f97316` (Orange)
- Hover: `hover:bg-orange-50 dark:hover:bg-orange-900/20`

#### Easter

- Accent: `#84cc16` (Lime green)
- Hover: `hover:bg-lime-50 dark:hover:bg-lime-900/20`
