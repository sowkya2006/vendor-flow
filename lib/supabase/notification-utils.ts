/**
 * notification-utils.ts
 * Pure client-safe helpers for notification display.
 * No server imports — safe to use in both server and client components.
 */

export type NotificationType =
  | 'approval_required'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'invitation_accepted'
  | 'vendor_approved'
  | 'vendor_rejected'
  | 'vendor_request'
  | 'po_issued'
  | 'invoice_submitted'
  | 'invoice_approved'
  | 'invoice_rejected'
  | 'payment_recorded'
  | 'rfq_created'
  | 'quotation_submitted'
  | 'low_stock'
  | 'general'
  | 'system'

export type NotificationFilter = 'all' | 'unread' | 'approvals' | 'system'

export interface Notification {
  id: string
  request_id: string | null
  company_id: string
  recipient_id: string | null
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  read_at: string | null
  sent_at: string | null
  created_at: string
  link: string | null
  entity_type: string | null
  entity_id: string | null
}

/** Map a NotificationType to a display-friendly label and colour family */
export function getNotificationMeta(type: NotificationType): {
  label: string
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray'
  icon: 'approval' | 'vendor' | 'finance' | 'inventory' | 'system'
} {
  switch (type) {
    case 'approval_required':
      return { label: 'Approval Required', color: 'amber',  icon: 'approval'  }
    case 'approved':
      return { label: 'Approved',           color: 'green',  icon: 'approval'  }
    case 'rejected':
      return { label: 'Rejected',           color: 'red',    icon: 'approval'  }
    case 'returned':
      return { label: 'Returned',           color: 'amber',  icon: 'approval'  }
    case 'vendor_approved':
    case 'vendor_request':
      return { label: 'Vendor',             color: 'blue',   icon: 'vendor'    }
    case 'vendor_rejected':
      return { label: 'Vendor',             color: 'red',    icon: 'vendor'    }
    case 'po_issued':
      return { label: 'Purchase Order',     color: 'purple', icon: 'approval'  }
    case 'invoice_submitted':
    case 'invoice_approved':
    case 'invoice_rejected':
    case 'payment_recorded':
      return { label: 'Finance',            color: 'green',  icon: 'finance'   }
    case 'rfq_created':
    case 'quotation_submitted':
      return { label: 'Procurement',        color: 'blue',   icon: 'approval'  }
    case 'low_stock':
      return { label: 'Inventory Alert',    color: 'red',    icon: 'inventory' }
    case 'invitation_accepted':
      return { label: 'Team',               color: 'green',  icon: 'system'    }
    case 'system':
    case 'general':
    default:
      return { label: 'System',             color: 'gray',   icon: 'system'    }
  }
}

/** Relative time string — "2 minutes ago", "yesterday", etc. */
export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1)  return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1)   return 'yesterday'
  if (days < 7)     return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
