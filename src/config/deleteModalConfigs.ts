export interface DeleteModalConfig {
  title: string;
  message: string;
  cardClassName: string;
  confirmText: string;
  cancelText: string;
  confirmButtonColor: string;
}

// Cards delete configuration
export const cardsDeleteConfig: DeleteModalConfig = {
  title: 'Confirm Delete',
  message:
    'Are you sure you want to delete this card? This action cannot be undone.',
  cardClassName: 'card card-cards',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  confirmButtonColor: '#ef4444', // Red
};

// Tasks delete configuration
export const tasksDeleteConfig: DeleteModalConfig = {
  title: 'Delete Task?',
  message:
    'Are you sure you want to delete this task? This action cannot be undone.',
  cardClassName: 'bg-white rounded-lg shadow-lg',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  confirmButtonColor: '#ef4444', // Red
};

// Gifts delete configuration
export const giftsDeleteConfig: DeleteModalConfig = {
  title: 'Confirm Delete',
  message:
    'Are you sure you want to delete this gift? This action cannot be undone.',
  cardClassName: 'card',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  confirmButtonColor: '#ef4444', // Red
};

// Guests delete configuration
export const guestsDeleteConfig: DeleteModalConfig = {
  title: 'Confirm Delete',
  message:
    'Are you sure you want to delete this guest? This action cannot be undone.',
  cardClassName: 'card',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  confirmButtonColor: '#ef4444', // Red
};

// Recipes delete configuration
export const recipesDeleteConfig: DeleteModalConfig = {
  title: 'Confirm Delete',
  message:
    'Are you sure you want to delete this recipe? This action cannot be undone.',
  cardClassName: 'card',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  confirmButtonColor: '#ef4444', // Red
};

// Address book delete configuration
export const addressBookDeleteConfig: DeleteModalConfig = {
  title: 'Confirm Delete',
  message:
    'Are you sure you want to delete this contact? This action cannot be undone.',
  cardClassName: 'card card-address',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  confirmButtonColor: '#ef4444', // Red
};

// Helper function to get delete config based on type
export function getDeleteConfig(
  type: 'cards' | 'tasks' | 'gifts' | 'guests' | 'recipes' | 'addressBook',
): DeleteModalConfig {
  const configs = {
    cards: cardsDeleteConfig,
    tasks: tasksDeleteConfig,
    gifts: giftsDeleteConfig,
    guests: guestsDeleteConfig,
    recipes: recipesDeleteConfig,
    addressBook: addressBookDeleteConfig,
  };

  return configs[type];
}
