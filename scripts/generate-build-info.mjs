import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "src/lib/build-info.ts");

const resolveGitSha = () => {
  const envSha =
    process.env.BUILD_GIT_SHA ||
    process.env.GIT_SHA ||
    process.env.GIT_COMMIT ||
    "";
  if (envSha.trim()) {
    return envSha.trim().slice(0, 7);
  }

  try {
    const gitSha = execSync("git rev-parse --short HEAD", {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (gitSha) {
      return gitSha;
    }
  } catch {
    // Fall back to manual .git parsing below.
  }

  const headPath = resolve(root, ".git/HEAD");
  if (existsSync(headPath)) {
    const head = readFileSync(headPath, "utf8").trim();
    if (head.startsWith("ref:")) {
      const ref = head.replace("ref:", "").trim();
      const refPath = resolve(root, ".git", ref);
      if (existsSync(refPath)) {
        const refSha = readFileSync(refPath, "utf8").trim();
        if (refSha) {
          return refSha.slice(0, 7);
        }
      }
      const packedRefsPath = resolve(root, ".git/packed-refs");
      if (existsSync(packedRefsPath)) {
        const packed = readFileSync(packedRefsPath, "utf8");
        const match = packed
          .split("\n")
          .find((line) => line.endsWith(` ${ref}`));
        if (match) {
          return match.split(" ")[0]?.slice(0, 7) || "";
        }
      }
    } else if (head) {
      return head.slice(0, 7);
    }
  }

  throw new Error(
    "Unable to resolve git SHA for build stamp. Set BUILD_GIT_SHA in the build environment.",
  );
};

const buildTime = process.env.BUILD_TIME || new Date().toISOString();
const buildSha = resolveGitSha();

const contents = `// AUTO-GENERATED FILE. DO NOT EDIT.
// This file is overwritten by scripts/generate-build-info.mjs on every build.
export const BUILD_TIME = "${buildTime}";
export const BUILD_GIT_SHA = "${buildSha}";
`;

writeFileSync(outputPath, contents);
console.log(`[build-info] ${buildTime} ${buildSha}`);
