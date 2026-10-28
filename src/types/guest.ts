export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  numberOfGuests: number;
  dietaryRestrictions?: string;
  bringingDish?: string;
  notes?: string;
  isCompleted: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}
