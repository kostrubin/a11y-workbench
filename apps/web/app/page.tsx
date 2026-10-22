import Link from 'next/link';
import { pageMetadata } from '../lib/site';
export const metadata = pageMetadata('Understand the finding. Test the next step.', 'Inspect accessibility reports locally, compare compatible evidence and explore corrected interface patterns.', '/');

export default function Home() {
  return <div className="page home-page">
    <section className="hero" aria-labelledby="hero-title"><div>
      <p className="eyebrow">A practical accessibility lab</p><h1 id="hero-title">Understand the finding.<br/><span>Test the next step.</span></h1>
      <p className="hero-copy">Bring an axe report into focus. Compare the evidence, keep manual review visible, and try a correction you can test.</p>
      <div className="actions"><Link className="button" href="/workbench/">Explore the sample <span aria-hidden="true">↗</span></Link><Link className="button secondary" href="/patterns/forms/">Open the pattern lab</Link></div>
      <p className="subtle">No account. No report upload. Session memory only.</p>
    </div><aside className="sample-preview" aria-label="Illustrative synthetic comparison">
      <div className="preview-top"><span className="status-dot"/> Synthetic evidence <span className="chip">Sample</span></div>
      <h2>A change is a question<br/>worth checking.</h2>
      <div className="preview-row"><span className="mini-icon">↗</span><span>Newly detected</span><strong>1</strong></div>
      <div className="preview-row"><span className="mini-icon">↔</span><span>Still detected</span><strong>2</strong></div>
      <div className="preview-row"><span className="mini-icon">−</span><span>Not detected in this run</span><strong>1</strong></div>
      <div className="preview-row uncertain"><span className="mini-icon">?</span><span>Cannot assess</span><strong>1</strong></div>
      <p>A missing menu state stays uncertain. It never becomes a verified fix.</p>
    </aside></section>
    <section className="section" aria-labelledby="workflow-title"><div className="section-heading"><div><p className="eyebrow">From observation to evidence</p><h2 id="workflow-title">A small, complete review loop.</h2></div><Link href="/guides/compare-reports/">How comparisons work <span aria-hidden="true">→</span></Link></div>
      <div className="feature-grid"><article className="card"><span className="step-number">01</span><h3>Inspect what was captured</h3><p>Separate violations, incomplete checks, passes and inapplicable rules. Keep rule counts distinct from affected nodes.</p><Link href="/guides/read-axe-results/">Read the outcomes →</Link></article>
      <article className="card"><span className="step-number">02</span><h3>Compare with care</h3><p>Require compatible states and exact rule–subject evidence. Configuration changes and missing coverage stay visible.</p><Link href="/workbench/">Try a comparison →</Link></article>
      <article className="card"><span className="step-number">03</span><h3>Leave room for people</h3><p>Record user-reported manual checks and export a minimized summary. An automated pass is one observation.</p><Link href="/guides/keyboard-review/">Plan a keyboard review →</Link></article></div>
    </section>
    <section className="section pattern-strip" aria-labelledby="pattern-title"><div><p className="eyebrow">The pattern lab</p><h2 id="pattern-title">Try the behavior.<br/>Understand the tradeoff.</h2><p>Corrected examples open first. Deliberate failures stay inside a labelled demo with an outside reset.</p></div><div className="pattern-links"><Link href="/patterns/forms/"><span>01</span><strong>Form validation</strong><span aria-hidden="true">↗</span></Link><Link href="/patterns/dialog/"><span>02</span><strong>Modal dialog</strong><span aria-hidden="true">↗</span></Link><Link href="/patterns/menu-button/"><span>03</span><strong>Action menu</strong><span aria-hidden="true">↗</span></Link></div></section>
    <aside className="notice"><strong>Useful evidence, bounded claims.</strong><p>This project is in development. The sample is hand-authored synthetic data. Automated checks do not establish WCAG conformance or replace human assistive-technology evaluation.</p><Link href="/limitations/">Read the limitations</Link></aside>
  </div>;
}
