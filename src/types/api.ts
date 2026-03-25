import { z } from 'zod';

// Base User type for Auth0 user
export interface User {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

// ============================================================================
// GIFT TYPES
// ============================================================================

export interface GiftQueryArgs {
  holidayId: string;
  auth0User: User;
}

export interface GiftMutationArgs extends GiftQueryArgs {
  payload: CreateGiftPayload;
}

export interface UpdateGiftArgs extends GiftQueryArgs {
  giftId: string;
  isCompleted: boolean;
}

export interface EditGiftArgs extends GiftQueryArgs {
  giftId: string;
  payload: Partial<CreateGiftPayload>;
}

export interface DeleteGiftArgs extends Omit<GiftQueryArgs, 'payload'> {
  giftId: string;
}

// Runtime validation schemas
export const GiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().optional(),
  recipient: z.string().optional(),
  store: z.string().optional(),
  url: z.string().url().optional(),
  isCompleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  holidayId: z.string(),
});

export const CreateGiftPayloadSchema = z.object({
  name: z.string().min(1, 'Gift name is required'),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  recipient: z.string().optional(),
  store: z.string().optional(),
  url: z.string().url().optional(),
});

export type Gift = z.infer<typeof GiftSchema>;
export type CreateGiftPayload = z.infer<typeof CreateGiftPayloadSchema>;

// ============================================================================
// TASK TYPES
// ============================================================================

export interface TaskQueryArgs {
  holidayId: string;
  auth0User: User;
}

export interface TaskMutationArgs extends TaskQueryArgs {
  payload: CreateTaskPayload;
}

export interface UpdateTaskArgs extends TaskQueryArgs {
  taskId: string;
  isCompleted: boolean;
}

export interface EditTaskArgs extends TaskQueryArgs {
  taskId: string;
  payload: Partial<CreateTaskPayload>;
}

export interface DeleteTaskArgs extends Omit<TaskQueryArgs, 'payload'> {
  taskId: string;
}

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
  isCompleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  holidayId: z.string(),
});

export const CreateTaskPayloadSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type CreateTaskPayload = z.infer<typeof CreateTaskPayloadSchema>;

// ============================================================================
// CARD TYPES
// ============================================================================

export interface CardQueryArgs {
  holidayId: string;
  auth0User: User;
}

export interface CardMutationArgs extends CardQueryArgs {
  payload: CreateCardPayload;
}

export interface UpdateCardArgs extends CardQueryArgs {
  cardId: string;
  isCompleted: boolean;
}

export interface EditCardArgs extends CardQueryArgs {
  cardId: string;
  payload: Partial<CreateCardPayload>;
}

export interface DeleteCardArgs extends Omit<CardQueryArgs, 'payload'> {
  cardId: string;
}

export const CardSchema = z.object({
  id: z.string(),
  recipient: z.string(),
  message: z.string().optional(),
  cardType: z.string().optional(),
  isCompleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  holidayId: z.string(),
});

export const CreateCardPayloadSchema = z.object({
  recipient: z.string().min(1, 'Recipient is required'),
  message: z.string().optional(),
  cardType: z.string().optional(),
});

export type Card = z.infer<typeof CardSchema>;
export type CreateCardPayload = z.infer<typeof CreateCardPayloadSchema>;

// ============================================================================
// GUEST TYPES
// ============================================================================

export interface GuestQueryArgs {
  holidayId: string;
  auth0User: User;
}

export interface GuestMutationArgs extends GuestQueryArgs {
  payload: CreateGuestPayload;
}

export interface UpdateGuestArgs extends GuestQueryArgs {
  guestId: string;
  isCompleted: boolean;
}

export interface EditGuestArgs extends GuestQueryArgs {
  guestId: string;
  payload: Partial<CreateGuestPayload>;
}

export interface DeleteGuestArgs extends Omit<GuestQueryArgs, 'payload'> {
  guestId: string;
}

export const GuestSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  attending: z.enum(['yes', 'no', 'maybe']).optional(),
  dietary: z.string().optional(),
  isCompleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  holidayId: z.string(),
});

export const CreateGuestPayloadSchema = z.object({
  name: z.string().min(1, 'Guest name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  attending: z.enum(['yes', 'no', 'maybe']).optional(),
  dietary: z.string().optional(),
});

export type Guest = z.infer<typeof GuestSchema>;
export type CreateGuestPayload = z.infer<typeof CreateGuestPayloadSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface APIErrorResponse {
  success: false;
  error: string;
  details?: any;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type EntityType = 'gifts' | 'tasks' | 'cards' | 'guests';

export interface HolidayId {
  holidayId: string;
}

export interface WithAuth0User {
  auth0User: User;
}

export type QueryWithAuth<T = {}> = T & HolidayId & WithAuth0User;
export type MutationWithAuth<T = {}> = T & HolidayId & WithAuth0User;
