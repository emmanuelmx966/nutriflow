"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000,
          },
        },
      }),
  );

  // Silence noisy next-auth CLIENT_FETCH_ERROR logs that occur during
  // Next.js hot-module reload race conditions. These are harmless
  // (session resolves on retry) but pollute the console.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const origError = console.error;
    console.error = function (...args: unknown[]) {
      const first = args[0];
      if (
        typeof first === "string" &&
        first.includes("[next-auth][error][CLIENT_FETCH_ERROR]")
      ) {
        return; // swallow
      }
      return origError.apply(console, args as never);
    };
    return () => {
      console.error = origError;
    };
  }, []);

  return (
    <SessionProvider
      // Re-fetch session every 5 min (catches logout from another tab)
      refetchInterval={5 * 60}
      refetchOnWindowFocus={false}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <SonnerToaster
            richColors
            position="top-center"
            toastOptions={{
              style: { borderRadius: "0.75rem" },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
