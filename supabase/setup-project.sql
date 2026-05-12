-- Elite Stay Supabase project bootstrap
-- Run this once in Supabase SQL Editor for a fresh project.
-- It is written to be safe to rerun if setup was only partially applied.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  room_type text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit enquiries" ON public.enquiries;
CREATE POLICY "Anyone can submit enquiries"
  ON public.enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(phone) BETWEEN 4 AND 30
    AND (email IS NULL OR length(email) <= 320)
    AND (message IS NULL OR length(message) <= 2000)
  );

DROP POLICY IF EXISTS "Admins can view enquiries" ON public.enquiries;
CREATE POLICY "Admins can view enquiries"
  ON public.enquiries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
CREATE POLICY "Admins can update enquiries"
  ON public.enquiries FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete enquiries" ON public.enquiries;
CREATE POLICY "Admins can delete enquiries"
  ON public.enquiries FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.room_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug IN ('one-room', 'two-room', 'three-room')),
  name text NOT NULL,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_room_categories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS room_categories_set_updated_at ON public.room_categories;
CREATE TRIGGER room_categories_set_updated_at
BEFORE UPDATE ON public.room_categories
FOR EACH ROW
EXECUTE PROCEDURE public.touch_room_categories_updated_at();

DROP POLICY IF EXISTS "Public can view room categories" ON public.room_categories;
CREATE POLICY "Public can view room categories"
  ON public.room_categories FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert room categories" ON public.room_categories;
CREATE POLICY "Admins can insert room categories"
  ON public.room_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update room categories" ON public.room_categories;
CREATE POLICY "Admins can update room categories"
  ON public.room_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.room_categories (slug, name)
VALUES
  ('one-room', 'One Room'),
  ('two-room', 'Two Room'),
  ('three-room', 'Three Room')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

DROP POLICY IF EXISTS "Public can view room images" ON storage.objects;
CREATE POLICY "Public can view room images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Admins can upload room images" ON storage.objects;
CREATE POLICY "Admins can upload room images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'room-images'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins can update room images" ON storage.objects;
CREATE POLICY "Admins can update room images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'room-images'
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'room-images'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete room images" ON storage.objects;
CREATE POLICY "Admins can delete room images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'room-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL UNIQUE,
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view gallery image records" ON public.gallery_images;
CREATE POLICY "Public can view gallery image records"
  ON public.gallery_images FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert gallery image records" ON public.gallery_images;
CREATE POLICY "Admins can insert gallery image records"
  ON public.gallery_images FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update gallery image records" ON public.gallery_images;
CREATE POLICY "Admins can update gallery image records"
  ON public.gallery_images FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete gallery image records" ON public.gallery_images;
CREATE POLICY "Admins can delete gallery image records"
  ON public.gallery_images FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

DROP POLICY IF EXISTS "Public can view gallery storage images" ON storage.objects;
CREATE POLICY "Public can view gallery storage images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'gallery-images');

DROP POLICY IF EXISTS "Admins can upload gallery storage images" ON storage.objects;
CREATE POLICY "Admins can upload gallery storage images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gallery-images'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins can update gallery storage images" ON storage.objects;
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

DROP POLICY IF EXISTS "Admins can delete gallery storage images" ON storage.objects;
CREATE POLICY "Admins can delete gallery storage images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gallery-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.assign_bootstrap_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_bootstrap_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_bootstrap_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.assign_bootstrap_admin_role();

WITH first_user AS (
  SELECT id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM first_user
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_roles
  WHERE role = 'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;
