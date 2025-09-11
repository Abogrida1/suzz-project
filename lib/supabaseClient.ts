import { createClient } from '@supabase/supabase-js'
import type { 
  User, 
  Restaurant, 
  MenuItem, 
  Order, 
  Courier, 
  Coupon,
  UserRole,
  OrderStatus,
  CourierStatus
} from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Re-export types for convenience
export type {
  User,
  Restaurant,
  MenuItem,
  Order,
  Courier,
  Coupon,
  UserRole,
  OrderStatus,
  CourierStatus
}