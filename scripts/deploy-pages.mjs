import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

const owner = "piccardino";
const sourceRepository = "cozy-terminal-portfolio-pages";
const dist = resolve("dist");
mkdirSync(".local", { recursive: true });
if (!existsSync(join(dist, "index.html")))
  throw new Error("Run npm run build before deployment.");

function git(args, cwd = process.cwd()) {
  const r = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  if (r.status !== 0)
    throw new Error(
      `Git operation failed: ${args.slice(0, 2).join(" ")}\n${r.stderr}`,
    );
  return r.stdout.trim();
}
const credential = spawnSync("git", ["credential", "fill"], {
  input: "protocol=https\nhost=github.com\n\n",
  encoding: "utf8",
  env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" },
});
const fields = Object.fromEntries(
  credential.stdout
    .trim()
    .split("\n")
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
if (!fields.password) throw new Error("GitHub credentials are unavailable.");
async function api(path, method = "GET", body) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${fields.password}`,
      "X-GitHub-Api-Version": "2026-03-10",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    data: response.status === 204 ? null : await response.json(),
  };
}
const user = await api("/user");
if (user.status !== 200 || user.data.login !== owner)
  throw new Error("Unexpected GitHub account.");

function pushBuild(repository) {
  const remote = `https://github.com/${owner}/${repository}.git`;
  const dir = mkdtempSync(join(tmpdir(), "cozy-portfolio-pages-"));
  const branchExists = !!git(["ls-remote", remote, "refs/heads/gh-pages"]);
  if (branchExists)
    git(["clone", "--branch", "gh-pages", "--single-branch", remote, dir]);
  else {
    git(["init", "-b", "gh-pages"], dir);
    git(["remote", "add", "origin", remote], dir);
  }
  // Only remove files in the temporary artifact checkout, preserving its Git metadata.
  const checkoutRoot = resolve(dir);
  if (
    !checkoutRoot.startsWith(resolve(tmpdir()) + sep) ||
    !checkoutRoot.includes("cozy-portfolio-pages-")
  ) {
    throw new Error("Unexpected temporary checkout path.");
  }
  for (const file of readdirSync(checkoutRoot)) {
    if (file === ".git") continue;
    const target = resolve(checkoutRoot, file);
    if (!target.startsWith(checkoutRoot + sep))
      throw new Error("Artifact path escaped its checkout.");
    rmSync(target, { recursive: true, force: true });
  }
  cpSync(dist, checkoutRoot, { recursive: true });
  // Preserve PDF bytes when the published checkout is opened on Windows.
  writeFileSync(join(checkoutRoot, ".gitattributes"), "*.pdf binary\n");
  writeFileSync(join(checkoutRoot, ".nojekyll"), "");
  git(["add", "--all"], checkoutRoot);
  if (git(["status", "--porcelain"], checkoutRoot)) {
    git(
      [
        "commit",
        "-m",
        `Publish portfolio from ${git(["rev-parse", "--short", "HEAD"])}`,
      ],
      checkoutRoot,
    );
    git(["push", "-u", "origin", "gh-pages"], checkoutRoot);
  }
  return git(["rev-parse", "HEAD"], checkoutRoot);
}
async function configure(repository) {
  const current = await api(`/repos/${owner}/${repository}/pages`);
  if (current.status === 200) {
    const update = await api(`/repos/${owner}/${repository}/pages`, "PUT", {
      build_type: "legacy",
      source: { branch: "gh-pages", path: "/" },
    });
    if (update.status !== 204) return update;
    return api(`/repos/${owner}/${repository}/pages`);
  }
  if (current.status !== 404) return current;
  const created = await api(`/repos/${owner}/${repository}/pages`, "POST", {
    build_type: "legacy",
    source: { branch: "gh-pages", path: "/" },
  });
  // Pushing the first gh-pages branch can enable Pages before this POST completes.
  if (created.status === 409) {
    const update = await api(`/repos/${owner}/${repository}/pages`, "PUT", {
      build_type: "legacy",
      source: { branch: "gh-pages", path: "/" },
    });
    if (update.status !== 204) return update;
    return api(`/repos/${owner}/${repository}/pages`);
  }
  return created;
}

const repository = sourceRepository;
const commit = pushBuild(repository);
const pages = await configure(repository);
if (pages.status !== 200 && pages.status !== 201)
  throw new Error(
    `Pages configuration failed: HTTP ${pages.status} — ${pages.data.message}`,
  );
const site = {
  repository: `${owner}/${repository}`,
  url: pages.data.html_url,
  commit,
  sourceCommit: git(["rev-parse", "HEAD"]),
};
const updated = await api(`/repos/${owner}/${sourceRepository}`, "PATCH", {
  homepage: site.url,
});
if (updated.status !== 200)
  console.log(
    "The site was published; the repository homepage could not be updated.",
  );
writeFileSync(".local/pages-result.json", JSON.stringify(site, null, 2));
console.log(JSON.stringify(site, null, 2));
console.log(
  "GitHub Pages deployment requested. Verify the build status and live site before reporting completion.",
);
