-- Sign-up funnel events.
--
-- Most Android installs never create an account, and nothing showed where
-- they stop. The app logs a few anonymous steps (app open, onboarding pages,
-- sign-up / sign-in attempts and their errors, email confirmation) tagged
-- with a random per-install device_id and the platform. user_id is filled in
-- once the person is signed in, which links a device's earlier anonymous
-- events to their account.
--
-- Clients may only INSERT (including signed-out users, via the anon role).
-- There is no SELECT policy, so the data is read only from the dashboard /
-- service role. Check constraints keep a misbehaving or abusive client from
-- writing large rows.
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  device_id   uuid        NOT NULL,
  user_id     uuid        REFERENCES auth.users (id) ON DELETE SET NULL,
  platform    text        NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  app_version text        CHECK (char_length(app_version) <= 32),
  build       text        CHECK (char_length(build) <= 16),
  event       text        NOT NULL CHECK (char_length(event) BETWEEN 1 AND 64),
  props       jsonb       NOT NULL DEFAULT '{}'::jsonb
                          CHECK (pg_column_size(props) <= 2048)
);

CREATE INDEX IF NOT EXISTS funnel_events_created_at_idx ON public.funnel_events (created_at);
CREATE INDEX IF NOT EXISTS funnel_events_device_idx ON public.funnel_events (device_id);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.funnel_events FROM anon, authenticated;
GRANT INSERT ON public.funnel_events TO anon, authenticated;

DROP POLICY IF EXISTS "funnel_events_insert" ON public.funnel_events;
CREATE POLICY "funnel_events_insert" ON public.funnel_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
