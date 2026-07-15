// ============================================================
// Communication Center — Types
// ============================================================

export type ConversationType = 'rfq' | 'quotation' | 'purchase_order' | 'invoice' | 'general'

export type MessageStatus = 'sent' | 'delivered' | 'read'

export interface ConversationParticipant {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  type: 'company_user' | 'vendor_user'
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_type: 'company_user' | 'vendor_user'
  content: string
  attachments?: MessageAttachment[]
  created_at: string
  status: MessageStatus
  is_own: boolean
}

export interface MessageAttachment {
  id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
}

export interface Conversation {
  id: string
  company_id: string
  vendor_id: string
  vendor_name: string
  type: ConversationType
  subject: string
  reference_id: string | null
  reference_label: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  participant_count: number
  created_at: string
  updated_at: string
}

export const CONVERSATION_TYPE_LABELS: Record<ConversationType, string> = {
  rfq: 'RFQ',
  quotation: 'Quotation',
  purchase_order: 'Purchase Order',
  invoice: 'Invoice',
  general: 'General',
}

export const CONVERSATION_TYPE_COLORS: Record<ConversationType, string> = {
  rfq: 'bg-blue-100 text-blue-700',
  quotation: 'bg-purple-100 text-purple-700',
  purchase_order: 'bg-orange-100 text-orange-700',
  invoice: 'bg-emerald-100 text-emerald-700',
  general: 'bg-gray-100 text-gray-600',
}
