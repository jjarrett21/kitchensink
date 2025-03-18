#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const sanitizeInput = (input) => {
  return input.replace(/[^a-zA-Z0-9-_]/g, "");
};

const includedPackagesList = [
  "tailwindcss", "postcss", "autoprefixer", "@tanstack/react-query", "axios", "react-router", "react-router-dom", "@tailwindcss/vite", "zod", "qs"
];

const packageChecker = (input) => {
  const packages = input.split(" ");
  const alreadyIncluded = packages.filter((pkg) => includedPackagesList.includes(pkg));
  const notIncluded = packages.filter((pkg) => !includedPackagesList.includes(pkg));
  console.log("Packages already included: ", alreadyIncluded);
  console.log("Additional packages to be installed: ", notIncluded);
  return notIncluded;
};

rl.question("Enter the project name: ", (inputProjectName) => {
  rl.question("Enter additional packages (space-separated): ", (inputCustomPackages) => {
    const projectName = sanitizeInput(inputProjectName) || "my-vite-kitchen-sink-app";
    const customPackages = packageChecker(inputCustomPackages).join(" ") || "";

    console.log(`Creating React Kitchen Sink project: ${projectName}...`);
    execSync(`npx create-vite ${projectName} --template react-ts`, {
      stdio: "inherit",
    });

    const projectPath = path.join(process.cwd(), projectName);
    console.log(`Changing directory to: ${projectPath}`);

    try {
      process.chdir(projectPath);
      console.log(`Successfully changed directory to ${projectPath}`);
    } catch (err) {
      console.error(`Failed to change directory to ${projectPath}: ${err.message}`);
      process.exit(1);
    }

    console.log(
      "Installing dependencies: Tailwind, react-query, react-router, and others..."
    );
    execSync(
      `npm install ${includedPackagesList.join(" ")} ${customPackages}`,
      { stdio: "inherit" }
    );

    console.log("Installing dev dependencies: vitest... and more");

    execSync(
      "npm install -D vitest jsdom test-utils @testing-library/dom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/qs @vitejs/plugin-react",
      { stdio: "inherit" }
    );

    console.log("Setting up global styles...");
    const mainStylesPath = path.join(projectPath, "src", "index.css");
    const mainStylesContent = fs.existsSync(mainStylesPath)
      ? fs.readFileSync(mainStylesPath, "utf-8")
      : "";
    fs.writeFileSync(
      mainStylesPath,
      `@import "tailwindcss";
@tailwind base;
@tailwind components;
@tailwind utilities;
${mainStylesContent}`
    );

    const appStylesPath = path.join(projectPath, "src", "app.css");
    const appStylesContent = fs.existsSync(appStylesPath)
      ? fs.readFileSync(appStylesPath, "utf-8")
      : "";
    fs.writeFileSync(
      appStylesPath,
      `@import "tailwindcss";
@tailwind base;
@tailwind components;
@tailwind utilities;
${appStylesContent}`
    );

    console.log("Updating Vite config...");
    const viteConfigPath = path.join(projectPath, "vite.config.ts");
    const viteConfigContent = `/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
});`;
    fs.writeFileSync(viteConfigPath, viteConfigContent);

    console.log("Updating main.tsx with Providers...");
    const appTsxPath = path.join(projectPath, "src", "main.tsx");
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
      </QueryClientProvider>
    </Router>
  </StrictMode>
);
`
    );

    console.log("Creating api folder and client.ts...");
    const apiFolderPath = path.join(projectPath, "src", "api");
    const clientTsPath = path.join(apiFolderPath, "client.ts");

    if (!fs.existsSync(apiFolderPath)) {
      fs.mkdirSync(apiFolderPath);
    }

    fs.writeFileSync(
      clientTsPath,
      `import axios from "axios";
import qs from "qs";

const api = axios.create({
  baseURL: process.env.VITE_BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
});

export { api };
`
    );

    console.log("Setup complete! Run the following commands to start:");
    console.log(`cd ${projectName} && npm run dev`);

    rl.close();
  });
});