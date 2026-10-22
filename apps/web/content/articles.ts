export type ArticleId =
  | "read-axe-results"
  | "compare-reports"
  | "form-errors"
  | "dialog-focus"
  | "menu-or-disclosure"
  | "keyboard-review"
  | "import-format"
  | "privacy"
  | "limitations"
  | "about";

export interface ContentLink {
  label: string;
  href: string;
}

export interface ArticleSection {
  heading: string;
  paragraphs: readonly string[];
  steps?: readonly string[];
  bullets?: readonly string[];
  table?: { headings: readonly string[]; rows: readonly (readonly string[])[] };
  code?: string;
}

export interface ArticleDefinition {
  caseId: string;
  path: string;
  kind: "Guide" | "Reference" | "Project";
  title: string;
  description: string;
  lead: string;
  consequence: string;
  action: ContentLink;
  sections: readonly ArticleSection[];
  verification: {
    command: string;
    expected: string;
    manual: string;
    files: readonly ContentLink[];
  };
  sources: readonly ContentLink[];
  related: readonly ContentLink[];
}

export const repositoryUrl = "https://github.com/kostrubin/a11y-workbench";
export const sourceUrl = (path: string): string => repositoryUrl + "/blob/work/" + path;

export const emptyCanonicalExample = {
  schemaVersion: "1.0",
  normalizationVersion: "1",
  reportId: "1626f136-bced-4b42-af32-b78900e5ccf2",
  createdAt: "2026-10-21T12:00:00.000Z",
  producer: { name: "a11y-workbench", version: "0.0.0" },
  identity: {
    namespace: "02dde330-4100-4d74-90e6-918844d693cb",
    method: "explicit",
  },
  states: [],
};

const formSources: readonly ContentLink[] = [
  { label: "WAI: validating input", href: "https://www.w3.org/WAI/tutorials/forms/validation/" },
  { label: "WAI: user notifications", href: "https://www.w3.org/WAI/tutorials/forms/notifications/" },
];
const dialogSources: readonly ContentLink[] = [
  { label: "WAI-ARIA APG: modal dialog pattern", href: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" },
];
const menuSources: readonly ContentLink[] = [
  { label: "WAI-ARIA APG: menu button pattern", href: "https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/" },
  { label: "WAI-ARIA APG: disclosure navigation", href: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/" },
];
const evidenceSources: readonly ContentLink[] = [
  { label: "axe-core API and result objects", href: "https://github.com/dequelabs/axe-core/blob/develop/doc/API.md" },
  { label: "Playwright: accessibility testing", href: "https://playwright.dev/docs/accessibility-testing" },
  { label: "W3C: choosing evaluation tools", href: "https://www.w3.org/WAI/test-evaluate/tools/selecting/" },
];

export const articles: Record<ArticleId, ArticleDefinition> = {
  "read-axe-results": {
    caseId: "guide-read-axe",
    path: "/guides/read-axe-results/",
    kind: "Guide",
    title: "Read an axe result without losing its limits",
    description: "Separate violations, incomplete checks, passes and inapplicable rules, then use state and node evidence to choose the next check.",
    lead: "Start with what was captured. A rule result describes an observation in a particular interface state; it is not a verdict on every page or every person’s experience.",
    consequence: "A single rule can affect several controls. Treating its rule count as the number of affected controls hides work, while treating an incomplete result as a pass hides uncertainty.",
    action: { label: "Inspect the synthetic sample", href: "/workbench/" },
    sections: [
      {
        heading: "Read the capture before the finding",
        paragraphs: [
          "Open the supplied sample and select a state such as forms.initial or dialog.open. Read the declared engine version, capture status and scope before interpreting the findings. A closed dialog and an open dialog are different observations, even when they belong to the same page.",
          "The bundled contract sample is hand-authored synthetic data. Its sentinel engine versions explain the comparison rules; they are not evidence that axe scanned this website. A real CLI capture records the installed engine and the states it actually exercised.",
        ],
        steps: [
          "Choose a state and check whether its capture is complete, partial or an error.",
          "Read automated outcomes separately from user-reported manual checks.",
          "Select a rule/subject finding and read its safe identifiers, impact and comparison reason.",
          "Open a trusted explanation from the bundled catalog, then reproduce the interaction in the related pattern.",
        ],
      },
      {
        heading: "Keep all four outcome categories",
        paragraphs: ["The categories answer different questions. Do not add them into an accessibility score."],
        table: {
          headings: ["Outcome", "What it means here", "Useful next action"],
          rows: [
            ["Violation", "The engine reported a failed automated check.", "Inspect the rule and affected subject, correct the behavior and retest."],
            ["Incomplete", "The engine could not reach a conclusive result.", "Record what needs human review; do not relabel it as a pass."],
            ["Pass", "A supplied automated evaluation passed for its scope.", "Keep the evidence; continue the relevant manual checks."],
            ["Inapplicable", "The supplied rule did not apply in this scope.", "Keep it separate; it is not a pass for a particular subject."],
          ],
        },
      },
      {
        heading: "Count rules and affected nodes explicitly",
        paragraphs: [
          "One missing-label rule can contain two affected input nodes. That is one rule and two node occurrences, not two independent rule types. Workbench preserves both counts so a filter does not silently change their meaning.",
          "Counts describe the records supplied by the report. A producer may omit detailed pass nodes, or capture only part of a page. A zero-finding array does not prove that navigation, scanning or human review completed successfully.",
          "Raw source HTML, selector text and failure messages are discarded during normalization. This reduces what can enter an export. It also means the minimized finding cannot reconstruct every diagnostic detail from the original scanner.",
        ],
      },
      {
        heading: "Turn the observation into a check",
        paragraphs: [
          "For a form finding, try the corrected and intentionally broken examples, submit invalid synthetic data, and check whether you can discover the relevant error and recover. For a dialog finding, check opening focus and focus return as well as the accessible name.",
          "Axe can help find structural failures. A keyboard assertion can measure focus movement. Neither means that someone listened to a screen reader or understood the interface. Keep any unperformed manual check marked not-run.",
        ],
      },
    ],
    verification: {
      command: "npm test\nnpm run test:e2e",
      expected: "Core tests preserve separate outcome counts; browser tests exercise sample inspection and a supported raw axe import.",
      manual: "Describe the selected state, rule and subject in your own words. Record any unresolved interpretation as a manual observation rather than a scanner pass.",
      files: [
        { label: "Independent comparison oracle", href: sourceUrl("fixtures/contract/expected-comparison.json") },
        { label: "Workbench browser tests", href: sourceUrl("tests/e2e/workbench.spec.ts") },
      ],
    },
    sources: evidenceSources,
    related: [
      { label: "Understand a comparison", href: "/guides/compare-reports/" },
      { label: "Accepted JSON and limits", href: "/docs/import-format/" },
      { label: "Review a form error", href: "/patterns/forms/" },
    ],
  },
  "compare-reports": {
    caseId: "guide-compare",
    path: "/guides/compare-reports/",
    kind: "Guide",
    title: "Compare reports with enough evidence",
    description: "Use compatible states and exact rule/subject evaluation evidence to distinguish new, persisting, changed, not-detected and unassessable findings.",
    lead: "A finding disappearing from a file is useful information. It becomes “Not detected in this run” only when a comparable candidate actually passed the same rule for the same subject.",
    consequence: "Skipping a dialog, removing a component or changing the scanner can make a report smaller while leaving an accessibility barrier untested.",
    action: { label: "Try the sample comparison", href: "/workbench/" },
    sections: [
      {
        heading: "Hold the experiment steady",
        paragraphs: [
          "Capture the same named state with the same engine, enabled rules and options, stable capture scope, browser environment and identity namespace. Workbench checks these declarations per state. A report’s producer declaration is supplied evidence, not an authenticated signature.",
          "Stable subject aliases such as dialog.close-button can survive a wording change. When explicit aliases are unavailable, the importer derives namespace-scoped HMAC fingerprints from full selector targets. The in-memory key is shared within the current workspace and never exported.",
          "Independently generated namespaces cannot be joined because two selectors look similar. A selector change may change identity. That produces uncertainty rather than a guessed fix or a guessed new defect.",
        ],
      },
      {
        heading: "Read the five comparison categories",
        paragraphs: ["Open the sample comparison and inspect the reason attached to each row."],
        table: {
          headings: ["Label", "Evidence required"],
          rows: [
            ["Still detected", "The same comparable rule/subject and observation signature appear in both runs."],
            ["Changed", "The comparable finding remains, but supported impact or check evidence changed."],
            ["Newly detected", "The candidate has a violation and the baseline records a pass for that exact rule/subject."],
            ["Not detected in this run", "The baseline has a violation and the comparable candidate records an exact pass."],
            ["Cannot assess", "Identity, configuration, completeness or exact evaluation coverage is insufficient."],
          ],
        },
      },
      {
        heading: "Reproduce the independent sample",
        paragraphs: [
          "The hand-authored baseline contains form findings F1/F2, dialog finding F3 and menu finding F4. The candidate keeps F1/F3, records an exact pass for F2, introduces F5 after its exact baseline pass, and omits the menu.open state.",
          "The independent expected result is one Newly detected, two Still detected, one Not detected in this run and one Cannot assess. The omitted menu state cannot count as fixed. A separate finding-change fixture demonstrates Changed without manufacturing an improvement.",
          "Incomplete results need care. A transition from a violation to an incomplete evaluation cannot establish improvement. An unchanged incomplete finding can remain visible as Still detected, with its Needs review status intact.",
        ],
      },
      {
        heading: "Know when to keep a descriptive view",
        paragraphs: [
          "A raw axe file remains useful for inspecting reported results even when it lacks capture provenance. Separate inventories of executed rules and observed subjects do not prove that every rule evaluated every subject. An inapplicable rule is not a subject-level pass.",
          "When Workbench says Cannot assess, read the reason and improve the next capture: include the omitted state, preserve namespace, record the actual configuration, or retain the exact evaluated pair. Do not edit the report merely to make its badge reassuring.",
        ],
      },
    ],
    verification: {
      command: "npm test\nnpm run test:e2e",
      expected: "The independent fixture oracle matches 1 new, 2 persisting, 0 changed, 1 not-detected and 1 unassessable; changed/incomplete/configuration variants retain their distinct meaning.",
      manual: "Explain why the missing menu state cannot prove a correction. Review the relevant interaction again after interpreting the automated comparison.",
      files: [
        { label: "Baseline contract fixture", href: sourceUrl("fixtures/contract/baseline-v1.json") },
        { label: "Candidate contract fixture", href: sourceUrl("fixtures/contract/candidate-v1.json") },
        { label: "Independent expected comparison", href: sourceUrl("fixtures/contract/expected-comparison.json") },
        { label: "Comparison and import tests", href: sourceUrl("tests/e2e/workbench.spec.ts") },
      ],
    },
    sources: evidenceSources,
    related: [
      { label: "Read axe outcomes", href: "/guides/read-axe-results/" },
      { label: "Capture and import formats", href: "/docs/import-format/" },
      { label: "Comparison limitations", href: "/limitations/" },
    ],
  },
  "form-errors": {
    caseId: "guide-form-errors",
    path: "/guides/form-errors/",
    kind: "Guide",
    title: "Make a field error discoverable",
    description: "Reproduce an invalid form submission, associate the message with its field and test recovery without losing entered values.",
    lead: "An error is useful when the person can identify the field, understand the correction and continue. A red border by itself does none of those jobs.",
    consequence: "A disconnected message can leave a keyboard or screen-reader user searching the page for the reason submission failed.",
    action: { label: "Try the form pattern", href: "/patterns/forms/" },
    sections: [
      {
        heading: "Reproduce the problem with synthetic data",
        paragraphs: [
          "The form example asks for a display name and email address. It performs local demonstration validation and never submits those values to a service. Use invented values in both variants; this is a pattern lab, not an account form.",
          "Begin with the corrected variant, then intentionally select the broken variant to compare the documented association failure. The surrounding page and its reset control remain available. A deliberately broken example is not permission to exclude the whole application from accessibility checks.",
        ],
        steps: [
          "Reach the form using Tab and submit with both fields empty.",
          "Read the visible correction messages and check which control receives focus.",
          "Enter a display name and an invalid email format, then submit again.",
          "Correct the email using the keyboard and submit; check the local success feedback and retained values.",
        ],
      },
      {
        heading: "Connect labels, instructions and errors",
        paragraphs: [
          "Give the control an explicit visible label. Keep required-field instructions available before submission. When a field is invalid, show a specific text explanation, expose its invalid state, and associate the error with that control using a stable description reference.",
          "The correction should say what the user can do, such as entering an email address in the required format. Do not replace the field label with an error, rely on placeholder text as the label, or communicate the result only by color.",
          "For longer forms, a focused error summary that links to invalid fields may help. This small example uses a bounded strategy appropriate to two fields. The right feedback placement depends on the form; it is not a universal instruction to move focus after every keystroke.",
        ],
      },
      {
        heading: "Preserve recovery and announce the outcome",
        paragraphs: [
          "Keep entered values when validation fails. A user who has completed one field should not have to re-enter it to fix another. Allow edits in place and ensure the success message describes the actual local result without implying that a server saved anything.",
          "Use a status or alert strategy that announces meaningful changes without repeating every keypress. An automated name/description assertion can check that the field has the expected relationship. A human review is still needed to assess timing, clarity and verbosity with the chosen assistive technology.",
        ],
      },
      {
        heading: "Check behavior and structure together",
        paragraphs: [
          "The maintained FormExample source is the reference for this page. Browser regression tests exercise invalid submission, correction and success; scoped axe checks look for additional structural findings. Reading this guide is not evidence that those tests passed in a particular environment.",
          "In a product form, repeat the review with its real error paths, input methods and server responses. This demonstration has no server validation, international address model, authentication or saved submission.",
        ],
      },
    ],
    verification: {
      command: "npm run test:e2e -- --grep 'forms:'\nnpm run test:a11y",
      expected: "Invalid fields expose labels, invalid state and associated feedback; correction preserves values and reaches a local success state without a request.",
      manual: "Check whether the message is understandable when discovered by keyboard and with the selected screen reader. Human assistive-technology evaluation remains NOT RUN unless separately recorded.",
      files: [
        { label: "Maintained form source", href: sourceUrl("apps/web/components/patterns/FormExample.tsx") },
        { label: "Pattern keyboard regressions", href: sourceUrl("tests/e2e/patterns.spec.ts") },
        { label: "Corrected-pattern axe checks", href: sourceUrl("tests/e2e/patterns-a11y.spec.ts") },
      ],
    },
    sources: formSources,
    related: [
      { label: "Form pattern lab", href: "/patterns/forms/" },
      { label: "Keyboard review procedure", href: "/guides/keyboard-review/" },
      { label: "Interpreting automated findings", href: "/guides/read-axe-results/" },
    ],
  },
  "dialog-focus": {
    caseId: "guide-dialog-focus",
    path: "/guides/dialog-focus/",
    kind: "Guide",
    title: "Follow focus into and out of a dialog",
    description: "Test initial focus, modal keyboard containment, Escape, save/cancel behavior and focus restoration in a small dialog.",
    lead: "Opening a dialog changes the active interaction context. Focus must help the person find that context and return to useful work when the dialog closes.",
    consequence: "A dialog that leaves focus behind or loses it on close can make a small edit feel like an unexplained jump through the page.",
    action: { label: "Try the dialog pattern", href: "/patterns/dialog/" },
    sections: [
      {
        heading: "Walk the complete interaction",
        paragraphs: [
          "Use the corrected Edit display name demonstration with synthetic text. The three captured states are dialog.closed, dialog.open and dialog.saved. The saved state describes an in-memory demonstration, not an account update.",
          "Start at the opener using the keyboard. Observe focus as the dialog opens, rather than assuming that a visible overlay is already modal. A visual backdrop and an aria-modal declaration alone cannot implement keyboard containment.",
        ],
        steps: [
          "Activate the opener with Enter or Space and identify the focused element.",
          "Move forward with Tab and backward with Shift+Tab through the active controls.",
          "Check that background controls cannot be activated while the modal is open.",
          "Press Escape, then reopen and use Cancel; verify a useful focus destination after each close.",
          "Reopen, edit synthetic text and Save; check feedback and return to the opener.",
        ],
      },
      {
        heading: "Choose initial focus for the content",
        paragraphs: [
          "For a short edit dialog, placing initial focus in the editable field can make the task immediately available. A long explanatory dialog or a destructive confirmation may need a different initial target so important content is not bypassed.",
          "Give the dialog a visible accessible name. Associate a concise description when it helps; do not force all complex contents into a single long announcement. Keep a visible close or cancel control that people can find without knowing an Escape shortcut.",
          "This example uses its maintained component as the behavioral reference. It demonstrates a specific editing task, not a general-purpose modal component certified for every browser and assistive technology.",
        ],
      },
      {
        heading: "Keep focus and background behavior consistent",
        paragraphs: [
          "Forward and backward keyboard navigation should remain within an open modal. Background content must be unavailable to the active interaction, not merely dimmed. Closing normally returns focus to the opener; when an application removes that opener, it needs an intentional useful alternative.",
          "The intentionally broken variant exists to make a limited focus/context problem observable. Use the page’s outside reset/exit mechanism if needed, and return to the corrected variant before assessing the workbench shell.",
        ],
      },
      {
        heading: "Measure the parts automation can see",
        paragraphs: [
          "Browser assertions can inspect the focused element before opening, during navigation and after dismissal. Axe can inspect relevant structural properties. Neither confirms how a screen reader announces the transition or whether a person understood the dialog’s purpose.",
          "For a real product, check opening from every trigger, validation inside the dialog, changes that remove controls, and dismissal during a pending action. Those additional workflows are outside this small synthetic recipe.",
        ],
      },
    ],
    verification: {
      command: "npm run test:e2e -- --grep 'dialog:'\nnpm run test:a11y",
      expected: "The corrected modal receives intentional focus, contains forward/backward Tab, closes predictably and restores focus after Cancel, Escape and Save.",
      manual: "Listen to the opening context and confirm the editing task can be understood and completed. Human screen-reader evaluation remains NOT RUN unless recorded separately.",
      files: [
        { label: "Maintained dialog source", href: sourceUrl("apps/web/components/patterns/DialogExample.tsx") },
        { label: "Pattern focus regressions", href: sourceUrl("tests/e2e/patterns.spec.ts") },
        { label: "Corrected-pattern axe checks", href: sourceUrl("tests/e2e/patterns-a11y.spec.ts") },
      ],
    },
    sources: dialogSources,
    related: [
      { label: "Dialog pattern lab", href: "/patterns/dialog/" },
      { label: "Record a keyboard observation", href: "/guides/keyboard-review/" },
      { label: "Coverage limitations", href: "/limitations/" },
    ],
  },
  "menu-or-disclosure": {
    caseId: "guide-menu-choice",
    path: "/guides/menu-or-disclosure/",
    kind: "Guide",
    title: "Choose an action menu or a disclosure",
    description: "Distinguish application commands from ordinary navigation, then verify the keyboard contract of the chosen interaction.",
    lead: "A popup’s appearance does not decide its semantics. Start with what the user is doing: running a command, or revealing ordinary links and content.",
    consequence: "Adding menu roles to ordinary navigation can create keyboard expectations that the controls do not meet.",
    action: { label: "Try the action menu", href: "/patterns/menu-button/" },
    sections: [
      {
        heading: "Choose based on the task",
        paragraphs: [
          "The pattern lab’s menu runs local demonstration commands, such as changing the displayed view. That is a bounded action-menu task. Its items behave as commands within a composite widget.",
          "A button that reveals links to other pages usually needs a disclosure pattern with ordinary links. Keep Tab navigation and link semantics familiar. Do not add menu/menuitem roles simply because a designer calls the visual component a dropdown menu.",
        ],
        table: {
          headings: ["User task", "Useful starting point", "Keyboard expectation"],
          rows: [
            ["Run a local application command", "Action menu button", "Open the menu, navigate its items and activate a command."],
            ["Reveal navigation links", "Disclosure button and ordinary links", "Expand/collapse the section; Tab through its links."],
            ["Choose a value for a field", "Native select when suitable", "Use the native control’s selection model rather than a command menu."],
          ],
        },
      },
      {
        heading: "Test the action menu’s complete key sequence",
        paragraphs: [
          "The corrected demonstration begins closed. The button exposes its expanded state and popup relationship. On open, focus enters the menu’s item navigation model; the page does not make every menu item a separate permanent Tab stop.",
          "The captured states are menu.closed, menu.open and menu.selected. Selecting a command updates local synthetic feedback. No remote command, account change or form submission is performed.",
        ],
        steps: [
          "Reach the button with Tab and open it with Enter; repeat with Space in a fresh run.",
          "Move through the items with the documented arrow keys and test Home/End.",
          "Activate a command and check the result and focus destination.",
          "Reopen and dismiss with Escape; check that focus returns predictably.",
          "Use Tab to continue through the page without trapping the user in the widget.",
        ],
      },
      {
        heading: "Keep the visible state truthful",
        paragraphs: [
          "A control that looks open should not announce collapsed. Focused, selected and expanded are different states; label the visible result of a command rather than using an arbitrary focus style as evidence of selection.",
          "Compare the deliberately broken variant only after entering it intentionally. Its documented failure helps explain the expected contract, while the outside reset control provides a way back to the corrected demonstration.",
        ],
      },
      {
        heading: "Review semantics and usability separately",
        paragraphs: [
          "Automated role/state checks and keyboard assertions can expose a mismatch between the menu contract and implementation. A human review must still consider discoverability, the wording of commands and announcements with the selected assistive technology.",
          "This P0 example is a single-level action menu. It does not implement nested submenus, a complete menubar, touch-gesture compatibility guarantees or every desktop application convention. Use the simpler pattern that matches the task instead of expanding this example by guesswork.",
        ],
      },
    ],
    verification: {
      command: "npm run test:e2e -- --grep 'menu:'\nnpm run test:a11y",
      expected: "Enter/Space opening, item navigation, command activation, dismissal and focus return follow the corrected action-menu contract.",
      manual: "Confirm that people can discover the commands and understand the result. Human assistive-technology evaluation remains NOT RUN unless recorded separately.",
      files: [
        { label: "Maintained action-menu source", href: sourceUrl("apps/web/components/patterns/MenuExample.tsx") },
        { label: "Pattern keyboard regressions", href: sourceUrl("tests/e2e/patterns.spec.ts") },
        { label: "Corrected-pattern axe checks", href: sourceUrl("tests/e2e/patterns-a11y.spec.ts") },
      ],
    },
    sources: menuSources,
    related: [
      { label: "Action-menu pattern lab", href: "/patterns/menu-button/" },
      { label: "Keyboard review procedure", href: "/guides/keyboard-review/" },
      { label: "Read automated results", href: "/guides/read-axe-results/" },
    ],
  },
  "keyboard-review": {
    caseId: "guide-keyboard",
    path: "/guides/keyboard-review/",
    kind: "Guide",
    title: "Run a bounded keyboard review",
    description: "Follow a repeatable keyboard path through import, findings, manual checks and exports, recording observations separately from automation.",
    lead: "Review one useful task from its starting state to its outcome. Record what you did and observed so another person can reproduce the same path.",
    consequence: "A checklist marked pass without a task, state or observation gives the next reviewer little evidence about what was actually usable.",
    action: { label: "Review the sample workflow", href: "/workbench/" },
    sections: [
      {
        heading: "Define the boundary before you start",
        paragraphs: [
          "Choose a task such as inspecting the synthetic sample and exporting a minimized report. State the browser and operating system you actually used. A keyboard review is not a substitute for a screen-reader session, and a headless browser focus assertion is not a human review.",
          "Begin from a known state. For the workbench, load the sample instead of a real report. For the pattern lab, use the corrected default and its reset control. If you later test a broken variant, record that it was the intentionally broken demonstration.",
        ],
      },
      {
        heading: "Follow a repeatable path",
        paragraphs: ["Use the keys the control’s semantics call for. Tab is a way through the page; arrow keys have a more local meaning inside widgets such as the action menu."],
        steps: [
          "Use Tab to reach the skip link and enter the main content. Check that focus is visible and not hidden beneath another element.",
          "Reach the file picker or sample action, then move through state and outcome filters without needing a pointer.",
          "Select a finding, read its details and return to the findings list. At a narrow viewport, check that the return action restores useful focus.",
          "Reach a manual check and deliberately choose a status. Supply a concrete local observation or a not-applicable reason.",
          "Inspect the export preview before activating the explicit download action.",
          "Clear the workspace and confirm that the imported findings and local notes disappear. Reload to confirm session data does not return.",
        ],
      },
      {
        heading: "Record an observation you can reproduce",
        paragraphs: [
          "A useful synthetic observation might read: “In forms.invalid, submitting two empty fields moved focus to the first invalid field; its visible error described the required value. After correction, the local success message appeared.” That is more informative than “keyboard good.”",
          "If a task fails, record the last successful step, the key pressed and the visible or focused result. Do not include personal data in an observation. Workbench keeps these free-text notes only in the current session and excludes them from P0 exports.",
          "Pass, fail and not-applicable are user-reported manual statuses. A not-applicable selection needs a reason. Importing a minimized status does not restore its omitted observation or independently verify someone else’s claim.",
        ],
      },
      {
        heading: "Add the checks this path cannot cover",
        paragraphs: [
          "Repeat important tasks at narrow widths and with reduced motion. Check real browser zoom where available; changing device pixel ratio or CSS zoom is not equivalent to a 200% browser-zoom review.",
          "A separate assistive-technology session should record the actual browser, operating system, screen reader/version and observation. If no session happened, its status is NOT RUN. A zero-violation scan or successful keyboard test cannot fill that entry.",
        ],
      },
    ],
    verification: {
      command: "npm run test:e2e\nnpm run test:a11y",
      expected: "Browser regressions inspect structural focus and keyboard behavior; their results remain separate from user-reported manual observations.",
      manual: "Complete the bounded path above and retain a truthful observation. No screen-reader session is claimed by this guide.",
      files: [
        { label: "Workbench browser regressions", href: sourceUrl("tests/e2e/workbench.spec.ts") },
        { label: "Pattern keyboard regressions", href: sourceUrl("tests/e2e/patterns.spec.ts") },
        { label: "Human evaluation record", href: sourceUrl("docs/VERIFICATION.md") },
      ],
    },
    sources: [
      { label: "Understanding WCAG: keyboard", href: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html" },
      { label: "W3C: selecting evaluation tools", href: "https://www.w3.org/WAI/test-evaluate/tools/selecting/" },
      { label: "Playwright: accessibility testing", href: "https://playwright.dev/docs/accessibility-testing" },
    ],
    related: [
      { label: "Form error recovery", href: "/guides/form-errors/" },
      { label: "Dialog focus", href: "/guides/dialog-focus/" },
      { label: "What remains untested", href: "/limitations/" },
    ],
  },
  "import-format": {
    caseId: "docs-import",
    path: "/docs/import-format/",
    kind: "Reference",
    title: "Import formats, capture commands and limits",
    description: "Use supported raw axe JSON or the canonical Workbench 1.0 bundle, with explicit size, identity, coverage and export boundaries.",
    lead: "Import a UTF-8 JSON file through the labelled picker or drop area. The parser supports a bounded raw axe result shape and the versioned Workbench bundle; a .json extension alone does not make a report compatible.",
    consequence: "Unsupported or incomplete data must produce an explanation. It must never be silently reshaped into a successful scan or overwrite the last valid workspace.",
    action: { label: "Open the file importer", href: "/workbench/" },
    sections: [
      {
        heading: "Two supported inputs",
        paragraphs: [
          "Raw axe JSON contains the engine declaration and its violations, incomplete, passes and inapplicable arrays. Findings contain rule IDs and node records. Workbench normalizes supported identifiers, result categories and node evidence; it discards source HTML, URLs, names, literal messages and arbitrary metadata.",
          "A canonical bundle declares schemaVersion 1.0, normalizationVersion 1, reportId, createdAt, producer, identity and states. Each state contains its capture, findings, manualChecks and separate reportedOutcomes. The published JSON Schema defines the exact serialized shape; the core validator also enforces uniqueness, aggregate limits and matching evaluated-pair/finding evidence.",
          "The object below is a complete, deliberately empty canonical example with a sentinel producer version. It contains no capture and proves no scan completed. Use the supplied synthetic sample or the full fixture links for meaningful findings.",
        ],
        code: JSON.stringify(emptyCanonicalExample, null, 2),
      },
      {
        heading: "Capture a real local synthetic run",
        paragraphs: [
          "Build and serve the application on the documented loopback port before capture. The CLI accepts an explicit HTTP loopback origin and output path, then visits only the bundled synthetic recipes. Its default corrected variant captures the nine named form, dialog and menu states.",
          "Use the same explicitly selected identity file for a baseline/candidate pair so their namespace is stable. Keep that file and its keys out of Git. A new independent capture otherwise receives a new namespace, and Workbench will conservatively limit comparison.",
        ],
        code: [
          "npm run build",
          "npm run preview",
          "# In another terminal in the same development environment:",
          "mkdir -p local-reports identity-keys",
          "npm run capture -- --origin http://127.0.0.1:4173 --output local-reports/capture.json --identity-file identity-keys/demo.json",
        ].join("\n"),
      },
      {
        heading: "Limits are rejection boundaries",
        paragraphs: ["The importer rejects an over-limit report atomically. It does not silently truncate records and call the capture complete."],
        table: {
          headings: ["Resource", "P0 limit"],
          rows: [
            ["UTF-8 input file", "10 MiB; JSON only, no archives or compression"],
            ["States per bundle", "50"],
            ["Total source node occurrences", "10,000 across all outcome categories"],
            ["Canonical findings / evaluated pairs", "10,000 each across the bundle"],
            ["Manual check records", "2,000"],
            ["JSON nesting depth / container entries", "64 / 250,000 aggregate entries"],
            ["Raw string / canonical identifier", "64 KiB / 128 ASCII characters"],
            ["Check IDs per group / executed rules per state", "100 / 1,000"],
            ["Concurrent files / import watchdog", "At most two / five seconds"],
          ],
        },
      },
      {
        heading: "Common rejection and uncertainty cases",
        paragraphs: [
          "Unknown schema versions, extra fields at canonical object boundaries, invalid identifiers, duplicate state or pair identities, poison property names and contradictory counts are rejected. A failed or cancelled import keeps the last valid report available.",
          "A Playwright HTML report, trace ZIP, generic reporter JSON, axe HTML report or future Workbench schema is not a supported substitute. Save the actual axe result object or produce a canonical bundle through the local runner.",
          "A raw axe import may lack trustworthy capture metadata and exact pass evidence. It can remain useful for inspection while comparison says Cannot assess. Imported producer and completeness declarations are not cryptographic proof of provenance.",
        ],
      },
      {
        heading: "Export a smaller record deliberately",
        paragraphs: [
          "Use the preview to review the normalized fields and counts, then choose the explicit JSON or Markdown download. JSON can be reimported; Markdown is a readable summary and is not accepted as an import.",
          "Exports omit source HTML, selectors, accessible names, input values, URLs, raw messages, notes, tester context and identity keys. They retain opaque aliases and fingerprints, which can still reveal equality or project structure. Minimized does not mean guaranteed anonymous.",
        ],
      },
    ],
    verification: {
      command: "npm test\nnpm run check:security\nnpm run test:e2e",
      expected: "Valid canonical/raw inputs normalize; invalid shapes and resource-limit cases fail without replacing the last valid workspace; exports omit sensitive canaries.",
      manual: "Check that the explanation describes your actual input and capture boundary before sharing any minimized report.",
      files: [
        { label: "Executable JSON Schema", href: sourceUrl("schemas/report-bundle.schema.json") },
        { label: "Full baseline bundle", href: sourceUrl("fixtures/contract/baseline-v1.json") },
        { label: "Canonical architecture contract", href: sourceUrl("docs/ARCHITECTURE.md") },
        { label: "Capture CLI source", href: sourceUrl("packages/cli/src/index.ts") },
      ],
    },
    sources: evidenceSources.slice(0, 2),
    related: [
      { label: "Import and inspect", href: "/workbench/" },
      { label: "Comparison evidence", href: "/guides/compare-reports/" },
      { label: "Data handling", href: "/privacy/" },
    ],
  },
  privacy: {
    caseId: "privacy",
    path: "/privacy/",
    kind: "Reference",
    title: "What happens to a report",
    description: "Understand browser-session processing, excluded storage, minimized exports, clearing and the limits of local data handling.",
    lead: "P0 processes selected reports in the browser session. It has no report upload service, account, runtime AI call, remote scanner or analytics workflow.",
    consequence: "A scanner file can contain sensitive page content. Review its origin and the minimized export instead of assuming that a local tool makes every file safe to share.",
    action: { label: "Inspect a synthetic report", href: "/workbench/" },
    sections: [
      {
        heading: "The intended data path",
        paragraphs: [
          "A deliberate file selection or drop starts byte checks and a cancellable worker. Validated data becomes an in-memory normalized report used for inspection, comparison and manual statuses. Untrusted report strings are not executable markup or instructions.",
          "Imported help URLs are ignored. Rule explanations and deliberate outbound links come from the bundled trusted catalog. Importing a string that looks like a URL must not cause a request to that destination.",
          "The application does not upload the selected report or send report-dependent requests during comparison, manual edits or export. Ordinary same-origin application assets may still load. A future hosting provider could log ordinary page requests; this page does not promise that absolutely no data ever leaves a device.",
        ],
      },
      {
        heading: "Session state and clearing",
        paragraphs: [
          "P0 does not store reports or identity keys in localStorage, IndexedDB, caches or a service worker. Free-text manual observations and optional tester context stay in the current session and are excluded from exports. Reload starts a new session rather than restoring a report.",
          "Clear workspace removes application-held report, comparison, observation and identity-key references, clears visible import state and revokes outstanding download URLs. It cannot remove files you already downloaded, erase every forensic trace of JavaScript memory or protect a compromised browser.",
        ],
      },
      {
        heading: "What the download retains",
        paragraphs: [
          "JSON and Markdown exports are constructed from an allowlist. They retain rule/check IDs, validated state and subject identities, safe capture configuration, outcomes and user-reported manual status.",
          "They omit source HTML, selectors, page text, accessible names, form values, page URLs, screenshots, raw messages, free-text notes, tester context and identity keys. Reimported manual statuses explicitly lack their omitted observation details.",
          "Aliases and HMAC fingerprints are pseudonymous, not guaranteed anonymous. A valid alias may still contain a meaningful project term, and repeated fingerprints reveal equality within a namespace. Review the preview and your own aliases before sharing.",
        ],
      },
      {
        heading: "The local runner has a separate boundary",
        paragraphs: [
          "The optional CLI runs against one explicit trusted loopback application. It uses fresh browser state, a fixed set of bundled synthetic recipes and bounded output handling. It is not a sandbox for malicious websites, a remote scanner or a way to import someone’s authenticated browser profile.",
          "An explicitly selected identity file can preserve a capture namespace. Its keys remain local and are excluded from source control. Do not commit real reports, identity material, auth states, browser traces or secrets to the public project repository.",
        ],
      },
      {
        heading: "What this statement cannot establish",
        paragraphs: [
          "Local processing does not neutralize browser extensions, a compromised device, malicious dependencies or the application being inspected by the CLI. File validation reduces the supported input surface; it is not an anonymity or penetration-testing guarantee.",
          "Source code publication is authorized for reviewed synthetic examples. Website deployment, public previews, packages, indexing and additional spending require separate authorization. A noindex tag is an indexing preference, not access control.",
        ],
      },
    ],
    verification: {
      command: "npm run check:security\nnpm run test:e2e",
      expected: "Security checks observe network canaries, export omission and clear/reload behavior; consult the repository record for checks actually executed.",
      manual: "Review the export preview and source aliases before deliberate sharing. Use only synthetic data while learning the tool.",
      files: [
        { label: "Security/privacy contract", href: sourceUrl("docs/SECURITY-PRIVACY.md") },
        { label: "Browser privacy regressions", href: sourceUrl("tests/e2e/privacy.spec.ts") },
        { label: "Observed verification record", href: sourceUrl("docs/VERIFICATION.md") },
      ],
    },
    sources: [
      { label: "OWASP: DOM-based XSS prevention", href: "https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html" },
      { label: "Playwright: network interception and service workers", href: "https://playwright.dev/docs/network" },
    ],
    related: [
      { label: "Import/export reference", href: "/docs/import-format/" },
      { label: "Coverage and data limitations", href: "/limitations/" },
      { label: "Project source and license", href: "/about/" },
    ],
  },
  limitations: {
    caseId: "limitations",
    path: "/limitations/",
    kind: "Reference",
    title: "What the evidence does not cover",
    description: "Review supported formats, comparison uncertainty, browser coverage, manual-assessment gaps and the boundaries of the local capture CLI.",
    lead: "Workbench helps organize evidence from a bounded scan and a human review. It cannot turn missing coverage into a pass or certify a website’s accessibility.",
    consequence: "A reassuring empty list can be misleading when the relevant state, rule or human task was never evaluated.",
    action: { label: "Inspect the sample’s uncertainty", href: "/workbench/" },
    sections: [
      {
        heading: "Automation covers the exercised state",
        paragraphs: [
          "Axe evaluates automated rules in the interface state available to it. A closed dialog does not prove the open dialog was tested. The supplied runner captures nine specifically named states across three synthetic patterns; it does not crawl the website or discover every possible workflow.",
          "Incomplete results require review. A pass means a supplied automated evaluation passed in its scope; it is not a WCAG conformance statement, a legal conclusion or proof that every assistive-technology user can complete the task.",
        ],
      },
      {
        heading: "Comparison is conservative by design",
        paragraphs: [
          "Compatible comparisons require matching normalization, namespace, state, engine, ruleset, scope and environment declarations, plus complete producer-attested captures. Those declarations are not authenticated provenance.",
          "Newly detected and Not detected in this run require an actual recorded pass for the exact opposite rule/subject pair. A missing state, element or rule; changed namespace; incomplete result; or insufficient metadata yields Cannot assess where the necessary evidence is missing.",
          "Selector fingerprints cannot infer that two visually similar controls are the same subject. Changing a selector can therefore reduce comparability even when a human considers the control unchanged. Workbench does not repair the gap with fuzzy matching.",
        ],
      },
      {
        heading: "Formats and resource boundaries are intentional",
        paragraphs: [
          "P0 accepts the supported raw axe JSON shape and Workbench bundle schema 1.0. It does not import Playwright HTML reports, traces, archives, arbitrary reporter formats or unknown future schema versions. Only JSON exports can be reimported.",
          "A report must fit the documented byte, state, node, string, depth and processing limits. Oversized or malformed input is rejected rather than silently shortened. Source details discarded during normalization cannot be reconstructed from a minimized export.",
        ],
      },
      {
        heading: "Browser tests and human evaluation are different",
        paragraphs: [
          "The required automated matrix uses Chromium for the full user journey and Firefox/WebKit smoke coverage when those engines can execute in the development environment. A package being installed is not proof that its browser launched.",
          "The repository verification record is the authority for which commands actually ran, failed, were blocked or remained NOT RUN. This page does not claim blanket browser compatibility. Real browser zoom and screenshots are recorded separately from CSS zoom or a device-pixel-ratio change.",
          "Human screen-reader and other assistive-technology evaluation remains NOT RUN unless a concrete session with its browser, operating system, technology/version and observation is recorded. Automated focus assertions and axe scans cannot supply that evidence.",
        ],
      },
      {
        heading: "The runner is not a remote security scanner",
        paragraphs: [
          "The CLI is for a trusted application controlled by its operator on a single explicit HTTP loopback origin. It does not load arbitrary adapters, authenticate, reuse stored profiles, inspect remote targets or safely execute a malicious website.",
          "Playwright routing is defense in depth rather than an operating-system network sandbox. Blocked resources and failed captures must remain partial/error evidence. The application has no hosted report processing, account, runtime AI, persistence or automatic remediation in P0.",
        ],
      },
    ],
    verification: {
      command: "npm run check",
      expected: "The required gate set reports its actual results without converting unavailable browser/human checks to passes.",
      manual: "Compare your intended task with the captured states and recorded browser matrix. Mark unperformed checks not-run rather than assuming coverage.",
      files: [
        { label: "Acceptance and evidence contract", href: sourceUrl("docs/ACCEPTANCE.md") },
        { label: "Actual verification record", href: sourceUrl("docs/VERIFICATION.md") },
        { label: "Capture architecture", href: sourceUrl("docs/ARCHITECTURE.md") },
      ],
    },
    sources: evidenceSources,
    related: [
      { label: "Comparison guide", href: "/guides/compare-reports/" },
      { label: "Manual keyboard review", href: "/guides/keyboard-review/" },
      { label: "Privacy boundaries", href: "/privacy/" },
    ],
  },
  about: {
    caseId: "about",
    path: "/about/",
    kind: "Project",
    title: "About A11y Workbench",
    description: "An open-source project connecting accessibility report evidence, bounded comparisons, manual review and three executable learning patterns.",
    lead: "A11y Workbench is an open-source project in development for frontend engineers, QA and small maintainers who need to connect a finding with an interaction, a correction and a reproducible check.",
    consequence: "Useful evidence needs a clear scope and honest limitations. An attractive report or a green automated result should not replace that explanation.",
    action: { label: "Try the synthetic workflow", href: "/workbench/" },
    sections: [
      {
        heading: "A small, concrete workflow",
        paragraphs: [
          "Start with a synthetic sample, import a supported report, inspect its separate automated outcomes, compare sufficiently documented runs, record user-reported manual checks and export a minimized summary. The three pattern labs demonstrate forms, a modal dialog and a single-level action menu.",
          "The project uses a static web presentation with browser-session processing, a shared pure TypeScript core and an optional local Playwright/axe runner. It has no runtime AI calls, account, database, report-upload service or paid API.",
          "The name is a working title. No domain or trademark availability claim is made. Public source is available for review; it should not be confused with a released service or a certification.",
        ],
      },
      {
        heading: "Authorship and license",
        paragraphs: [
          "The project repository is maintained under the kostrubin account. Original project work is licensed under MIT with the attribution in LICENSE. Third-party dependencies retain their own licenses and required notices.",
          "The explanations and small demonstrations are original project work grounded in primary W3C, axe and Playwright guidance. Citing a source does not make its full documentation or example code part of this project’s MIT license.",
          "No independent user study, screen-reader evaluation, traffic result, adoption statistic or accessibility certification is claimed here. The research baseline is desk research and a hypothesis about the usefulness of this focused workflow.",
        ],
      },
      {
        heading: "Contribute evidence, not real reports",
        paragraphs: [
          "Use the exact installation, build and test commands in the repository README. Reproduce a change with a small synthetic fixture, state which rule/subject/state is involved and keep expected outcomes independent from the fixture generator.",
          "Do not put secrets, personal data, real customer captures, browser profiles, identity keys or sensitive logs into an issue or source commit. The project does not claim a private security-reporting channel exists; check the repository’s available controls before sharing any sensitive detail.",
          "Keep changes within the bounded P0 contract unless a later scope decision explicitly expands it. A second backend, remote scanner, runtime LLM or automatic compliance claim would change the project’s purpose and trust boundaries.",
        ],
      },
      {
        heading: "Source publication and website release",
        paragraphs: [
          "Reviewed project source, documentation, tests and synthetic examples may be committed and pushed normally to the public work branch. Preserve branch protections and do not force push.",
          "That authorization does not cover deployment, public previews, GitHub Releases, package publication, website indexing or new spending. Default builds keep SITE_RELEASE_APPROVED=false and omit production canonicals and sitemap entries. The workbench route remains non-indexable even after a separately approved website release.",
        ],
      },
    ],
    verification: {
      command: "npm run check:content\nnpm run check",
      expected: "The source manifest connects authored routes, primary references, maintained fixtures and regression tests; executed results are reported in the repository.",
      manual: "Read the actual verification record before relying on a behavior or browser claim. This page does not itself establish acceptance.",
      files: [
        { label: "Public source repository", href: repositoryUrl },
        { label: "MIT license", href: sourceUrl("LICENSE") },
        { label: "Research baseline", href: sourceUrl("docs/RESEARCH-BASELINE.md") },
        { label: "Contribution and run commands", href: sourceUrl("README.md") },
      ],
    },
    sources: [
      { label: "W3C: evaluation tools and their limits", href: "https://www.w3.org/WAI/test-evaluate/tools/selecting/" },
      { label: "axe-core source and license", href: "https://github.com/dequelabs/axe-core" },
      { label: "Playwright: accessibility testing", href: "https://playwright.dev/docs/accessibility-testing" },
    ],
    related: [
      { label: "Data handling", href: "/privacy/" },
      { label: "Evidence limitations", href: "/limitations/" },
      { label: "Supported import format", href: "/docs/import-format/" },
    ],
  },
};
