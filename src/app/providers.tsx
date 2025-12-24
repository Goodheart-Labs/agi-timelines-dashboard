"use client";

import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Only initialize PostHog if we have a valid key (not a placeholder)
const isValidKey = posthogKey && !posthogKey.includes("your_posthog_key");

if (typeof window !== "undefined" && isValidKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost || "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // We capture pageviews manually for Next.js App Router
    capture_pageleave: true,
  });
}

function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthogClient.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  if (!isValidKey) {
    return <>{children}</>;
  }
  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}
