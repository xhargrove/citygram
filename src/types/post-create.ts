/** Payload for finalizing a post after client-direct Storage uploads. */
export type FinalizeMediaItem = {
  storage_path: string;
  media_type: "image" | "video";
  byte_size: number;
  sort_order: number;
};

export type FinalizeCreatePostInput = {
  caption: string;
  city_id: string;
  neighborhood_id: string | null;
  /** Must match the draft segment used in storage paths. */
  draft_id: string;
  media: FinalizeMediaItem[];
};
