# EventItems Component

A reusable component for rendering event/task items across all holiday event pages. This component handles both completed and incomplete tasks with a consistent design pattern.

## Features

- Supports both completed and incomplete task states
- Themeable with custom colors for different holidays
- Type-safe with TypeScript generics
- Consistent priority styling (high/medium/low)
- Interactive toggles and delete functionality
- Responsive design with dark mode support

## Props

### EventItemsProps<T>

| Prop           | Type                                          | Default  | Description                                 |
| -------------- | --------------------------------------------- | -------- | ------------------------------------------- |
| `task`         | `T extends BaseEventTask`                     | -        | The task object to render                   |
| `onToggleTask` | `(taskId: string) => void`                    | -        | Callback when task completion is toggled    |
| `onDeleteTask` | `(taskId: string, taskTitle: string) => void` | -        | Callback when task is deleted               |
| `loading`      | `boolean`                                     | `false`  | Whether actions are disabled due to loading |
| `themeColor`   | `string`                                      | `"blue"` | Theme color for hover effects and accents   |

### BaseEventTask Interface

```typescript
interface BaseEventTask {
	id: string;
	title: string;
	description?: string;
	priority: "high" | "medium" | "low";
	assignedTo?: string;
	category?: string;
	dueDate?: string;
	isCompleted: boolean;
	completedDate?: string;
}
```

## Usage Example

```tsx
import { EventItems } from "@/components/cards/event";
import { HanukkahTask } from "@/store/slices/hanukkah/hanukkahTasksSlice";

const renderEventItem = (task: HanukkahTask) => (
	<EventItems
		key={task.id}
		task={task}
		onToggleTask={handleToggleTask}
		onDeleteTask={handleDeleteTask}
		loading={loading}
		themeColor="blue" // Use holiday-specific colors
	/>
);

// Use with TaskSection
<TaskSection
	title="Events"
	items={eventTasks}
	isCompleted={false}
	emptyMessage="No events planned!"
	completedMessage=""
	renderItem={renderEventItem}
	cardClassName="card-events-hanukkah"
/>;
```

## Theme Colors

The component supports different theme colors for various holidays:

- `"blue"` - Hanukkah, Father's Day
- `"red"` - Kwanzaa, Fourth of July, Christmas
- `"green"` - Easter, St. Patrick's Day
- `"purple"` - Graduation, Birthday, Anniversary
- `"amber"` - New Year, Thanksgiving
- `"pink"` - Mother's Day, Valentine's Day
- `"orange"` - Halloween

### Current Holiday Implementations

| Holiday        | Theme Color | Page                     |
| -------------- | ----------- | ------------------------ |
| Hanukkah       | `blue`      | `/hanukkah/events`       |
| Kwanzaa        | `red`       | `/kwanzaa/events`        |
| New Year       | `amber`     | `/new-year/events`       |
| Easter         | `green`     | `/easter/events`         |
| Father's Day   | `blue`      | `/fathers-day/events`    |
| Mother's Day   | `pink`      | `/mothers-day/events`    |
| Fourth of July | `red`       | `/fourth-of-july/events` |
| Graduation     | `purple`    | `/graduation/events`     |

## Integration with TaskSection

This component is designed to work seamlessly with the existing `TaskSection` component, which handles the list container and empty states while `EventItems` handles individual item rendering.

## Type Safety

The component uses TypeScript generics to ensure type safety when used with different holiday task types. Each holiday can extend `BaseEventTask` with additional properties while maintaining compatibility.
