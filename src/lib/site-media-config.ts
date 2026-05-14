import hero from "@/assets/hero.jpg";
import type { Tables } from "@/integrations/supabase/types";
import { GALLERY_IMAGE_BUCKET } from "@/lib/gallery-config";

export const SITE_MEDIA_BUCKET = GALLERY_IMAGE_BUCKET;
export const HERO_MEDIA_KEY = "hero";

type GalleryImageRow = Pick<Tables<"gallery_images">, "alt_text" | "created_at" | "id" | "image_path">;

export type SiteMediaAsset = {
  alt: string;
  imagePath: string | null;
  isDefault: boolean;
  mediaKey: typeof HERO_MEDIA_KEY;
  recordId: string | null;
  src: string;
};

const DEFAULT_HERO_ALT = "Elite Stay PG rooms and exterior";

export function getDefaultHeroMedia(): SiteMediaAsset {
  return {
    alt: DEFAULT_HERO_ALT,
    imagePath: null,
    isDefault: true,
    mediaKey: HERO_MEDIA_KEY,
    recordId: null,
    src: hero,
  };
}

export function isHeroMediaPath(path: string | null | undefined) {
  return (path ?? "").startsWith("hero/");
}

export function isHomepageGalleryPath(path: string | null | undefined) {
  return (path ?? "").startsWith("gallery/");
}

export function pickHeroMediaRow(rows: GalleryImageRow[] | null | undefined) {
  return [...(rows ?? [])]
    .filter((row) => isHeroMediaPath(row.image_path))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function filterHomepageGalleryRows(rows: GalleryImageRow[] | null | undefined) {
  return (rows ?? []).filter((row) => isHomepageGalleryPath(row.image_path));
}

export function buildHeroMedia(
  row: GalleryImageRow | null | undefined,
  resolveImage: (path: string) => string,
): SiteMediaAsset {
  if (!row?.image_path || !isHeroMediaPath(row.image_path)) {
    return getDefaultHeroMedia();
  }

  return {
    alt: row.alt_text?.trim() || DEFAULT_HERO_ALT,
    imagePath: row.image_path,
    isDefault: false,
    mediaKey: HERO_MEDIA_KEY,
    recordId: row.id,
    src: resolveImage(row.image_path),
  };
}
