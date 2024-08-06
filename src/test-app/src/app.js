// import { create_ssr_component } from "@svelte/internal";

import { IndexComponent } from "templates";
import { indexHtmlTemplate } from "templates";
import { Bte } from "rewriter";

const bte = new Bte(indexHtmlTemplate);

export const app = async () => {
  const server = Bun.serve({
    async fetch(req) {
      const rewritedHtmlPage = await bte.getPageHtml(IndexComponent, {
        color: "red",
      });

      return new Response(rewritedHtmlPage, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    },
  });
  console.log(`bun server started at ${server.url.href}`);
  return server;
};
