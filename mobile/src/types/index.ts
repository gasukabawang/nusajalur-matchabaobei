export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Curator {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  badge?: string;
}

export interface Waypoint {
  id: string;
  sequence: number;
  name: string;
  category: string;
  description: string;
  lat: float;
  lon: float;
  radius_m: number;
  umkm_name: string;
  promo_teaser: string;
}

export type float = number;

export interface Trail {
  id: string;
  title: string;
  slug: string;
  theme: string;
  description: string;
  city: string;
  distance_km: number;
  est_duration_min: number;
  est_steps: number;
  est_kcal: number;
  price_idr: number;
  difficulty: string;
  distance_from_user_km?: number | null;
  curator: Curator;
  waypoints?: Waypoint[];
}

export interface PricingCalculation {
  trail_id: string;
  trail_title: string;
  num_waypoints: number;
  base_trail_price_idr: number;
  waypoint_subtotal_idr: number;
  subtotal_idr: number;
  visit_time_evaluated: string;
  is_off_peak: boolean;
  discount_percentage: number;
  discount_amount_idr: number;
  final_price_idr: number;
  pricing_rule: string;
}

export interface WaypointProgress {
  waypoint_id: string;
  waypoint_name: string;
  sequence: number;
  category: string;
  is_checked_in: boolean;
  checked_in_at?: string | null;
  story_text?: string | null;
  umkm_name?: string | null;
  voucher_code?: string | null;
}

export interface PassDetail {
  id: string;
  trail_id: string;
  trail_title: string;
  purchase_date: string;
  visit_date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  total_price_idr: number;
  allocation: {
    total_price_idr: number;
    umkm_allocation_idr: number;
    curator_allocation_idr: number;
    platform_fee_idr: number;
  };
  total_waypoints: number;
  checked_in_count: number;
  completion_percentage: number;
  est_steps: number;
  est_kcal: number;
  waypoints_progress: WaypointProgress[];
}

export interface UserTripHistory {
  user_id: string;
  user_name: string;
  total_passes_purchased: number;
  total_completed_trips: number;
  total_steps_achieved: number;
  total_kcal_burned: number;
  passes: PassDetail[];
}

export interface CheckinResult {
  checkin_id: string;
  pass_id: string;
  waypoint_id: string;
  waypoint_name: string;
  checked_in_at: string;
  user_lat: number;
  user_lon: number;
  waypoint_lat: number;
  waypoint_lon: number;
  distance_m: number;
  radius_m: number;
  is_valid: boolean;
  message: string;
  story_text: string;
  umkm_name: string;
  voucher_code: string;
  voucher_desc: string;
}
