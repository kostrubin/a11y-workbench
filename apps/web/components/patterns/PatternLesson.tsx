import Link from "next/link";
import type { ReactNode } from "react";

export function PatternLesson({
  sourceFile,
  children,
}: {
  sourceFile: "FormExample.tsx" | "DialogExample.tsx" | "MenuExample.tsx";
  children: ReactNode;
}) {
  return (
    <section aria-labelledby="verification-heading">
      <h2 id="verification-heading">Verify the behavior</h2>
      {children}
      <p>
        <a href={`https://github.com/kostrubin/a11y-workbench/blob/work/apps/web/components/patterns/${sourceFile}`} target="_blank" rel="noopener noreferrer">Read the original component source</a>
        {" · "}
        <a href="https://github.com/kostrubin/a11y-workbench/blob/work/tests/e2e/patterns.spec.ts" target="_blank" rel="noopener noreferrer">Read the executable keyboard tests</a>
        {" · "}
        <a href="https://github.com/kostrubin/a11y-workbench/blob/work/tests/e2e/patterns-a11y.spec.ts" target="_blank" rel="noopener noreferrer">Read the axe checks</a>
      </p>
      <p>Automated focus and axe checks cover specific behavior. They do not establish screen-reader usability, WCAG conformance or accessibility certification. Human assistive-technology evaluation remains separate.</p>
      <p><Link href="/guides/keyboard-review/">Follow the keyboard review guide</Link> or <Link href="/workbench/">inspect a synthetic report in the workbench</Link>.</p>
    </section>
  );
}
