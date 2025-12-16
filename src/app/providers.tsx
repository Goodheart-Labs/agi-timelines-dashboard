"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Only initialize PostHog if we have a valid key (not a placeholder)
const isValidKey = posthogKey && !posthogKey.includes("your_posthog_key");

if (typeof window !== "undefined" && isValidKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost || "https://us.i.posthog.com",
    person_profiles: "identified_only",
  });
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  if (!isValidKey) {
    return <>{children}</>;
  }
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
