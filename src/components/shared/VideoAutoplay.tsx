"use client";

import { useEffect } from "react";

/**
 * Fixes mobile video autoplay across the site.
 *
 * Mobile browsers (iOS Safari, Chrome Android) often block autoplay
 * even with the muted + playsinline attributes. This component adds:
 *
 * 1. IntersectionObserver — plays when 15% visible, pauses when scrolled away
 * 2. JS-side v.muted = true — some browsers ignore the HTML attribute
 * 3. touchstart fallback — covers strict iOS policies on first user touch
 */
export default function VideoAutoplay() {
  useEffect(() => {
    const videos = document.querySelectorAll<HTMLVideoElement>(
      "video[data-autoplay]"
    );
    if (!videos.length) return;

    // Force muted via JS — critical for some browsers that ignore the attribute
    videos.forEach((v) => {
      v.muted = true;
    });

    // Play when visible, pause when not (saves battery/bandwidth)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const video = e.target as HTMLVideoElement;
          if (e.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.15 }
    );

    videos.forEach((v) => observer.observe(v));

    // iOS fallback: play all videos on first touch
    const playAll = () => {
      videos.forEach((v) => v.play().catch(() => {}));
    };
    document.addEventListener("touchstart", playAll, {
      once: true,
      passive: true,
    });

    return () => {
      observer.disconnect();
      document.removeEventListener("touchstart", playAll);
    };
  }, []);

  return null; // No visible UI — just a side-effect component
}
