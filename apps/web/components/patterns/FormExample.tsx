"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PatternControls, usePatternVariant, type PatternVariant } from "./PatternControls";
import styles from "./examples.module.css";

type FormPhase = "initial" | "invalid" | "success";
type FieldErrors = { name: string; email: string };
const emptyErrors: FieldErrors = { name: "", email: "" };

export function FormExample() {
  const [variant, setVariant] = usePatternVariant();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors);
  const [phase, setPhase] = useState<FormPhase>("initial");
  const [attempt, setAttempt] = useState(0);
  const errorSummary = useRef<HTMLDivElement>(null);
  const corrected = variant === "corrected";

  useEffect(() => {
    if (phase === "invalid" && corrected) errorSummary.current?.focus();
  }, [attempt, phase, corrected]);

  function reset() {
    setName("");
    setEmail("");
    setErrors(emptyErrors);
    setPhase("initial");
  }

  function changeVariant(next: PatternVariant) {
    reset();
    setVariant(next);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: FieldErrors = {
      name: name.trim() ? "" : "Enter a display name.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? ""
        : "Enter an email address in the format name@example.test.",
    };
    setErrors(next);
    setAttempt((value) => value + 1);
    setPhase(next.name || next.email ? "invalid" : "success");
  }

  return (
    <div className={styles.example}>
      <PatternControls pattern="forms" variant={variant} onVariantChange={changeVariant} onReset={reset} />
      <div
        className={styles.surface}
        data-pattern="forms"
        data-state={`forms.${phase}`}
        data-variant={variant}
        data-subject-id="forms.surface"
      >
        <p className={styles.state} data-subject-id="forms.capture-state">Capture state: <code data-subject-id="forms.state-id">{`forms.${phase}`}</code></p>
        <form noValidate onSubmit={submit} data-subject-id="forms.form">
          <h3 data-subject-id="forms.title">Join a synthetic project</h3>
          <p id="forms-instructions" data-subject-id="forms.instructions">Both fields are required. Use invented details; nothing is sent.</p>
          {phase === "invalid" && corrected ? (
            <div ref={errorSummary} tabIndex={-1} role="alert" className={styles.errorSummary} data-subject-id="forms.error-summary">
              <h4 data-subject-id="forms.error-title">Check the form</h4>
              <ul data-subject-id="forms.error-list">
                {errors.name ? <li data-subject-id="forms.name-error-item"><a href="#demo-name" data-subject-id="forms.name-error-link">{errors.name}</a></li> : null}
                {errors.email ? <li data-subject-id="forms.email-error-item"><a href="#demo-email" data-subject-id="forms.email-error-link">{errors.email}</a></li> : null}
              </ul>
            </div>
          ) : null}
          <div className={styles.field} data-subject-id="forms.name-field">
            {corrected ? <label htmlFor="demo-name" data-subject-id="forms.name-label">Display name</label> : <span className={styles.fieldLabel} data-subject-id="forms.name-label">Display name</span>}
            <p className={styles.hint} id="demo-name-hint" data-subject-id="forms.name-hint">For example, Synthetic Reviewer.</p>
            <input
              id="demo-name"
              name="displayName"
              type="text"
              autoComplete="off"
              maxLength={80}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-describedby={corrected ? `demo-name-hint${errors.name ? " demo-name-error" : ""}` : undefined}
              aria-invalid={corrected && Boolean(errors.name) ? true : undefined}
              data-subject-id="forms.display-name"
            />
            {errors.name ? <p id="demo-name-error" className={styles.error} data-subject-id="forms.name-error">{errors.name}</p> : null}
          </div>
          <div className={styles.field} data-subject-id="forms.email-field">
            {corrected ? <label htmlFor="demo-email" data-subject-id="forms.email-label">Email</label> : <span className={styles.fieldLabel} data-subject-id="forms.email-label">Email</span>}
            <p className={styles.hint} id="demo-email-hint" data-subject-id="forms.email-hint">Use a synthetic address such as reviewer@example.test.</p>
            <input
              id="demo-email"
              name="email"
              type="email"
              autoComplete="off"
              maxLength={120}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={corrected ? `demo-email-hint${errors.email ? " demo-email-error" : ""}` : undefined}
              aria-invalid={corrected && Boolean(errors.email) ? true : undefined}
              data-subject-id="forms.email"
            />
            {errors.email ? <p id="demo-email-error" className={styles.error} data-subject-id="forms.email-error">{errors.email}</p> : null}
          </div>
          <button type="submit" data-action="forms.submit" data-subject-id="forms.submit">Save local example</button>
          <div aria-live={corrected ? "polite" : "off"} aria-atomic="true" data-subject-id="forms.outcome">
            {phase === "success" ? <p className={styles.success} data-subject-id="forms.success">Example saved locally. No data was submitted to a server.</p> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
