"use client";

import { useEffect, useState } from "react";
import styles from "./examples.module.css";

export type PatternVariant = "corrected" | "broken";

/** Only the two bundled demonstration variants can be selected by a URL. */
export function usePatternVariant() {
  const [variant, setVariant] = useState<PatternVariant>("corrected");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("variant") === "broken") {
      setVariant("broken");
    }
  }, []);
  return [variant, setVariant] as const;
}

export function PatternControls({
  pattern,
  variant,
  onVariantChange,
  onReset,
}: {
  pattern: "forms" | "dialog" | "menu";
  variant: PatternVariant;
  onVariantChange: (variant: PatternVariant) => void;
  onReset: () => void;
}) {
  return (
    <div className={styles.controls}>
      <fieldset className={styles.variants}>
        <legend>Example version</legend>
        <label>
          <input
            type="radio"
            name={`${pattern}-variant`}
            value="corrected"
            checked={variant === "corrected"}
            onChange={() => onVariantChange("corrected")}
          />
          Corrected
        </label>
        <label>
          <input
            type="radio"
            name={`${pattern}-variant`}
            value="broken"
            checked={variant === "broken"}
            onChange={() => onVariantChange("broken")}
          />
          Intentionally broken
        </label>
      </fieldset>
      <button type="button" onClick={onReset} data-action={`${pattern}.reset`}>
        Reset demonstration
      </button>
      {variant === "broken" ? (
        <p className={styles.warning}>
          Intentionally broken fixture. The failure is limited to this example;
          use Reset demonstration or choose Corrected to leave it.
        </p>
      ) : (
        <p className={styles.boundary}>
          Synthetic local demonstration. Changes stay in this page session.
        </p>
      )}
    </div>
  );
}
