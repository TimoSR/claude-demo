import css from "rollup-plugin-css-only";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import serve from "rollup-plugin-serve";
import svelte from "rollup-plugin-svelte";

export default {
  input: "src/main.js",
  output: {
    file: "dist/bundle.js",
    format: "iife",
    sourcemap: true,
  },
  plugins: [
    svelte(),
    css({ output: "bundle.css" }),
    nodeResolve({ browser: true }),
    process.env.ROLLUP_WATCH && serve({
      contentBase: ".",
      host: "localhost",
      port: 5173,
    }),
  ].filter(Boolean),
};
