import { plugin } from "bun";

// TODO перенести эту функцию в setup
const { compile } = await import("../compiler/index.js");

export const bteRuntimePlugin = plugin({
  name: "bteRuntimePlugin",
  async setup(build) {
    build.onLoad({ filter: /\.bte$/ }, async ({ path }) => {
      const bteFile = Bun.file(path);
      const bteFileText = await bteFile.text();

      const compileResult = compile(bteFileText, {
        filename: path,
        generate: "ssr",
      });

      console.log("result on plugin: ");
      console.log(compileResult);

      return {
        contents: compileResult,
        loader: "js",
      };
    });
  },
});
