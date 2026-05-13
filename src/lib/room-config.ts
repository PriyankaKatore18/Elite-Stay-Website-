import roomSingle from "@/assets/room-single.jpg";
import roomDouble from "@/assets/room-double.jpg";
import roomTriple from "@/assets/room-triple.jpg";
import type { Tables } from "@/integrations/supabase/types";

export const ROOM_IMAGE_BUCKET = "room-images";
export const DEFAULT_ADMIN_EMAIL = "admin@elitestay.com";
export const DEFAULT_ADMIN_PASSWORD = "EliteStay@123";

export type RoomCategorySlug = "one-room" | "two-room" | "three-room";

type RoomCategoryImageRow = Pick<Tables<"room_categories">, "slug" | "image_path">;

type RoomCardBase = {
  slug: RoomCategorySlug;
  name: string;
  price: string;
  tag: string;
  features: string[];
  status: string;
  defaultImage: string;
};

export type RoomCard = Omit<RoomCardBase, "defaultImage"> & {
  img: string;
  imagePath: string | null;
};

const ROOM_CARD_BASE: RoomCardBase[] = [
  {
    slug: "one-room",
    name: "Single",
    price: "Rs 12,000",
    tag: "AC",
    features: ["2 beds", "Study table", "Wardrobe", "Balcony"],
    status: "Available",
    defaultImage: roomSingle,
  },
  {
    slug: "two-room",
    name: "Twin",
    price: "Rs 8,500",
    tag: "AC",
    features: ["2 beds", "2 study tables", "2 wardrobes", "Balcony"],
    status: "Few Left",
    defaultImage: roomDouble,
  },
  {
    slug: "three-room",
    name: "Triple",
    price: "Rs 6,500",
    tag: "Non-AC",
    features: ["3 beds", "3 study tables", "3 wardrobes", "Balcony"],
    status: "Available",
    defaultImage: roomTriple,
  },
];

export function getDefaultRoomCards(): RoomCard[] {
  return ROOM_CARD_BASE.map(({ defaultImage, ...room }) => ({
    ...room,
    img: defaultImage,
    imagePath: null,
  }));
}

export function buildRoomCards(
  rows: RoomCategoryImageRow[] | null | undefined,
  resolveImage: (path: string) => string,
): RoomCard[] {
  const imageMap = new Map(rows?.map((row) => [row.slug, row.image_path ?? null]) ?? []);

  return getDefaultRoomCards().map((room) => {
    const imagePath = imageMap.get(room.slug) ?? null;

    return {
      ...room,
      img: imagePath ? resolveImage(imagePath) : room.img,
      imagePath,
    };
  });
}

export const ROOM_OPTION_LABELS = ROOM_CARD_BASE.map((room) => room.name);
