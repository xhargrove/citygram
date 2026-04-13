-- Tighten city-first invariant at DB policy level:
-- authenticated users may insert posts only as themselves and only in their home city.

DROP POLICY IF EXISTS posts_insert ON public.posts;

CREATE POLICY posts_insert ON public.posts
FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.onboarding_completed = true
      AND p.home_city_id = city_id
  )
);
