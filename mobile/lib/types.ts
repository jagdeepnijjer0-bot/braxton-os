export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  order_index: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export interface ReservationInput {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface RestaurantMembership {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  plan: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoffeeClaim {
  id: string;
  user_id: string;
  claimed_at: string;
  month_year: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type MenuCategory =
  | 'all'
  | 'breakfast'
  | 'classics'
  | 'drinks'
  | 'desserts'
  | string; // fallback for any future categories added in Supabase without a code change
