/**
 * lib/notifications/engine.ts
 *
 * Central Notification Engine — EVENT-DRIVEN, ROLE-BASED.
 *
 * Usage:
 *   import { notify } from '@/lib/notifications/engine'
 *   await notify({ event: 'RFQ_CREATED', companyId, triggeredBy, entityId, entityRef, meta })
 *
 * The engine:
 *   1. Determines who should receive the notification (role-based matrix)
 *   2. Creates in-app notification records (approval_notifications table)
 *   3. Sends email via Supabase built-in transactional emails (or Brevo SMTP)
 *   4. Never throws — always fails silently to avoid breaking primary actions
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationType } from '@/lib/supabase/notification-utils'

// ─────────────────────────────────────────────────────────────────────────────
// Event types
// ─────────────────────────────────────────────────────────────────────────────
export type NotificationEvent =
  | 'RFQ_CREATED'
  | 'RFQ_APPROVED'
  | 'RFQ_REJECTED'
  | 'RFQ_SENT_TO_VENDOR'
  | 'QUOTATION_SUBMITTED'
  | 'QUOTATION_APPROVED'
  | 'QUOTATION_REJECTED'
  | 'PO_CREATED'
  | 'PO_APPROVED'
  | 'PO_REJECTED'
  | 'PO_SENT_TO_VENDOR'
  | 'PO_ACKNOWLEDGED'
  | 'GRN_CREATED'
  | 'INVOICE_SUBMITTED'
  | 'INVOICE_APPROVED'
  | 'INVOICE_REJECTED'
  | 'PAYMENT_RECORDED'
  | 'VENDOR_REQUEST'
  | 'VENDOR_APPROVED'
  | 'VENDOR_REJECTED'
  | 'LOW_STOCK'

export interface NotifyInput {
  event: NotificationEvent
  companyId: string
  triggeredBy: string        // userId who triggered the event
  triggeredByName?: string   // display name of the triggerer
  entityId: string
  entityRef: string          // human-readable ref e.g. "RFQ-2026-001"
  entityType?: string
  meta?: Record<string, string | number | null>
  link?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification matrix
// Defines: who gets notified, what type, what title/body, whether email needed
// ─────────────────────────────────────────────────────────────────────────────
interface NotificationRule {
  /** Roles that receive this notification (in-app + email) */
  notifyRoles: string[]
  /** Also notify the entity creator/submitter by userId (from triggeredBy) */
  notifySubmitter?: boolean
  type: NotificationType
  title: (input: NotifyInput) => string
  body: (input: NotifyInput) => string
  link: (input: NotifyInput) => string
  emailSubject?: (input: NotifyInput) => string
  emailBody?: (input: NotifyInput) => string
  sendEmail: boolean
}

const MATRIX: Record<NotificationEvent, NotificationRule> = {

  // ─── RFQ ──────────────────────────────────────────────────────────────────

  RFQ_CREATED: {
    // PM needs to review and approve. Admin for oversight.
    notifyRoles: ['procurement_manager', 'administrator'],
    type: 'rfq_created',
    title: (i) => `New RFQ: ${i.entityRef}`,
    body: (i) => `${i.triggeredByName ?? 'A user'} created RFQ ${i.entityRef}. Please review and approve.`,
    link: (i) => `/rfqs/${i.entityId}`,
    emailSubject: (i) => `RFQ ${i.entityRef} Created — Action Required`,
    emailBody: (i) => `Hello,\n\nA new RFQ (${i.entityRef}) has been created by ${i.triggeredByName ?? 'a procurement officer'}.\n\nPlease review and approve it.\n\nView RFQ: ${process.env.NEXT_PUBLIC_APP_URL}/rfqs/${i.entityId}`,
    sendEmail: true,
  },

  RFQ_APPROVED: {
    // Officer who created it + Admin. PM already knows.
    notifyRoles: ['procurement_officer', 'administrator'],
    notifySubmitter: true,
    type: 'approved',
    title: (i) => `RFQ Approved: ${i.entityRef}`,
    body: (i) => `RFQ ${i.entityRef} has been approved. You can now send it to vendors.`,
    link: (i) => `/rfqs/${i.entityId}`,
    emailSubject: (i) => `RFQ ${i.entityRef} Approved`,
    emailBody: (i) => `Hello,\n\nRFQ ${i.entityRef} has been approved by ${i.triggeredByName ?? 'the procurement manager'}.\n\nYou can now send it to vendors.\n\nView RFQ: ${process.env.NEXT_PUBLIC_APP_URL}/rfqs/${i.entityId}`,
    sendEmail: true,
  },

  RFQ_REJECTED: {
    notifyRoles: ['procurement_officer', 'administrator'],
    notifySubmitter: true,
    type: 'rejected',
    title: (i) => `RFQ Rejected: ${i.entityRef}`,
    body: (i) => `RFQ ${i.entityRef} was rejected. Please review the feedback and resubmit.`,
    link: (i) => `/rfqs/${i.entityId}`,
    sendEmail: true,
    emailSubject: (i) => `RFQ ${i.entityRef} Rejected`,
    emailBody: (i) => `Hello,\n\nRFQ ${i.entityRef} has been rejected. Please review and resubmit.`,
  },

  RFQ_SENT_TO_VENDOR: {
    notifyRoles: ['procurement_manager', 'warehouse_manager', 'administrator'],
    type: 'general',
    title: (i) => `RFQ Sent to Vendor: ${i.entityRef}`,
    body: (i) => `RFQ ${i.entityRef} has been sent to the vendor. Awaiting quotation.`,
    link: (i) => `/rfqs/${i.entityId}`,
    sendEmail: false,
  },

  // ─── Quotation ────────────────────────────────────────────────────────────

  QUOTATION_SUBMITTED: {
    // PM approves quotations. Officer needs to see. Admin oversight.
    notifyRoles: ['procurement_officer', 'procurement_manager', 'administrator'],
    type: 'quotation_submitted',
    title: (i) => `Quotation Received: ${i.entityRef}`,
    body: (i) => `${i.triggeredByName ?? 'A vendor'} submitted quotation ${i.entityRef}. Please review.`,
    link: (i) => `/quotations/${i.entityId}`,
    emailSubject: (i) => `New Quotation Submitted — ${i.entityRef}`,
    emailBody: (i) => `Hello,\n\nA vendor has submitted quotation ${i.entityRef}.\n\nReview it now: ${process.env.NEXT_PUBLIC_APP_URL}/quotations/${i.entityId}`,
    sendEmail: true,
  },

  QUOTATION_APPROVED: {
    // Officer needs to create PO. Admin oversight.
    notifyRoles: ['procurement_officer', 'administrator'],
    type: 'approved',
    title: (i) => `Quotation Approved: ${i.entityRef}`,
    body: (i) => `Quotation ${i.entityRef} has been approved. Create a Purchase Order now.`,
    link: (i) => `/quotations/${i.entityId}`,
    emailSubject: (i) => `Quotation ${i.entityRef} Approved`,
    emailBody: (i) => `Hello,\n\nQuotation ${i.entityRef} has been approved. Please create a Purchase Order.\n\nView: ${process.env.NEXT_PUBLIC_APP_URL}/quotations/${i.entityId}`,
    sendEmail: true,
  },

  QUOTATION_REJECTED: {
    notifyRoles: ['procurement_officer', 'administrator'],
    type: 'rejected',
    title: (i) => `Quotation Rejected: ${i.entityRef}`,
    body: (i) => `Quotation ${i.entityRef} was rejected.`,
    link: (i) => `/quotations/${i.entityId}`,
    sendEmail: false,
  },

  // ─── Purchase Order ───────────────────────────────────────────────────────

  PO_CREATED: {
    // PM must approve. Warehouse prepares for delivery. Finance plans payment.
    notifyRoles: ['procurement_manager', 'warehouse_manager', 'finance_manager', 'administrator'],
    type: 'po_issued',
    title: (i) => `Purchase Order Created: ${i.entityRef}`,
    body: (i) => `PO ${i.entityRef} has been created by ${i.triggeredByName ?? 'Procurement Officer'} and awaits approval.`,
    link: (i) => `/purchase-orders/${i.entityId}`,
    emailSubject: (i) => `PO ${i.entityRef} Created — Awaiting Approval`,
    emailBody: (i) => `Hello,\n\nPurchase Order ${i.entityRef} has been created and awaits approval.\n\nView PO: ${process.env.NEXT_PUBLIC_APP_URL}/purchase-orders/${i.entityId}`,
    sendEmail: true,
  },

  PO_APPROVED: {
    // Officer created it. Warehouse prepares. Admin oversight.
    notifyRoles: ['procurement_officer', 'warehouse_manager', 'administrator'],
    type: 'approved',
    title: (i) => `PO Approved: ${i.entityRef}`,
    body: (i) => `PO ${i.entityRef} has been approved and will be sent to the vendor.`,
    link: (i) => `/purchase-orders/${i.entityId}`,
    emailSubject: (i) => `Purchase Order ${i.entityRef} Approved`,
    emailBody: (i) => `Hello,\n\nPurchase Order ${i.entityRef} has been approved.\n\nView: ${process.env.NEXT_PUBLIC_APP_URL}/purchase-orders/${i.entityId}`,
    sendEmail: true,
  },

  PO_REJECTED: {
    notifyRoles: ['procurement_officer', 'administrator'],
    type: 'rejected',
    title: (i) => `PO Rejected: ${i.entityRef}`,
    body: (i) => `PO ${i.entityRef} was rejected. Please review and resubmit.`,
    link: (i) => `/purchase-orders/${i.entityId}`,
    sendEmail: true,
    emailSubject: (i) => `Purchase Order ${i.entityRef} Rejected`,
    emailBody: (i) => `Hello,\n\nPurchase Order ${i.entityRef} has been rejected. Please review and resubmit.\n\nView: ${process.env.NEXT_PUBLIC_APP_URL}/purchase-orders/${i.entityId}`,
  },

  PO_SENT_TO_VENDOR: {
    // Warehouse prepares for receipt. Finance plans. Admin oversight.
    notifyRoles: ['warehouse_manager', 'finance_manager', 'administrator'],
    type: 'po_issued',
    title: (i) => `PO Sent to Vendor: ${i.entityRef}`,
    body: (i) => `PO ${i.entityRef} has been sent to the vendor. Prepare to receive goods.`,
    link: (i) => `/purchase-orders/${i.entityId}`,
    sendEmail: false,
  },

  PO_ACKNOWLEDGED: {
    // Officer and PM need to know vendor accepted. Admin oversight.
    notifyRoles: ['procurement_officer', 'procurement_manager', 'warehouse_manager', 'administrator'],
    type: 'general',
    title: (i) => `Vendor Accepted PO: ${i.entityRef}`,
    body: (i) => `The vendor has accepted PO ${i.entityRef}. Delivery is in progress.`,
    link: (i) => `/purchase-orders/${i.entityId}`,
    sendEmail: false,
  },

  // ─── GRN ──────────────────────────────────────────────────────────────────

  GRN_CREATED: {
    // Finance needs to know goods arrived (for invoice matching). PM oversight. Admin.
    notifyRoles: ['finance_manager', 'procurement_manager', 'procurement_officer', 'administrator'],
    type: 'general',
    title: (i) => `Goods Received: ${i.entityRef}`,
    body: (i) => `GRN ${i.entityRef} has been completed. Inventory updated.`,
    link: (i) => `/inventory/grn/${i.entityId}`,
    emailSubject: (i) => `Goods Received — ${i.entityRef}`,
    emailBody: (i) => `Hello,\n\nGoods receipt ${i.entityRef} has been completed.\n\nView GRN: ${process.env.NEXT_PUBLIC_APP_URL}/inventory/grn/${i.entityId}`,
    sendEmail: true,
  },

  // ─── Invoice ──────────────────────────────────────────────────────────────

  INVOICE_SUBMITTED: {
    // Finance reviews and approves. Admin oversight.
    notifyRoles: ['finance_manager', 'administrator'],
    type: 'invoice_submitted',
    title: (i) => `Invoice Submitted: ${i.entityRef}`,
    body: (i) => `Invoice ${i.entityRef} has been submitted by the vendor and awaits approval.`,
    link: (i) => `/payments/invoices/${i.entityId}`,
    emailSubject: (i) => `Invoice ${i.entityRef} Submitted — Action Required`,
    emailBody: (i) => `Hello,\n\nInvoice ${i.entityRef} has been submitted and is awaiting review.\n\nReview: ${process.env.NEXT_PUBLIC_APP_URL}/payments/invoices/${i.entityId}`,
    sendEmail: true,
  },

  INVOICE_APPROVED: {
    // PM and Officer need to know (PO lifecycle). Finance confirmed. Admin oversight.
    notifyRoles: ['procurement_manager', 'procurement_officer', 'administrator'],
    type: 'invoice_approved',
    title: (i) => `Invoice Approved: ${i.entityRef}`,
    body: (i) => `Invoice ${i.entityRef} has been approved. Payment can now be processed.`,
    link: (i) => `/payments/invoices/${i.entityId}`,
    emailSubject: (i) => `Invoice ${i.entityRef} Approved`,
    emailBody: (i) => `Hello,\n\nInvoice ${i.entityRef} has been approved. Payment will be processed.\n\nView: ${process.env.NEXT_PUBLIC_APP_URL}/payments/invoices/${i.entityId}`,
    sendEmail: true,
  },

  INVOICE_REJECTED: {
    notifyRoles: ['procurement_manager', 'administrator'],
    type: 'invoice_rejected',
    title: (i) => `Invoice Rejected: ${i.entityRef}`,
    body: (i) => `Invoice ${i.entityRef} was rejected. Please review and resubmit.`,
    link: (i) => `/payments/invoices/${i.entityId}`,
    sendEmail: false,
  },

  // ─── Payment ──────────────────────────────────────────────────────────────

  PAYMENT_RECORDED: {
    // PM and Officer to close out PO. Finance confirmed. Admin oversight.
    notifyRoles: ['procurement_manager', 'procurement_officer', 'finance_manager', 'administrator'],
    type: 'payment_recorded',
    title: (i) => `Payment Completed: ${i.entityRef}`,
    body: (i) => `Payment for invoice ${i.entityRef} has been processed. The procurement cycle is now closed.`,
    link: (i) => `/payments/history`,
    emailSubject: (i) => `Payment Completed — ${i.entityRef}`,
    emailBody: (i) => `Hello,\n\nPayment for ${i.entityRef} has been completed.\n\nView payment history: ${process.env.NEXT_PUBLIC_APP_URL}/payments/history`,
    sendEmail: true,
  },

  // ─── Vendor ───────────────────────────────────────────────────────────────

  VENDOR_REQUEST: {
    notifyRoles: ['administrator', 'procurement_manager'],
    type: 'vendor_request',
    title: (i) => `Vendor Collaboration Request`,
    body: (i) => `${i.triggeredByName ?? 'A vendor'} wants to collaborate with your company.`,
    link: (i) => `/vendors/requests`,
    emailSubject: () => `New Vendor Collaboration Request`,
    emailBody: (i) => `Hello,\n\n${i.triggeredByName ?? 'A vendor'} has requested to collaborate.\n\nReview request: ${process.env.NEXT_PUBLIC_APP_URL}/vendors/requests`,
    sendEmail: true,
  },

  VENDOR_APPROVED: {
    notifyRoles: ['administrator', 'procurement_manager'],
    type: 'vendor_approved',
    title: (i) => `Vendor Approved: ${i.entityRef}`,
    body: (i) => `${i.entityRef} has been approved as a vendor.`,
    link: (i) => `/vendors/${i.entityId}`,
    sendEmail: false,
  },

  VENDOR_REJECTED: {
    notifyRoles: ['administrator'],
    type: 'vendor_rejected',
    title: (i) => `Vendor Request Rejected: ${i.entityRef}`,
    body: (i) => `The collaboration request from ${i.entityRef} has been rejected.`,
    link: (i) => `/vendors/requests`,
    sendEmail: false,
  },

  LOW_STOCK: {
    notifyRoles: ['warehouse_manager', 'administrator'],
    type: 'low_stock',
    title: (i) => `Low Stock Alert: ${i.entityRef}`,
    body: (i) => `${i.entityRef} is running low on stock. Please reorder.`,
    link: (i) => `/inventory`,
    emailSubject: (i) => `Low Stock Alert — ${i.entityRef}`,
    emailBody: (i) => `Hello,\n\n${i.entityRef} has fallen below the reorder point.\n\nView inventory: ${process.env.NEXT_PUBLIC_APP_URL}/inventory`,
    sendEmail: true,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Email sender — sends HTML emails via Brevo API
// ─────────────────────────────────────────────────────────────────────────────
function buildEmailHtml(subject: string, body: string, ctaUrl?: string, ctaLabel?: string): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'VendorFlow'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#5c63f5,#4349d0);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${appName}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Enterprise Procurement Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;color:#0d1117;font-size:18px;font-weight:600;">${subject}</h2>
            <div style="color:#4b5563;font-size:14px;line-height:1.7;white-space:pre-line;">${body.replace(/\n/g, '<br/>')}</div>
            ${ctaUrl && ctaLabel ? `
            <div style="text-align:center;margin:28px 0 8px;">
              <a href="${ctaUrl}" style="background:#5c63f5;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">
                ${ctaLabel}
              </a>
            </div>` : ''}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${year} ${appName} · <a href="${appUrl}" style="color:#5c63f5;text-decoration:none;">Visit Platform</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendEmail(to: string, subject: string, text: string, ctaUrl?: string, ctaLabel?: string): Promise<void> {
  const brevoKey = process.env.BREVO_API_KEY
  if (!brevoKey) return

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoKey,
      },
      body: JSON.stringify({
        sender: {
          name: process.env.NEXT_PUBLIC_APP_NAME ?? 'VendorFlow',
          email: process.env.BREVO_SENDER_EMAIL ?? 'noreply@vendorflow.app',
        },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: buildEmailHtml(subject, text, ctaUrl, ctaLabel),
      }),
    })
  } catch {
    // Non-critical — never block the primary action
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main engine entry point
// ─────────────────────────────────────────────────────────────────────────────
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const rule = MATRIX[input.event]
    if (!rule) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    // 1. Resolve all recipient user IDs
    const roleSet = new Set(rule.notifyRoles)
    const { data: roleUsers } = await db
      .from('users')
      .select('id, email, role, full_name')
      .eq('company_id', input.companyId)
      .in('role', Array.from(roleSet))
      .eq('status', 'active')

    const recipients: { id: string; email: string; full_name: string | null }[] =
      (roleUsers ?? []) as { id: string; email: string; full_name: string | null }[]

    // 2. If notifySubmitter, also add the triggering user (unless already included)
    if (rule.notifySubmitter) {
      const alreadyIncluded = recipients.some((r) => r.id === input.triggeredBy)
      if (!alreadyIncluded) {
        const { data: submitter } = await db
          .from('users')
          .select('id, email, full_name')
          .eq('id', input.triggeredBy)
          .maybeSingle()
        if (submitter) {
          recipients.push(submitter as { id: string; email: string; full_name: string | null })
        }
      }
    }

    if (recipients.length === 0) return

    const title   = rule.title(input)
    const body    = rule.body(input)
    const link    = input.link ?? rule.link(input)
    const now     = new Date().toISOString()

    // 3. Create in-app notifications in bulk
    const notifRows = recipients.map((r) => ({
      company_id:   input.companyId,
      recipient_id: r.id,
      request_id:   null,
      type:         rule.type,
      title,
      body,
      link,
      entity_type:  input.entityType ?? null,
      entity_id:    input.entityId ?? null,
      is_read:      false,
      sent_at:      now,
    }))

    await db.from('approval_notifications').insert(notifRows)

    // 4. Send emails in parallel (fire-and-forget)
    if (rule.sendEmail && rule.emailSubject && rule.emailBody) {
      const subject = rule.emailSubject(input)
      const text    = rule.emailBody(input)
      const ctaUrl  = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}${rule.link(input)}`
      await Promise.allSettled(
        recipients.map((r) => r.email ? sendEmail(r.email, subject, text, ctaUrl, 'Open VendorFlow') : Promise.resolve())
      )
    }

  } catch (err) {
    // NEVER throw — always fail silently
    console.error('[NotificationEngine] Failed:', input.event, err)
  }
}

/**
 * Convenience wrapper — notify by roles directly (for custom scenarios)
 */
export async function notifyRoles(
  companyId: string,
  roles: string[],
  notification: {
    type: NotificationType
    title: string
    body: string
    link?: string
    entityType?: string
    entityId?: string
  },
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const { data: users } = await db
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .in('role', roles)
      .eq('status', 'active')

    if (!users?.length) return

    const rows = (users as { id: string }[]).map((u) => ({
      company_id:  companyId,
      recipient_id: u.id,
      request_id:  null,
      type:        notification.type,
      title:       notification.title,
      body:        notification.body,
      link:        notification.link ?? null,
      entity_type: notification.entityType ?? null,
      entity_id:   notification.entityId ?? null,
      is_read:     false,
    }))

    await db.from('approval_notifications').insert(rows)
  } catch {
    // Silent
  }
}

/**
 * notifyVendor — sends a notification to a vendor's auth user(s).
 *
 * Vendors are stored in vendor_users (invited) or vendor_companies (self-registered).
 * Neither table is in `public.users`, so the standard `notify()` / `notifyRoles()`
 * helpers never reach them. This function bridges that gap.
 *
 * @param vendorId - The vendors.id (or vendor_companies.id) for the vendor
 * @param notification - The notification payload
 */
export async function notifyVendor(
  vendorId: string,
  notification: {
    type: NotificationType
    title: string
    body: string
    link?: string
    entityType?: string
    entityId?: string
    companyId?: string
  },
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    // Collect all user_ids associated with this vendor
    const userIds = new Set<string>()

    // 1. Invited vendor users (vendor_users table)
    const { data: vuRows } = await db
      .from('vendor_users')
      .select('user_id')
      .eq('vendor_id', vendorId)
    for (const r of (vuRows ?? []) as { user_id: string }[]) {
      if (r.user_id) userIds.add(r.user_id)
    }

    // 2. Self-registered vendor (vendor_companies table — direct user_id)
    const { data: vcRow } = await db
      .from('vendor_companies')
      .select('user_id')
      .eq('id', vendorId)
      .maybeSingle()
    if ((vcRow as { user_id: string } | null)?.user_id) {
      userIds.add((vcRow as { user_id: string }).user_id)
    }

    // 3. Also check vendor_companies linked via vendors.vendor_company_id
    const { data: vendorRow } = await db
      .from('vendors')
      .select('vendor_company_id')
      .eq('id', vendorId)
      .maybeSingle()
    if ((vendorRow as { vendor_company_id: string } | null)?.vendor_company_id) {
      const { data: vcRow2 } = await db
        .from('vendor_companies')
        .select('user_id')
        .eq('id', (vendorRow as { vendor_company_id: string }).vendor_company_id)
        .maybeSingle()
      if ((vcRow2 as { user_id: string } | null)?.user_id) {
        userIds.add((vcRow2 as { user_id: string }).user_id)
      }
    }

    if (userIds.size === 0) return

    const now = new Date().toISOString()
    const rows = Array.from(userIds).map((uid) => ({
      company_id:  notification.companyId ?? null,
      recipient_id: uid,
      request_id:  null,
      type:        notification.type,
      title:       notification.title,
      body:        notification.body,
      link:        notification.link ?? null,
      entity_type: notification.entityType ?? null,
      entity_id:   notification.entityId ?? null,
      is_read:     false,
      sent_at:     now,
    }))

    await db.from('approval_notifications').insert(rows)
  } catch (err) {
    console.error('[notifyVendor] failed:', err)
  }
}
