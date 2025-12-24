"use client";

import { PostHogProvider } from "../components/PostHogProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <PostHogProvider>{children}</PostHogProvider>;
}
