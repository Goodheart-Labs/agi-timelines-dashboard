import { PostHog } from "posthog-node";

// NOTE: This is a Node.js client for sending events from the server side to PostHog.
export default function PostHogClient() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!posthogKey || posthogKey.includes("your_posthog_key")) {
    console.warn("PostHog is not configured - skipping server-side analytics");
    return null;
  }

  const posthogClient = new PostHog(posthogKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}
