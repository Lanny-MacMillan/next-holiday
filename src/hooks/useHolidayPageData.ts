import { useAppSelector } from '@/store/hooks';
import { useFormModalMutation } from '@/hooks/useFormModalMutation';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
  selectHolidayPrefById,
} from '@/store/selectors/home';

export interface HolidayPageData {
  // Auth & User
  holidayId: string | null;
  auth0User: any;

  // Redux State
  holidayPreferences: any[];
  homeInitialized: boolean;
  homeData: any;
  holidayData: any;

  // Form Modal Mutation
  mutation: any;
  isLoading: boolean;
  error: any;

  // Utility Functions
  getProgressData: (sliceKey: string) => {
    total: number;
    completed: number;
    progress: number;
  };
}

/**
 * Custom hook that provides all the common data and functionality
 * needed by holiday pages, reducing 150-200 lines of boilerplate per page
 */
export function useHolidayPageData(): HolidayPageData {
  // Form modal mutation (includes auth0User and holidayId)
  const {
    holidayId,
    mutation,
    isLoading: mutationLoading,
    error: mutationError,
    auth0User,
  } = useFormModalMutation();

  // Redux selectors
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Get holiday-specific data using memoized selector
  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, holidayId!),
  );

  /**
   * Generic progress calculation function that can handle different slice types
   * Used across all holiday pages for calculating completion percentages
   */
  const getProgressData = (
    sliceKey: string,
  ): {
    total: number;
    completed: number;
    progress: number;
  } => {
    let total = 0;
    let completed = 0;

    // Early return if data not ready
    if (!holidayData || !homeInitialized) {
      return { total: 0, completed: 0, progress: 0 };
    }

    // Handle tasks with specific categories (format: "tasks:CategoryName")
    // baby shower Games page uses this format to differentiate between different types of tasks
    if (sliceKey.startsWith('tasks:')) {
      const category = sliceKey.split(':')[1];
      if (holidayData.tasks) {
        const categoryTasks = holidayData.tasks.filter(
          (task: any) => task.category === category,
        );
        total = categoryTasks.length;
        completed = categoryTasks.filter((task: any) => task.isCompleted).length;
      }
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, completed, progress };
    }

    switch (sliceKey) {
      case 'cards':
        // Dual logic: For most holidays, cards are stored as tasks with category 'Cards'
        // Only Birthday uses the actual cards collection
        if (holidayData.tasks) {
          const cardTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Cards',
          );
          if (cardTasks.length > 0) {
            // Use tasks approach (Fathers-day, Mothers-day, Valentines use this)

            total = cardTasks.length;
            completed = cardTasks.filter((task: any) => task.isCompleted).length;
          } else if (holidayData.cards && holidayData.cards.length > 0) {
            // Fall back to actual cards collection (Birthday uses this approach)
            total = holidayData.cards.length;
            completed = holidayData.cards.filter(
              (card: any) => card.isCompleted,
            ).length;
          }
        } else if (holidayData.cards && holidayData.cards.length > 0) {
          // Use actual cards collection if no tasks exist
          total = holidayData.cards.length;
          completed = holidayData.cards.filter(
            (card: any) => card.isCompleted,
          ).length;
        } else {
          console.log('No cards or tasks data found for progress calculation');
        }
        break;

      case 'dateIdeas':
        // Date Ideas are stored as tasks with category 'Date Ideas'
        if (holidayData.tasks) {
          const dateIdeaTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Date Ideas',
          );
          total = dateIdeaTasks.length;
          completed = dateIdeaTasks.filter((task: any) => task.isCompleted).length;
        }
        break;

      case 'reservations':
        // Reservations are stored as tasks with category 'Reservations'
        if (holidayData.tasks) {
          const reservationTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Reservations',
          );
          total = reservationTasks.length;
          completed = reservationTasks.filter(
            (task: any) => task.isCompleted,
          ).length;
        }
        break;

      case 'giftList':
      case 'gifts': // Support both giftList and gifts sliceKey
        if (holidayData.gifts) {
          total = holidayData.gifts.length;
          completed = holidayData.gifts.filter(
            (gift: any) => gift.isCompleted,
          ).length;
        }
        break;

      case 'guestList':
        if (holidayData.guestLists) {
          const guestLists = holidayData.guestLists || [];
          total = guestLists.length;
          completed = guestLists.filter(
            (guest: any) => guest.rsvpStatus === 'confirmed',
          ).length;
        }
        break;

      // New Year specific categories
      case 'events':
        if (holidayData.tasks) {
          const eventTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Events',
          );
          total = eventTasks.length;
          completed = eventTasks.filter((task: any) => task.isCompleted).length;
        }
        break;

      case 'decorations':
        if (holidayData.tasks) {
          const decorationTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Decorations',
          );
          total = decorationTasks.length;
          completed = decorationTasks.filter((task: any) => task.isCompleted).length;
        }
        break;

      case 'resolutions':
        if (holidayData.tasks) {
          const resolutionTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Resolutions',
          );
          total = resolutionTasks.length;
          completed = resolutionTasks.filter((task: any) => task.isCompleted).length;
        }
        break;

      // Hanukkah specific categories
      case 'candleLighting':
        if (holidayData.tasks) {
          const candleLightingTasks = holidayData.tasks.filter(
            (task: any) => task.category === 'Candle Lighting',
          );
          total = candleLightingTasks.length;
          completed = candleLightingTasks.filter(
            (task: any) => task.isCompleted,
          ).length;
        }
        break;

      // Generic task category handling
      default:
        if (holidayData.tasks) {
          // Handle Halloween-specific categories
          if (sliceKey === 'trickOrTreatPrep') {
            const trickOrTreatTasks = holidayData.tasks.filter(
              (task: any) => task.category === 'Trick or Treat Prep',
            );
            total = trickOrTreatTasks.length;
            completed = trickOrTreatTasks.filter(
              (task: any) => task.isCompleted,
            ).length;
          } else if (sliceKey === 'costumeIdeas') {
            const costumeIdeaTasks = holidayData.tasks.filter(
              (task: any) => task.category === 'Costume Ideas',
            );
            total = costumeIdeaTasks.length;
            completed = costumeIdeaTasks.filter(
              (task: any) => task.isCompleted,
            ).length;
          } else if (sliceKey === 'mealPlanning') {
            const mealPlanningTasks = holidayData.tasks.filter(
              (task: any) => task.category === 'Meal Planning',
            );
            total = mealPlanningTasks.length;
            completed = mealPlanningTasks.filter(
              (task: any) => task.isCompleted,
            ).length;
          } else if (sliceKey === 'partyPlanning') {
            const partyPlanningTasks = holidayData.tasks.filter(
              (task: any) => task.category === 'Party Planning',
            );
            total = partyPlanningTasks.length;
            completed = partyPlanningTasks.filter(
              (task: any) => task.isCompleted,
            ).length;
          } else {
            // Try to match by category name (capitalize first letter)
            const categoryName =
              sliceKey.charAt(0).toUpperCase() + sliceKey.slice(1);
            const categoryTasks = holidayData.tasks.filter(
              (task: any) => task.category === categoryName,
            );
            total = categoryTasks.length;
            completed = categoryTasks.filter((task: any) => task.isCompleted).length;
          }
        }
        break;
    }

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, progress };
  };

  return {
    // Auth & User
    holidayId,
    auth0User,

    // Redux State
    holidayPreferences,
    homeInitialized,
    homeData,
    holidayData,

    // Form Modal Mutation
    mutation,
    isLoading: mutationLoading,
    error: mutationError,

    // Utility Functions
    getProgressData,
  };
}
