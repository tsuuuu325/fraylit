-- ============================================================================
-- Fraylit — Remove all test posts before production launch
-- Run in Supabase Dashboard → SQL Editor → New query → Run
--
-- Deletes: posts, likes, comments, notifications (via CASCADE)
-- Keeps:   profiles, auth users (your accounts stay)
-- ============================================================================

DELETE FROM public.posts;

-- Optional: verify everything is clean
-- SELECT count(*) FROM public.posts;
-- SELECT count(*) FROM public.likes;
-- SELECT count(*) FROM public.comments;
-- SELECT count(*) FROM public.notifications;
