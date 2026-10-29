import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { api } from './api';
import addressBookReducer from './slices/addressBookSlice';
import budgetsReducer from './slices/budgetsSlice';
import cardsReducer from './slices/cardsSlice';
import giftListReducer from './slices/giftListSlice';
import homeReducer from './slices/homeSlice';
import tasksReducer from './slices/tasksSlice';
import userReducer from './slices/userSlice';
import themeReducer from './slices/themeSlice';
import countdownReducer from './slices/countdownSlice';
import sharesReducer from './slices/sharesSlice';
import invitesReducer from './slices/invitesSlice';
import holidayPreferencesReducer from './slices/holidayPreferencesSlice';
import hanukkahCountdownReducer from './slices/hanukkah/hanukkahCountdownSlice';
import kwanzaaCountdownReducer from './slices/kwanzaa/kwanzaaCountdownSlice';

import newYearCountdownReducer from './slices/new-year/newYearCountdownSlice';
import valentinesCountdownReducer from './slices/valentines/valentinesCountdownSlice';
import easterCountdownReducer from './slices/easter/easterCountdownSlice';
import halloweenCountdownReducer from './slices/halloween/halloweenCountdownSlice';
import thanksgivingCountdownReducer from './slices/thanksgiving/thanksgivingCountdownSlice';
import graduationCountdownReducer from './slices/graduation/graduationCountdownSlice';
import anniversaryCountdownReducer from './slices/anniversary/anniversaryCountdownSlice';
import birthdayCountdownReducer from './slices/birthday/birthdayCountdownSlice';
import fourthOfJulyCountdownReducer from './slices/fourth-of-july/fourthOfJulyCountdownSlice';
import fathersDayCountdownReducer from './slices/fathers-day/fathersDayCountdownSlice';
import mothersDayCountdownReducer from './slices/mothers-day/mothersDayCountdownSlice';
import christmasCountdownReducer from './slices/christmas/christmasCountdownSlice';
import userPreferencesReducer from './slices/userPreferencesSlice';
import countdownTimerReducer from './slices/countdownTimerSlice';

// Check if we should disable serializable checks in development
const shouldDisableSerializableCheck =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_DISABLE_SERIALIZABLE_CHECK === 'true';

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage,

  whitelist: [
    'home',
    'userPreferences',
    'theme',
    'holidayPreferences',
    'budgets',
    'user', // Persist user subscription data for authorization checks
  ],
  // Don't persist API cache or temporary UI state
  blacklist: [api.reducerPath],
};

// Create the root reducer
const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  addressBook: addressBookReducer,
  budgets: budgetsReducer,
  cards: cardsReducer,
  giftList: giftListReducer,
  home: homeReducer,
  tasks: tasksReducer,
  user: userReducer,
  theme: themeReducer,
  countdown: countdownReducer,
  shares: sharesReducer,
  invites: invitesReducer,
  hanukkahCountdown: hanukkahCountdownReducer,
  kwanzaaCountdown: kwanzaaCountdownReducer,

  newYearCountdown: newYearCountdownReducer,
  valentinesCountdown: valentinesCountdownReducer,
  easterCountdown: easterCountdownReducer,
  halloweenCountdown: halloweenCountdownReducer,
  thanksgivingCountdown: thanksgivingCountdownReducer,
  graduationCountdown: graduationCountdownReducer,
  anniversaryCountdown: anniversaryCountdownReducer,
  birthdayCountdown: birthdayCountdownReducer,
  fourthOfJulyCountdown: fourthOfJulyCountdownReducer,
  fathersDayCountdown: fathersDayCountdownReducer,
  mothersDayCountdown: mothersDayCountdownReducer,
  christmasCountdown: christmasCountdownReducer,
  userPreferences: userPreferencesReducer,
  holidayPreferences: holidayPreferencesReducer,
  countdownTimer: countdownTimerReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => {
    const middleware = getDefaultMiddleware({
      serializableCheck: shouldDisableSerializableCheck
        ? false
        : {
            // Ignore specific actions that might contain non-serializable data
            ignoredActions: [
              'persist/PERSIST',
              'persist/REHYDRATE',
              'persist/PAUSE',
              'persist/PURGE',
              'persist/REGISTER',
              'persist/FLUSH',
            ],
            // Ignore specific paths in the state that might contain non-serializable data
            ignoredPaths: [
              'user.user', // Auth0 user object might contain non-serializable data
            ],
            // Increase the warning threshold for development
            warnAfter: 128, // Increase from default 32ms to 128ms
          },
      // Disable immutable check in development to improve performance
      immutableCheck: {
        warnAfter: 128,
      },
    });

    // Log middleware configuration in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Redux middleware configuration:', {
        serializableCheck: shouldDisableSerializableCheck ? 'disabled' : 'enabled',
        immutableCheck: 'enabled with 128ms threshold',
        reducerCount: 50, // Approximate count of reducers
      });
    }

    return middleware.concat(api.middleware);
  },
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
