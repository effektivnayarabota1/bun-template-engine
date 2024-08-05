import { create_ssr_component } from "svelte/internal";

import { FlatBte } from "templates";

export const app = async () => {
  const server = Bun.serve({
    fetch(req) {

      const bteRenderResult = FlatBte.render();


    },
  });
  console.log(`bun server started at ${server.url.href}`);
  return server;
};
