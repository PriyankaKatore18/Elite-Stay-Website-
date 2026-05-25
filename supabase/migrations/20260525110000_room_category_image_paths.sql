ALTER TABLE public.room_categories
ADD COLUMN IF NOT EXISTS image_paths text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.room_categories
SET image_paths = ARRAY[image_path]
WHERE image_path IS NOT NULL
  AND cardinality(image_paths) = 0;

UPDATE public.room_categories
SET image_paths = ARRAY(
  SELECT path
  FROM unnest(image_paths) WITH ORDINALITY AS item(path, position)
  WHERE path IS NOT NULL
    AND btrim(path) <> ''
  ORDER BY position
  LIMIT 4
);

UPDATE public.room_categories
SET image_path = image_paths[1]
WHERE image_path IS DISTINCT FROM image_paths[1];

ALTER TABLE public.room_categories
DROP CONSTRAINT IF EXISTS room_categories_image_paths_max_4;

ALTER TABLE public.room_categories
ADD CONSTRAINT room_categories_image_paths_max_4
CHECK (cardinality(image_paths) <= 4);
