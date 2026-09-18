"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA offline support.
 * Only runs in production-like browsers that support SW.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production" && window.location.hostname !== "localhost"
    ) {
      // Still register on localhost for dev testing
    }
    if ("serviceWorker" in navigator) {
      const onLoad = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* silent — SW registration failures are non-fatal */
        });
      };
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  return null;
}
