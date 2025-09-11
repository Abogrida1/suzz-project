// Common types for the admin dashboard

export type UserRole = 'customer' | 'restaurant_owner' | 'admin' | { name: string; display_name_ar: string }
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type CourierStatus = 'available' | 'busy' | 'offline'

export interface User {
  id: string
  name: string
  phone: string
  email?: string
  role: UserRole
  created_at: string
}

export interface Restaurant {
  id: string
  name: string
  owner_id: string
  address: string
  open_hours: string
  delivery_zones: string[]
  rating: number
  is_cloud_kitchen: boolean
  images: string[]
  active: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  name: string
  description: string
  price: number
  category: string
  calories?: number
  is_healthy: boolean
  image_url?: string
  active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  restaurant_id: string
  items: any[]
  total_price: number
  status: OrderStatus
  coupon_id?: string
  created_at: string
  estimated_ready_time?: string
  courier_id?: string
  courier_phone?: string
}

export interface Courier {
  id: string
  name: string
  phone: string
  status: CourierStatus
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_percent: number
  max_uses: number
  uses_count: number
  valid_from: string
  valid_to: string
  daily_limit?: number
  created_at: string
}

// Extended types for components
export interface OrderWithDetails extends Order {
  users: { name: string } | null
  restaurants: { name: string } | null
  couriers?: { name: string; phone: string } | null
}

export interface MenuItemWithRestaurant extends MenuItem {
  restaurants: { name: string } | null
}
