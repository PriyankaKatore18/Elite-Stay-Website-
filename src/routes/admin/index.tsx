import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Mail, Phone, MessageSquare, Trash2, Inbox, CheckCircle2, Clock, Home as HomeIcon } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Elite Stay" }] }),
  component: AdminDashboard,
});

type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  room_type: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

function AdminDashboard() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setAuthed(false);
        nav({ to: "/admin/login" });
      }
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { nav({ to: "/admin/login" }); return; }
      setAuthed(true);
      setUserId(data.session.user.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (admin) {
        const { data: rows } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
        setEnquiries((rows as Enquiry[]) ?? []);
      }
      setLoading(false);
    })();

    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const signOut = async () => { await supabase.auth.signOut(); nav({ to: "/admin/login" }); };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("enquiries").update({ status }).eq("id", id);
    setEnquiries((es) => es.map((e) => (e.id === id ? { ...e, status } : e)));
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    await supabase.from("enquiries").delete().eq("id", id);
    setEnquiries((es) => es.filter((e) => e.id !== id));
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/40 p-6">
        <div className="surface-card rounded-3xl p-8 max-w-md text-center">
          <h1 className="font-display text-2xl font-bold">Access pending</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your account is signed in but has no admin role yet.
          </p>
          {userId && (
            <div className="mt-4 p-3 rounded-xl bg-muted text-xs break-all">
              <div className="text-muted-foreground mb-1">Your user ID:</div>
              <code>{userId}</code>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Ask an existing admin (or use the backend dashboard) to insert a row into <code>user_roles</code> with role <code>admin</code> for this ID.
          </p>
          <button onClick={signOut} className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const total = enquiries.length;
  const fresh = enquiries.filter((e) => e.status === "new").length;
  const done = enquiries.filter((e) => e.status === "closed").length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center font-display font-bold text-primary-foreground">E</div>
            <div>
              <div className="font-display font-bold">Elite Stay Admin</div>
              <div className="text-xs text-muted-foreground">Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted">
              <HomeIcon className="h-4 w-4" /> Site
            </Link>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat icon={Inbox} label="Total Enquiries" value={total} />
          <Stat icon={Clock} label="New" value={fresh} accent />
          <Stat icon={CheckCircle2} label="Closed" value={done} />
        </div>

        <div className="mt-8 surface-card rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-bold">Enquiries</h2>
            <span className="text-xs text-muted-foreground">{total} total</span>
          </div>

          {enquiries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No enquiries yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {enquiries.map((e) => (
                <li key={e.id} className="p-5 sm:p-6 hover:bg-muted/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{e.name}</h3>
                        <StatusPill status={e.status} />
                        {e.room_type && (
                          <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{e.room_type}</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {e.phone}</span>
                        {e.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {e.email}</span>}
                        <span className="text-xs">{new Date(e.created_at).toLocaleString()}</span>
                      </div>
                      {e.message && (
                        <p className="mt-3 text-sm flex gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <span>{e.message}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={e.status} onChange={(ev) => updateStatus(e.id, ev.target.value)}
                        className="text-sm rounded-xl border border-input bg-background px-3 py-2">
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button onClick={() => remove(e.id)}
                        className="h-9 w-9 grid place-items-center rounded-xl border border-border hover:bg-destructive hover:text-destructive-foreground transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Inbox; label: string; value: number; accent?: boolean }) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${accent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    contacted: "bg-amber-100 text-amber-700",
    closed: "bg-emerald-100 text-emerald-700",
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wider ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}
