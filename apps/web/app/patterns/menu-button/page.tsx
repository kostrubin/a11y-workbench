import type { Metadata } from "next";
import Link from "next/link";
import { MenuExample } from "../../../components/patterns/MenuExample";
import { PatternLesson } from "../../../components/patterns/PatternLesson";

export const metadata: Metadata = {
  title: "Action menu button: state and keyboard commands",
  description: "Explore an original single-level action menu with Enter and Space opening, arrow navigation, Home and End, Escape dismissal and focus return.",
};

export default function MenuPage() {
  return (
    <article className="page" data-case-id="pattern.menu">
      <p className="eyebrow">Pattern lab / 03</p>
      <h1>Use a menu for actions, not ordinary navigation</h1>
      <p className="lead">A menu promises a particular keyboard interaction. This single-level example performs a local view command; normal website links do not need application-menu roles.</p>
      <h2>Try the action menu</h2>
      <p>Open with Enter or Space, move between commands with the arrow keys, try Home and End, then choose a view. Escape dismisses the menu and returns to its button.</p>
      <MenuExample />
      <section aria-labelledby="menu-correction">
        <h2 id="menu-correction">What the correction changes</h2>
        <p>The corrected button exposes <code>aria-haspopup="menu"</code> and its expanded state. Opening moves focus to a menu item. A roving tab stop supports arrow keys, Home and End; selecting an action or pressing Escape returns to the button. Tab exits instead of trapping focus. The selected command is announced as a local outcome.</p>
        <p>The broken example omits the expanded/menu relationship and item-navigation behavior. Its ordinary buttons can still be clicked and its outside reset stays available. These failures are not all detectable by axe; keyboard assertions test the promised interaction.</p>
        <p><Link href="/guides/menu-or-disclosure/">Choose between an action menu and a disclosure</Link>.</p>
      </section>
      <PatternLesson sourceFile="MenuExample.tsx">
        <ol>
          <li>Focus Choose display view and press Enter. Confirm expanded state and focus on Compact.</li>
          <li>Use ArrowDown, End, Home and ArrowUp. Confirm that focus moves among the three local commands.</li>
          <li>Select a command. Confirm that it is announced and focus returns to the button.</li>
          <li>Reopen with Space and dismiss with Escape. Reopen once more and press Tab to leave the menu.</li>
        </ol>
        <p>Regression coverage: <code>E2E-09</code>, <code>E2E-10</code> and corrected-pattern axe checks. Capture states: <code>menu.closed</code>, <code>menu.open</code>, <code>menu.selected</code>.</p>
      </PatternLesson>
      <section aria-labelledby="menu-sources">
        <h2 id="menu-sources">Primary sources</h2>
        <ul>
          <li><a href="https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/" target="_blank" rel="noopener noreferrer">W3C APG: menu button pattern</a></li>
          <li><a href="https://www.w3.org/WAI/ARIA/apg/patterns/menubar/" target="_blank" rel="noopener noreferrer">W3C APG: menu and menubar keyboard behavior</a></li>
        </ul>
      </section>
    </article>
  );
}
