import IndexBte from "../templates/index.bte";

export const testApp = async () => {
  const server = Bun.serve({
    fetch(req) {
      console.log(IndexBte.render());
      return new Response(Bun.file("./src/templates/index.html"));
    },
  });
  console.log(`bun server started at ${server.url.href}`);
  return server;
};
