import roomSingle from "@/assets/room-single.jpg";
import roomDouble from "@/assets/room-double.jpg";
import roomTriple from "@/assets/room-triple.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import type { Tables } from "@/integrations/supabase/types";

export const ROOM_IMAGE_BUCKET = "room-images";
export const MAX_ROOM_IMAGES = 4;
export const DEFAULT_ADMIN_EMAIL = "admin@elitestay.com";
export const DEFAULT_ADMIN_PASSWORD = "EliteStay@123";

export type RoomCategorySlug = "one-room" | "two-room" | "three-room";

type RoomCategoryImageRow = Pick<Tables<"room_categories">, "slug" | "image_path" | "image_paths">;

type RoomCardBase = {
  slug: RoomCategorySlug;
  name: string;
  description: string;
  price: string;
  tag: string;
  features: string[];
  status: string;
  defaultImages: [string, string, string];
};

export type RoomCard = Omit<RoomCardBase, "defaultImages"> & {
  img: string;
  images: string[];
  imagePath: string | null;
  imagePaths: string[];
  customImages: string[];
};

const ROOM_CARD_BASE: RoomCardBase[] = [
  {
    slug: "one-room",
    name: "Single Sharing",
    description: "Private, peaceful, and fully maintained rooms for a comfortable stay near MIT Pune.",
    price: "Rs 12,000",
    tag: "AC",
    features: ["2 beds", "Study table", "Wardrobe", "Balcony"],
    status: "Available",
    defaultImages: [roomSingle, gallery1, gallery2],
  },
  {
    slug: "two-room",
    name: "Twin Sharing",
    description: "Comfortable and spacious twin sharing rooms with modern amenities for a convenient stay.",
    price: "Rs 8,500",
    tag: "AC",
    features: ["2 beds", "2 study tables", "2 wardrobes", "Balcony"],
    status: "Few Left",
    defaultImages: [roomDouble, gallery2, gallery3],
  },
  {
    slug: "three-room",
    name: "Triple Sharing",
    description: "Affordable and well-maintained rooms designed for comfortable student living.",
    price: "Rs 6,500",
    tag: "Non-AC",
    features: ["3 beds", "3 study tables", "3 wardrobes", "Balcony"],
    status: "Available",
    defaultImages: [roomTriple, gallery3, gallery4],
  },
];

export function getDefaultRoomCards(): RoomCard[] {
  return ROOM_CARD_BASE.map(({ defaultImages, ...room }) => ({
    ...room,
    img: defaultImages[0],
    images: [...defaultImages],
    imagePath: null,
    imagePaths: [],
    customImages: [],
  }));
}

export function buildRoomCards(
  rows: RoomCategoryImageRow[] | null | undefined,
  resolveImage: (path: string) => string,
): RoomCard[] {
  const imageMap = new Map(rows?.map((row) => [row.slug, normalizeRoomImagePaths(row)]) ?? []);

  return getDefaultRoomCards().map((room) => {
    const imagePaths = imageMap.get(room.slug) ?? [];
    const customImages = imagePaths.map(resolveImage);
    const images = customImages.length > 0 ? customImages : room.images;

    return {
      ...room,
      img: images[0] ?? room.img,
      images,
      imagePath: imagePaths[0] ?? null,
      imagePaths,
      customImages,
    };
  });
}

export const ROOM_OPTION_LABELS = ROOM_CARD_BASE.map((room) => room.name);

function normalizeRoomImagePaths(row: RoomCategoryImageRow): string[] {
  const fromLegacy = row.image_path ? [row.image_path] : [];
  const fromArray = (row.image_paths ?? []).filter((path): path is string => !!path && path.trim().length > 0);
  const deduped = [...new Set([...fromLegacy, ...fromArray])];

  return deduped.slice(0, MAX_ROOM_IMAGES);
}
