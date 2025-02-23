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

  beforeEach(() => {
    rl = {
      question: jest.fn(),
      close: jest.fn(),
    };
    readline.createInterface.mockReturnValue(rl);
    path.join.mockImplementation((...args) => args.join("/"));
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue("");
    fs.writeFileSync.mockImplementation(() => {});
    execSync.mockImplementation(() => {});
  });

  afterEach(() => {
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
      expect(execSync).toHaveBeenCalledWith(
        `npx create-vite ${projectName} --template react-ts`,
        { stdio: "inherit" }
      );
      expect(execSync).toHaveBeenCalledWith(
        `npm install tailwindcss postcss autoprefixer @tanstack/react-query axios react-router react-router-dom @tailwindcss/vite zod qs lodash moment`,
        { stdio: "inherit" }
      );
      expect(execSync).toHaveBeenCalledWith(
        "npm install -D vitest jsdom test-utils @testing-library/dom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/qs @vitejs/plugin-react",
        { stdio: "inherit" }
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/src/index.css",
        `@import "tailwindcss";
@tailwind base;
@tailwind components;
@tailwind utilities;`
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/src/app.css",
        `@import "tailwindcss";
@tailwind base;
@tailwind components;
@tailwind utilities;`
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/vite.config.ts",
        expect.stringContaining('import { defineConfig } from "vite";')
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/src/main.tsx",
        expect.stringContaining('import { StrictMode } from "react";')
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith("test-project/src/api");
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "test-project/src/api/client.ts",
        expect.stringContaining('import axios from "axios";')
      );
      done();
    });
  });
});