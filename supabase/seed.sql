-- Seed reference data (run after migrations)
-- Cities
INSERT INTO public.cities (id, slug, name, region, country, tagline)
VALUES
  ('a0000001-0000-4000-8000-000000000001', 'atlanta', 'Atlanta', 'Georgia', 'US', 'The capital of Southern culture in motion.'),
  ('a0000002-0000-4000-8000-000000000002', 'austin', 'Austin', 'Texas', 'US', 'Live music, open skies, creative heat.'),
  ('a0000003-0000-4000-8000-000000000003', 'portland', 'Portland', 'Oregon', 'US', 'Rain-soaked streets, bold ideas, local craft.')
ON CONFLICT (slug) DO NOTHING;

-- Neighborhoods
INSERT INTO public.neighborhoods (city_id, slug, name)
VALUES
  ('a0000001-0000-4000-8000-000000000001', 'midtown', 'Midtown'),
  ('a0000001-0000-4000-8000-000000000001', 'west-end', 'West End'),
  ('a0000001-0000-4000-8000-000000000001', 'buckhead', 'Buckhead'),
  ('a0000002-0000-4000-8000-000000000002', 'east-austin', 'East Austin'),
  ('a0000002-0000-4000-8000-000000000002', 'south-congress', 'South Congress'),
  ('a0000003-0000-4000-8000-000000000003', 'pearl', 'Pearl District'),
  ('a0000003-0000-4000-8000-000000000003', 'alberta', 'Alberta Arts')
ON CONFLICT (city_id, slug) DO NOTHING;

-- Interests
INSERT INTO public.interests (key, label)
VALUES
  ('music', 'Music'),
  ('food', 'Food'),
  ('nightlife', 'Nightlife'),
  ('fashion', 'Fashion'),
  ('business', 'Business'),
  ('sports', 'Sports'),
  ('art', 'Art'),
  ('tech', 'Tech')
ON CONFLICT (key) DO NOTHING;
