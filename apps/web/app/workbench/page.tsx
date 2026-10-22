import type { Metadata } from 'next';
import Workbench from '../../components/workbench/Workbench';

export const metadata: Metadata = {
  title: 'Local report workbench · A11y Workbench',
  description: 'Inspect synthetic or local axe reports, compare compatible captures, record manual checks and export minimized evidence in this browser session.',
  robots: { index: false, follow: false },
};

export default function WorkbenchPage() {
  return <Workbench />;
}
