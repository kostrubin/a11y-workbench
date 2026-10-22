import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { articles, emptyCanonicalExample, repositoryUrl, type ArticleDefinition } from "../../apps/web/content/articles.js";
import { validateBundle } from "../../packages/core/src/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const readJson = (path: string) => JSON.parse(readFileSync(join(root, path), "utf8"));
const manifest = readJson("apps/web/content/cases.json") as {
  defaultIndexable: boolean;
  sourceRegister: { id: string; url: string }[];
  cases: {
    caseId: string;
    route: string;
    kind: string;
    consequence: string;
    sourceIds: string[];
    fixtureFiles: string[];
    sourceFiles: string[];
    testFiles: string[];
    acceptanceIds: string[];
    manualChecks: string[];
  }[];
};
const routeSpec = readJson("spec/routes.json") as { routes: { path: string; caseId: string }[] };
const manualSpec = readJson("spec/manual-checks.json") as { checks: { checkId: string }[] };
const acceptanceSpec = readJson("spec/acceptance.json") as { criteria: { id: string }[] };
const knownRoutes = new Set(routeSpec.routes.map((route) => route.path));
const knownManualIds = new Set(manualSpec.checks.map((check) => check.checkId));
const knownAcceptanceIds = new Set(acceptanceSpec.criteria.map((criterion) => criterion.id));
const trustedSourceHosts = new Set(["www.w3.org", "github.com", "playwright.dev", "cheatsheetseries.owasp.org"]);

function articleText(article: ArticleDefinition): string {
  return [
    article.lead,
    article.consequence,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.steps ?? []),
      ...(section.bullets ?? []),
      ...(section.table?.rows.flat() ?? []),
    ]),
  ].join(" ");
}

test("content traceability matches the independent fifteen-route contract", () => {
  assert.equal(manifest.cases.length, 15);
  assert.equal(new Set(manifest.cases.map((entry) => entry.caseId)).size, 15);
  assert.deepEqual(
    manifest.cases.map(({ route, caseId }) => ({ path: route, caseId })).sort((a, b) => a.path.localeCompare(b.path)),
    routeSpec.routes.map(({ path, caseId }) => ({ path, caseId })).sort((a, b) => a.path.localeCompare(b.path)),
  );
  assert.equal(manifest.defaultIndexable, false);
  assert.equal(manifest.cases.filter((entry) => entry.kind === "guide").length, 6);
  assert.equal(manifest.cases.filter((entry) => entry.kind === "pattern").length, 3);
});

test("every case resolves to maintained source, fixture, test and review identifiers", () => {
  const sourceIds = new Set(manifest.sourceRegister.map((source) => source.id));
  for (const entry of manifest.cases) {
    const routeFile = join(root, "apps/web/app", entry.route === "/" ? "page.tsx" : entry.route.slice(1), entry.route === "/" ? "" : "page.tsx");
    assert.ok(existsSync(routeFile), "Missing route source: " + entry.route);
    assert.ok(entry.consequence.length >= 40, "Missing concrete consequence: " + entry.caseId);
    assert.ok(entry.sourceIds.length > 0, "Missing source reference: " + entry.caseId);
    assert.ok(entry.sourceFiles.length > 0 && entry.testFiles.length > 0, "Missing source/test relationship: " + entry.caseId);
    for (const id of entry.sourceIds) assert.ok(sourceIds.has(id), "Unknown source ID: " + id);
    for (const path of [...entry.fixtureFiles, ...entry.sourceFiles, ...entry.testFiles]) {
      assert.ok(!path.includes("..") && !path.startsWith("/"), "Reference must remain repository relative: " + path);
      assert.ok(existsSync(join(root, path)), "Missing maintained reference: " + path);
    }
    for (const id of entry.manualChecks) assert.ok(knownManualIds.has(id), "Unknown manual check: " + id);
    for (const id of entry.acceptanceIds) assert.ok(knownAcceptanceIds.has(id), "Unknown acceptance entry: " + id);
  }
});

test("ten substantive articles have unique intent, metadata and actual static route wrappers", () => {
  const entries = Object.entries(articles);
  assert.equal(entries.length, 10);
  assert.equal(new Set(entries.map(([, article]) => article.title)).size, 10);
  assert.equal(new Set(entries.map(([, article]) => article.description)).size, 10);
  assert.equal(new Set(entries.map(([, article]) => article.lead)).size, 10);
  const renderer = readFileSync(join(root, "apps/web/components/Article.tsx"), "utf8");
  assert.doesNotMatch(renderer, /["']use client["']/);
  for (const [id, article] of entries) {
    assert.ok(knownRoutes.has(article.path), "Unknown route: " + article.path);
    assert.ok(article.title.length > 15 && article.description.length > 60);
    assert.ok(article.sections.length >= 4, "Article needs distinct substance: " + id);
    const wordCount = articleText(article).split(/\s+/).length;
    assert.ok(wordCount >= 300, "Article too short for its purpose: " + id + " (" + wordCount + " words)");
    assert.ok(article.sources.length > 0);
    const file = readFileSync(join(root, "apps/web/app", article.path.slice(1), "page.tsx"), "utf8");
    assert.ok(file.includes('articles["' + id + '"]'));
    assert.ok(file.includes('id="' + id + '"'));
    assert.match(file, /pageMetadata\(article.title, article.description, article.path\)/);
    assert.doesNotMatch(file, /["']use client["']/);
  }
});

test("article navigation resolves to the route allowlist and deliberate trusted source links", () => {
  for (const article of Object.values(articles)) {
    for (const link of [article.action, ...article.related]) {
      assert.ok(knownRoutes.has(link.href), "Unknown internal destination: " + link.href);
      assert.ok(link.href === "/" || link.href.endsWith("/"), "Inconsistent trailing slash: " + link.href);
    }
    for (const link of [...article.sources, ...article.verification.files]) {
      const url = new URL(link.href);
      assert.equal(url.protocol, "https:");
      assert.equal(url.username + url.password, "");
      assert.ok(trustedSourceHosts.has(url.hostname), "Unreviewed external source: " + link.href);
      if (link.href.startsWith(repositoryUrl + "/blob/work/")) {
        const path = link.href.slice((repositoryUrl + "/blob/work/").length);
        assert.ok(existsSync(join(root, path)), "Code link points at no maintained source: " + path);
      }
    }
  }
  for (const source of manifest.sourceRegister) {
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:");
    assert.ok(trustedSourceHosts.has(url.hostname));
  }
});

test("the complete published empty-bundle example is accepted without claiming a capture", () => {
  const bundle = validateBundle(JSON.parse(JSON.stringify(emptyCanonicalExample)));
  assert.equal(bundle.schemaVersion, "1.0");
  assert.equal(bundle.states.length, 0);
  assert.equal(bundle.producer.version, "0.0.0");
  assert.ok(articles["import-format"].sections.some((section) => section.code === JSON.stringify(emptyCanonicalExample, null, 2)));
  assert.match(articleText(articles["import-format"]), /proves no scan completed/);
});

test("authored guides distinguish expected checks, human review and uncertain evidence", () => {
  assert.match(articleText(articles["read-axe-results"]), /Incomplete/);
  assert.match(articleText(articles["read-axe-results"]), /one rule and two node occurrences/);
  assert.match(articleText(articles["compare-reports"]), /omitted menu state cannot count as fixed/);
  assert.match(articleText(articles["compare-reports"]), /exact opposite rule\/subject pair|exact rule\/subject/);
  assert.match(articleText(articles["form-errors"]), /Keep entered values/);
  assert.match(articleText(articles["dialog-focus"]), /Tab and backward with Shift\+Tab/);
  assert.match(articleText(articles["menu-or-disclosure"]), /ordinary links/);
  assert.match(articleText(articles["keyboard-review"]), /NOT RUN/);
  assert.match(articleText(articles["privacy"]), /pseudonymous, not guaranteed anonymous/);
  assert.match(articleText(articles["limitations"]), /NOT RUN/);
  assert.match(articleText(articles["about"]), /MIT/);
  assert.match(readFileSync(join(root, "apps/web/components/Article.tsx"), "utf8"), /not a claim that a command or human session passed/);
});
