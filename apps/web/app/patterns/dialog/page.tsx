import type { Metadata } from "next";
import Link from "next/link";
import { DialogExample } from "../../../components/patterns/DialogExample";
import { PatternLesson } from "../../../components/patterns/PatternLesson";

export const metadata: Metadata = {
  title: "Modal dialog: focus, dismissal and return",
  description: "Try an original modal-dialog example with initial focus, native modal containment, Escape cancellation, local saving and focus restoration.",
};

export default function DialogPage() {
  return (
    <article className="page" data-case-id="pattern.dialog">
      <p className="eyebrow">Pattern lab / 02</p>
      <h1>A dialog needs a predictable way back</h1>
      <p className="lead">Opening a modal changes the active task. Make that context clear, keep background controls unavailable and return focus when the task ends.</p>
      <h2>Try the modal</h2>
      <p>Use the keyboard to open Edit display name. Change the invented name, save, reopen and cancel with Escape. All changes remain local to this demonstration.</p>
      <DialogExample />
      <section aria-labelledby="dialog-correction">
        <h2 id="dialog-correction">What the correction changes</h2>
        <p>The corrected example opens the native <code>dialog</code> with <code>showModal()</code>. Its heading supplies an accessible name, the input receives initial focus and the browser provides modal containment and background inertness. Cancel, Escape and Save all return focus to the opener. A larger dialog may need a different initial focus target; this short editing task starts at its input.</p>
        <p>The intentionally broken version displays an ordinary panel without dialog semantics, modal containment or initial-focus movement. It has a working Cancel button and an outside reset, so the demonstration does not trap visitors. Automated scans alone cannot establish whether a person understands the context change.</p>
        <p><Link href="/guides/dialog-focus/">Reproduce a dialog-focus failure and test its correction</Link>.</p>
      </section>
      <PatternLesson sourceFile="DialogExample.tsx">
        <ol>
          <li>Focus the opener and press Enter. Confirm that focus lands on Display name inside the dialog.</li>
          <li>Cycle with Tab and Shift+Tab. Confirm that focus stays in the modal and background controls cannot be activated.</li>
          <li>Press Escape. Confirm that the modal closes and focus returns to its opener.</li>
          <li>Reopen, edit the synthetic value and save. Confirm the local update and the same predictable focus return.</li>
        </ol>
        <p>Regression coverage: <code>E2E-08</code>, <code>E2E-10</code> and corrected-pattern axe checks. Capture states: <code>dialog.closed</code>, <code>dialog.open</code>, <code>dialog.saved</code>.</p>
      </PatternLesson>
      <section aria-labelledby="dialog-sources">
        <h2 id="dialog-sources">Primary sources</h2>
        <ul>
          <li><a href="https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" target="_blank" rel="noopener noreferrer">W3C APG: modal dialog pattern</a></li>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog" target="_blank" rel="noopener noreferrer">MDN: native dialog element and modal behavior</a></li>
        </ul>
      </section>
    </article>
  );
}
