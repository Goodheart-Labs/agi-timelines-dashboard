"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useState } from "react";

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    // Skip initialization if key is missing or a placeholder
    const isValidKey = posthogKey && !posthogKey.includes("your_posthog_key");

    if (!isValidKey) {
      return;
    }

    // Initialize PostHog only once on client-side
    if (!posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost || "https://us.i.posthog.com",
        person_profiles: "identified_only",
      });
    }

    setIsInitialized(true);
  }, []);

  // Render children with or without PostHog provider
  if (!isInitialized) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
