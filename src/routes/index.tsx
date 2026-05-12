import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  BedDouble,
  BookOpen,
  Check,
  ChevronDown,
  Droplets,
  Dumbbell,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  WashingMachine,
  Wifi,
  Zap,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import hero from "@/assets/hero.jpg";
import siteLogo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import {
  GALLERY_IMAGE_BUCKET,
  buildGalleryImages,
  getDefaultGalleryImages,
  type GalleryAsset,
} from "@/lib/gallery-config";
import {
  buildRoomCards,
  getDefaultRoomCards,
  ROOM_IMAGE_BUCKET,
  type RoomCard,
} from "@/lib/room-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elite Stay PG - Comfortable and Secure Stay Near MIT Pune" },
      {
        name: "description",
        content:
          "Safe, clean, fully furnished PG stay near MIT Pune with Wi-Fi, study space, CCTV security, daily cleaning, and flexible room options.",
      },
      { property: "og:title", content: "Elite Stay PG" },
      {
        property: "og:description",
        content:
          "Comfortable and secure PG stay for students and professionals with modern rooms and a peaceful environment.",
      },
    ],
  }),
  component: Landing,
});

const GOOGLE_PLACE_NAME = "ELITE STAY PG SERVICES";
const CONTACT_ADDRESS = "Chintamani Park, Vishay Company Road, Kadamwak Wasti, Maharashtra 412201";
const CONTACT_EMAIL = "elitestay.loni@gmail.com";
const CONTACT_PHONE_DISPLAY = "09553961076";
const CONTACT_PHONE_RAW = "919553961076";
const MAP_LAT = "18.4872489";
const MAP_LNG = "74.0166317";
const WHATSAPP = `https://wa.me/${CONTACT_PHONE_RAW}?text=${encodeURIComponent(
  "Hi Elite Stay, I'd like to enquire about a room.",
)}`;
const MAP_EMBED = `https://www.google.com/maps?q=${MAP_LAT},${MAP_LNG}&z=15&output=embed`;
const MAPS_PLACE_URL = "https://maps.app.goo.gl/hUWkxUSNoF2hkoTs5";
const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_LAT},${MAP_LNG}`;

const ABOUT_POINTS = [
  "Premium boys' accommodation near MIT Pune",
  "Safe, clean, and peaceful environment for focused living",
  "Flexible room choices for students and working professionals",
  "Daily maintenance and modern amenities for stress-free stays",
];

const FACILITY_ITEMS = [
  {
    icon: Wifi,
    label: "High-Speed Wi-Fi",
    detail: "Stable internet for classes, work, streaming, and everyday connectivity.",
    note: "Always connected",
  },
  {
    icon: ShieldCheck,
    label: "24x7 CCTV Security",
    detail: "Round-the-clock surveillance helps residents feel safe and protected.",
    note: "Safety first",
  },
  {
    icon: BedDouble,
    label: "Fully Furnished Rooms",
    detail: "Move into rooms that are already set up for comfortable daily living.",
    note: "Ready to move in",
  },
  {
    icon: BookOpen,
    label: "Study Space",
    detail: "Dedicated study-friendly areas support focused learning and remote work.",
    note: "Made for focus",
  },
  {
    icon: Sparkles,
    label: "Daily Cleaning",
    detail: "Regular housekeeping helps keep the property clean, fresh, and organized.",
    note: "Well maintained",
  },
  {
    icon: Droplets,
    label: "24x7 Water",
    detail: "Reliable water access is available throughout the day for a smoother routine.",
    note: "Daily comfort",
  },
  {
    icon: Zap,
    label: "Power Backup",
    detail: "Backup support keeps your routine moving during power interruptions.",
    note: "Uninterrupted stay",
  },
  {
    icon: WashingMachine,
    label: "Washing Machines",
    detail: "On-site washing machines make everyday laundry simple and convenient.",
    note: "Easy upkeep",
  },
  {
    icon: Dumbbell,
    label: "Basic Gym",
    detail: "A practical workout setup helps residents keep up with their fitness routine.",
    note: "Stay active",
  },
  {
    icon: Quote,
    label: "Wardrobe Storage",
    detail: "Personal wardrobe space keeps clothes and daily essentials neatly organized.",
    note: "Neat living",
  },
] as const;

const TRUST_HIGHLIGHTS = [
  {
    title: "Comfort",
    text: "Clean, fully furnished rooms designed for focused student and professional living.",
  },
  {
    title: "Safety",
    text: "CCTV monitoring, ID-proof admission, and clear rules support a secure stay.",
  },
  {
    title: "Convenience",
    text: "A peaceful location with easy access to colleges, transport, food outlets, and essentials.",
  },
  {
    title: "Fast response",
    text: "Website enquiries go straight into the admin dashboard so follow-up stays quick and organized.",
  },
];

const RULES = [
  {
    question: "ID Proof Mandatory",
    answer:
      "Government-issued ID proof and address proof must be submitted during admission for all residents.",
  },
  {
    question: "No Outsiders Allowed",
    answer:
      "Unauthorized guests or outsiders are not allowed inside rooms or for overnight stays without prior permission. Delivery services are not allowed upstairs.",
  },
  {
    question: "Security Deposit",
    answer:
      "A refundable Rs 10,000 security deposit must be paid during registration. It is returned after proper room handover and damage inspection.",
  },
  {
    question: "Refund Policy",
    answer:
      "PG or hostel fees must be paid in advance and are non-refundable if a resident leaves before the agreed stay period.",
  },
  {
    question: "Zero Tolerance for Ragging",
    answer:
      "Ragging or any form of harassment is strictly prohibited inside the premises, and strict disciplinary action will be taken against offenders.",
  },
  {
    question: "CCTV Monitoring",
    answer:
      "The property is under CCTV surveillance for the safety and security of all residents, and everyone is expected to maintain cleanliness and responsible behavior.",
  },
  {
    question: "Smoking and Alcohol",
    answer:
      "Smoking, alcohol consumption, and illegal activity inside the premises are strictly prohibited and may lead to parent notification, eviction, and loss of refund eligibility.",
  },
];

function Landing() {
  const [rooms, setRooms] = useState<RoomCard[]>(() => getDefaultRoomCards());
  const [galleryImages, setGalleryImages] = useState<GalleryAsset[]>(() => getDefaultGalleryImages());

  useEffect(() => {
    let active = true;

    const loadHomepageContent = async () => {
      const [roomResponse, galleryResponse] = await Promise.all([
        supabase.from("room_categories").select("slug, image_path"),
        supabase
          .from("gallery_images")
          .select("id, image_path, alt_text, created_at")
          .order("created_at", { ascending: true }),
      ]);

      if (!active) {
        return;
      }

      if (!roomResponse.error) {
        setRooms(
          buildRoomCards(roomResponse.data, (imagePath) =>
            supabase.storage.from(ROOM_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl,
          ),
        );
      }

      if (!galleryResponse.error) {
        setGalleryImages([
          ...getDefaultGalleryImages(),
          ...buildGalleryImages(galleryResponse.data, (imagePath) =>
            supabase.storage.from(GALLERY_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl,
          ),
        ]);
      }
    };

    void loadHomepageContent();

    return () => {
      active = false;
    };
  }, []);

  const roomGalleryImages = rooms.map((room) => ({
    id: `room-${room.slug}`,
    src: room.img,
    alt: `${room.name} room at Elite Stay`,
    imagePath: room.imagePath,
    isDefault: !room.imagePath,
  }));
  const allGalleryImages = dedupeGalleryImages([
    ...galleryImages,
    ...roomGalleryImages,
    {
      id: "hero-image",
      src: hero,
      alt: "Elite Stay PG exterior and entrance",
      imagePath: null,
      isDefault: true,
    },
  ]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Nav />
      <Hero />
      <Stats />
      <About images={allGalleryImages} />
      <Rooms rooms={rooms} />
      <Facilities />
      <Gallery images={allGalleryImages} />
      <Testimonials />
      <Rules />
      <Contact roomOptions={rooms.map((room) => room.name)} />
      <Footer />
      <FloatingActions />
    </div>
  );
}

function dedupeGalleryImages(images: GalleryAsset[]) {
  const seen = new Set<string>();

  return images.filter((image) => {
    if (seen.has(image.src)) {
      return false;
    }

    seen.add(image.src);
    return true;
  });
}

function BrandLogo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src={siteLogo}
      alt="Elite Stay"
      className={`${className} object-contain`}
      width={232}
      height={64}
      loading="eager"
    />
  );
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.14 6.44 2.14 11.9c0 1.75.46 3.46 1.32 4.96L2 22l5.31-1.39a9.8 9.8 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.11-2.9-6.99Zm-7.01 15.23h-.01a8.11 8.11 0 0 1-4.13-1.13l-.3-.18-3.15.83.84-3.07-.2-.31a8.13 8.13 0 0 1-1.25-4.37c0-4.49 3.66-8.15 8.16-8.15 2.17 0 4.21.84 5.75 2.38a8.08 8.08 0 0 1 2.39 5.77c0 4.49-3.66 8.14-8.14 8.14Zm4.47-6.1c-.24-.12-1.41-.69-1.63-.77-.22-.08-.38-.12-.54.12-.16.24-.61.77-.75.93-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.21-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.52.58.18 1.1.15 1.51.09.46-.07 1.41-.58 1.61-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function Nav() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#1E3A5F]/96 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-5">
        <a href="#home" className="flex shrink-0 items-center">
          <BrandLogo className="h-10 w-auto brightness-0 invert sm:h-11" />
        </a>

        <div className="flex items-center gap-3">
          <a
            href={MAPS_PLACE_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/84 transition hover:bg-white/10 md:inline-flex"
          >
            View Location
          </a>
          <a
            href="#contact-form"
            className="group inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-sm font-semibold text-[#1E3A5F] transition hover:scale-[1.02]"
          >
            Book Now
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);

  return (
    <section id="home" className="relative min-h-[100svh] w-full overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src={hero}
          alt="Elite Stay PG rooms and exterior"
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#102033]/72 via-[#102033]/56 to-[#102033]/80" />
      </motion.div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-5 pb-24 pt-44">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="glass-dark inline-flex rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/90">
            <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Elite Stay PG
          </span>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.02] font-bold text-white sm:text-6xl lg:text-7xl">
            Comfortable & secure PG stay
            <br />
            <span className="text-white/88">for students & professionals</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/82">
            Safe - Clean - Fully Furnished - Peaceful Living Near MIT Pune.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5">
              <MapPin className="h-4 w-4" /> Chintamani Park, Kadamwak Wasti
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4" /> 24x7 CCTV security
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#rooms"
              className="group inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-accent-foreground shadow-xl transition hover:scale-[1.03]"
            >
              Explore Rooms
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-xl transition hover:scale-[1.03] hover:bg-[#1fb85a]"
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp Enquiry
            </a>
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#about"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 z-10 inline-flex -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/80"
      >
        Scroll
        <ChevronDown className="h-4 w-4" />
      </motion.a>
    </section>
  );
}

function Stats() {
  const items = [
    { icon: ShieldCheck, label: "Safe stay", value: "24x7 CCTV" },
    { icon: Sparkles, label: "Clean living", value: "Daily Care" },
    { icon: BedDouble, label: "Move-in ready", value: "Furnished" },
    { icon: MapPin, label: "Well connected", value: "Near MIT Pune" },
  ];

  return (
    <section className="relative z-20 -mt-12">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="surface-card rounded-2xl p-5"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-display text-2xl font-bold">{item.value}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About({ images }: { images: GalleryAsset[] }) {
  const marqueeImages = [...images, ...images];

  return (
    <section id="about" className="relative pb-8 pt-18 sm:pb-10 sm:pt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="min-w-0 max-w-xl lg:flex lg:h-full lg:flex-col"
        >
          <SectionLabel>About Elite Stay PG</SectionLabel>
          <h2 className="mt-4 font-display text-4xl leading-tight font-bold sm:text-5xl">
            A New Standard for Living.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Welcome to Elite Stay PG, a premium boys' accommodation near MIT Pune, designed for
            students and working professionals who want comfort, safety, and a peaceful
            environment to focus on their goals.
          </p>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            At Elite Stay PG, we believe a hostel should feel like more than just a place to stay.
            From clean and spacious rooms to daily maintenance and modern amenities, every detail
            is shaped to create a stress-free and comfortable living experience. With convenient
            access to colleges, transport, food outlets, and essential services, residents get a
            balanced mix of comfort, convenience, and affordability.
          </p>
          <ul className="mt-8 space-y-3">
            {ABOUT_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-1 grid h-5 w-5 place-items-center rounded-md bg-primary/10 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-foreground/90">{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="min-w-0 overflow-hidden rounded-[2rem] border border-border/80 bg-white/92 p-5 shadow-[var(--shadow-glow)] lg:h-full"
        >
          <div className="flex h-full flex-col rounded-[1.6rem] bg-muted/55 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-primary/80">
              Safe - Clean - Fully Furnished - Peaceful Living Near MIT Pune
            </div>
            <div className="mt-4 max-w-xl">
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-[1.75rem]">
                A stay built for comfort, focus, and everyday ease.
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                From fully furnished rooms to a calm atmosphere and practical amenities, Elite Stay
                is designed to help students and working professionals feel settled from day one.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Near MIT Pune", "Move-in ready rooms", "Peaceful daily living"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-primary/12 bg-white/80 px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-5 flex min-h-[14rem] flex-1 items-center overflow-hidden rounded-[1.4rem] fade-mask-x lg:min-h-[20rem]">
              <div className="marquee-track flex items-center gap-4 py-1">
                {marqueeImages.map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    className="h-40 w-56 shrink-0 overflow-hidden rounded-[1.2rem] bg-white shadow-[var(--shadow-soft)] sm:h-44 sm:w-60 lg:h-52 lg:w-72"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-6 text-sm leading-7 text-muted-foreground">
              Images uploaded from the admin gallery also flow into this moving preview strip
              automatically.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Rooms({ rooms }: { rooms: RoomCard[] }) {
  return (
    <section id="rooms" className="relative bg-muted/40 pb-14 pt-10 sm:pb-16 sm:pt-12">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Rooms</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Choose your stay</h2>
          <p className="mt-4 text-muted-foreground">
            Flexible room options for different needs, each designed for practical and comfortable
            daily living.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, index) => (
            <motion.article
              key={room.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-3xl surface-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={room.img}
                  alt={room.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
                    {room.tag}
                  </span>
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                    {room.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-xl font-bold">{room.name}</h3>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">starting</div>
                    <div className="font-display text-lg font-bold">
                      {room.price}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </div>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {room.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" /> {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex gap-2">
                  <a
                    href="#contact-form"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02]"
                  >
                    Book Now
                  </a>
                  <a
                    href={`${WHATSAPP}%20(${encodeURIComponent(room.name)})`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Chat on WhatsApp about ${room.name}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.05] hover:bg-[#1fb85a]"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Facilities() {
  return (
    <section id="facilities" className="relative overflow-hidden pb-10 pt-18 sm:pb-12 sm:pt-20">
      <div className="absolute inset-x-0 top-12 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-[radial-gradient(circle,_rgba(30,58,95,0.12),_transparent_68%)] blur-3xl" />
      <div className="absolute left-0 top-1/3 -z-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(30,58,95,0.08),_transparent_70%)] blur-3xl" />

      <div className="mx-auto max-w-7xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-white/92 px-6 py-8 shadow-[var(--shadow-glow)] backdrop-blur-sm sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(30,58,95,0.14),_transparent_65%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
            <div className="max-w-3xl">
              <SectionLabel>Facilities</SectionLabel>
              <h2 className="mt-4 font-display text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
                Everything needed for a safe and comfortable stay.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Fully furnished rooms with Wi-Fi, study space, wardrobe, daily cleaning, 24x7
                water, power backup, and CCTV security for a safe and comfortable stay.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {TRUST_HIGHLIGHTS.slice(0, 3).map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/80 bg-white/78 px-4 py-4 shadow-[var(--shadow-soft)] backdrop-blur-sm"
                >
                  <div className="text-sm font-semibold text-foreground">{item.title}</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {FACILITY_ITEMS.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-white/95 p-6 shadow-[var(--shadow-soft)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/12 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/85 via-primary/25 to-transparent" />
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/8 blur-2xl transition duration-500 group-hover:bg-primary/14" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10 transition duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Included
                  </span>
                </div>

                <h3 className="mt-6 font-display text-xl font-bold text-foreground">{item.label}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                <div className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {item.note}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery({ images }: { images: GalleryAsset[] }) {
  const [open, setOpen] = useState<{ src: string; alt: string } | null>(null);

  return (
    <section id="gallery" className="relative bg-muted/40 pb-18 pt-10 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Gallery</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            A look around Elite Stay.
          </h2>
          <p className="mt-4 text-muted-foreground">
            All bundled images are shown here, and any gallery image added from the admin panel
            joins the gallery automatically.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image, index) => (
            <motion.button
              key={`${image.id}-${index}`}
              type="button"
              onClick={() => setOpen({ src: image.src, alt: image.alt })}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group block overflow-hidden rounded-3xl surface-card p-2 text-left"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[1.15rem]">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      {open && (
        <div
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[100] grid cursor-zoom-out place-items-center bg-black/80 p-6 backdrop-blur-md"
        >
          <img
            src={open.src}
            alt={open.alt}
            className="max-h-[90vh] max-w-[92vw] rounded-3xl shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}

function Testimonials() {
  return (
    <section id="reviews" className="relative py-18 sm:py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Testimonials</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Start with our verified Google listing.
          </h2>
          <p className="mt-4 text-muted-foreground">
            The exact Elite Stay PG Services map listing is connected below so visitors can open
            directions and read the latest Google reviews directly on Google Maps.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[2rem] bg-[#1E3A5F] p-8 text-white shadow-[0_28px_70px_rgba(30,58,95,0.24)]"
          >
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/85">
              Google Maps verified location
            </div>
            <div className="mt-6 flex items-center gap-1 text-[#FFD166]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <h3 className="mt-4 font-display text-3xl font-bold">{GOOGLE_PLACE_NAME}</h3>
            <p className="mt-3 max-w-xl text-white/78">{CONTACT_ADDRESS}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={MAPS_PLACE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1E3A5F] transition hover:scale-[1.02]"
              >
                Read reviews on Google
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Get directions
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-6 text-sm leading-7 text-white/72">
              Live Google review text is best opened directly from Google Maps, so this section
              links to the verified review page instead of showing unstable copied snippets.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {TRUST_HIGHLIGHTS.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="rounded-[1.6rem] border border-border/80 bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Quote className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Rules() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="rules" className="relative bg-muted/40 py-18 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SectionLabel>Rules & Regulations</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Clear policies for peaceful living.
          </h2>
          <p className="mt-4 text-muted-foreground">
            These simple rules help keep Elite Stay safe, organized, and comfortable for every
            resident.
          </p>

          <div className="mt-8 rounded-3xl surface-card p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Key policies
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm leading-7 text-foreground/88">
                Government-issued ID proof and address proof are required during admission.
              </div>
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm leading-7 text-foreground/88">
                Rs 10,000 refundable security deposit after proper handover and inspection.
              </div>
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm leading-7 text-foreground/88">
                No outsiders, ragging, smoking, alcohol, or illegal activity inside the premises.
              </div>
            </div>
            <a
              href={MAPS_PLACE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
            >
              Open exact Google Maps location
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-3">
          {RULES.map((rule, index) => (
            <div key={rule.question} className="overflow-hidden rounded-2xl surface-card">
              <button
                type="button"
                onClick={() => setOpenIdx(openIdx === index ? null : index)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted"
              >
                <span className="font-medium">{rule.question}</span>
                <ChevronDown
                  className={`h-4 w-4 transition ${
                    openIdx === index ? "rotate-180 text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: openIdx === index ? "auto" : 0, opacity: openIdx === index ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 text-sm leading-7 text-muted-foreground">{rule.answer}</div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ roomOptions }: { roomOptions: string[] }) {
  const defaultRoomType = roomOptions[0] ?? "Single";
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    room_type: defaultRoomType,
    message: "",
  });
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setState("loading");

    const { error } = await supabase.from("enquiries").insert([form]);

    if (error) {
      setState("error");
      return;
    }

    setState("sent");
    setForm({
      name: "",
      phone: "",
      email: "",
      room_type: defaultRoomType,
      message: "",
    });
    setTimeout(() => setState("idle"), 4000);
  };

  return (
    <section id="contact" className="relative pb-20 pt-18 sm:pb-22 sm:pt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
        <div>
          <SectionLabel>Contact</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Book your stay.</h2>
          <p className="mt-4 text-muted-foreground">
            Reach out for availability, pricing, a visit, or any quick questions about the PG.
          </p>

          <div className="mt-8 space-y-4">
            <ContactRow icon={MapPin} title="Visit Us" detail={CONTACT_ADDRESS} />
            <ContactRow icon={Phone} title="Call" detail={CONTACT_PHONE_DISPLAY} />
            <ContactRow icon={Mail} title="Email" detail={CONTACT_EMAIL} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-semibold text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.03] hover:bg-[#1fb85a]"
            >
              <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
            </a>
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white px-5 py-3 font-semibold text-foreground transition hover:scale-[1.03]"
            >
              Get Directions
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl surface-card">
            <iframe
              title="Elite Stay location map"
              src={MAP_EMBED}
              className="h-[340px] w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <form
          id="contact-form"
          onSubmit={onSubmit}
          className="scroll-mt-28 space-y-4 self-start rounded-3xl surface-card p-7"
        >
          <Field
            label="Name"
            value={form.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Your full name"
            required
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
            placeholder="+91 ..."
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="you@email.com"
          />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Room Type</label>
            <select
              value={form.room_type}
              onChange={(event) => setForm({ ...form, room_type: event.target.value })}
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary/50"
            >
              {roomOptions.map((room) => (
                <option key={room}>{room}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Tell us a little about what you're looking for..."
              className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={state === "loading"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-semibold text-primary-foreground transition hover:scale-[1.01] disabled:opacity-60"
          >
            {state === "loading"
              ? "Sending..."
              : state === "sent"
                ? "Sent - we'll be in touch"
                : state === "error"
                  ? "Something went wrong"
                  : "Send Enquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
      />
    </div>
  );
}

function ContactRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof MapPin;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl surface-card p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="font-medium">{detail}</div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative mt-6 bg-[#1E3A5F] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_1fr]">
        <div>
          <BrandLogo className="h-12 w-auto brightness-0 invert" />
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/78">
            Comfortable and secure PG stay for students and professionals with peaceful living,
            modern rooms, and responsive support.
          </p>
        </div>
        <FooterCol
          title="Explore"
          links={[
            { label: "About", href: "#about" },
            { label: "Rooms", href: "#rooms" },
            { label: "Facilities", href: "#facilities" },
            { label: "Gallery", href: "#gallery" },
            { label: "Rules", href: "#rules" },
          ]}
        />
        <FooterCol
          title="Contact"
          links={[
            { label: CONTACT_PHONE_DISPLAY, href: `tel:+${CONTACT_PHONE_RAW}` },
            { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
            { label: "Google Maps", href: MAPS_PLACE_URL, external: true },
            { label: "Get Directions", href: MAPS_DIRECTIONS_URL, external: true },
          ]}
        />
      </div>
      <div className="border-t border-white/12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-white/68 sm:flex-row">
          <div>(c) {new Date().getFullYear()} Elite Stay PG Services. All rights reserved.</div>
          <div>Comfort - Safety - Convenience.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      <ul className="space-y-2 text-sm text-white/78">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <a
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className="transition hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FloatingActions() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="grid h-12 w-12 place-items-center rounded-full surface-card transition hover:text-primary"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
      <a
        href={`tel:+${CONTACT_PHONE_RAW}`}
        className="grid h-12 w-12 place-items-center rounded-full surface-card transition hover:text-primary"
      >
        <Phone className="h-5 w-5" />
      </a>
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noreferrer"
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-110 hover:bg-[#1fb85a]"
      >
        <WhatsAppIcon className="h-6 w-6" />
      </a>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
      <span className="h-1 w-1 rounded-full bg-primary" /> {children}
    </span>
  );
}
