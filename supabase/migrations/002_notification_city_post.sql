-- New notification type: someone in your home city published a post (see finalizeCreatePost).
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'city_post';
