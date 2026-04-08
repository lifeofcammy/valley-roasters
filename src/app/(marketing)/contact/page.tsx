"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Have questions about our wholesale program? Interested in custom
              blends or private labeling? We&apos;d love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Contact Form */}
            <div>
              {submitted ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <h2 className="font-display text-2xl font-bold mb-4">
                      Message Sent!
                    </h2>
                    <p className="text-muted-foreground">
                      Thank you for reaching out. We&apos;ll get back to you within
                      1 business day.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us about your coffee needs..."
                      required
                    />
                  </div>
                  <Button type="submit" size="lg">
                    Send Message
                  </Button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-2xl font-bold mb-6">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a
                        href="mailto:info@valleyspecialtyroasters.com"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@valleyspecialtyroasters.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
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

              <div className="bg-muted rounded-lg p-8">
                <h3 className="font-display text-lg font-semibold mb-3">
                  Interested in Wholesale?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Apply for a wholesale account to access our full catalog
                  with custom pricing.
                </p>
                <a href="/register">
                  <Button variant="outline">Apply Now</Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
