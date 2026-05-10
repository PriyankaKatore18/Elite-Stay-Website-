import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import {
  Wifi, ShieldCheck, UtensilsCrossed, Droplets, Shirt, Car,
  Sparkles, BookOpen, Zap, Bath, Phone, ArrowUp,
  MapPin, Mail, ChevronDown, ArrowRight, Check, Instagram, Facebook, Twitter, Linkedin,
} from "lucide-react";
import hero from "@/assets/hero.jpg";
import siteLogo from "@/assets/logo.png";
import roomSingle from "@/assets/room-single.jpg";
import roomDouble from "@/assets/room-double.jpg";
import roomTriple from "@/assets/room-triple.jpg";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elite Stay — Luxury Co-Living for Students & Professionals" },
      { name: "description", content: "Premium co-living spaces with 24/7 security, high-speed WiFi, fresh meals, and modern rooms." },
      { property: "og:title", content: "Elite Stay — Luxury Co-Living" },
      { property: "og:description", content: "Safe • Modern • Comfortable • Fully Managed co-living for men & women." },
    ],
  }),
  component: Landing,
});

const CONTACT_ADDRESS = "Chintamani Park, Vishay Comapny Road, Kadamwak Wasti, Maharashtra 412201";
const CONTACT_EMAIL = "elitestay.loni@gmail.com";
const CONTACT_PHONE_DISPLAY = "09553961076";
const CONTACT_PHONE_RAW = "919553961076";
const WHATSAPP = `https://wa.me/${CONTACT_PHONE_RAW}?text=${encodeURIComponent("Hi Elite Stay, I'd like to enquire about a room.")}`;
const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(CONTACT_ADDRESS)}&output=embed`;

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Nav />
      <Hero />
      <Stats />
      <About />
      <Rooms />
      <Facilities />
      <Gallery />
      <Rules />
      <Contact />
      <Footer />
      <FloatingActions />
    </div>
  );
}

/* ---------------- NAV (logo + name + socials + Book Now) ---------------- */
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
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 11.5a8 8 0 0 1-11.8 7l-3.2 1 1-3.1A8 8 0 1 1 20 11.5Z" />
      <path d="M9.4 8.7c.2-.4.4-.4.7-.4h.6c.2 0 .5.1.6.5l.5 1.4c.1.3.1.5-.1.8l-.4.5c-.1.1-.1.3 0 .5.3.6.8 1.2 1.4 1.7.6.5 1.1.9 1.8 1.2.2.1.4.1.5 0l.6-.4c.2-.2.5-.2.8-.1l1.3.6c.4.2.4.4.4.6v.6c0 .3-.1.5-.4.7-.4.3-1 .5-1.6.4-.9-.2-2-.8-3.3-1.8-1-.8-1.8-1.8-2.4-2.8-.5-.9-.8-1.7-.8-2.4 0-.5.2-1 .4-1.4Z" />
    </svg>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
        <a href="#home" className="flex shrink-0 items-center">
          <BrandLogo className="h-10 w-auto sm:h-11" />
        </a>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 sm:flex">
            <SocialBtn href="https://instagram.com" icon={Instagram} />
            <SocialBtn href="https://facebook.com" icon={Facebook} />
            <SocialBtn href="https://twitter.com" icon={Twitter} />
            <SocialBtn href="https://linkedin.com" icon={Linkedin} />
          </div>
          <a href="#contact-form"
             className="group inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] hover:bg-primary/95">
            Book Now
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

function SocialBtn({
  href,
  icon: Icon,
  className = "grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground",
}: {
  href: string;
  icon: typeof Instagram;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
       className={className}>
      <Icon className="h-4 w-4" />
    </a>
  );
}

/* ---------------- HERO (full-width bg image) ---------------- */
function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  return (
    <section id="home" className="relative w-full min-h-[100svh] overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <img src={hero} alt="Luxury co-living interior" className="h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/70" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-44 pb-24 min-h-[100svh] flex flex-col justify-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark text-xs uppercase tracking-[0.2em] text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Now accepting residents
          </span>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] text-white max-w-4xl">
            Luxury co-living spaces<br />
            <span className="text-white/85">for students & professionals</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80">
            Safe • Modern • Comfortable • Fully Managed. Move into a thoughtfully designed home with the comforts of a premium hotel.
          </p>
          <div className="mt-3 text-sm text-white/60">Daily · Weekly · Monthly Stay</div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#rooms" className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-foreground font-semibold hover:scale-[1.03] transition shadow-xl">
              Explore Rooms
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a href={WHATSAPP} target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-dark text-white font-semibold hover:bg-white/15 transition">
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp Enquiry
            </a>
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#about"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 inline-flex flex-col items-center gap-2 text-xs uppercase tracking-[0.25em] z-10"
      >
        Scroll
        <ChevronDown className="h-4 w-4" />
      </motion.a>
    </section>
  );
}

/* ---------------- STATS ---------------- */
function Stats() {
  const items = [
    { icon: ShieldCheck, label: "24×7 CCTV Security", value: "Always On" },
    { icon: Sparkles, label: "Happy Residents", value: "100+" },
    { icon: Wifi, label: "High-Speed WiFi", value: "200 Mbps" },
    { icon: UtensilsCrossed, label: "Premium Food", value: "3 Meals" },
  ];
  return (
    <section className="relative -mt-12 z-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="surface-card rounded-2xl p-5"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
                <it.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-display text-2xl font-bold">{it.value}</div>
              <div className="text-sm text-muted-foreground">{it.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- ABOUT ---------------- */
function About() {
  const points = [
    "Separate floors for men & women",
    "Student & working professional friendly",
    "Hotel-grade housekeeping & cleanliness",
    "Modern interiors with premium finishes",
  ];
  return (
    <section id="about" className="relative py-28">
      <div className="mx-auto max-w-7xl px-5 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <SectionLabel>About Elite Stay</SectionLabel>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-tight">
            A new standard for co-living.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Elite Stay is a premium PG & co-living experience designed for those who refuse to compromise on safety, quality, or comfort. Every detail — from the linens to the lighting — is engineered for a calm, productive life.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-1 h-5 w-5 rounded-md bg-primary/10 grid place-items-center text-primary"><Check className="h-3.5 w-3.5" /></span>
                <span className="text-foreground/90">{p}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative grid grid-cols-2 gap-4">
          <img src={g1} alt="Lounge" className="rounded-3xl h-72 w-full object-cover shadow-[var(--shadow-soft)]" loading="lazy" />
          <img src={g3} alt="Study" className="rounded-3xl h-56 w-full object-cover mt-10 shadow-[var(--shadow-soft)]" loading="lazy" />
          <img src={g2} alt="Kitchen" className="rounded-3xl h-56 w-full object-cover -mt-6 shadow-[var(--shadow-soft)]" loading="lazy" />
          <img src={g4} alt="Bath" className="rounded-3xl h-72 w-full object-cover shadow-[var(--shadow-soft)]" loading="lazy" />
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- ROOMS ---------------- */
function Rooms() {
  const rooms = [
    { name: "Single Sharing", img: roomSingle, price: "₹12,000", tag: "AC", features: ["Private Room", "Study Desk", "Attached Bath"], status: "Available" },
    { name: "Double Sharing", img: roomDouble, price: "₹8,500", tag: "AC", features: ["2 Beds", "Wardrobe", "Balcony"], status: "Few Left" },
    { name: "Triple Sharing", img: roomTriple, price: "₹6,500", tag: "Non-AC", features: ["3 Beds", "Storage", "Bright"], status: "Available" },
  ];
  return (
    <section id="rooms" className="relative py-28 bg-muted/40">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center max-w-2xl mx-auto">
          <SectionLabel>Rooms</SectionLabel>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold">Choose your stay</h2>
          <p className="mt-4 text-muted-foreground">Three thoughtfully designed room types — each with premium bedding, modern furniture, and reliable amenities.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((r, i) => (
            <motion.article
              key={r.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative surface-card rounded-3xl overflow-hidden hover:-translate-y-1.5 transition-all duration-500 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="relative h-56 overflow-hidden">
                <img src={r.img} alt={r.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/90 text-foreground backdrop-blur">{r.tag}</span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary text-primary-foreground">{r.status}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl font-bold">{r.name}</h3>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">starting</div>
                    <div className="font-display font-bold text-lg">{r.price}<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {r.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex gap-2">
                  <a href="#contact-form"
                     className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:scale-[1.02] transition">
                    Book Now
                  </a>
                  <a href={`${WHATSAPP}%20(${encodeURIComponent(r.name)})`} target="_blank" rel="noreferrer"
                     aria-label={`Chat on WhatsApp about ${r.name}`}
                     className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.05] hover:bg-[#1fb85a]">
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

/* ---------------- FACILITIES ---------------- */
function Facilities() {
  const facilityMeta = [
    { detail: "Stable, high-speed internet for classes, work calls, and seamless streaming.", note: "Always connected" },
    { detail: "Round-the-clock surveillance and secure entry points for greater peace of mind.", note: "Safety first" },
    { detail: "Fresh, reliable meals designed to make everyday living easier and more convenient.", note: "Daily convenience" },
    { detail: "Purified drinking water available throughout the day for a healthier routine.", note: "Clean essentials" },
    { detail: "On-site laundry support that keeps your weekly routine simple and hassle-free.", note: "Well maintained" },
    { detail: "Organized parking space for residents, designed for smooth daily access.", note: "Easy access" },
    { detail: "Regular cleaning and upkeep to maintain a polished, comfortable living space.", note: "Hotel-style care" },
    { detail: "Quiet, focused spaces that support productive study sessions and remote work.", note: "Made to focus" },
    { detail: "Reliable backup support so your schedule stays uninterrupted during outages.", note: "Uninterrupted living" },
    { detail: "Private, well-finished bathrooms for greater comfort and everyday ease.", note: "Premium comfort" },
  ];
  const highlights = [
    { title: "Thoughtfully managed", text: "Every amenity is selected to support a smoother, more comfortable daily routine." },
    { title: "Elegant by design", text: "Clean interiors, refined upkeep, and a premium standard across the property." },
    { title: "Built for modern living", text: "An environment that works equally well for students and professionals." },
  ];
  const items = [
    { icon: Wifi, label: "High-Speed WiFi" },
    { icon: ShieldCheck, label: "24×7 CCTV" },
    { icon: UtensilsCrossed, label: "Food Facility" },
    { icon: Droplets, label: "RO Water" },
    { icon: Shirt, label: "Laundry" },
    { icon: Car, label: "Parking" },
    { icon: Sparkles, label: "Housekeeping" },
    { icon: BookOpen, label: "Study Area" },
    { icon: Zap, label: "Power Backup" },
    { icon: Bath, label: "Attached Bathroom" },
  ];
  return (
    <section id="facilities" className="relative overflow-hidden py-28">
      <div className="absolute inset-x-0 top-12 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-[radial-gradient(circle,_rgba(15,85,125,0.12),_transparent_68%)] blur-3xl" />
      <div className="absolute left-0 top-1/3 -z-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(15,85,125,0.08),_transparent_70%)] blur-3xl" />

      <div className="mx-auto max-w-7xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-white/92 px-6 py-8 shadow-[var(--shadow-glow)] backdrop-blur-sm sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(15,85,125,0.14),_transparent_65%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
            <div className="max-w-3xl">
              <SectionLabel>Facilities</SectionLabel>
              <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Everything you need, beautifully managed.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                From safety and housekeeping to comfort and productivity, every essential is handled with a polished,
                professional standard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {highlights.map((item) => (
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
          {items.map((f, i) => {
            const meta = facilityMeta[i];

            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-white/95 p-6 shadow-[var(--shadow-soft)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/12 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/85 via-primary/25 to-transparent" />
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/8 blur-2xl transition duration-500 group-hover:bg-primary/14" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10 transition duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Included
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-xl font-bold text-foreground">{f.label}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{meta.detail}</p>
                  <div className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{meta.note}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- GALLERY ---------------- */
function Gallery() {
  const imgs = [
    { src: g1, alt: "Elite Stay lounge area" },
    { src: roomSingle, alt: "Single sharing room" },
    { src: g2, alt: "Shared kitchen and dining area" },
    { src: roomDouble, alt: "Double sharing room" },
    { src: g3, alt: "Study and seating corner" },
    { src: g4, alt: "Bathroom and wash area" },
    { src: roomTriple, alt: "Triple sharing room" },
    { src: hero, alt: "Elite Stay premium interior" },
  ];
  const [open, setOpen] = useState<{ src: string; alt: string } | null>(null);
  return (
    <section id="gallery" className="relative py-28 bg-muted/40">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center max-w-2xl mx-auto">
          <SectionLabel>Gallery</SectionLabel>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold">A look inside.</h2>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {imgs.map((im, i) => (
            <motion.button
              key={im.src}
              onClick={() => setOpen(im)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group block overflow-hidden rounded-3xl surface-card p-2 text-left"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[1.15rem]">
                <img
                  src={im.src}
                  alt={im.alt}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      {open && (
        <div onClick={() => setOpen(null)} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md grid place-items-center p-6 cursor-zoom-out">
          <img src={open.src} alt={open.alt} className="max-h-[90vh] max-w-[92vw] rounded-3xl shadow-2xl" />
        </div>
      )}
    </section>
  );
}

/* ---------------- RULES ---------------- */
function Rules() {
  const meals = [
    { t: "Morning", v: "8:00 – 10:00 AM" },
    { t: "Afternoon", v: "12:00 – 1:30 PM" },
    { t: "Evening", v: "8:00 – 10:00 PM" },
  ];
  const rules = [
    { q: "ID Proof Mandatory", a: "Government-issued ID is required at check-in for all residents." },
    { q: "No Outsiders Allowed", a: "Visitors are not permitted inside resident rooms for safety reasons." },
    { q: "Security Deposit", a: "₹10,000 fully refundable security deposit at the time of move-in." },
    { q: "Refund Policy", a: "Deposit refunded within 7 days of checkout after dues & inspection." },
    { q: "Zero Tolerance for Ragging", a: "Strictly prohibited. Violators will be removed immediately." },
    { q: "CCTV Monitoring", a: "Common areas and entry points are monitored 24×7 for safety." },
    { q: "Smoking & Alcohol", a: "Strictly prohibited inside the premises." },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="rules" className="relative py-28">
      <div className="mx-auto max-w-7xl px-5 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <SectionLabel>House Rules</SectionLabel>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold">Calm, safe & well-run.</h2>
          <p className="mt-4 text-muted-foreground">Simple rules so everyone enjoys a comfortable stay.</p>

          <div className="mt-8 surface-card rounded-3xl p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Food Timings</div>
            <div className="mt-4 grid gap-3">
              {meals.map((m) => (
                <div key={m.t} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3"><UtensilsCrossed className="h-4 w-4 text-primary" /><span className="font-medium">{m.t}</span></div>
                  <span className="text-muted-foreground text-sm">{m.v}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 p-4 rounded-2xl bg-primary/5 border border-primary/15 text-sm">
              ₹10,000 fully <span className="text-primary font-semibold">refundable</span> security deposit
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          {rules.map((r, i) => (
            <div key={r.q} className="surface-card rounded-2xl overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted transition">
                <span className="font-medium">{r.q}</span>
                <ChevronDown className={`h-4 w-4 transition ${openIdx === i ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
              </button>
              <motion.div initial={false} animate={{ height: openIdx === i ? "auto" : 0, opacity: openIdx === i ? 1 : 0 }} className="overflow-hidden">
                <div className="px-5 pb-5 text-sm text-muted-foreground">{r.a}</div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CONTACT (saves to DB) ---------------- */
function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", room_type: "Single Sharing", message: "" });
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    const { error } = await supabase.from("enquiries").insert([form]);
    if (error) {
      setState("error");
      return;
    }
    setState("sent");
    setForm({ name: "", phone: "", email: "", room_type: "Single Sharing", message: "" });
    setTimeout(() => setState("idle"), 4000);
  };

  return (
    <section id="contact" className="relative py-28">
      <div className="mx-auto max-w-7xl px-5 grid lg:grid-cols-2 gap-10">
        <div>
          <SectionLabel>Contact</SectionLabel>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold">Come say hello.</h2>
          <p className="mt-4 text-muted-foreground">Reach out for a tour, pricing, or any quick questions.</p>

          <div className="mt-8 space-y-4">
            <ContactRow icon={MapPin} title="Visit Us" detail={CONTACT_ADDRESS} />
            <ContactRow icon={Phone} title="Call" detail={CONTACT_PHONE_DISPLAY} />
            <ContactRow icon={Mail} title="Email" detail={CONTACT_EMAIL} />
          </div>

          <a href={WHATSAPP} target="_blank" rel="noreferrer"
             className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-semibold text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.03] hover:bg-[#1fb85a]">
            <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
          </a>

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

        <form id="contact-form" onSubmit={onSubmit} className="scroll-mt-28 surface-card rounded-3xl p-7 space-y-4 self-start">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Your full name" required />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91 ..." required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@email.com" />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Room Type</label>
            <select value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })}
              className="mt-2 w-full rounded-xl bg-background border border-input px-4 py-3 outline-none focus:border-primary/50">
              <option>Single Sharing</option>
              <option>Double Sharing</option>
              <option>Triple Sharing</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us a little about what you're looking for..."
              className="mt-2 w-full rounded-xl bg-background border border-input px-4 py-3 outline-none focus:border-primary/50 resize-none" />
          </div>
          <button type="submit" disabled={state === "loading"}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:scale-[1.01] transition disabled:opacity-60">
            {state === "loading" ? "Sending..." : state === "sent" ? "Sent ✓ We'll be in touch" : state === "error" ? "Something went wrong" : "Send Enquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input type={type} placeholder={placeholder} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl bg-background border border-input px-4 py-3 outline-none focus:border-primary/50 placeholder:text-muted-foreground/60" />
    </div>
  );
}

function ContactRow({ icon: Icon, title, detail }: { icon: typeof MapPin; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-4 surface-card rounded-2xl p-4">
      <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="font-medium">{detail}</div>
      </div>
    </div>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  return (
    <footer className="relative mt-10 bg-[#0f557d] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="inline-flex items-center rounded-2xl bg-white/96 px-3 py-2 shadow-lg">
            <BrandLogo className="h-11 w-auto" />
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/78">Premium co-living for students & professionals. Safe, modern, fully managed.</p>
        </div>
        <FooterCol title="Explore" links={["Rooms", "Facilities", "Gallery", "Rules"]} />
        <FooterCol title="Contact" links={[CONTACT_PHONE_DISPLAY, CONTACT_EMAIL, CONTACT_ADDRESS]} />
        <div>
          <div className="mb-3 text-sm font-semibold text-white">Follow</div>
          <div className="flex gap-2">
            <SocialBtn href="https://instagram.com" icon={Instagram} className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white" />
            <SocialBtn href="https://facebook.com" icon={Facebook} className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white" />
            <SocialBtn href="https://twitter.com" icon={Twitter} className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white" />
            <SocialBtn href="https://linkedin.com" icon={Linkedin} className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white" />
          </div>
        </div>
      </div>
      <div className="border-t border-white/12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-white/68 sm:flex-row">
          <div>© {new Date().getFullYear()} Elite Stay PG Services. All rights reserved.</div>
          <div>Crafted with care.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      <ul className="space-y-2 text-sm text-white/78">
        {links.map((l) => <li key={l}><a href="#" className="transition hover:text-white">{l}</a></li>)}
      </ul>
    </div>
  );
}

function FloatingActions() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="h-12 w-12 grid place-items-center rounded-full surface-card hover:text-primary transition">
        <ArrowUp className="h-5 w-5" />
      </button>
      <a href={`tel:+${CONTACT_PHONE_RAW}`} className="h-12 w-12 grid place-items-center rounded-full surface-card hover:text-primary transition">
        <Phone className="h-5 w-5" />
      </a>
      <a href={WHATSAPP} target="_blank" rel="noreferrer"
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-110 hover:bg-[#1fb85a]">
        <WhatsAppIcon className="h-6 w-6" />
      </a>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
      <span className="h-1 w-1 rounded-full bg-primary" /> {children}
    </span>
  );
}
