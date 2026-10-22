import type { Metadata } from "next";
import Link from "next/link";
import { FormExample } from "../../../components/patterns/FormExample";
import { PatternLesson } from "../../../components/patterns/PatternLesson";

export const metadata: Metadata = {
  title: "Form validation: discover and recover from errors",
  description: "Try corrected and intentionally broken local form validation. Inspect label associations, field errors, focus recovery and success feedback.",
};

export default function FormsPage() {
  return (
    <article className="page" data-case-id="pattern.forms">
      <p className="eyebrow">Pattern lab / 01</p>
      <h1>Make form errors discoverable</h1>
      <p className="lead">An error is useful only when someone can find it, understand it and recover. This local form keeps entered values and connects each correction to its field.</p>
      <h2>Try the form</h2>
      <p>Submit the empty form, follow an error link, enter invented details and save again. No network submission or browser persistence is used.</p>
      <FormExample />
      <section aria-labelledby="form-correction">
        <h2 id="form-correction">What the correction changes</h2>
        <p>The corrected version uses explicit labels, instructions, an error summary, <code>aria-invalid</code> and error descriptions. After an invalid submission, focus moves to the summary; each summary link leads to its field. A live region reports local success without moving focus away from the form.</p>
        <p>The broken version intentionally replaces labels with unassociated visual text and omits error associations, focus recovery and live success feedback. Its surrounding controls remain usable. An automated label finding describes one defect; keyboard and human checks are still needed to understand error recovery.</p>
        <p><Link href="/guides/form-errors/">Diagnose a field-error association step by step</Link>.</p>
      </section>
      <PatternLesson sourceFile="FormExample.tsx">
        <ol>
          <li>Submit with both fields empty. Confirm that the summary receives focus and names both errors.</li>
          <li>Follow the email error link. Confirm that the email input receives focus and retains its hint and error description.</li>
          <li>Enter a synthetic display name and a valid example address. Confirm that the values survive and local success appears.</li>
          <li>Repeat in the broken version and record the differences as observations, not an accessibility score.</li>
        </ol>
        <p>Regression coverage: <code>E2E-07</code>, <code>E2E-10</code> and corrected-pattern axe checks. Capture states: <code>forms.initial</code>, <code>forms.invalid</code>, <code>forms.success</code>.</p>
      </PatternLesson>
      <section aria-labelledby="forms-sources">
        <h2 id="forms-sources">Primary sources</h2>
        <ul>
          <li><a href="https://www.w3.org/WAI/tutorials/forms/labels/" target="_blank" rel="noopener noreferrer">W3C WAI: labeling controls</a></li>
          <li><a href="https://www.w3.org/WAI/tutorials/forms/validation/" target="_blank" rel="noopener noreferrer">W3C WAI: validating input</a></li>
          <li><a href="https://www.w3.org/WAI/tutorials/forms/notifications/" target="_blank" rel="noopener noreferrer">W3C WAI: user notifications</a></li>
        </ul>
      </section>
    </article>
  );
}
