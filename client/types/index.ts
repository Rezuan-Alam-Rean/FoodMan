// shared type definitions matching backend data contracts

export type UserRole = 'ADMIN' | 'RESTAURANT_OWNER' | 'RIDER' | 'CUSTOMER';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'LOOKING_FOR_RIDER'
  | 'RIDER_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY';
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
export type RemittanceStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
export type PayoutChannel = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER';

export interface User {
  id: string;
  _id?: string;
  name: string;
  phone_number: string;
  email?: string;
  role: UserRole;
  status?: string;
  has_password?: boolean;
  createdAt?: string;
}

export interface Zone {
  id: string;
  _id: string;
  name: string;
  city: string;
  fixed_delivery_fee: number;
  is_active: boolean;
  subzones?: Subzone[];
}

export interface Subzone {
  id: string;
  _id: string;
  zone_id: string;
  name: string;
  custom_fixed_fee: number | null;
  is_active: boolean;
}

export interface UserAddress {
  id: string;
  _id: string;
  user_id: string;
  zone_id: Zone | string;
  subzone_id: Subzone | string;
  address_label: string;
  detailed_address: string;
  contact_person_name: string;
  contact_phone: string;
  is_default: boolean;
}

export interface VariantOption {
  name: string;
  price_delta: number;
}

export interface VariantGroup {
  title: string;
  options: VariantOption[];
}

export interface AddOn {
  name: string;
  price: number;
}

export interface FoodItem {
  id: string;
  _id: string;
  restaurant_id: string | Restaurant;
  category_id: string | MenuCategory;
  name: string;
  description: string;
  image_url?: string | null;
  base_price: number;
  variants: VariantGroup[];
  add_ons: AddOn[];
  is_vegetarian: boolean;
  is_available: boolean;
}

export interface MenuCategory {
  id: string;
  _id: string;
  restaurant_id?: string;
  name: string;
  emoji?: string;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  items?: FoodItem[];
}

export interface Restaurant {
  id: string;
  _id: string;
  owner_id: string;
  zone_id: Zone | string;
  name: string;
  slug: string;
  description: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
  address: string;
  phone_number?: string | null;
  commission_rate: number;
  is_open: boolean;
  rating_avg: number;
  total_ratings: number;
}

export interface CartItemOption {
  group_title: string;
  option_name: string;
  price_delta: number;
}

export interface CartItemAddOn {
  name: string;
  price: number;
}

export interface CartItem {
  food_item_id: string;
  name: string;
  base_price: number;
  unit_price: number;
  quantity: number;
  selected_variant?: CartItemOption | null;
  selected_add_ons?: CartItemAddOn[];
  total_price: number;
  notes?: string;
}

export interface OrderItem {
  food_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  selected_variant?: CartItemOption | null;
  selected_add_ons?: CartItemAddOn[];
  total_price: number;
}

export interface Order {
  id: string;
  _id: string;
  order_number: string;
  customer_id: string | User;
  restaurant_id: Restaurant;
  rider_id?: Rider | null;
  delivery_zone_id: Zone;
  delivery_subzone_id: Subzone | string;
  user_address_id?: string | null;
  items: OrderItem[];
  food_subtotal: number;
  delivery_fee: number;
  service_fee: number;
  grand_total: number;
  customer_name: string;
  customer_phone: string;
  delivery_address_text: string;
  special_notes?: string;
  payment_method?: PaymentMethod;
  status: OrderStatus;
  cancellation_locked: boolean;
  cancellation_reason?: string;
  rider_accepted_at?: string;
  restaurant_accepted_at?: string;
  food_ready_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  _id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  sender_number?: string | null;
  transaction_id?: string | null;
  verified_at?: string | null;
}

export interface Rider {
  id: string;
  _id: string;
  user_id: User;
  vehicle_type: string;
  driving_license_no?: string | null;
  nid_number?: string | null;
  is_online: boolean;
  cash_in_hand_limit: number;
  rating_avg: number;
  total_ratings: number;
  assigned_zones: Zone[];
}

export interface Wallet {
  id: string;
  _id: string;
  user_id: string | User;
  current_balance: number;
  lifetime_earnings: number;
  total_settled_by_admin: number;
}

export interface LedgerTransaction {
  id: string;
  _id: string;
  wallet_id: string;
  order_id?: Order | null;
  payout_id?: string | null;
  remittance_id?: string | null;
  type: string;
  amount: number;
  balance_after: number;
  notes: string;
  createdAt: string;
}

export interface RiderRemittance {
  id: string;
  _id: string;
  rider_id: Rider;
  amount: number;
  payment_method: string;
  sender_account_no: string;
  transaction_reference: string;
  status: RemittanceStatus;
  admin_notes?: string;
  verified_at?: string;
  createdAt: string;
}

export interface PayoutSettlement {
  id: string;
  _id: string;
  wallet_id: string;
  recipient_user_id: User;
  amount: number;
  payout_channel: PayoutChannel;
  reference_txn_id: string;
  disbursed_by_admin_id: User;
  notes?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  _id: string;
  order_id: string;
  customer_id: User;
  restaurant_id: string;
  rider_id?: string | null;
  food_rating?: number | null;
  food_review?: string;
  rider_rating?: number | null;
  rider_review?: string;
  createdAt: string;
}

export interface AdminDeskCounts {
  pending_mfs_verifications: number;
  pending_cod_remittances: number;
  active_orders_in_progress: number;
}

export interface ApiResponseWrapper<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}
