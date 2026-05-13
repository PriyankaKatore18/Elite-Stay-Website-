import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import type { Tables } from "@/integrations/supabase/types";

export const GALLERY_IMAGE_BUCKET = "gallery-images";

type GalleryImageRow = Pick<Tables<"gallery_images">, "alt_text" | "created_at" | "id" | "image_path">;

export type GalleryAsset = {
  id: string;
  src: string;
  alt: string;
  imagePath: string | null;
  isDefault: boolean;
};

const DEFAULT_GALLERY_IMAGES = [
  { id: "default-1", src: g1, alt: "Elite Stay room interior" },
  { id: "default-2", src: g2, alt: "Elite Stay dining and common area" },
  { id: "default-3", src: g3, alt: "Elite Stay study-friendly corner" },
  { id: "default-4", src: g4, alt: "Elite Stay washroom and utility area" },
] satisfies Array<Pick<GalleryAsset, "alt" | "id" | "src">>;

export function getDefaultGalleryImages(): GalleryAsset[] {
  return DEFAULT_GALLERY_IMAGES.map((image) => ({
    ...image,
    imagePath: null,
    isDefault: true,
  }));
}

export function buildGalleryImages(
  rows: GalleryImageRow[] | null | undefined,
  resolveImage: (path: string) => string,
): GalleryAsset[] {
  return (rows ?? [])
    .filter((row) => !!row.image_path)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((row) => ({
      id: row.id,
      src: resolveImage(row.image_path),
      alt: row.alt_text?.trim() || "Elite Stay gallery image",
      imagePath: row.image_path,
      isDefault: false,
    }));
}
