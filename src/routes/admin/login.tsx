import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "@/lib/room-config";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login - Elite Stay" }] }),
  component: AdminLogin,
});

const bootstrapAdminInput = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(6).max(72),
});

const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator(bootstrapAdminInput)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const normalizedEmail = data.email.trim().toLowerCase();

    const listUsersResponse = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });

    if (listUsersResponse.error) {
      return {
        ok: false as const,
        message: getBootstrapErrorMessage(listUsersResponse.error.message),
      };
    }

    const existingUser = listUsersResponse.data.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail,
    );

    const adminRolesResponse = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminRolesResponse.error) {
      return {
        ok: false as const,
        message: getBootstrapErrorMessage(adminRolesResponse.error.message),
      };
    }

    const existingAdminUserIds = new Set((adminRolesResponse.data ?? []).map((row) => row.user_id));
    const ownerAlreadyExists = existingAdminUserIds.size > 0;
    const isExistingOwnerEmail = !!existingUser && existingAdminUserIds.has(existingUser.id);

    if (ownerAlreadyExists && !isExistingOwnerEmail) {
      return {
        ok: false as const,
        message: "An owner account already exists. Switch to sign in and use that account.",
        nextMode: "signin" as const,
      };
    }

    let userId = existingUser?.id ?? null;

    if (existingUser) {
      const updateUserResponse = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
        password: data.password,
      });

      if (updateUserResponse.error || !updateUserResponse.data.user) {
        return {
          ok: false as const,
          message: getBootstrapErrorMessage(
            updateUserResponse.error?.message ?? "The existing owner account could not be prepared.",
          ),
        };
      }

      userId = updateUserResponse.data.user.id;
    } else {
      const createUserResponse = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        password: data.password,
      });

      if (createUserResponse.error || !createUserResponse.data.user) {
        return {
          ok: false as const,
          message: getBootstrapErrorMessage(
            createUserResponse.error?.message ?? "The owner account could not be created.",
          ),
        };
      }

      userId = createUserResponse.data.user.id;
    }

    const assignRoleResponse = await supabaseAdmin
      .from("user_roles")
      .upsert({ role: "admin", user_id: userId }, { onConflict: "user_id,role" });

    if (assignRoleResponse.error) {
      return {
        ok: false as const,
        message: getBootstrapErrorMessage(assignRoleResponse.error.message),
      };
    }

    return {
      ok: true as const,
      message: "Owner account is ready. Signing you in...",
    };
  });

type Feedback = {
  tone: "success" | "error";
  message: string;
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function getBootstrapErrorMessage(message: string) {
  if (
    message.includes("user_roles") ||
    message.includes("room_categories") ||
    message.includes("gallery_images") ||
    message.includes("relation") ||
    message.includes("schema cache")
  ) {
    return "This Supabase project is missing the website tables and policies. Run the SQL migrations for this project in Supabase, then try again.";
  }

  if (message.includes("SUPABASE_SERVICE_ROLE_KEY") || message.includes("SUPABASE_URL")) {
    return "Server-side Supabase admin access is not configured. Check .env and restart the dev server.";
  }

  return message;
}

function getSignInErrorMessage(message: string) {
  if (message.toLowerCase().includes("email not confirmed")) {
    return "This owner account is not ready yet. Use the sign-in button again and the app will repair the built-in owner account automatically.";
  }

  return message;
}

function shouldAttemptOwnerRepair(email: string, message: string) {
  if (email.trim().toLowerCase() !== DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    return false;
  }

  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("email logins are disabled")
  );
}

function AdminLogin() {
  const nav = useNavigate();
  const bootstrapAdminFn = useServerFn(bootstrapAdmin);
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState(DEFAULT_ADMIN_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        nav({ to: "/admin" });
      }
    });
  }, [nav]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const attemptOwnerRepair = async () => {
        const bootstrapResponse = await withTimeout(
          bootstrapAdminFn({
            data: { email, password },
          }),
          20000,
          "Owner setup timed out. Check your internet connection and Supabase project settings, then try again.",
        );

        if (!bootstrapResponse.ok) {
          setFeedback({ tone: "error", message: bootstrapResponse.message });
          return false;
        }

        const signInResponse = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          20000,
          "Sign-in timed out. Make sure the Supabase Email provider is enabled, then try again.",
        );

        if (signInResponse.error) {
          setFeedback({ tone: "error", message: getSignInErrorMessage(signInResponse.error.message) });
          return false;
        }

        setFeedback({
          tone: "success",
          message: "Owner account is ready. Opening the dashboard...",
        });
        nav({ to: "/admin" });
        return true;
      };

      const response = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        20000,
        "Sign-in timed out. Make sure the Supabase Email provider is enabled, then try again.",
      );

      if (response.error) {
        if (shouldAttemptOwnerRepair(email, response.error.message)) {
          await attemptOwnerRepair();
          return;
        }

        setFeedback({ tone: "error", message: getSignInErrorMessage(response.error.message) });
        return;
      }

      nav({ to: "/admin" });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong while contacting Supabase.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f4efe7_0%,#f9fbfd_48%,#dbe9f2_100%)] p-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_30px_80px_rgba(15,85,125,0.16)] backdrop-blur sm:p-2 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[1.6rem] bg-[#0f557d] px-7 py-8 text-white sm:px-10 sm:py-10">
          <div className="absolute -left-12 top-8 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-[#cfa64a]/20 blur-3xl" />

          <Link to="/" className="relative text-xs text-white/75 transition hover:text-white">
            Back to site
          </Link>

          <div className="relative mt-10 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/85">
              <ShieldCheck className="h-3.5 w-3.5" />
              Single owner access
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
              Sign in to the one owner dashboard for rooms, gallery, and enquiries.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/78 sm:text-base">
              This project uses one built-in owner account. If the account needs a first-time
              repair on a fresh Supabase project, the sign-in action will prepare that same owner
              account instead of creating a second admin.
            </p>
          </div>

          <div className="relative mt-10 rounded-[1.6rem] border border-white/14 bg-white/10 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.15)] backdrop-blur">
            <div className="text-xs uppercase tracking-[0.2em] text-white/70">Owner credentials</div>
            <div className="mt-4 space-y-3">
              <CredentialRow label="Email" value={DEFAULT_ADMIN_EMAIL} />
              <CredentialRow label="Password" value={DEFAULT_ADMIN_PASSWORD} />
            </div>
            <p className="mt-4 text-sm text-white/72">
              Keep this account as the only owner login for the dashboard. You can later change the
              password inside Supabase Auth if needed.
            </p>
          </div>
        </section>

        <section className="flex items-center px-6 py-8 sm:px-10 lg:px-12">
          <div className="w-full">
            <div className="inline-flex rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground">
              Owner sign in
            </div>

            <h2 className="mt-6 font-display text-3xl font-bold">Admin sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage room images and enquiries for the single owner account.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                icon={Mail}
                placeholder="admin@elitestay.com"
              />
              <InputField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                icon={Lock}
                placeholder="Enter a secure password"
                minLength={6}
              />

              {feedback && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    feedback.tone === "error"
                      ? "border-destructive/20 bg-destructive/5 text-destructive"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-semibold text-primary-foreground transition hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Sign in to dashboard"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">{label}</div>
      <div className="mt-1 break-all font-medium text-white">{value}</div>
    </div>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
  icon: Icon,
  placeholder,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  icon: typeof Mail;
  placeholder: string;
  minLength?: number;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative mt-2">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type}
          required
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-input bg-background py-3 pr-4 pl-10 outline-none transition focus:border-primary/50"
        />
      </div>
    </div>
  );
}
