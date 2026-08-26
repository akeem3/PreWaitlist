-- Story 7.6: Warmth tracking foundation

-- WARMTH SCORE ON SUBSCRIBERS
ALTER TABLE public.subscribers
ADD COLUMN warmth_score text
CHECK (warmth_score IN ('hot', 'warm', 'cold'));

COMMENT ON COLUMN public.subscribers.warmth_score
IS 'Warmth classification: hot (engaged), warm (moderate), cold (disengaged). Null = unscored.';

-- PAGE VIEWS
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid REFERENCES public.subscribers(id) ON DELETE SET NULL,
  waitlist_id uuid NOT NULL REFERENCES public.waitlists(id) ON DELETE CASCADE,
  path text NOT NULL DEFAULT '/',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX page_views_waitlist_id_idx ON public.page_views(waitlist_id);
CREATE INDEX page_views_subscriber_id_idx ON public.page_views(subscriber_id);
CREATE INDEX page_views_created_at_idx ON public.page_views(created_at);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founders manage own waitlist's page views"
  ON public.page_views FOR ALL
  USING (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()))
  WITH CHECK (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()));

CREATE POLICY "public insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

-- EMAIL EVENTS
CREATE TABLE public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  waitlist_id uuid NOT NULL REFERENCES public.waitlists(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_events_waitlist_id_idx ON public.email_events(waitlist_id);
CREATE INDEX email_events_subscriber_id_idx ON public.email_events(subscriber_id);
CREATE INDEX email_events_event_type_idx ON public.email_events(event_type);
CREATE INDEX email_events_created_at_idx ON public.email_events(created_at);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founders manage own waitlist's email events"
  ON public.email_events FOR ALL
  USING (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()))
  WITH CHECK (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()));
-- NO public insert — server-side only (Resend webhooks)
