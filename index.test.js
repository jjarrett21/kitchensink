const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

jest.mock("child_process");
jest.mock("fs");
jest.mock("path");
jest.mock("readline");

describe("index.js script", () => {
  let rl;
  let originalChdir;

  beforeEach(() => {
    // Save original process.chdir and mock it
    originalChdir = process.chdir;
    process.chdir = jest.fn();

    rl = {
      question: jest.fn(),
      close: jest.fn(),
    };
    readline.createInterface.mockReturnValue(rl);
    path.join.mockImplementation((...args) => args.join("/"));
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue("");
    fs.writeFileSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});
    execSync.mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original process.chdir
    process.chdir = originalChdir;
    jest.clearAllMocks();
  });

  it("should create a new project and set up the environment", (done) => {
    const projectName = "test-project";
    const customPackages = "lodash moment";

    rl.question
      .mockImplementationOnce((question, callback) => callback(projectName))
      .mockImplementationOnce((question, callback) => callback(customPackages));

    require("./index");

    process.nextTick(() => {
      // Check project creation
      expect(execSync).toHaveBeenCalledWith(
        `npx create-vite ${projectName} --template react-ts`,
        { stdio: "inherit" }
      );

      // Check directory change
      expect(process.chdir).toHaveBeenCalledWith("test-project");

      // Check package installation
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("npm install tailwindcss postcss autoprefixer"),
        { stdio: "inherit" }
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("npm install -D vitest"),
        { stdio: "inherit" }
      );

      // Check CSS file setup
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/src/index.css",
        expect.stringContaining("@tailwind base;")
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/src/app.css",
        expect.stringContaining("@tailwind base;")
      );

      // Check Vite config setup - using more flexible expectation
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/vite.config.ts",
        expect.stringContaining('import { defineConfig } from "vite";')
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/vite.config.ts",
        expect.stringContaining('export default defineConfig({')
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/vite.config.ts",
        expect.stringContaining('plugins: [react(), tailwindcss()]')
      );

      // Check main.tsx setup
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/src/main.tsx",
        expect.stringContaining('import { StrictMode } from "react";')
      );

      // Check API folder and client setup
      expect(fs.mkdirSync).toHaveBeenCalledWith("test-project/src/api");
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/src/api/client.ts",
        expect.stringContaining('import axios from "axios";')
      );
      
      done();
    });
  });
});