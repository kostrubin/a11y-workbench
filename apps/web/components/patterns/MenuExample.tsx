"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { PatternControls, usePatternVariant, type PatternVariant } from "./PatternControls";
import styles from "./examples.module.css";

const choices = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "detailed", label: "Detailed" },
] as const;

export function MenuExample() {
  const [variant, setVariant] = usePatternVariant();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const corrected = variant === "corrected";

  useEffect(() => {
    if (open && corrected) itemRefs.current[active]?.focus();
  }, [open, active, corrected]);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function reset() {
    setOpen(false);
    setSelected(null);
    setActive(0);
  }

  function changeVariant(next: PatternVariant) {
    reset();
    setVariant(next);
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }

  function buttonKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!corrected) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(event.key === "ArrowUp" ? choices.length - 1 : 0);
      setOpen(true);
    } else if (event.key === "Escape") {
      close(true);
    }
  }

  function itemKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!corrected) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === "Tab") {
      // Let the native Tab action move focus before hiding the menu.
      window.setTimeout(() => close(false), 0);
    } else if (event.key.length === 1 && /^[a-z]$/i.test(event.key)) {
      const match = choices.findIndex((choice, candidate) => candidate !== index && choice.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (match >= 0) { event.preventDefault(); setActive(match); }
    }
  }

  const phase = open ? "open" : selected ? "selected" : "closed";
  return (
    <div className={styles.example}>
      <PatternControls pattern="menu" variant={variant} onVariantChange={changeVariant} onReset={reset} />
      <div className={styles.surface} data-pattern="menu" data-state={`menu.${phase}`} data-variant={variant} data-subject-id="menu.surface">
        <p className={styles.state} data-subject-id="menu.capture-state">Capture state: <code data-subject-id="menu.state-id">{`menu.${phase}`}</code></p>
        <p data-subject-id="menu.description">This menu performs a local display command. It is not website navigation.</p>
        <div ref={container} className={styles.menuContainer} data-subject-id="menu.container">
          <button
            ref={trigger}
            id="example-menu-button"
            type="button"
            aria-haspopup={corrected ? "menu" : undefined}
            aria-expanded={corrected ? open : undefined}
            aria-controls={corrected ? "example-action-menu" : undefined}
            onClick={() => { setActive(0); setOpen((value) => !value); }}
            onKeyDown={buttonKey}
            data-action="menu.open"
            data-subject-id="menu.trigger"
          >
            Choose display view <span aria-hidden="true" data-subject-id="menu.icon">▾</span>
          </button>
          <ul
            id="example-action-menu"
            role={corrected ? "menu" : undefined}
            aria-labelledby={corrected ? "example-menu-button" : undefined}
            hidden={!open}
            className={styles.menu}
            data-subject-id="menu.list"
          >
            {choices.map((choice, index) => (
              <li key={choice.value} role={corrected ? "none" : undefined} data-subject-id={`menu.${choice.value}-container`}>
                <button
                  ref={(element) => { itemRefs.current[index] = element; }}
                  type="button"
                  role={corrected ? "menuitem" : undefined}
                  tabIndex={corrected ? (active === index ? 0 : -1) : 0}
                  onKeyDown={(event) => itemKey(event, index)}
                  onClick={() => { setSelected(choice.label); close(corrected); }}
                  data-action="menu.select"
                  data-value={choice.value}
                  data-subject-id={`menu.${choice.value}`}
                >
                  {choice.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div role="status" aria-live="polite" data-subject-id="menu.outcome">
          <p data-subject-id="menu.selected-command">{selected ? `Selected view: ${selected}. This changes only the local demonstration.` : "No display command has been selected."}</p>
        </div>
      </div>
    </div>
  );
}
