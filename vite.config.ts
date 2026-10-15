import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Lovable's wrapper accepts additional Vite plugins under "vite".
  // Force Nitro's output to match Vercel Functions for SSR and route handling.
  vite: {
    plugins: [
      nitro({
        preset: "vercel",
      }),
    ],
  },
});
