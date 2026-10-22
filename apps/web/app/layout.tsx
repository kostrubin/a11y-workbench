import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'A11y Workbench', description: 'Understand accessibility findings, compare evidence and keep manual review visible.',
  robots: { index: false, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="brand" aria-label="A11y Workbench home"><span className="brand-mark" aria-hidden="true">a</span><span>A11y<span className="brand-light"> Workbench</span></span></Link>
      <nav aria-label="Main navigation"><Link href="/workbench/">Workbench</Link><Link href="/patterns/forms/">Patterns</Link><Link href="/guides/keyboard-review/">Guides</Link><Link href="/docs/import-format/">Docs</Link></nav>
    </div></header>
    <main id="main" tabIndex={-1}>{children}</main>
    <footer className="site-footer"><div><strong>A11y Workbench</strong><p>Evidence for your next step. Automation leaves questions for people.</p></div><nav aria-label="Footer navigation"><Link href="/privacy/">Privacy</Link><Link href="/limitations/">Limitations</Link><Link href="/about/">About &amp; source</Link></nav><p className="footer-status">In development · synthetic examples · no accessibility certification</p></footer>
  </body></html>;
}
