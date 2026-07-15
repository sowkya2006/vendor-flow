import { redirect } from 'next/navigation'

/**
 * Legacy login route — kept so old bookmarks/links don't break.
 * Redirects permanently to the new Company Portal login.
 */
export default function LoginPage() {
  redirect('/company/login')
}
