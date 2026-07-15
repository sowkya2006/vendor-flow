import { redirect } from 'next/navigation'

/**
 * /approvals/pending → redirects to /approvals?tab=pending
 * The Pending tab is now part of the unified Approvals page.
 */
export default function PendingPage() {
  redirect('/approvals?tab=pending')
}
