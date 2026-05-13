import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BedDouble,
  CheckCircle2,
  Clock3,
  Home as HomeIcon,
  ImagePlus,
  Inbox,
  LoaderCircle,
  LogOut,
  Mail,
  MessageSquare,
  PencilLine,
  Phone,
  Trash2,
  UserCheck,
} from "lucide-react";
import logoMark from "@/assets/logo-mark.png";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  GALLERY_IMAGE_BUCKET,
  buildGalleryImages,
  type GalleryAsset,
} from "@/lib/gallery-config";
import {
  buildRoomCards,
  getDefaultRoomCards,
  ROOM_IMAGE_BUCKET,
  type RoomCard,
} from "@/lib/room-config";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard - Elite Stay" }] }),
  component: AdminDashboard,
});

type Enquiry = Tables<"enquiries">;
type Banner = {
  tone: "success" | "error";
  message: string;
};

function isHasRolePermissionError(message: string) {
  return message.toLowerCase().includes("permission denied for function has_role");
}

function formatDashboardErrorMessage(message: string) {
  if (isHasRolePermissionError(message)) {
    return "This Supabase project is missing the latest admin role grant. Apply the newest SQL migration, or run GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;, then sign in again.";
  }

  return message;
}

function AdminDashboard() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [roomCards, setRoomCards] = useState<RoomCard[]>(() => getDefaultRoomCards());
  const [galleryItems, setGalleryItems] = useState<GalleryAsset[]>([]);
  const [screenError, setScreenError] = useState<string>("");
  const [roomBanner, setRoomBanner] = useState<Banner | null>(null);
  const [galleryBanner, setGalleryBanner] = useState<Banner | null>(null);
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [deletingRoomSlug, setDeletingRoomSlug] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [deletingGalleryId, setDeletingGalleryId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        nav({ to: "/admin/login" });
      }
    });

    const loadDashboard = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        nav({ to: "/admin/login" });
        return;
      }

      if (!active) {
        return;
      }

      setUserId(session.user.id);

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (rolesError) {
        if (active) {
          setScreenError(rolesError.message);
          setLoading(false);
        }
        return;
      }

      const admin = !!roles?.some((role) => role.role === "admin");

      if (!active) {
        return;
      }

      setIsAdmin(admin);

      if (!admin) {
        setLoading(false);
        return;
      }

      const [enquiryResponse, roomResponse, galleryResponse] = await Promise.all([
        supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
        supabase.from("room_categories").select("slug, image_path"),
        supabase
          .from("gallery_images")
          .select("id, image_path, alt_text, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (!active) {
        return;
      }

      if (enquiryResponse.error) {
        setScreenError(enquiryResponse.error.message);
      } else {
        setEnquiries(enquiryResponse.data ?? []);
      }

      if (roomResponse.error) {
        setRoomBanner({
          tone: "error",
          message: "Saved room images could not be loaded, so the default website images are being shown.",
        });
      }

      setRoomCards(
        buildRoomCards(roomResponse.data, (imagePath) =>
          supabase.storage.from(ROOM_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl,
        ),
      );

      if (galleryResponse.error) {
        setGalleryBanner({
          tone: "error",
          message:
            "Custom gallery images could not be loaded. The public site will continue using the bundled website gallery images.",
        });
      } else {
        setGalleryItems(
          buildGalleryImages(galleryResponse.data, (imagePath) =>
            supabase.storage.from(GALLERY_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl,
          ),
        );
      }

      setLoading(false);
    };

    void loadDashboard();

    return () => {
      active = false;
      authSubscription.subscription.unsubscribe();
    };
  }, [nav]);

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/admin/login" });
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);

    if (error) {
      setScreenError(error.message);
      return;
    }

    setEnquiries((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const removeEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry?")) {
      return;
    }

    const { error } = await supabase.from("enquiries").delete().eq("id", id);

    if (error) {
      setScreenError(error.message);
      return;
    }

    setEnquiries((current) => current.filter((item) => item.id !== id));
  };

  const uploadRoomImage = async (room: RoomCard, file: File) => {
    if (!file.type.startsWith("image/")) {
      setRoomBanner({ tone: "error", message: "Please choose a valid image file." });
      return;
    }

    setUploadingSlug(room.slug);
    setRoomBanner(null);

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileBaseName = normalizeFileBaseName(file.name, "room");
    const filePath = `${room.slug}/${fileBaseName}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(ROOM_IMAGE_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setUploadingSlug(null);
      setRoomBanner({ tone: "error", message: uploadError.message });
      return;
    }

    const { error: saveError } = await supabase.from("room_categories").upsert(
      {
        slug: room.slug,
        name: room.name,
        image_path: filePath,
      },
      { onConflict: "slug" },
    );

    if (saveError) {
      await supabase.storage.from(ROOM_IMAGE_BUCKET).remove([filePath]);
      setUploadingSlug(null);
      setRoomBanner({ tone: "error", message: saveError.message });
      return;
    }

    if (room.imagePath) {
      await supabase.storage.from(ROOM_IMAGE_BUCKET).remove([room.imagePath]);
    }

    const publicUrl = supabase.storage.from(ROOM_IMAGE_BUCKET).getPublicUrl(filePath).data.publicUrl;

    setRoomCards((current) =>
      current.map((item) =>
        item.slug === room.slug ? { ...item, img: publicUrl, imagePath: filePath } : item,
      ),
    );
    setUploadingSlug(null);
    setRoomBanner({
      tone: "success",
      message: `${room.name} image ${room.imagePath ? "updated" : "added"} successfully. The homepage will show the new photo after refresh.`,
    });
  };

  const deleteRoomImage = async (room: RoomCard) => {
    if (!room.imagePath) {
      return;
    }

    if (!confirm(`Delete the custom image for ${room.name}? The website will switch back to the default image.`)) {
      return;
    }

    setDeletingRoomSlug(room.slug);
    setRoomBanner(null);

    const defaultRoomImage =
      getDefaultRoomCards().find((item) => item.slug === room.slug)?.img ?? room.img;

    const { error: saveError } = await supabase
      .from("room_categories")
      .update({ image_path: null })
      .eq("slug", room.slug);

    if (saveError) {
      setDeletingRoomSlug(null);
      setRoomBanner({ tone: "error", message: saveError.message });
      return;
    }

    const { error: removeStorageError } = await supabase.storage
      .from(ROOM_IMAGE_BUCKET)
      .remove([room.imagePath]);

    setRoomCards((current) =>
      current.map((item) =>
        item.slug === room.slug ? { ...item, img: defaultRoomImage, imagePath: null } : item,
      ),
    );
    setDeletingRoomSlug(null);

    if (removeStorageError) {
      setRoomBanner({
        tone: "error",
        message: `${room.name} image was reset to the default website image, but the old file could not be deleted from storage: ${removeStorageError.message}`,
      });
      return;
    }

    setRoomBanner({
      tone: "success",
      message: `${room.name} image deleted successfully. The website is now using the default room image again.`,
    });
  };

  const uploadGalleryImages = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setUploadingGallery(true);
    setGalleryBanner(null);

    const uploadedItems: GalleryAsset[] = [];

    for (const [index, file] of selectedFiles.entries()) {
      if (!file.type.startsWith("image/")) {
        setUploadingGallery(false);
        setGalleryBanner({ tone: "error", message: `Skipped "${file.name}" because it is not an image file.` });
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileBaseName = normalizeFileBaseName(file.name, "gallery-image");
      const filePath = `gallery/${fileBaseName}-${Date.now()}-${index}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(GALLERY_IMAGE_BUCKET)
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setUploadingGallery(false);
        setGalleryBanner({ tone: "error", message: uploadError.message });
        return;
      }

      const altText = humanizeFileBaseName(fileBaseName);
      const { data: createdRow, error: insertError } = await supabase
        .from("gallery_images")
        .insert({ image_path: filePath, alt_text: altText })
        .select("id, image_path, alt_text, created_at")
        .single();

      if (insertError || !createdRow) {
        await supabase.storage.from(GALLERY_IMAGE_BUCKET).remove([filePath]);
        setUploadingGallery(false);
        setGalleryBanner({ tone: "error", message: insertError?.message ?? "Gallery image could not be saved." });
        return;
      }

      uploadedItems.push(
        ...buildGalleryImages([createdRow], (imagePath) =>
          supabase.storage.from(GALLERY_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl,
        ),
      );
    }

    setGalleryItems((current) => [...uploadedItems.reverse(), ...current]);
    setUploadingGallery(false);
    setGalleryBanner({
      tone: "success",
      message:
        uploadedItems.length === 1
          ? "Gallery image uploaded successfully. It will appear in the moving About strip and the homepage gallery."
          : `${uploadedItems.length} gallery images uploaded successfully.`,
    });
  };

  const deleteGalleryImage = async (image: GalleryAsset) => {
    if (!image.imagePath) {
      return;
    }

    if (!confirm("Delete this gallery image?")) {
      return;
    }

    setDeletingGalleryId(image.id);
    setGalleryBanner(null);

    const { error: removeStorageError } = await supabase.storage
      .from(GALLERY_IMAGE_BUCKET)
      .remove([image.imagePath]);

    if (removeStorageError) {
      setDeletingGalleryId(null);
      setGalleryBanner({ tone: "error", message: removeStorageError.message });
      return;
    }

    const { error: deleteRowError } = await supabase.from("gallery_images").delete().eq("id", image.id);

    if (deleteRowError) {
      setDeletingGalleryId(null);
      setGalleryBanner({ tone: "error", message: deleteRowError.message });
      return;
    }

    setGalleryItems((current) => current.filter((item) => item.id !== image.id));
    setDeletingGalleryId(null);
    setGalleryBanner({
      tone: "success",
      message: "Gallery image deleted successfully.",
    });
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
          <div className="mt-3 text-sm text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const hasRolePermissionIssue = isHasRolePermissionError(screenError);

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40 p-6">
        <div className="w-full max-w-lg rounded-[2rem] surface-card p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold">Access pending</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            This account is signed in, but it does not currently have the admin role for the
            Elite Stay dashboard.
          </p>

          {screenError && (
            <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formatDashboardErrorMessage(screenError)}
            </div>
          )}

          {userId && (
            <div className="mt-5 rounded-2xl bg-muted px-4 py-4 text-left text-xs">
              <div className="mb-1 text-muted-foreground">Signed-in user ID</div>
              <code className="break-all">{userId}</code>
            </div>
          )}

          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            {hasRolePermissionIssue
              ? "This project needs the latest Supabase admin-role migration before any signed-in admin can open the dashboard. Apply the migration, then sign out and sign back in."
              : "If this is a new setup, sign out and create the first owner account from the admin login page. Otherwise, ask an existing admin to add this user to the user_roles table with the admin role."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin/login"
              className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted"
            >
              Back to login
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:scale-[1.01]"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const total = enquiries.length;
  const fresh = enquiries.filter((item) => item.status === "new").length;
  const contacted = enquiries.filter((item) => item.status === "contacted").length;
  const closed = enquiries.filter((item) => item.status === "closed").length;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f9fafb_0%,#eef4f8_100%)]">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={logoMark}
              alt="Elite Stay"
              className="h-11 w-11 rounded-2xl object-contain shadow-[var(--shadow-soft)]"
              width={312}
              height={312}
            />
            <div>
              <div className="font-display font-bold">Elite Stay Admin</div>
              <div className="text-xs text-muted-foreground">Rooms, gallery, and enquiries dashboard</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm transition hover:bg-muted"
            >
              <HomeIcon className="h-4 w-4" /> View site
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm transition hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/88 px-6 py-7 shadow-[0_24px_60px_rgba(15,85,125,0.08)] backdrop-blur sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">
                Admin overview
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Manage room photos, gallery photos, and every incoming enquiry.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Update room category images, add custom gallery photos for the homepage, and review
                new website enquiries from one place.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-primary/10 bg-primary/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-primary/80">Quick note</div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Room and gallery images are stored in Supabase Storage, while the enquiry list is
                populated directly from the public website form.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Inbox} label="Total Enquiries" value={total} />
          <StatCard icon={Clock3} label="New" value={fresh} accent />
          <StatCard icon={Phone} label="Contacted" value={contacted} />
          <StatCard icon={CheckCircle2} label="Closed" value={closed} />
        </div>

        <section className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_24px_60px_rgba(15,85,125,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
               <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                 Content manager
               </div>
               <h2 className="mt-3 font-display text-2xl font-bold">Room image manager</h2>
               <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Add, replace, or delete a custom image for each room category below. The public
                room cards on the homepage will use these images automatically.
               </p>
             </div>
            <div className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
              3 room categories
            </div>
          </div>

          {roomBanner && <BannerCard banner={roomBanner} className="mt-5" />}

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {roomCards.map((room) => {
              const isUploading = uploadingSlug === room.slug;
              const isDeleting = deletingRoomSlug === room.slug;
              const isBusy = isUploading || isDeleting;

              return (
                <article
                  key={room.slug}
                  className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-background shadow-[var(--shadow-soft)]"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img src={room.img} alt={room.name} className="h-full w-full object-cover" />
                    <div className="absolute left-4 top-4 inline-flex rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white backdrop-blur">
                      {room.name}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{room.name}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {room.imagePath
                        ? "Custom image is live for this category."
                        : "Default website image is being used right now."}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <label
                        className={`inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition ${
                          isBusy ? "pointer-events-none opacity-60" : "cursor-pointer hover:scale-[1.01]"
                        }`}
                      >
                        {isUploading ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : room.imagePath ? (
                          <PencilLine className="h-4 w-4" />
                        ) : (
                          <ImagePlus className="h-4 w-4" />
                        )}
                        {isUploading ? "Saving..." : room.imagePath ? "Edit image" : "Add image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isBusy}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void uploadRoomImage(room, file);
                            }
                            event.target.value = "";
                          }}
                        />
                      </label>
                      {room.imagePath ? (
                        <button
                          type="button"
                          onClick={() => void deleteRoomImage(room)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-destructive hover:text-destructive-foreground disabled:pointer-events-none disabled:opacity-60"
                        >
                          {isDeleting ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {isDeleting ? "Deleting..." : "Delete image"}
                        </button>
                      ) : (
                        <span className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
                          No custom image yet
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">JPG, PNG, or WebP</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_24px_60px_rgba(15,85,125,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Gallery manager
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold">Homepage gallery images</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Add extra gallery images here. These custom uploads appear in both the homepage
                gallery section and the auto-scrolling image strip inside the About section.
              </p>
            </div>
            <div className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
              {galleryItems.length} custom gallery image{galleryItems.length === 1 ? "" : "s"}
            </div>
          </div>

          {galleryBanner && <BannerCard banner={galleryBanner} className="mt-5" />}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition ${
                uploadingGallery ? "pointer-events-none opacity-60" : "cursor-pointer hover:scale-[1.01]"
              }`}
            >
              {uploadingGallery ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {uploadingGallery ? "Uploading..." : "Upload gallery images"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void uploadGalleryImages(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            <span className="text-xs text-muted-foreground">You can select multiple images at once.</span>
          </div>

          {galleryItems.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              No custom gallery images uploaded yet. The website is currently showing its bundled
              default gallery images.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {galleryItems.map((image) => {
                const isDeleting = deletingGalleryId === image.id;

                return (
                  <article
                    key={image.id}
                    className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-background shadow-[var(--shadow-soft)]"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex items-start justify-between gap-3 p-5">
                      <div>
                        <div className="font-semibold">{image.alt}</div>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          This image is live on the public homepage gallery.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteGalleryImage(image)}
                        disabled={isDeleting}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border transition hover:bg-destructive hover:text-destructive-foreground disabled:pointer-events-none disabled:opacity-60"
                      >
                        {isDeleting ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 shadow-[0_24px_60px_rgba(15,85,125,0.08)]">
          <div className="flex flex-col gap-3 border-b border-border/70 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Leads
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold">Website enquiries</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Every enquiry submitted from the contact form appears here.
              </p>
            </div>
            <div className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
              {total} total enquiries
            </div>
          </div>

          {screenError && <BannerCard banner={{ tone: "error", message: screenError }} className="m-6" />}

          {enquiries.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No enquiries yet.</div>
          ) : (
            <ul className="divide-y divide-border/70">
              {enquiries.map((enquiry) => (
                <li key={enquiry.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{enquiry.name}</h3>
                        <StatusPill status={enquiry.status} />
                        {enquiry.room_type && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                            {enquiry.room_type}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {enquiry.phone}
                        </span>
                        {enquiry.email && (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> {enquiry.email}
                          </span>
                        )}
                        <span className="text-xs">{new Date(enquiry.created_at).toLocaleString()}</span>
                      </div>
                      {enquiry.message && (
                        <p className="mt-3 flex gap-2 text-sm">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>{enquiry.message}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={enquiry.status}
                        onChange={(event) => updateStatus(enquiry.id, event.target.value)}
                        className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeEnquiry(enquiry.id)}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-border transition hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function normalizeFileBaseName(name: string, fallback: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

function humanizeFileBaseName(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,85,125,0.06)]">
      <div
        className={`grid h-11 w-11 place-items-center rounded-2xl ${
          accent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 font-display text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    contacted: "bg-amber-100 text-amber-700",
    closed: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wider ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function BannerCard({ banner, className = "" }: { banner: Banner; className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl border px-4 py-3 text-sm ${
        banner.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-destructive/20 bg-destructive/5 text-destructive"
      }`}
    >
      {banner.message}
    </div>
  );
}
