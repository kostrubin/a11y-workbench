'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import {
  LIMITS,
  createIdentityContext,
  exportBundle,
  exportMarkdown,
  getRuleInfo,
  getStateTitle,
  manualChecks,
  newManualChecks,
  sampleBundle,
  sampleCandidate,
  type Finding,
  type ComparisonResult,
  type IdentityContext,
  type ManualCheck,
  type ReportBundle,
  type StateReport,
} from '@a11y-workbench/core';
import type { ImportRequest, ImportResponse } from '../../workers/import-protocol';
import type { CompareRequest, CompareResponse } from '../../workers/compare-protocol';
import styles from './Workbench.module.css';

type Target = 'candidate' | 'baseline';
type ComparisonCategory = 'new' | 'persisting' | 'changed' | 'not-detected' | 'unassessable';
type ExportFormat = 'json' | 'markdown';
type ManualStatus = ManualCheck['status'];
type Entry = {
  key: string;
  stateId: string;
  finding: Finding;
  category?: ComparisonCategory;
  reason?: string;
};
type Job = { id: number; reader: FileReader | null; worker: Worker | null; timer: ReturnType<typeof setTimeout> | null };
type ManualDraft = { status: ManualStatus; observation: string };
type Preview = { format: ExportFormat; text: string; bytes: number };
type ComparisonPhase = 'idle' | 'pending' | 'ready' | 'error' | 'cancelled';
type ComparisonState = { baseline: ReportBundle | null; candidate: ReportBundle | null; phase: ComparisonPhase; result: ComparisonResult | null; message: string };

const comparisonLabels: Record<ComparisonCategory, string> = {
  new: 'Newly detected',
  persisting: 'Still detected',
  changed: 'Changed',
  'not-detected': 'Not detected in this run',
  unassessable: 'Cannot assess',
};
const comparisonOrder: ComparisonCategory[] = ['new', 'persisting', 'changed', 'not-detected', 'unassessable'];
const manualLabels: Record<ManualStatus, string> = {
  'not-run': 'Not run', pass: 'Pass', fail: 'Fail', 'not-applicable': 'Not applicable',
};
const outcomeFields = ['violations', 'incomplete', 'passes', 'inapplicable'] as const;
const outcomeLabels = {
  violations: 'Violations', incomplete: 'Needs review', passes: 'Pass observations', inapplicable: 'Inapplicable',
};
const PAGE_SIZE = 40;

function withChecklist(bundle: ReportBundle): ReportBundle {
  return {
    ...bundle,
    states: bundle.states.map((state) => ({
      ...state,
      manualChecks: newManualChecks().map((check) => state.manualChecks.find((existing) => existing.checkId === check.checkId) ?? check),
    })),
  };
}

function initialReport(): ReportBundle {
  return withChecklist(exportBundle(sampleBundle));
}

function errorMessage(code: string): string {
  const normalized = code.toLowerCase();
  if (/size|bytes|large/.test(normalized)) return 'This report exceeds the 10 MiB limit.';
  if (/utf/.test(normalized)) return 'This file is not valid UTF-8 JSON.';
  if (/version/.test(normalized)) return 'This report version is unsupported. Use canonical version 1.0 or a supported raw axe JSON result.';
  if (/timeout|time/.test(normalized)) return 'Processing exceeded the five-second limit.';
  if (/json|parse/.test(normalized)) return 'This file is not valid JSON.';
  if (/depth|limit|count|entries/.test(normalized)) return 'This report exceeds a documented structural or record limit.';
  return 'This report does not match the supported import contract. Check its format, required fields and duplicate identities.';
}

function statePatternPath(state?: StateReport): string | undefined {
  switch (state?.patternId) {
    case 'forms': return '/patterns/forms/';
    case 'dialog': return '/patterns/dialog/';
    case 'menu': return '/patterns/menu-button/';
    default: return undefined;
  }
}

export default function Workbench() {
  const [candidate, setCandidate] = useState<ReportBundle | null>(initialReport);
  // Manual annotations do not change automated capture evidence. Keep this
  // snapshot stable until a different current report is accepted.
  const [comparisonCandidate, setComparisonCandidate] = useState<ReportBundle | null>(initialReport);
  const [baseline, setBaseline] = useState<ReportBundle | null>(null);
  const [comparisonState, setComparisonState] = useState<ComparisonState>({ baseline: null, candidate: null, phase: 'idle', result: null, message: '' });
  const [comparisonRetry, setComparisonRetry] = useState(0);
  const [source, setSource] = useState<'sample' | 'import' | 'empty'>('sample');
  const [status, setStatus] = useState('Synthetic sample loaded. Your files are not needed to try the workbench.');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<Record<Target, boolean>>({ candidate: false, baseline: false });
  const [lastImportMs, setLastImportMs] = useState<number | undefined>();
  const [dropTarget, setDropTarget] = useState<Target>('candidate');
  const [dragging, setDragging] = useState(false);
  const [stateFilter, setStateFilter] = useState('all');
  const [ruleFilter, setRuleFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');
  const [comparisonFilter, setComparisonFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedKey, setSelectedKey] = useState('');
  const [manualStateId, setManualStateId] = useState(sampleBundle.states[0]?.stateId ?? '');
  const [notes, setNotes] = useState<Map<string, string>>(() => new Map());
  const [drafts, setDrafts] = useState<Map<string, ManualDraft>>(() => new Map());
  const [manualErrors, setManualErrors] = useState<Map<string, string>>(() => new Map());
  const [testerContext, setTesterContext] = useState({ tester: '', browser: '', technology: '' });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const identity = useRef<IdentityContext | null>(null);
  const jobs = useRef<Partial<Record<Target, Job>>>({});
  const comparisonJob = useRef<{ id: number; worker: Worker; timer: ReturnType<typeof setTimeout> } | null>(null);
  const comparisonCounter = useRef(0);
  const jobCounter = useRef(0);
  const objectUrls = useRef(new Set<string>());
  const downloadTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const candidateInput = useRef<HTMLInputElement>(null);
  const baselineInput = useRef<HTMLInputElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);

  function stopJob(target: Target) {
    const job = jobs.current[target];
    if (!job) return;
    if (job.reader?.readyState === FileReader.LOADING) job.reader.abort();
    job.worker?.terminate();
    if (job.timer) clearTimeout(job.timer);
    delete jobs.current[target];
  }

  function revokeDownloads() {
    for (const timer of downloadTimers.current) clearTimeout(timer);
    downloadTimers.current.clear();
    for (const url of objectUrls.current) URL.revokeObjectURL(url);
    objectUrls.current.clear();
  }

  function stopComparison() {
    comparisonJob.current?.worker.terminate();
    if (comparisonJob.current) clearTimeout(comparisonJob.current.timer);
    comparisonJob.current = null;
  }

  useEffect(() => () => {
    stopJob('candidate'); stopJob('baseline');
    for (const timer of downloadTimers.current) clearTimeout(timer);
    for (const url of objectUrls.current) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    stopComparison();
    if (!baseline || !comparisonCandidate) {
      setComparisonState({ baseline, candidate: comparisonCandidate, phase: 'idle', result: null, message: '' });
      return;
    }
    const baselineInput = baseline;
    const candidateInput = comparisonCandidate;
    const id = ++comparisonCounter.current;
    setComparisonState({ baseline: baselineInput, candidate: candidateInput, phase: 'pending', result: null, message: 'Comparing the supplied capture evidence in an isolated worker…' });
    function fail(message: string) {
      if (comparisonJob.current?.id !== id) return;
      stopComparison();
      setComparisonState({ baseline: baselineInput, candidate: candidateInput, phase: 'error', result: null, message });
    }
    try {
      const worker = new Worker(new URL('../../workers/compare.worker.ts', import.meta.url), { type: 'module' });
      const timer = setTimeout(() => fail('Comparison exceeded the five-second limit. Both reports were preserved; no verdict is displayed.'), LIMITS.processingMs);
      comparisonJob.current = { id, worker, timer };
      worker.onmessage = (event: MessageEvent<CompareResponse>) => {
        if (comparisonJob.current?.id !== id || event.data.id !== id) return;
        if (!event.data.ok) { fail('The capture evidence could not be compared. Both reports were preserved; no verdict is displayed.'); return; }
        stopComparison();
        setComparisonState({ baseline: baselineInput, candidate: candidateInput, phase: 'ready', result: event.data.result, message: 'Comparison complete. Its categories describe only the supplied compatible evidence.' });
      };
      worker.onerror = (event) => { event.preventDefault(); fail('The comparison worker could not complete. Both reports were preserved; no verdict is displayed.'); };
      const request: CompareRequest = { id, baseline: baselineInput, candidate: candidateInput };
      worker.postMessage(request);
    } catch {
      stopComparison();
      setComparisonState({ baseline: baselineInput, candidate: candidateInput, phase: 'error', result: null, message: 'This browser could not start the comparison worker. Both reports were preserved; no verdict is displayed.' });
    }
    return () => { if (comparisonJob.current?.id === id) stopComparison(); };
  }, [baseline, comparisonCandidate, comparisonRetry]);

  function cancelComparison() {
    stopComparison();
    setComparisonState({ baseline, candidate: comparisonCandidate, phase: 'cancelled', result: null, message: 'Comparison cancelled. Both reports were preserved; no verdict is displayed.' });
  }

  function resetAutomatedFilters() {
    setStateFilter('all'); setRuleFilter('all'); setOutcomeFilter('all'); setImpactFilter('all'); setComparisonFilter('all');
    setPage(0); setSelectedKey('');
  }

  function resetView(bundle: ReportBundle | null) {
    resetAutomatedFilters(); setPreview(null);
    setManualStateId(bundle?.states[0]?.stateId ?? '');
    setNotes(new Map()); setDrafts(new Map()); setManualErrors(new Map());
  }

  function cancelImport(target: Target) {
    stopJob(target);
    setBusy((previous) => ({ ...previous, [target]: false }));
    setStatus(`${target === 'candidate' ? 'Current' : 'Baseline'} import cancelled. The previous workspace was preserved.`);
  }

  async function importFile(file: File, target: Target) {
    stopJob(target);
    setError('');
    if (file.size > LIMITS.bytes) {
      setBusy((previous) => ({ ...previous, [target]: false }));
      setError('This report exceeds the 10 MiB limit. The previous workspace was preserved.');
      return;
    }
    if (file.size === 0) {
      setBusy((previous) => ({ ...previous, [target]: false }));
      setError('This file is empty. Select a supported JSON report. The previous workspace was preserved.');
      return;
    }
    const id = ++jobCounter.current;
    const started = performance.now();
    const job: Job = { id, reader: null, worker: null, timer: null };
    jobs.current[target] = job;
    setBusy((previous) => ({ ...previous, [target]: true }));
    setStatus(`Reading and validating ${target === 'candidate' ? 'current' : 'baseline'} report in an isolated worker…`);
    const fail = (message: string) => {
      if (jobs.current[target]?.id !== id) return;
      stopJob(target);
      setBusy((previous) => ({ ...previous, [target]: false }));
      setError(`${message} The previous workspace was preserved.`);
      setStatus('Import rejected. No partial report was accepted.');
    };
    job.timer = setTimeout(() => fail('Processing exceeded the five-second limit.'), LIMITS.processingMs);
    try {
      // FileReader is abortable, so replacing/cancelling either target cannot
      // leave additional files reading alongside the two active import jobs.
      const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        job.reader = reader;
        reader.onload = () => reader.result instanceof ArrayBuffer ? resolve(reader.result) : reject(new Error('Read failed.'));
        reader.onerror = () => reject(new Error('Read failed.'));
        reader.onabort = () => reject(new Error('Read cancelled.'));
        reader.readAsArrayBuffer(file);
      });
      if (jobs.current[target]?.id !== id) return;
      identity.current ??= createIdentityContext();
      const worker = new Worker(new URL('../../workers/import.worker.ts', import.meta.url), { type: 'module' });
      job.worker = worker;
      worker.onmessage = (event: MessageEvent<ImportResponse>) => {
        if (jobs.current[target]?.id !== id || event.data.id !== id) return;
        if (!event.data.ok) { fail(errorMessage(event.data.code)); return; }
        const bundle = withChecklist(event.data.bundle);
        stopJob(target);
        setBusy((previous) => ({ ...previous, [target]: false }));
        setLastImportMs(performance.now() - started);
        if (target === 'candidate') {
          setCandidate(bundle); setComparisonCandidate(bundle); setSource('import'); resetView(bundle);
        } else {
          setBaseline(bundle); resetAutomatedFilters();
        }
        setError('');
        setStatus(`${target === 'candidate' ? 'Current' : 'Baseline'} report imported: ${bundle.states.length} states. Source filenames and raw report content are not retained.`);
      };
      worker.onerror = (event) => {
        event.preventDefault();
        fail('The isolated import worker could not complete processing.');
      };
      const request: ImportRequest = { id, bytes, identity: identity.current };
      worker.postMessage(request, [bytes]);
    } catch {
      fail('This browser could not read the file or start the isolated import worker.');
    }
  }

  function fileChanged(event: ChangeEvent<HTMLInputElement>, target: Target) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) void importFile(file, target);
  }

  function filesDropped(event: DragEvent<HTMLDivElement>) {
    event.preventDefault(); setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length < 1 || files.length > 2) {
      setError('Choose one report, or two reports in baseline-then-current order. At most two files are processed concurrently.');
      return;
    }
    if (files.length === 2) {
      void importFile(files[0]!, 'baseline'); void importFile(files[1]!, 'candidate');
    } else void importFile(files[0]!, dropTarget);
  }

  function loadSample(compare = false) {
    stopJob('candidate'); stopJob('baseline'); stopComparison(); revokeDownloads();
    const current = withChecklist(exportBundle(compare ? sampleCandidate : sampleBundle));
    setCandidate(current); setComparisonCandidate(current);
    setBaseline(compare ? withChecklist(exportBundle(sampleBundle)) : null);
    setSource('sample'); setBusy({ candidate: false, baseline: false });
    setError(''); setLastImportMs(undefined); identity.current = null;
    resetView(current);
    setStatus(compare ? 'Synthetic comparison loaded. Expected: one newly detected, two still detected, one not detected in this run and one cannot assess.' : 'Synthetic sample loaded. No real browser capture or human evaluation is claimed.');
  }

  function clearWorkspace() {
    stopJob('candidate'); stopJob('baseline'); stopComparison(); revokeDownloads();
    identity.current = null;
    setCandidate(null); setComparisonCandidate(null); setBaseline(null); setSource('empty');
    setBusy({ candidate: false, baseline: false }); setError(''); setLastImportMs(undefined);
    setTesterContext({ tester: '', browser: '', technology: '' });
    resetView(null);
    if (candidateInput.current) candidateInput.current.value = '';
    if (baselineInput.current) baselineInput.current.value = '';
    setStatus('Workspace cleared. Imported reports, comparison, local observations and identity key were discarded. Previously downloaded files are unchanged.');
  }

  const comparisonInputsMatch = comparisonState.baseline === baseline && comparisonState.candidate === comparisonCandidate;
  // Never render a previous pair's verdict, even for the render before the
  // new pair's effect starts its worker.
  const comparison = comparisonInputsMatch ? comparisonState.result : null;
  const comparisonPhase = comparisonInputsMatch ? comparisonState.phase : baseline && comparisonCandidate ? 'pending' : 'idle';
  const comparisonMessage = comparisonInputsMatch ? comparisonState.message : 'Comparing the supplied capture evidence in an isolated worker…';
  const entries = useMemo<Entry[]>(() => {
    if (comparison) return comparison.items.flatMap((item) => {
      const finding = item.candidate ?? item.baseline;
      return finding ? [{ key: item.key, stateId: item.stateId, finding, category: item.category, reason: item.reason }] : [];
    });
    return comparisonCandidate?.states.flatMap((state) => state.findings.map((finding) => ({
      key: `${state.stateId}/${finding.ruleId}/${finding.subjectId}`,
      stateId: state.stateId, finding,
    }))) ?? [];
  }, [comparisonCandidate, comparison]);
  const stateIds = useMemo(() => [...new Set([...(comparisonCandidate?.states.map((state) => state.stateId) ?? []), ...(baseline?.states.map((state) => state.stateId) ?? [])])], [comparisonCandidate, baseline]);
  const ruleIds = useMemo(() => [...new Set(entries.map((entry) => entry.finding.ruleId))].sort(), [entries]);
  const filtered = useMemo(() => entries.filter((entry) =>
    (stateFilter === 'all' || entry.stateId === stateFilter)
    && (ruleFilter === 'all' || entry.finding.ruleId === ruleFilter)
    && (outcomeFilter === 'all' || entry.finding.category === outcomeFilter)
    && (impactFilter === 'all' || (entry.finding.impact ?? 'unknown') === impactFilter)
    && (comparisonFilter === 'all' || entry.category === comparisonFilter)), [entries, stateFilter, ruleFilter, outcomeFilter, impactFilter, comparisonFilter]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1));
  const displayed = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selected = entries.find((entry) => entry.key === selectedKey);
  const selectedState = selected && (candidate?.states.find((state) => state.stateId === selected.stateId) ?? baseline?.states.find((state) => state.stateId === selected.stateId));
  const ruleInfo = selected ? getRuleInfo(selected.finding.ruleId, selectedState?.capture.engine.version) : undefined;
  const patternPath = statePatternPath(selectedState || undefined);
  const visibleStates = candidate?.states.filter((state) => stateFilter === 'all' || state.stateId === stateFilter) ?? [];
  const counts = outcomeFields.map((field) => ({ field, rules: visibleStates.reduce((sum, state) => sum + state.reportedOutcomes[field].ruleCount, 0), nodes: visibleStates.reduce((sum, state) => sum + state.reportedOutcomes[field].nodeCount, 0) }));
  const manualState = candidate?.states.find((state) => state.stateId === manualStateId);
  const outstandingManual = candidate?.states.reduce((sum, state) => sum + state.manualChecks.filter((check) => check.status === 'not-run').length, 0) ?? 0;
  const sentinel = candidate?.states.some((state) => /^0\.0\.[01]$/.test(state.capture.engine.version));

  function filterChanged(setter: (value: string) => void, value: string) { setter(value); setPage(0); setSelectedKey(''); }

  function saveManual(event: FormEvent<HTMLFormElement>, checkId: string, draft: ManualDraft) {
    event.preventDefault();
    if (!candidate || !manualState) return;
    const key = `${manualState.stateId}/${checkId}`;
    const observation = draft.observation.trim();
    if (draft.status !== 'not-run' && !observation) {
      setManualErrors((previous) => new Map(previous).set(key, 'Record an observation or a not-applicable reason before saving this status.'));
      return;
    }
    setCandidate({ ...candidate, states: candidate.states.map((state) => state.stateId === manualState.stateId ? { ...state, manualChecks: state.manualChecks.map((check) => check.checkId === checkId ? { ...check, status: draft.status } : check) } : state) });
    setNotes((previous) => { const next = new Map(previous); if (observation) next.set(key, observation); else next.delete(key); return next; });
    setManualErrors((previous) => { const next = new Map(previous); next.delete(key); return next; });
    setPreview(null);
    setStatus(`User-reported manual status saved as ${manualLabels[draft.status].toLowerCase()}. Local observation details will not be exported.`);
  }

  function previewExport() {
    if (!candidate) return;
    const text = exportFormat === 'json' ? JSON.stringify(exportBundle(candidate), null, 2) : exportMarkdown(candidate);
    setPreview({ format: exportFormat, text, bytes: new TextEncoder().encode(text).byteLength });
    setStatus('Export preview prepared from the minimized allowlist. Review it before downloading.');
  }

  function downloadExport() {
    if (!preview) return;
    const blob = new Blob([preview.text], { type: preview.format === 'json' ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    objectUrls.current.add(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = preview.format === 'json' ? 'a11y-workbench-report.json' : 'a11y-workbench-report.md';
    document.body.append(link); link.click(); link.remove();
    const timer = setTimeout(() => { URL.revokeObjectURL(url); objectUrls.current.delete(url); downloadTimers.current.delete(timer); }, 1000);
    downloadTimers.current.add(timer);
    setStatus('Minimized export downloaded. Previously downloaded files remain under your control.');
  }

  return (
    <div className={`page ${styles.workbench}`}>
      <header className={styles.heading}>
        <div><p className="eyebrow">Local evidence, explicit limits</p><h1>Your accessibility workbench</h1><p>Inspect what was observed. Compare only what the captures support. Keep the human review visible.</p></div>
        <div className={styles.sessionBadge}>Session only<span>No account · no report upload</span></div>
      </header>

      <section className={styles.toolbar} aria-label="Workspace actions">
        <button type="button" onClick={() => loadSample(false)}>Try synthetic sample</button>
        <button type="button" onClick={() => loadSample(true)}>Try synthetic comparison</button>
        <button type="button" className={styles.clearButton} onClick={clearWorkspace}>Clear workspace</button>
      </section>
      <p className={styles.notice}>{source === 'sample' || sentinel ? 'Hand-authored synthetic contract sample. Engine versions 0.0.0/0.0.1 are sentinels, not real axe captures or human evaluation.' : 'Imported declarations are unverified. Reports and local observations stay in this page session; reload returns to the synthetic sample.'}</p>
      <div role="status" aria-live="polite" data-testid="import-status" data-duration-ms={lastImportMs} className={styles.status}>{status}</div>
      {error && <p role="alert" className={styles.error}>{error}</p>}

      <section className={styles.importPanel} aria-labelledby="import-heading">
        <div><h2 id="import-heading">Bring a report into this session</h2><p>Supported raw axe JSON or canonical bundle version 1.0. Up to 10 MiB per file. <a href="/docs/import-format/">See the import contract</a>.</p></div>
        <div className={styles.importGrid}>
          <div className={styles.fileCard} aria-busy={busy.candidate}>
            <label htmlFor="candidate-file">Current report</label>
            <input ref={candidateInput} id="candidate-file" type="file" accept=".json,application/json" onChange={(event) => fileChanged(event, 'candidate')} />
            <p>The report to inspect and annotate.</p>
            {busy.candidate && <button type="button" onClick={() => cancelImport('candidate')}>Cancel current import</button>}
          </div>
          <div className={styles.fileCard} aria-busy={busy.baseline}>
            <label htmlFor="baseline-file">Baseline report</label>
            <input ref={baselineInput} id="baseline-file" type="file" accept=".json,application/json" onChange={(event) => fileChanged(event, 'baseline')} />
            <p>An earlier capture for a conservative comparison.</p>
            {busy.baseline && <button type="button" onClick={() => cancelImport('baseline')}>Cancel baseline import</button>}
            {baseline && !busy.baseline && <button type="button" onClick={() => { stopComparison(); setBaseline(null); resetAutomatedFilters(); setStatus('Baseline removed. Current report and manual observations are unchanged.'); }}>Remove baseline</button>}
          </div>
        </div>
        <div data-testid="report-drop-zone" className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={filesDropped}>
          <label htmlFor="drop-target">Drop one report into</label>
          <select id="drop-target" value={dropTarget} onChange={(event) => setDropTarget(event.target.value as Target)}><option value="candidate">Current report</option><option value="baseline">Baseline report</option></select>
          <span>Or drop two files in baseline-then-current order. The labelled file pickers provide the same keyboard-accessible actions.</span>
        </div>
      </section>

      {!candidate ? <section className={styles.empty}><h2>A clear workspace</h2><p>Select a local JSON report or load the synthetic sample. No previous imported report or local observation is retained by the application.</p><button type="button" onClick={() => loadSample(false)}>Load synthetic sample</button></section> : <>
        <section aria-labelledby="overview-heading">
          <div className={styles.sectionHeading}><h2 id="overview-heading">What this report supplies</h2><p><strong>{outstandingManual}</strong> user-reported manual checks not run</p></div>
          <div className={styles.outcomeGrid}>{counts.map(({ field, rules, nodes }) => <div key={field} className={`${styles.outcomeCard} ${field === 'violations' ? styles.violationCard : ''}`}><h3>{outcomeLabels[field]}</h3><strong>{nodes.toLocaleString()}</strong><span>node records · {rules.toLocaleString()} rule records</span></div>)}</div>
          <p className={styles.finePrint}>Totals add the selected states’ supplied records; repeated rules in different states are separate records. Passes, inapplicable results and zero findings are not a whole-site coverage or conformance verdict.</p>
          <details className={styles.evidence}><summary>Inspect capture evidence ({candidate.states.length} states)</summary><p>“Producer-attested” is an unverified declaration in a report. Missing scope or execution evidence limits comparison.</p>{candidate.states.length === 0 ? <p>No states were supplied; this does not establish a completed scan.</p> : candidate.states.map((state) => <section key={state.stateId} className={styles.capture}><h3>{getStateTitle(state.stateId)}</h3><dl><div><dt>State identifier</dt><dd>{state.stateId}</dd></div><div><dt>Engine</dt><dd>{state.capture.engine.name} {state.capture.engine.version}</dd></div><div><dt>Capture</dt><dd>{state.capture.status} · {state.capture.completeness}</dd></div><div><dt>Scope</dt><dd>{state.capture.scopeId ?? 'Unknown'}</dd></div><div><dt>Execution evidence</dt><dd>{state.capture.executedRuleIds.length} rules · {state.capture.observedSubjectIds.length} subjects · {state.capture.evaluatedPairs.length} evaluated pairs</dd></div></dl>{state.capture.reasonCodes.length > 0 && <p>Capture limitations: {state.capture.reasonCodes.join(', ')}</p>}</section>)}</details>
        </section>

        {baseline && <section className={styles.comparisonPanel} aria-labelledby="comparison-heading" aria-busy={comparisonPhase === 'pending'}><h2 id="comparison-heading">Comparison with baseline</h2><p>Newly detected and not detected require a recorded pass for the same rule and subject in the opposite compatible run. Missing states or changed configuration cannot prove an improvement.</p><p role={comparisonPhase === 'error' ? 'alert' : 'status'}>{comparisonMessage}</p>{comparisonPhase === 'pending' && <button type="button" onClick={cancelComparison}>Cancel comparison</button>}{(comparisonPhase === 'error' || comparisonPhase === 'cancelled') && <button type="button" onClick={() => setComparisonRetry((previous) => previous + 1)}>Retry comparison</button>}{comparison && <><dl className={styles.comparisonCounts}>{comparisonOrder.map((category) => <div key={category}><dt>{comparisonLabels[category]}</dt><dd data-testid={`comparison-${category}`}>{comparison.counts[category]}</dd></div>)}</dl>{comparison.counts.unassessable > 0 && <p className={styles.notice}>Some observations cannot be assessed. Open their details for the missing or incompatible evidence.</p>}</>}<p className={styles.finePrint}>Descriptive baseline totals: {baseline.states.reduce((sum, state) => sum + state.reportedOutcomes.violations.nodeCount, 0)} violation node records; {baseline.states.reduce((sum, state) => sum + state.reportedOutcomes.incomplete.nodeCount, 0)} incomplete; {baseline.states.reduce((sum, state) => sum + state.reportedOutcomes.passes.nodeCount, 0)} pass; {baseline.states.reduce((sum, state) => sum + state.reportedOutcomes.inapplicable.nodeCount, 0)} inapplicable. These counts alone cannot establish a regression verdict.</p></section>}

        <section aria-labelledby="findings-heading">
          <div className={styles.sectionHeading}><h2 id="findings-heading">Explore findings</h2><p>{filtered.length.toLocaleString()} of {entries.length.toLocaleString()} finding observations shown by these filters</p></div>
          <div className={styles.filters}>
            <label>State<select value={stateFilter} onChange={(event) => filterChanged(setStateFilter, event.target.value)}><option value="all">All states</option>{stateIds.map((id) => <option key={id} value={id}>{getStateTitle(id)}</option>)}</select></label>
            <label>Rule<select value={ruleFilter} onChange={(event) => filterChanged(setRuleFilter, event.target.value)}><option value="all">All supplied rules</option>{ruleIds.map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
            <label>Automated outcome<select value={outcomeFilter} onChange={(event) => filterChanged(setOutcomeFilter, event.target.value)}><option value="all">All finding outcomes</option><option value="violation">Violation</option><option value="incomplete">Needs review</option></select></label>
            <label>Impact<select value={impactFilter} onChange={(event) => filterChanged(setImpactFilter, event.target.value)}><option value="all">All impacts</option><option value="critical">Critical</option><option value="serious">Serious</option><option value="moderate">Moderate</option><option value="minor">Minor</option><option value="unknown">Unknown</option></select></label>
            {comparison && <label>Comparison<select value={comparisonFilter} onChange={(event) => filterChanged(setComparisonFilter, event.target.value)}><option value="all">All comparison categories</option>{comparisonOrder.map((category) => <option key={category} value={category}>{comparisonLabels[category]}</option>)}</select></label>}
          </div>
          <div className={styles.findingLayout}>
            <div><ul className={styles.findings}>{displayed.map((entry) => <li key={entry.key}><button type="button" className={`${styles.findingButton} ${selectedKey === entry.key ? styles.selected : ''}`} aria-pressed={selectedKey === entry.key} onClick={() => { setSelectedKey(entry.key); requestAnimationFrame(() => detailHeading.current?.focus()); }}><span className={styles.findingTop}><strong>{entry.finding.ruleId}</strong><span className={entry.finding.category === 'incomplete' ? styles.reviewBadge : styles.impactBadge}>{entry.finding.category === 'incomplete' ? 'Needs review' : entry.finding.impact ?? 'Unknown impact'}</span></span><span>{getStateTitle(entry.stateId)} · {entry.finding.subjectId}</span>{entry.category && <span className={styles.comparisonLabel}>{comparisonLabels[entry.category]}</span>}<span className={styles.srOnly}> — open finding details</span></button></li>)}</ul>{filtered.length === 0 && <div className={styles.empty}><h3>{entries.length ? 'No findings match these filters' : 'No findings supplied'}</h3><p>{entries.length ? 'Change a filter to inspect other observations.' : 'Zero supplied findings do not establish a completed scan or accessible experience. Inspect capture evidence and perform the manual checks.'}</p></div>}{filtered.length > PAGE_SIZE && <nav className={styles.pagination} aria-label="Finding pages"><button type="button" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); setSelectedKey(''); }}>Previous</button><span>Page {currentPage + 1} of {Math.ceil(filtered.length / PAGE_SIZE)}</span><button type="button" disabled={(currentPage + 1) * PAGE_SIZE >= filtered.length} onClick={() => { setPage(currentPage + 1); setSelectedKey(''); }}>Next</button></nav>}</div>
            <aside className={styles.detail} aria-label="Finding details"><h3 ref={detailHeading} tabIndex={-1}>{selected ? 'Finding details' : 'Select a finding'}</h3>{selected ? <><p className={styles.ruleTitle}>{ruleInfo?.title ?? selected.finding.ruleId}</p><dl><div><dt>State</dt><dd>{selected.stateId}</dd></div><div><dt>Subject identifier</dt><dd>{selected.finding.subjectId}</dd></div><div><dt>Automated outcome</dt><dd>{selected.finding.category === 'incomplete' ? 'Needs review (incomplete)' : 'Violation'}</dd></div><div><dt>Reported impact</dt><dd>{selected.finding.impact ?? 'Unknown'}</dd></div>{selected.category && <div><dt>Comparison</dt><dd>{comparisonLabels[selected.category]}</dd></div>}</dl>{selected.reason && <p className={styles.reason}>{selected.reason}</p>}{ruleInfo ? <><p>{ruleInfo.explanation}</p><p><a href={ruleInfo.guide}>Read the related guide</a> · <a href={ruleInfo.source} target="_blank" rel="noopener noreferrer">Primary guidance (opens a new tab)</a></p></> : <p>No trusted explanation is bundled for this rule and engine version. The imported identifier is shown as text; imported links are never followed.</p>}{patternPath && <p><a href={patternPath}>Inspect this pattern and its regression checks</a></p>}<details><summary>Safe check identifiers</summary>{(['any', 'all', 'none'] as const).map((group) => <p key={group}><strong>{group}:</strong> {selected.finding.checks[group].join(', ') || 'None supplied'}</p>)}</details><p className={styles.finePrint}>A finding disappearing is not a verified fix. Automated checks do not replace human assistive-technology evaluation.</p></> : <p>Open an observation to see its state, safe identifiers and the evidence behind a comparison.</p>}</aside>
          </div>
        </section>

        <section className={styles.manualPanel} aria-labelledby="manual-heading"><div className={styles.sectionHeading}><h2 id="manual-heading">User-reported manual checks</h2><p>Automation leaves work to do.</p></div><p>Record what you actually observed. A saved status is your report, not independent verification. Observations and optional tester context stay in session memory and are excluded from exports.</p><label className={styles.manualState}>Checklist state<select value={manualStateId} onChange={(event) => setManualStateId(event.target.value)}>{candidate.states.map((state) => <option key={state.stateId} value={state.stateId}>{getStateTitle(state.stateId)}</option>)}</select></label>{manualState ? <div className={styles.manualGrid}>{manualState.manualChecks.map((check, index) => {
          const definition = manualChecks.find((item) => item.checkId === check.checkId);
          const key = `${manualState.stateId}/${check.checkId}`;
          const draft = drafts.get(key) ?? { status: check.status, observation: notes.get(key) ?? '' };
          const manualError = manualErrors.get(key);
          const elementId = `manual-${index}`;
          return <form key={key} className={styles.manualCheck} noValidate onSubmit={(event) => saveManual(event, check.checkId, draft)}><h3>{definition?.title ?? check.checkId}</h3><p>{definition?.steps}</p><p className={styles.expected}><strong>Expected:</strong> {definition?.expected}</p><p className={styles.savedStatus}>Saved: <strong>{manualLabels[check.status]}</strong> · user-reported</p>{check.status !== 'not-run' && !notes.has(key) && <p className={styles.notice}>Observation details were not included in this imported report.</p>}<label htmlFor={`${elementId}-status`}>Reported status<select id={`${elementId}-status`} value={draft.status} onChange={(event) => setDrafts((previous) => new Map(previous).set(key, { ...draft, status: event.target.value as ManualStatus }))}>{(Object.keys(manualLabels) as ManualStatus[]).map((value) => <option key={value} value={value}>{manualLabels[value]}</option>)}</select></label><label htmlFor={`${elementId}-note`}>Local observation or not-applicable reason<textarea id={`${elementId}-note`} maxLength={2000} value={draft.observation} aria-required={draft.status !== 'not-run'} aria-invalid={Boolean(manualError)} aria-describedby={manualError ? `${elementId}-error` : `${elementId}-hint`} onChange={(event) => setDrafts((previous) => new Map(previous).set(key, { ...draft, observation: event.target.value }))} rows={3} /></label><p id={`${elementId}-hint`} className={styles.finePrint}>Required for a recorded result. Maximum 2,000 characters; never exported.</p>{manualError && <p id={`${elementId}-error`} role="alert" className={styles.error}>{manualError}</p>}<button type="submit">Save manual status</button></form>;
        })}</div> : <p>No state was supplied for a checklist. An empty report is not a completed evaluation.</p>}<details className={styles.context}><summary>Optional local tester context (not exported)</summary><div className={styles.contextGrid}><label>Tester alias<input maxLength={120} value={testerContext.tester} onChange={(event) => setTesterContext((previous) => ({ ...previous, tester: event.target.value }))} /></label><label>Browser description<input maxLength={120} value={testerContext.browser} onChange={(event) => setTesterContext((previous) => ({ ...previous, browser: event.target.value }))} /></label><label>Assistive technology description<input maxLength={120} value={testerContext.technology} onChange={(event) => setTesterContext((previous) => ({ ...previous, technology: event.target.value }))} /></label></div><p>These fields do not mean a human assistive-technology session has occurred. Record only work actually performed.</p></details></section>

        <section className={styles.exportPanel} aria-labelledby="export-heading"><h2 id="export-heading">Review a minimized export</h2><p>Exports include safe rule/check identifiers, capture evidence and user-reported statuses. They exclude source HTML, selectors, URLs, raw messages, form values, identity keys, observations and tester context. Identifiers remain pseudonymous and can reveal project structure.</p><div className={styles.exportActions}><label>Export format<select value={exportFormat} onChange={(event) => { setExportFormat(event.target.value as ExportFormat); setPreview(null); }}><option value="json">Canonical JSON (re-importable)</option><option value="markdown">Escaped Markdown summary</option></select></label><button type="button" onClick={previewExport}>Preview minimized export</button></div>{preview && <div className={styles.preview}><p>{candidate.states.length} states · {candidate.states.reduce((sum, state) => sum + state.findings.length, 0)} findings · {preview.bytes.toLocaleString()} UTF-8 bytes. {preview.format === 'markdown' && 'Markdown summaries cannot be re-imported.'}</p><label htmlFor="export-preview">Minimized {preview.format === 'json' ? 'JSON' : 'Markdown'} preview</label><textarea id="export-preview" readOnly value={preview.text} rows={12} spellCheck={false} /><button type="button" onClick={downloadExport}>Download {preview.format === 'json' ? 'JSON' : 'Markdown'}</button></div>}</section>
      </>}
      <footer className={styles.workbenchFooter}><p>Use synthetic files while evaluating this project. <a href="/privacy/">Privacy boundaries</a> · <a href="/limitations/">What these results cannot establish</a> · <a href="/guides/keyboard-review/">Plan a human keyboard review</a></p></footer>
    </div>
  );
}
