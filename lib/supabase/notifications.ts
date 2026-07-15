/**
 * notifications.ts  — SERVER-ONLY
 * Data layer for the VendorFlow notifications module.
 * All functions here use server-side Supabase clients (cookies / admin key).
 * Do NOT import this file in client components.
 *
 * For client-safe display helpers (getNotificationMeta, relativeTime, types)
 * import from '@/lib/supabase/notification-utils' instead.
 */
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Re-export client-safe types and helpers so existing imports keep working
export type {
  NotificationType,
  NotificationFilter,
  Notification,
} from '@/lib/supabase/notification-utils'
export {
  getNotificationMeta,
  relativeTime,
} from '@/lib/supabase/notification-utils'

import type { Notification, NotificationFilter } from '@/lib/supabase/notification-utils'
import type { NotificationType } from '@/lib/supabase/notification-utils'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GetNotificationsResult {
  data: Notification[]
  total: number
  unreadCount: number
}

interface SendNotificationInput {
  companyId: string
  recipientUserId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  entityType?: string
  entityId?: string
  requestId?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotifications(
  filter: NotificationFilter = 'all',
  page = 1,
  pageSize = 30,
): Promise<GetNotificationsResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], total: 0, unreadCount: 0 }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { count: unreadCount } = await db
    .from('approval_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  let query = db
    .from('approval_notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filter === 'unread') {
    query = query.eq('is_read', false)
  } else if (filter === 'approvals') {
    query = query.in('type', ['approval_required', 'approved', 'rejected', 'returned'])
  } else if (filter === 'system') {
    query = query.in('type', [
      'general', 'system', 'low_stock', 'invitation_accepted',
      'vendor_approved', 'vendor_rejected', 'vendor_request',
    ])
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as Notification[],
    total: count ?? 0,
    unreadCount: unreadCount ?? 0,
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('approval_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false)
  return count ?? 0
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────────────────────────

export async function markOneRead(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('approval_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', user.id)
}

export async function markAllRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('approval_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('is_read', false)
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('approval_notifications')
    .delete()
    .eq('id', notificationId)
    .eq('recipient_id', user.id)
}

export async function deleteAllRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('approval_notifications')
    .delete()
    .eq('recipient_id', user.id)
    .eq('is_read', true)
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND  (admin client — bypasses RLS, server-actions only)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendNotification(input: SendNotificationInput): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    await db.from('approval_notifications').insert({
      company_id:   input.companyId,
      recipient_id: input.recipientUserId,
      request_id:   input.requestId ?? null,
      type:         input.type,
      title:        input.title,
      body:         input.message,
      link:         input.link ?? null,
      entity_type:  input.entityType ?? null,
      entity_id:    input.entityId ?? null,
      is_read:      false,
    })
  } catch {
    // Non-critical — never break the primary action
  }
}

export async function notifyAllWithRole(
  companyId: string,
  roleSlug: string,
  notification: Omit<SendNotificationInput, 'companyId' | 'recipientUserId'>,
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const { data: users } = await db
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .eq('role', roleSlug)
      .eq('status', 'active')

    if (!users || users.length === 0) return

    const rows = (users as { id: string }[]).map((u) => ({
      company_id:   companyId,
      recipient_id: u.id,
      request_id:   notification.requestId ?? null,
      type:         notification.type,
      title:        notification.title,
      body:         notification.message,
      link:         notification.link ?? null,
      entity_type:  notification.entityType ?? null,
      entity_id:    notification.entityId ?? null,
      is_read:      false,
    }))

    await db.from('approval_notifications').insert(rows)
  } catch {
    // Silent fail — never block the primary action
  }
}
