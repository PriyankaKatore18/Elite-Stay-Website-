CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL UNIQUE,
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view gallery image records"
  ON public.gallery_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert gallery image records"
  ON public.gallery_images FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update gallery image records"
  ON public.gallery_images FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gallery image records"
  ON public.gallery_images FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

CREATE POLICY "Public can view gallery storage images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'gallery-images');

CREATE POLICY "Admins can upload gallery storage images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gallery-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update gallery storage images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gallery-images'
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'gallery-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete gallery storage images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gallery-images'
    AND public.has_role(auth.uid(), 'admin')
  );
