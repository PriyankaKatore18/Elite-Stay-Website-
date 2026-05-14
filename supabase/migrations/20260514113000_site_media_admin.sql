CREATE TABLE IF NOT EXISTS public.site_media (
  media_key text PRIMARY KEY CHECK (char_length(trim(media_key)) > 0),
  image_path text,
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_site_media_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_media_set_updated_at ON public.site_media;
CREATE TRIGGER site_media_set_updated_at
BEFORE UPDATE ON public.site_media
FOR EACH ROW
EXECUTE PROCEDURE public.touch_site_media_updated_at();

CREATE POLICY "Public can view site media"
  ON public.site_media FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert site media"
  ON public.site_media FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site media"
  ON public.site_media FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site media"
  ON public.site_media FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_media (media_key, alt_text)
VALUES ('hero', 'Elite Stay PG rooms and exterior')
ON CONFLICT (media_key) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

CREATE POLICY "Public can view site media storage"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'site-media');

CREATE POLICY "Admins can upload site media storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update site media storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'site-media'
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'site-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete site media storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-media'
    AND public.has_role(auth.uid(), 'admin')
  );
