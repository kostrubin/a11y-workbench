import type { ManualCheck } from './types.js';

export interface ManualCheckDefinition { checkId: string; title: string; steps: string; expected: string }
export const manualChecks: readonly ManualCheckDefinition[] = Object.freeze([
  { checkId: 'keyboard.complete', title: 'Complete the interaction by keyboard', steps: 'Use Tab, Shift+Tab and the documented activation keys. Complete and recover from the task without a pointer.', expected: 'All controls remain reachable and operable.' },
  { checkId: 'focus.visible', title: 'Inspect visible focus', steps: 'Move through the controls and inspect the focus indication, including where content may obscure it.', expected: 'The current focus is visibly identifiable.' },
  { checkId: 'form.errors', title: 'Understand field errors', steps: 'Submit invalid synthetic values, locate the errors, correct them and resubmit.', expected: 'Errors are associated with their fields; recovery preserves other values.' },
  { checkId: 'dialog.context', title: 'Understand modal context', steps: 'Using the chosen assistive technology, open the dialog and assess its name, context, dismissal and focus return.', expected: 'The user understands the modal and returns to the invoking context.' },
  { checkId: 'menu.discovery', title: 'Discover and operate the action menu', steps: 'Locate the button, open the menu, navigate commands, activate and dismiss.', expected: 'State, navigation and action feedback are understandable.' },
  { checkId: 'zoom.reflow', title: 'Inspect zoom and reflow', steps: 'Inspect 320 CSS-pixel reflow and, when available, actual browser zoom at 200 percent. Record these separately.', expected: 'Content and actions remain usable.' },
  { checkId: 'motion.preference', title: 'Inspect reduced-motion behavior', steps: 'Enable reduced motion and repeat the interaction.', expected: 'Nonessential movement is removed and feedback stays understandable.' },
  { checkId: 'screen-reader.feedback', title: 'Assess spoken interaction feedback', steps: 'Perform an actual human assistive-technology session and record the AT/browser combination locally.', expected: 'Errors, dialog context and command feedback are understandable.' },
]);
export function newManualChecks(): ManualCheck[] {
  return manualChecks.map(({ checkId }) => ({ checkId, status: 'not-run', reportedBy: 'user' }));
}
export interface RuleInfo { title: string; explanation: string; guide: string; source: string }
export const ruleCatalog: Readonly<Record<string, RuleInfo>> = Object.freeze({
  label: { title: 'Form field label', explanation: 'A form control needs a programmatically associated label. Confirm the label is also useful to the person completing the form.', guide: '/guides/form-errors/', source: 'https://www.w3.org/WAI/tutorials/forms/labels/' },
  'button-name': { title: 'Button name', explanation: 'A button needs a discernible accessible name describing its action. Confirm the name makes sense in context.', guide: '/guides/keyboard-review/', source: 'https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/' },
  'image-alt': { title: 'Image alternative', explanation: 'Images need an appropriate text alternative, or an explicit decorative treatment. The useful alternative requires human judgment.', guide: '/guides/read-axe-results/', source: 'https://www.w3.org/WAI/tutorials/images/' },
  'color-contrast': { title: 'Text contrast', explanation: 'Text must have sufficient contrast against its background. Review the actual colors and the scope that the engine assessed.', guide: '/guides/read-axe-results/', source: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html' },
  'aria-dialog-name': { title: 'Dialog name', explanation: 'An accessible dialog name identifies the purpose of the modal. Focus placement, containment and return need separate behavior checks.', guide: '/guides/dialog-focus/', source: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/' },
  'aria-required-attr': { title: 'Required ARIA state', explanation: 'An ARIA role may require associated states or properties. Prefer native semantics and verify the complete interaction.', guide: '/guides/menu-or-disclosure/', source: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/' },
});
/** Catalog entries are bundled, never derived from imported helpUrl values. */
export function getRuleInfo(ruleId: string, engineVersion?: string): RuleInfo | undefined {
  // Exact installed engine version plus explicitly labelled demonstration
  // sentinels. An unreviewed engine version does not acquire trusted links.
  if (!engineVersion || !['0.0.0', '0.0.1', '4.14.0'].includes(engineVersion)) return undefined;
  return Object.hasOwn(ruleCatalog, ruleId) ? ruleCatalog[ruleId] : undefined;
}
export const stateTitles: Readonly<Record<string, string>> = Object.freeze({
  'forms.initial': 'Form · initial', 'forms.invalid': 'Form · invalid', 'forms.success': 'Form · success',
  'dialog.closed': 'Dialog · closed', 'dialog.open': 'Dialog · open', 'dialog.saved': 'Dialog · saved',
  'menu.closed': 'Menu · closed', 'menu.open': 'Menu · open', 'menu.selected': 'Menu · selected',
});
export function getStateTitle(stateId: string): string { return Object.hasOwn(stateTitles, stateId) ? stateTitles[stateId]! : stateId; }
