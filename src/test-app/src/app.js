// import { create_ssr_component } from "@svelte/internal";

import { FlatBte } from "templates";
import { indexHtmlTemplate } from "templates";
import { BtePageView } from "rewriter";

const btePageView = new BtePageView(indexHtmlTemplate);

export const app = async () => {
  const server = Bun.serve({
    async fetch(req) {
      // console.log("raw bte file from plugin:");
      // console.log(FlatBte);

      const rewritedHtmlPage = await btePageView.getPageHtml(FlatBte, {
        color: "red",
      });

      console.log(rewritedHtmlPage);

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
