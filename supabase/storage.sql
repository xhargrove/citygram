-- Run in Supabase SQL after creating the bucket in Dashboard: Storage → New bucket → name: post-media → Public bucket ON (for public read URLs)
-- Or private bucket + signed URLs (recommended for production). Below assumes public read for MVP.

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Post media public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

CREATE POLICY "Users upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
