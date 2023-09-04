import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://jonathanmv.github.io",
  // @TODO Remove after setting custom domain
  base: "/patoland-blog",
  integrations: [mdx(), sitemap()],
});
