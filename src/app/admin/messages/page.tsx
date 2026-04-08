import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Building2, Clock, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  created_at: string;
  responded_at: string | null;
  responded_by: string | null;
  notes: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(iso);
}

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/portal/orders");

  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (messages ?? []) as ContactMessage[];
  const unresponded = list.filter((m) => !m.responded_at).length;

  async function markResponded(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (typeof id !== "string") return;

    const supabaseAction = await createClient();
    const {
      data: { user: actor },
    } = await supabaseAction.auth.getUser();
    if (!actor) return;

    await supabaseAction
      .from("contact_messages")
      .update({
        responded_at: new Date().toISOString(),
        responded_by: actor.id,
      })
      .eq("id", id);

    revalidatePath("/admin/messages");
  }

  async function markUnresponded(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (typeof id !== "string") return;

    const supabaseAction = await createClient();
    await supabaseAction
      .from("contact_messages")
      .update({ responded_at: null, responded_by: null })
      .eq("id", id);

    revalidatePath("/admin/messages");
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Mail className="h-7 w-7 text-primary" />
            Contact Messages
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            All inquiries submitted through the website contact form.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={unresponded > 0 ? "default" : "secondary"} className="text-sm px-3 py-1">
            {unresponded} unanswered
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {list.length} total
          </Badge>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold">No messages yet</p>
            <p className="text-muted-foreground text-sm mt-2">
              When customers submit the contact form, their messages will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((msg) => {
            const isResponded = !!msg.responded_at;
            return (
              <Card
                key={msg.id}
                className={isResponded ? "opacity-70" : ""}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg truncate">{msg.name}</h3>
                        {isResponded && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Responded
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                        <a
                          href={`mailto:${msg.email}`}
                          className="text-primary hover:underline break-all"
                        >
                          {msg.email}
                        </a>
                        {msg.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {msg.company}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 shrink-0"
                      title={formatDate(msg.created_at)}
                    >
                      <Clock className="h-3 w-3" />
                      {relativeTime(msg.created_at)}
                    </div>
                  </div>

                  <div className="bg-muted/40 rounded-lg p-4 mb-4">
                    <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={`mailto:${msg.email}?subject=Re: Your inquiry to Valley Specialty Roasters`}
                      className="flex-1"
                    >
                      <Button variant="default" size="sm" className="w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        Reply via Email
                      </Button>
                    </a>
                    {isResponded ? (
                      <form action={markUnresponded} className="flex-1">
                        <input type="hidden" name="id" value={msg.id} />
                        <Button variant="outline" size="sm" type="submit" className="w-full">
                          Mark as Unresponded
                        </Button>
                      </form>
                    ) : (
                      <form action={markResponded} className="flex-1">
                        <input type="hidden" name="id" value={msg.id} />
                        <Button variant="outline" size="sm" type="submit" className="w-full">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Responded
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
