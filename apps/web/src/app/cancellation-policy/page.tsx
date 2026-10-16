import type { Metadata } from 'next';

import CancellationContent from './CancellationContent';

export const metadata: Metadata = {
  title: 'Cancellation Policy | Swago ',
  description: 'Learn about our cancellation policy for Swago  educational smart box',
};

export default function CancellationPolicyPage() {
  return <CancellationContent />;
}
