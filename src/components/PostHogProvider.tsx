"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const isValidKey = posthogKey && !posthogKey.includes("your_posthog_key");

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && isValidKey) {
      posthog.init(posthogKey, {
        api_host: "/ingest",
        ui_host: "https://eu.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false, // Disabled - Next.js App Router handles this
        capture_pageleave: true,
        debug: process.env.NODE_ENV === "development",
      });
    }
  }, []);

  // If PostHog isn't configured, just render children without the provider
  if (!isValidKey) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
