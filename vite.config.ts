// @lovable.dev/vite-tanstack-config already includes the required TanStack Start,
// React, Tailwind, path-alias, and Nitro plugins. Do not register duplicate plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Lovable's default Nitro target is Cloudflare. Vercel needs Nitro's Vercel
// output preset so SSR routes are served instead of returning NOT_FOUND.
const isVercelBuild = Boolean(process.env.VERCEL && process.env.VERCEL !== "0") || Boolean(process.env.VERCEL_URL);

export default defineConfig({
  tanstackStart: {
    // Keep the app's existing SSR error wrapper.
    server: { entry: "server" },
  },
  nitro: isVercelBuild ? { preset: "vercel" } : true,
});
