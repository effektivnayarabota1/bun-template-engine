export const testApp = async () => {
  const server = Bun.serve({
    fetch(req) {
      return new Response("Bun!");
    },
  });
  console.log(`bun server started at ${server.url.href}`);
  return server;
};
