"use client";

import { useRef, useState, type FormEvent } from "react";
import { PatternControls, usePatternVariant, type PatternVariant } from "./PatternControls";
import styles from "./examples.module.css";

type DialogPhase = "closed" | "open" | "saved";

export function DialogExample() {
  const [variant, setVariant] = usePatternVariant();
  const [phase, setPhase] = useState<DialogPhase>("closed");
  const [draft, setDraft] = useState("Synthetic Reviewer");
  const [saved, setSaved] = useState("Synthetic Reviewer");
  const [invalid, setInvalid] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const closeResult = useRef<"closed" | "saved">("closed");
  const corrected = variant === "corrected";

  function restoreFocus() {
    requestAnimationFrame(() => opener.current?.focus());
  }

  function finish(result: "closed" | "saved") {
    closeResult.current = result;
    setPhase(result);
    if (dialog.current?.open) dialog.current.close();
    if (corrected) restoreFocus();
  }

  function reset() {
    closeResult.current = "closed";
    if (dialog.current?.open) dialog.current.close();
    setPhase("closed");
    setDraft("Synthetic Reviewer");
    setSaved("Synthetic Reviewer");
    setInvalid(false);
  }

  function changeVariant(next: PatternVariant) {
    reset();
    setVariant(next);
  }

  function openDialog() {
    setDraft(saved);
    setInvalid(false);
    closeResult.current = "closed";
    setPhase("open");
    if (corrected) {
      dialog.current?.showModal();
      nameInput.current?.focus();
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) {
      setInvalid(true);
      if (corrected) nameInput.current?.focus();
      return;
    }
    setSaved(draft.trim());
    finish("saved");
  }

  const content = (
    <form noValidate onSubmit={save} data-subject-id="dialog.form">
      <h3 id="example-dialog-title" data-subject-id="dialog.title">Edit display name</h3>
      <p id="example-dialog-description" data-subject-id="dialog.description">Change a synthetic name for this page only. Save or cancel to return to the opener.</p>
      <div className={styles.field} data-subject-id="dialog.name-field">
        <label htmlFor="dialog-name" data-subject-id="dialog.name-label">Display name</label>
        <input
          ref={nameInput}
          id="dialog-name"
          name="displayName"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={80}
          autoComplete="off"
          required
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "dialog-name-error" : undefined}
          data-subject-id="dialog.display-name"
        />
        {invalid ? <p id="dialog-name-error" role="alert" className={styles.error} data-subject-id="dialog.name-error">Enter a display name before saving.</p> : null}
      </div>
      <div className={styles.actions} data-subject-id="dialog.actions">
        <button type="submit" data-action="dialog.save" data-subject-id="dialog.save">Save name</button>
        <button type="button" onClick={() => finish("closed")} data-action="dialog.cancel" data-subject-id="dialog.cancel">Cancel</button>
      </div>
    </form>
  );

  return (
    <div className={styles.example}>
      <PatternControls pattern="dialog" variant={variant} onVariantChange={changeVariant} onReset={reset} />
      <div className={styles.surface} data-pattern="dialog" data-state={`dialog.${phase}`} data-variant={variant} data-subject-id="dialog.surface">
        <p className={styles.state} data-subject-id="dialog.capture-state">Capture state: <code data-subject-id="dialog.state-id">{`dialog.${phase}`}</code></p>
        <p data-subject-id="dialog.current-name">Local display name: <strong data-subject-id="dialog.current-value">{saved}</strong></p>
        <button ref={opener} type="button" onClick={openDialog} data-action="dialog.open" data-subject-id="dialog.opener">Edit display name</button>
        <p className={styles.hint} data-subject-id="dialog.hint">The modal is dismissed with Escape or Cancel. In the corrected example, background controls are unavailable while it is open.</p>
        {corrected ? (
          <dialog
            ref={dialog}
            id="example-dialog"
            aria-labelledby="example-dialog-title"
            aria-describedby="example-dialog-description"
            className={styles.dialog}
            onCancel={(event) => { event.preventDefault(); finish("closed"); }}
            onClose={() => { setPhase(closeResult.current); restoreFocus(); }}
            data-subject-id="dialog.modal"
          >
            {content}
          </dialog>
        ) : phase === "open" ? (
          <div className={styles.brokenDialog} id="example-dialog" data-subject-id="dialog.modal">
            {content}
          </div>
        ) : null}
        <div role="status" aria-live="polite" data-subject-id="dialog.outcome">
          {phase === "saved" ? <p className={styles.success} data-subject-id="dialog.success">Display name saved in this page session.</p> : null}
        </div>
      </div>
    </div>
  );
}
