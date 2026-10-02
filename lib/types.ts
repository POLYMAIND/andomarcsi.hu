export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  tool: string;
  level: string;
  price_huf: number;
  included_in_subscription: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  duration_min: number | null;
  sort_order: number;
  is_preview: boolean;
  published_at: string;
};

export type Subscription = {
  user_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export const isSubscriptionActive = (s: Subscription | null | undefined) =>
  !!s && ['active', 'trialing'].includes(s.status) && (!s.current_period_end || new Date(s.current_period_end) > new Date());
