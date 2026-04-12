export type AccountType = "standard" | "creator" | "business";
export type AppRole = "user" | "moderator" | "admin";
export type NotificationType = "follow" | "like" | "comment" | "mention";
export type ReportStatus = "open" | "reviewed" | "dismissed";

export type CityRow = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  country: string;
  tagline: string | null;
  hero_image_url: string | null;
  created_at: string;
};

export type NeighborhoodRow = {
  id: string;
  city_id: string;
  slug: string;
  name: string;
};

export type InterestRow = {
  id: string;
  key: string;
  label: string;
};

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  home_city_id: string | null;
  neighborhood_id: string | null;
  account_type: AccountType;
  role: AppRole;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type PostRow = {
  id: string;
  author_id: string;
  city_id: string;
  neighborhood_id: string | null;
  caption: string | null;
  hashtags: string[];
  is_sponsored_placeholder: boolean;
  is_flagged: boolean;
  is_removed: boolean;
  like_count: number;
  comment_count: number;
  save_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
};

export type PostMediaRow = {
  id: string;
  post_id: string;
  storage_path: string;
  media_type: "image" | "video";
  sort_order: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
};

export type PostWithAuthor = PostRow & {
  author: Pick<ProfileRow, "id" | "username" | "display_name" | "avatar_url">;
  city: Pick<CityRow, "id" | "slug" | "name">;
  media: PostMediaRow[];
  liked_by_me?: boolean;
  saved_by_me?: boolean;
};

export type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  post_id: string | null;
  read: boolean;
  created_at: string;
};
