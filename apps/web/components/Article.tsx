import { articles, sourceUrl, type ArticleId } from "../content/articles";
import styles from "../content/article.module.css";

export function Article({ id }: { id: ArticleId }) {
  const article = articles[id];
  return (
    <article className={styles.article} data-case-id={article.caseId}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{article.kind} · A11y Workbench</p>
        <h1>{article.title}</h1>
        <p className={styles.lead}>{article.lead}</p>
        <p className={styles.consequence}>{article.consequence}</p>
        <a className="button" href={article.action.href}>{article.action.label}</a>
      </header>
      <nav className={styles.contents} aria-label="On this page">
        <p><strong>On this page</strong></p>
        <ul>
          {article.sections.map((section, index) => (
            <li key={section.heading}><a href={"#section-" + index}>{section.heading}</a></li>
          ))}
          <li><a href="#verification">Verify the behavior</a></li>
          <li><a href="#sources">Primary sources</a></li>
        </ul>
      </nav>
      {article.sections.map((section, index) => (
        <section className={styles.section} key={section.heading} aria-labelledby={"section-" + index}>
          <h2 id={"section-" + index}>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.steps && <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
          {section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
          {section.table && (
            <div className={styles.tableScroll} role="region" aria-label={section.heading + " table"} tabIndex={0}>
              <table>
                <thead><tr>{section.table.headings.map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
                <tbody>{section.table.rows.map((row) => <tr key={row[0]}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          {section.code && <pre className={styles.code}><code>{section.code}</code></pre>}
        </section>
      ))}
      <section className={styles.verification} aria-labelledby="verification">
        <h2 id="verification">Verify the behavior</h2>
        <p>Run from the repository root after the documented dependency and browser setup.</p>
        <pre className={styles.code}><code>{article.verification.command}</code></pre>
        <p><strong>Expected evidence:</strong> {article.verification.expected}</p>
        <p><strong>Manual review:</strong> {article.verification.manual}</p>
        <p>These are reproduction instructions, not a claim that a command or human session passed. See the <a href={sourceUrl("docs/VERIFICATION.md")} target="_blank" rel="noopener noreferrer">actual verification record</a> for observed results.</p>
        <ul>{article.verification.files.map((file) => <li key={file.href}><a href={file.href} target="_blank" rel="noopener noreferrer">{file.label}</a></li>)}</ul>
      </section>
      <section className={styles.section} aria-labelledby="sources">
        <h2 id="sources">Primary sources</h2>
        <p>Behavior guidance and engine documentation; these references do not certify this implementation.</p>
        <ul>{article.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>
      </section>
      <nav className={styles.related} aria-label="Related pages">
        {article.related.map((link) => <a className="card" key={link.href} href={link.href}>{link.label}<span aria-hidden="true"> →</span></a>)}
      </nav>
    </article>
  );
}
