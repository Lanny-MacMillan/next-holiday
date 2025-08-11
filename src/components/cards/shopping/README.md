# ShoppingListItems Component

A reusable component for displaying shopping items across different holidays. This component maintains the exact same styling as the original Thanksgiving shopping list while being flexible enough to work with any holiday.

## Features

- **Generic Type Support**: Uses TypeScript generics to work with any shopping item type that extends the base `ShoppingItem` interface
- **Customizable Colors**: Supports different accent colors for different holidays
- **Flexible Props**: Customizable title, empty message, and callback functions
- **Consistent Styling**: Maintains the exact same visual design as the original

## Usage

### Basic Usage

```tsx
import { ShoppingListItems } from "@/components/cards/shopping";

<ShoppingListItems
	items={shoppingItems}
	onEditItem={handleEditItem}
	onDeleteItem={handleDeleteItem}
/>;
```

### With Custom Colors (Christmas Example)

```tsx
<ShoppingListItems
	items={christmasShoppingItems}
	title="Christmas Shopping List"
	emptyMessage="No Christmas shopping items yet. Start your holiday shopping!"
	onEditItem={handleEditItem}
	onDeleteItem={handleDeleteItem}
	accentColor="green"
	accentColorLight="green-100"
	accentColorDark="green-800"
/>
```

### With Custom Types

```tsx
// Define your custom shopping item type
interface ChristmasShoppingItem extends ShoppingItem {
	category: "Decorations" | "Gifts" | "Food" | "Wrapping" | "Other";
	priority: "High" | "Medium" | "Low";
}

// Use with your custom type
<ShoppingListItems<ChristmasShoppingItem>
	items={christmasItems}
	onEditItem={handleEditItem}
	onDeleteItem={handleDeleteItem}
	accentColor="red"
	accentColorLight="red-100"
	accentColorDark="red-800"
/>;
```

## Props

| Prop               | Type                       | Default                                         | Description                                       |
| ------------------ | -------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| `items`            | `T[]`                      | -                                               | Array of shopping items to display                |
| `title`            | `string`                   | `"Shopping Items"`                              | Title displayed above the list                    |
| `emptyMessage`     | `string`                   | `"No shopping items yet. Add your first item!"` | Message shown when no items exist                 |
| `onEditItem`       | `(item: T) => void`        | -                                               | Callback when edit button is clicked              |
| `onDeleteItem`     | `(itemId: string) => void` | -                                               | Callback when delete button is clicked            |
| `accentColor`      | `string`                   | `"amber"`                                       | Base accent color (e.g., "amber", "green", "red") |
| `accentColorLight` | `string`                   | `"amber-100"`                                   | Light variant of accent color                     |
| `accentColorDark`  | `string`                   | `"amber-800"`                                   | Dark variant of accent color                      |

## Holiday Color Suggestions

- **Thanksgiving**: `amber` (current)
- **Christmas**: `green` or `red`
- **Valentine's Day**: `pink` or `red`
- **Easter**: `purple` or `pink`
- **Halloween**: `orange` or `purple`
- **Fourth of July**: `blue` or `red`
- **Birthday**: `blue` or `pink`

## Example Implementation

Here's how the Thanksgiving shopping list page uses this component:

```tsx
// In src/app/thanksgiving/shopping-list/page.tsx
import { ShoppingListItems } from "@/components/cards/shopping";

<ShoppingListItems
	items={sortedItems}
	title="Shopping Items"
	emptyMessage="No shopping items yet. Add your first item!"
	onEditItem={handleEditItem}
	onDeleteItem={handleDeleteItem}
	accentColor="amber"
	accentColorLight="amber-100"
	accentColorDark="amber-800"
/>;
```

## Migration from Inline Code

To migrate from inline shopping list code to this component:

1. Replace the inline JSX with the `ShoppingListItems` component
2. Pass your existing items array as the `items` prop
3. Pass your existing edit and delete handlers
4. Customize colors and text as needed for your holiday
5. Remove the original inline code

The component maintains the exact same styling and functionality while being reusable across different holidays.
