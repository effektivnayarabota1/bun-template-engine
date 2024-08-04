// TODO замени create_ssr_component на локальный пакет

// import { create_ssr_component } from "@svelte/internal";
import { create_ssr_component } from "svelte/internal";

import { FlatBte } from "templates";

export const app = async () => {
  const server = Bun.serve({
    fetch(req) {
      console.log("raw bte file from plugin:");
      console.log(FlatBte);

      console.log("create_ssr_component: ");
      console.log(create_ssr_component);

      const bteRenderResult = FlatBte.render();

      console.log("* bte render result: ");
      console.log(bteRenderResult);

      return new Response(Bun.file("./src/templates/index.html"));
    },
  });
  console.log(`bun server started at ${server.url.href}`);
  return server;
};
