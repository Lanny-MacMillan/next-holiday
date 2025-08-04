# TaskCard Component

A reusable component for displaying task sections like Cards, Tasks, Decorations, etc. across different holidays.

## Features

- **Task Information Display**: Shows section name, description, and progress
- **Progress Tracking**: Visual progress bar and completion statistics
- **Theme Customization**: Supports different color schemes for each holiday
- **Responsive Design**: Works on mobile and desktop
- **Navigation**: Built-in Link component for navigation

## Props

```typescript
interface TaskCardProps {
	holidayName: string; // Name of the holiday (e.g., "Christmas")
	sectionName: string; // Name of the task section (e.g., "Cards", "Tasks")
	description: string; // Description of the section
	href: string; // Navigation link
	totalItems: number; // Total number of items in the section
	completedItems: number; // Number of completed items
	theme?: {
		primaryColor?: string; // Main color for badges and accents
		accentColor?: string; // Secondary color for highlights
		backgroundColor?: string; // Background color of the card
		progressColor?: string; // Color for the progress bar
	};
	className?: string; // Additional CSS classes
}
```

## Usage Examples

### Basic Usage

```tsx
import TaskCard from "@/components/cards/task/TaskCard";

<TaskCard
	holidayName="Christmas"
	sectionName="Cards"
	description="Track your holiday cards"
	href="/christmas/cards"
	totalItems={5}
	completedItems={2}
/>;
```

### With Custom Theme

```tsx
<TaskCard
	holidayName="Valentine's Day"
	sectionName="Cards"
	description="Track your Valentine's cards"
	href="/valentines/cards"
	totalItems={3}
	completedItems={1}
	theme={{
		primaryColor: "#ec4899", // Pink
		progressColor: "#ec4899",
	}}
/>
```

### With Real Data from Redux

```tsx
import { useAppSelector } from "@/store/hooks";

const cards = useAppSelector((state: any) => state.cards.cards);

<TaskCard
	holidayName="Christmas"
	sectionName="Cards"
	description="Track your holiday cards"
	href="/christmas/cards"
	totalItems={cards.length}
	completedItems={cards.filter((card: any) => card.isCompleted).length}
	theme={{
		primaryColor: "#22c55e",
		progressColor: "#22c55e",
	}}
/>;
```

## Holiday Theme Suggestions

### Christmas

- Primary: `#22c55e` (Green)
- Progress: `#22c55e` (Green)

### Valentine's Day

- Primary: `#ec4899` (Pink)
- Progress: `#ec4899` (Pink)

### Halloween

- Primary: `#f97316` (Orange)
- Progress: `#f97316` (Orange)

### Easter

- Primary: `#84cc16` (Lime green)
- Progress: `#84cc16` (Lime green)

## Integration

The component is designed to work seamlessly with the existing Redux store structure. It automatically calculates progress percentages and provides visual feedback for task completion.

## Accessibility

- Uses semantic HTML elements
- Includes proper ARIA labels
- Supports keyboard navigation
- High contrast color combinations
- Responsive design for all screen sizes
