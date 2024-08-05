import { plugin } from "bun";

const { compile } = await import("compiler");

const btePlugin = () => {
  return {
    name: "bteRuntimePlugin",
    async setup(build) {
      build.onLoad({ filter: /\.bte$/ }, async ({ path }) => {
        const bteFile = Bun.file(path);
        const bteFileText = await bteFile.text();

        const compileResult = compile(bteFileText, {
          filename: path,
          generate: "ssr",
        });

        return {
          contents: compileResult,
          loader: "js",
        };
      });
    },
  };
};

export const bteRuntimePlugin = plugin(btePlugin());
