// Deliberately hand-authored contract demonstration, NOT a real axe capture.
import { validateBundle } from './validate.js';
export const sampleBundle = validateBundle({
  "schemaVersion": "1.0",
  "normalizationVersion": "1",
  "reportId": "00000000-0000-4000-8000-000000000101",
  "createdAt": "2026-10-21T00:00:00Z",
  "producer": {
    "name": "a11y-workbench",
    "version": "0.0.0"
  },
  "identity": {
    "namespace": "00000000-0000-4000-8000-000000000001",
    "method": "explicit"
  },
  "states": [
    {
      "stateId": "forms.initial",
      "patternId": "forms",
      "capture": {
        "status": "complete",
        "engine": {
          "name": "axe-core",
          "version": "0.0.0"
        },
        "rulesetId": "contract-only.synthetic-v1",
        "rulesetDigest": "6e2bc81fe3c925033612cd6612c0449b180c96b1fa0a49747e7e19e02091bd8f",
        "scopeId": "contract-only.forms.initial",
        "environmentDigest": "4ee0946717614f23a45d76b43cd85c452ce88937838abd7b6d9f5e692b38c8e2",
        "completeness": "producer-attested",
        "executedRuleIds": [
          "image-alt",
          "label"
        ],
        "observedSubjectIds": [
          "forms.email",
          "forms.illustration",
          "forms.name"
        ],
        "evaluatedPairs": [
          {
            "ruleId": "label",
            "subjectId": "forms.name",
            "outcome": "violation"
          },
          {
            "ruleId": "label",
            "subjectId": "forms.email",
            "outcome": "violation"
          },
          {
            "ruleId": "image-alt",
            "subjectId": "forms.illustration",
            "outcome": "pass"
          }
        ],
        "reasonCodes": []
      },
      "findings": [
        {
          "ruleId": "label",
          "subjectId": "forms.name",
          "category": "violation",
          "impact": "serious",
          "checks": {
            "any": [],
            "all": [],
            "none": []
          }
        },
        {
          "ruleId": "label",
          "subjectId": "forms.email",
          "category": "violation",
          "impact": "serious",
          "checks": {
            "any": [],
            "all": [],
            "none": []
          }
        }
      ],
      "manualChecks": [
        {
          "checkId": "keyboard.complete",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "focus.visible",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "form.errors",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "dialog.context",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "menu.discovery",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "zoom.reflow",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "motion.preference",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "screen-reader.feedback",
          "status": "not-run",
          "reportedBy": "user"
        }
      ],
      "reportedOutcomes": {
        "violations": {
          "ruleCount": 1,
          "nodeCount": 2
        },
        "incomplete": {
          "ruleCount": 0,
          "nodeCount": 0
        },
        "passes": {
          "ruleCount": 1,
          "nodeCount": 1
        },
        "inapplicable": {
          "ruleCount": 0,
          "nodeCount": 0
        }
      }
    },
    {
      "stateId": "dialog.open",
      "patternId": "dialog",
      "capture": {
        "status": "complete",
        "engine": {
          "name": "axe-core",
          "version": "0.0.0"
        },
        "rulesetId": "contract-only.synthetic-v1",
        "rulesetDigest": "6e2bc81fe3c925033612cd6612c0449b180c96b1fa0a49747e7e19e02091bd8f",
        "scopeId": "contract-only.dialog.open",
        "environmentDigest": "4ee0946717614f23a45d76b43cd85c452ce88937838abd7b6d9f5e692b38c8e2",
        "completeness": "producer-attested",
        "executedRuleIds": [
          "button-name"
        ],
        "observedSubjectIds": [
          "dialog.close"
        ],
        "evaluatedPairs": [
          {
            "ruleId": "button-name",
            "subjectId": "dialog.close",
            "outcome": "violation"
          }
        ],
        "reasonCodes": []
      },
      "findings": [
        {
          "ruleId": "button-name",
          "subjectId": "dialog.close",
          "category": "violation",
          "impact": "serious",
          "checks": {
            "any": [],
            "all": [],
            "none": []
          }
        }
      ],
      "manualChecks": [
        {
          "checkId": "keyboard.complete",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "focus.visible",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "form.errors",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "dialog.context",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "menu.discovery",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "zoom.reflow",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "motion.preference",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "screen-reader.feedback",
          "status": "not-run",
          "reportedBy": "user"
        }
      ],
      "reportedOutcomes": {
        "violations": {
          "ruleCount": 1,
          "nodeCount": 1
        },
        "incomplete": {
          "ruleCount": 0,
          "nodeCount": 0
        },
        "passes": {
          "ruleCount": 0,
          "nodeCount": 0
        },
        "inapplicable": {
          "ruleCount": 0,
          "nodeCount": 0
        }
      }
    },
    {
      "stateId": "menu.open",
      "patternId": "menu",
      "capture": {
        "status": "complete",
        "engine": {
          "name": "axe-core",
          "version": "0.0.0"
        },
        "rulesetId": "contract-only.synthetic-v1",
        "rulesetDigest": "6e2bc81fe3c925033612cd6612c0449b180c96b1fa0a49747e7e19e02091bd8f",
        "scopeId": "contract-only.menu.open",
        "environmentDigest": "4ee0946717614f23a45d76b43cd85c452ce88937838abd7b6d9f5e692b38c8e2",
        "completeness": "producer-attested",
        "executedRuleIds": [
          "button-name"
        ],
        "observedSubjectIds": [
          "menu.trigger"
        ],
        "evaluatedPairs": [
          {
            "ruleId": "button-name",
            "subjectId": "menu.trigger",
            "outcome": "violation"
          }
        ],
        "reasonCodes": []
      },
      "findings": [
        {
          "ruleId": "button-name",
          "subjectId": "menu.trigger",
          "category": "violation",
          "impact": "serious",
          "checks": {
            "any": [],
            "all": [],
            "none": []
          }
        }
      ],
      "manualChecks": [
        {
          "checkId": "keyboard.complete",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "focus.visible",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "form.errors",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "dialog.context",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "menu.discovery",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "zoom.reflow",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "motion.preference",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "screen-reader.feedback",
          "status": "not-run",
          "reportedBy": "user"
        }
      ],
      "reportedOutcomes": {
        "violations": {
          "ruleCount": 1,
          "nodeCount": 1
        },
        "incomplete": {
          "ruleCount": 0,
          "nodeCount": 0
        },
        "passes": {
          "ruleCount": 0,
          "nodeCount": 0
        },
        "inapplicable": {
          "ruleCount": 0,
          "nodeCount": 0
        }
      }
    }
  ]
});
export const sampleCandidate = validateBundle({
  "schemaVersion": "1.0",
  "normalizationVersion": "1",
  "reportId": "00000000-0000-4000-8000-000000000102",
  "createdAt": "2026-10-21T00:00:00Z",
  "producer": {
    "name": "a11y-workbench",
    "version": "0.0.0"
  },
  "identity": {
    "namespace": "00000000-0000-4000-8000-000000000001",
    "method": "explicit"
  },
  "states": [
    {
      "stateId": "forms.initial",
      "patternId": "forms",
      "capture": {
        "status": "complete",
        "engine": {
          "name": "axe-core",
          "version": "0.0.0"
        },
        "rulesetId": "contract-only.synthetic-v1",
        "rulesetDigest": "6e2bc81fe3c925033612cd6612c0449b180c96b1fa0a49747e7e19e02091bd8f",
        "scopeId": "contract-only.forms.initial",
        "environmentDigest": "4ee0946717614f23a45d76b43cd85c452ce88937838abd7b6d9f5e692b38c8e2",
        "completeness": "producer-attested",
        "executedRuleIds": [
          "image-alt",
          "label"
        ],
        "observedSubjectIds": [
          "forms.email",
          "forms.illustration",
          "forms.name"
        ],
        "evaluatedPairs": [
          {
            "ruleId": "label",
            "subjectId": "forms.name",
            "outcome": "violation"
          },
          {
            "ruleId": "label",
            "subjectId": "forms.email",
            "outcome": "pass"
          },
          {
            "ruleId": "image-alt",
            "subjectId": "forms.illustration",
            "outcome": "violation"
          }
        ],
        "reasonCodes": []
      },
      "findings": [
        {
          "ruleId": "label",
          "subjectId": "forms.name",
          "category": "violation",
          "impact": "serious",
          "checks": {
            "any": [],
            "all": [],
            "none": []
          }
        },
        {
          "ruleId": "image-alt",
          "subjectId": "forms.illustration",
          "category": "violation",
          "impact": "serious",
          "checks": {
            "any": [],
            "all": [],
            "none": []
          }
        }
      ],
      "manualChecks": [
        {
          "checkId": "keyboard.complete",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "focus.visible",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "form.errors",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "dialog.context",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "menu.discovery",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "zoom.reflow",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "motion.preference",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "screen-reader.feedback",
          "status": "not-run",
          "reportedBy": "user"
        }
      ],
      "reportedOutcomes": {
        "violations": {
          "ruleCount": 2,
          "nodeCount": 2
        },
        "incomplete": {
          "ruleCount": 0,
          "nodeCount": 0
        },
        "passes": {
          "ruleCount": 1,
          "nodeCount": 1
        },
        "inapplicable": {
          "ruleCount": 0,
          "nodeCount": 0
        }
      }
    },
    {
      "stateId": "dialog.open",
      "patternId": "dialog",
      "capture": {
        "status": "complete",
        "engine": {
          "name": "axe-core",
          "version": "0.0.0"
        },
        "rulesetId": "contract-only.synthetic-v1",
        "rulesetDigest": "6e2bc81fe3c925033612cd6612c0449b180c96b1fa0a49747e7e19e02091bd8f",
        "scopeId": "contract-only.dialog.open",
        "environmentDigest": "4ee0946717614f23a45d76b43cd85c452ce88937838abd7b6d9f5e692b38c8e2",
        "completeness": "producer-attested",
        "executedRuleIds": [
          "button-name"
        ],
        "observedSubjectIds": [
          "dialog.close"
        ],
        "evaluatedPairs": [
          {
            "ruleId": "button-name",
            "subjectId": "dialog.close",
            "outcome": "violation"
          }
        ],
        "reasonCodes": []
      },
      "findings": [
        {
          "ruleId": "button-name",
          "subjectId": "dialog.close",
          "category": "violation",
          "impact": "serious",
          "checks": {
            "any": [],
            "all": [],
            "none": []
          }
        }
      ],
      "manualChecks": [
        {
          "checkId": "keyboard.complete",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "focus.visible",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "form.errors",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "dialog.context",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "menu.discovery",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "zoom.reflow",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "motion.preference",
          "status": "not-run",
          "reportedBy": "user"
        },
        {
          "checkId": "screen-reader.feedback",
          "status": "not-run",
          "reportedBy": "user"
        }
      ],
      "reportedOutcomes": {
        "violations": {
          "ruleCount": 1,
          "nodeCount": 1
        },
        "incomplete": {
          "ruleCount": 0,
          "nodeCount": 0
        },
        "passes": {
          "ruleCount": 0,
          "nodeCount": 0
        },
        "inapplicable": {
          "ruleCount": 0,
          "nodeCount": 0
        }
      }
    }
  ]
});
