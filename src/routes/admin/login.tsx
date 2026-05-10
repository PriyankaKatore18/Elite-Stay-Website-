import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Mail, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — Elite Stay" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/admin" });
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    const fn = mode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    const { error } = await fn;
    setLoading(false);
    if (error) { setErr(error.message); return; }
    if (mode === "signup") {
      setErr("Account created. Ask an existing admin to grant you access, then sign in.");
      setMode("signin");
      return;
    }
    nav({ to: "/admin" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-muted/40 p-6">
      <div className="w-full max-w-md surface-card rounded-3xl p-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to site</Link>
        <h1 className="mt-4 font-display text-3xl font-bold">Admin {mode === "signin" ? "Sign In" : "Sign Up"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage enquiries and content.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
            <div className="mt-2 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background outline-none focus:border-primary/50" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="mt-2 relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background outline-none focus:border-primary/50" />
            </div>
          </div>
          {err && <div className="text-sm text-destructive">{err}</div>}
          <button disabled={loading} type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:scale-[1.01] transition disabled:opacity-60">
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "No account? Create one" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
