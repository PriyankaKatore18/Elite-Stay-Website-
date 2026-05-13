CREATE TABLE public.room_categories (
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

CREATE POLICY "Public can view room categories"
  ON public.room_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert room categories"
  ON public.room_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

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

CREATE POLICY "Public can view room images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'room-images');

CREATE POLICY "Admins can upload room images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'room-images'
    AND public.has_role(auth.uid(), 'admin')
  );

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

CREATE POLICY "Admins can delete room images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'room-images'
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
