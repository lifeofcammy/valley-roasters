"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, CheckCircle2 } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Could not reach the server. Please check your connection and try again.",
      );
    }
  }

  return (
    <>
      {/* Hero — dramatic image background with Ken Burns */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0c0705]">
          <Image
            src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1920&q=85"
            alt="Coffee farm"
            fill
            className="object-cover opacity-40 animate-ken-burns"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 w-full">
          <div className="max-w-3xl">
            <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
              Contact
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mt-3 leading-tight">
              Get in Touch
            </h1>
            <p className="mt-5 sm:mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl">
              Have questions about our wholesale program? Interested in custom
              blends or private labeling? We&apos;d love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Form + Contact info */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Contact Form */}
            <div className="fade-up-on-scroll">
              {status === "success" ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <CheckCircle2 className="h-14 w-14 text-primary" />
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                      Message Sent!
                    </h2>
                    <p className="text-muted-foreground text-base sm:text-lg">
                      Thank you for reaching out. We&apos;ll get back to you as
                      soon as possible.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us about your coffee needs..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                    />
                  </div>
                  {status === "error" && (
                    <p className="text-sm text-destructive">{errorMessage}</p>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={status === "submitting"}
                    className="btn-lift w-full sm:w-auto"
                  >
                    {status === "submitting" ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-8 fade-up-delay-1">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-6">
                  Contact Information
                </h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">Email</p>
                      <a
                        href="mailto:info@valleyspecialtyroasters.com"
                        className="text-muted-foreground hover:text-primary transition-colors break-all"
                      >
                        info@valleyspecialtyroasters.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Roastery</p>
                      <p className="text-muted-foreground">
                        7131 S Val Vista Dr, Suite 103
                        <br />
                        Gilbert, AZ 85298
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-xl p-6 sm:p-8">
                <h3 className="font-display text-lg sm:text-xl font-semibold mb-3">
                  Interested in Wholesale?
                </h3>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  Interested in wholesale? Reach out and we&apos;ll get you set up
                  with custom pricing for your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
