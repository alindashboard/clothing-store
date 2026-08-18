export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
  show_on_landing: boolean
  /** Editorial override for the landing card; falls back to product photos. */
  image_url: string | null
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  color_name: string | null
  is_primary: boolean
  sort_order: number
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string
  color_name: string
  color_hex: string
  sku: string | null
  price_override: number | null
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  base_price: number
  compare_at_price: number | null
  currency: string
  category_id: string | null
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  sku_prefix: string | null
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  category?: Category
  variants?: ProductVariant[]
  images?: ProductImage[]
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed'
export type PaymentMethod = 'stripe' | 'whatsapp' | 'bank_transfer' | 'pending'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string
  product_name: string
  variant_size: string
  variant_color: string
  sku: string | null
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  customer_email: string
  customer_name: string
  customer_phone: string | null
  shipping_address_line1: string
  shipping_address_line2: string | null
  shipping_city: string
  shipping_state: string | null
  shipping_postal_code: string
  shipping_country: string
  billing_same_as_shipping: boolean
  billing_address_line1: string | null
  billing_address_line2: string | null
  billing_city: string | null
  billing_state: string | null
  billing_postal_code: string | null
  billing_country: string | null
  subtotal: number
  shipping_cost: number
  tax_amount: number
  discount_amount: number
  total: number
  currency: string
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  payment_intent_id: string | null
  tracking_number: string | null
  tracking_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface ContactRequest {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string
  is_read: boolean
  created_at: string
}

export type EventStatus = 'draft' | 'published'

export interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  event_date: string
  location: string | null
  is_online: boolean
  image_url: string | null
  cta_label: string | null
  cta_url: string | null
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface CheckoutFormData {
  email: string
  phone: string
  name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  billing_same_as_shipping: boolean
  billing_address_line1: string
  billing_address_line2: string
  billing_city: string
  billing_state: string
  billing_postal_code: string
  billing_country: string
  payment_method: 'whatsapp' | 'bank_transfer'
}
