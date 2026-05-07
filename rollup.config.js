import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/recipe-box-card.ts",
  output: {
    file: "dist/recipe-box-card.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    typescript({ tsconfig: "./tsconfig.json" }),
    terser(),
  ],
};
