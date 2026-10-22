import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (['node_modules', '.next', 'dist', 'out'].includes(e.name)) return [];
    const p = join(dir, e.name);
    return e.isDirectory() ? sourceFiles(p) : /\.(?:ts|tsx|js|mjs)$/.test(e.name) ? [p] : [];
  });
}

test('runtime source excludes HTML execution, browser persistence and remote application endpoints', () => {
  const files = [...sourceFiles('apps/web'), ...sourceFiles('packages/core/src')];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const violations: string[] = [];
    const visit = (node: ts.Node) => {
      // Parse executable syntax: educational text describing storage must remain publishable.
      if (ts.isIdentifier(node) && ['localStorage', 'sessionStorage', 'indexedDB'].includes(node.text)) violations.push('browser persistence');
      if (ts.isJsxAttribute(node) && node.name.getText(tree) === 'dangerouslySetInnerHTML') violations.push('HTML injection');
      if (ts.isPropertyAccessExpression(node) && node.name.text === 'innerHTML' && ts.isBinaryExpression(node.parent) && node.parent.left === node) violations.push('HTML assignment');
      if ((ts.isCallExpression(node) || ts.isNewExpression(node)) && ts.isIdentifier(node.expression) && ['eval', 'Function'].includes(node.expression.text)) violations.push('code execution');
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        if (ts.isIdentifier(callee) && callee.text === 'fetch' && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0]) && /^https?:\/\//.test(node.arguments[0].text)) violations.push('remote runtime fetch');
        if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'register' && ts.isPropertyAccessExpression(callee.expression) && callee.expression.name.text === 'serviceWorker') violations.push('service worker persistence');
      }
      ts.forEachChild(node, visit);
    };
    visit(tree);
    assert.deepEqual(violations, [], file);
  }
  assert.equal(existsSync('.github/workflows'), false, 'no potentially billable workflow activated');
  assert.equal(existsSync('apps/web/app/api'), false, 'no report upload endpoint');
  assert.match(readFileSync('.env.example', 'utf8'), /^SITE_RELEASE_APPROVED=false$/m);
});
