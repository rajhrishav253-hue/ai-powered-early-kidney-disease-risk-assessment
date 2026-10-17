import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Build the server for whichever host is running the build: Netlify sets
  // NETLIFY=true during its builds; everything else keeps the Vercel output.
  nitro: {
    preset: process.env.NETLIFY ? "netlify" : "vercel",
  },
});
