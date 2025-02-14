#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const projectName = process.argv[2] || "my-vite-app";
const customPackages = process.argv.slice(3).join(" ") || "";

console.log(`Creating React Kitchen Sink project: ${projectName}...`);
execSync(`npx create-vite ${projectName} --template react-ts`, {
  stdio: "inherit",
});

const projectPath = path.join(process.cwd(), projectName);
process.chdir(projectPath);

console.log(
  "Installing dependencies: Tailwind, react-query, react-router, and others..."
);
execSync(
  `npm install tailwindcss postcss autoprefixer @tanstack/react-query axios react-router react-router-dom @tailwindcss/vite zod  ${customPackages}`,
  { stdio: "inherit" }
);

console.log("Installing dev dependencies: vitest... and more");

execSync(
  "npm install -D vitest jsdom test-utils @testing-library/react @testing-library/jest-dom @testing-library/user-event",
  { stdio: "inherit" }
);

console.log("Setting up global styles...");
const mainStylesPath = path.join(projectPath, "src", "index.css");
fs.writeFileSync(
  mainStylesPath,
  `@tailwind base;
@tailwind components;
@tailwind utilities;`
);

const appStylesPath = path.join(projectPath, "src", "app.css");
fs.writeFileSync(
  appStylesPath,
  `@tailwind base;
@tailwind components;
@tailwind utilities;`
);

console.log("Updating Vite config...");
const viteConfigPath = path.join(projectPath, "vite.config.ts");
const viteConfig = fs.readFileSync(viteConfigPath, "utf-8");
const updatedViteConfig = viteConfig.replace(
  ``,
  `/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  /** @see https://vitest.dev/config/ */
  test: {
    coverage: {
      include: ["src/**/*.ts", "src/**/*.tsx"],

      reporter: ["html", "text-summary", "lcov"],
      provider: "istanbul",
    },
    reporters: ["default"],
    environment: "jsdom",
    globals: true,
    setupFiles: "./setup.ts",
  },
});
    `
);
fs.writeFileSync(viteConfigPath, updatedViteConfig);

console.log("Updating App.tsx with Providers...");
const appTsxPath = path.join(projectPath, "src", "App.tsx");
fs.writeFileSync(
  appTsxPath,
  `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { BrowserRouter as Router } from "react-router";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <QueryClientProvider client={queryClient}>
          <App />
        </FilterProvider>
      </QueryClientProvider>
    </Router>
  </StrictMode>
);
`
);

console.log("Setup complete! Run the following commands to start:");
console.log(`cd ${projectName} && npm run dev`);
