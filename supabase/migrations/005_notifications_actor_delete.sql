-- Allow the actor who created a notification to delete it (e.g. remove follow alert when unfollowing).
CREATE POLICY notif_delete_actor ON public.notifications FOR DELETE TO authenticated
  USING (actor_id = auth.uid());
