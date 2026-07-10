import type {
  Conversation,
  Message,
  ConversationType,
} from '@/types/communication'
import { formatDistanceToNow } from 'date-fns'

// ---------------------------------------------------------------------------
// Mock data helpers — replaced with Supabase queries when backend is ready
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString()
}
function minsAgo(n: number): string {
  return new Date(Date.now() - n * 60000).toISOString()
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    company_id: 'co-1',
    vendor_id: 'v-1',
    vendor_name: 'TechSupply Co.',
    type: 'rfq',
    subject: 'RFQ-2024-0847 — Industrial Sensors',
    reference_id: 'rfq-1',
    reference_label: 'RFQ-2024-0847',
    last_message: "We can deliver within 14 days. Please confirm your preferred payment terms.",
    last_message_at: minsAgo(8),
    unread_count: 2,
    participant_count: 3,
    created_at: daysAgo(5),
    updated_at: minsAgo(8),
  },
  {
    id: 'conv-2',
    company_id: 'co-1',
    vendor_id: 'v-2',
    vendor_name: 'Global Materials Inc.',
    type: 'purchase_order',
    subject: 'PO-2024-1123 — Circuit Boards',
    reference_id: 'po-1',
    reference_label: 'PO-2024-1123',
    last_message: "The shipment has been dispatched. Tracking number: GML-TRK-8821.",
    last_message_at: minsAgo(45),
    unread_count: 1,
    participant_count: 2,
    created_at: daysAgo(8),
    updated_at: minsAgo(45),
  },
  {
    id: 'conv-3',
    company_id: 'co-1',
    vendor_id: 'v-3',
    vendor_name: 'ElectroComponents Ltd.',
    type: 'quotation',
    subject: 'Quotation Review — Q-2024-0334',
    reference_id: 'quot-1',
    reference_label: 'Q-2024-0334',
    last_message: "Thanks for the feedback. We've revised the unit pricing as requested.",
    last_message_at: minsAgo(120),
    unread_count: 0,
    participant_count: 2,
    created_at: daysAgo(3),
    updated_at: minsAgo(120),
  },
  {
    id: 'conv-4',
    company_id: 'co-1',
    vendor_id: 'v-4',
    vendor_name: 'Swift Logistics',
    type: 'invoice',
    subject: 'Invoice INV-8841 — Payment Query',
    reference_id: 'inv-1',
    reference_label: 'INV-8841',
    last_message: "Could you please confirm when the payment will be processed?",
    last_message_at: minsAgo(300),
    unread_count: 0,
    participant_count: 2,
    created_at: daysAgo(2),
    updated_at: minsAgo(300),
  },
  {
    id: 'conv-5',
    company_id: 'co-1',
    vendor_id: 'v-5',
    vendor_name: 'ProServices Group',
    type: 'general',
    subject: 'Onboarding Discussion',
    reference_id: null,
    reference_label: null,
    last_message: "Looking forward to our partnership. Please share your compliance documents.",
    last_message_at: daysAgo(1),
    unread_count: 0,
    participant_count: 4,
    created_at: daysAgo(10),
    updated_at: daysAgo(1),
  },
  {
    id: 'conv-6',
    company_id: 'co-1',
    vendor_id: 'v-1',
    vendor_name: 'TechSupply Co.',
    type: 'general',
    subject: 'Delivery Schedule for Q4',
    reference_id: null,
    reference_label: null,
    last_message: "Understood. We'll adjust the delivery schedule accordingly.",
    last_message_at: daysAgo(3),
    unread_count: 0,
    participant_count: 2,
    created_at: daysAgo(14),
    updated_at: daysAgo(3),
  },
]

const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm1', conversation_id: 'conv-1', sender_id: 'u-me', sender_name: 'Alex Johnson', sender_type: 'company_user', content: "Hi, we've sent you RFQ-2024-0847 for 500 units of industrial sensors. Please review the specifications and submit your quotation by Aug 20.", created_at: daysAgo(5), status: 'read', is_own: true, attachments: [] },
    { id: 'm2', conversation_id: 'conv-1', sender_id: 'v-u-1', sender_name: 'Sarah Chen', sender_type: 'vendor_user', content: "Hello Alex, thank you for the RFQ. We've reviewed the specifications and can fulfill this order. A few questions: What's the required IP rating? Do you need CE certification?", created_at: daysAgo(4), status: 'read', is_own: false, attachments: [] },
    { id: 'm3', conversation_id: 'conv-1', sender_id: 'u-me', sender_name: 'Alex Johnson', sender_type: 'company_user', content: "IP67 is required. CE certification is mandatory. Please include the relevant documentation with your quotation.", created_at: daysAgo(4), status: 'read', is_own: true },
    { id: 'm4', conversation_id: 'conv-1', sender_id: 'v-u-1', sender_name: 'Sarah Chen', sender_type: 'vendor_user', content: "Understood. We have IP67-rated sensors with CE certification. Our quoted delivery time would be 10–14 business days from PO confirmation.", created_at: daysAgo(2), status: 'read', is_own: false },
    { id: 'm5', conversation_id: 'conv-1', sender_id: 'v-u-1', sender_name: 'Sarah Chen', sender_type: 'vendor_user', content: "We can deliver within 14 days. Please confirm your preferred payment terms.", created_at: minsAgo(8), status: 'delivered', is_own: false },
  ],
  'conv-2': [
    { id: 'm6', conversation_id: 'conv-2', sender_id: 'u-me', sender_name: 'Alex Johnson', sender_type: 'company_user', content: "Hi team, PO-2024-1123 has been approved for 1,000 circuit boards. Please confirm your production schedule.", created_at: daysAgo(8), status: 'read', is_own: true },
    { id: 'm7', conversation_id: 'conv-2', sender_id: 'v-u-2', sender_name: 'Marcus Green', sender_type: 'vendor_user', content: "Thank you! We've confirmed the order. Production starts immediately. Expected completion: 7 days.", created_at: daysAgo(7), status: 'read', is_own: false },
    { id: 'm8', conversation_id: 'conv-2', sender_id: 'v-u-2', sender_name: 'Marcus Green', sender_type: 'vendor_user', content: "The shipment has been dispatched. Tracking number: GML-TRK-8821.", created_at: minsAgo(45), status: 'delivered', is_own: false },
  ],
  'conv-3': [
    { id: 'm9', conversation_id: 'conv-3', sender_id: 'u-me', sender_name: 'Alex Johnson', sender_type: 'company_user', content: "Hi, we've reviewed quotation Q-2024-0334. The unit price seems high compared to other bids. Can you revise?", created_at: daysAgo(3), status: 'read', is_own: true },
    { id: 'm10', conversation_id: 'conv-3', sender_id: 'v-u-3', sender_name: 'Priya Patel', sender_type: 'vendor_user', content: "Thanks for the feedback. We've revised the unit pricing as requested.", created_at: minsAgo(120), status: 'read', is_own: false },
  ],
  'conv-4': [
    { id: 'm11', conversation_id: 'conv-4', sender_id: 'v-u-4', sender_name: 'James Wilson', sender_type: 'vendor_user', content: "Hello, we noticed that Invoice INV-8841 (due 3 days ago) has not been settled. Could you please check?", created_at: daysAgo(2), status: 'read', is_own: false },
    { id: 'm12', conversation_id: 'conv-4', sender_id: 'u-me', sender_name: 'Alex Johnson', sender_type: 'company_user', content: "Apologies for the delay. Our finance team is processing it. Expected payment in 2 business days.", created_at: daysAgo(1), status: 'read', is_own: true },
    { id: 'm13', conversation_id: 'conv-4', sender_id: 'v-u-4', sender_name: 'James Wilson', sender_type: 'vendor_user', content: "Could you please confirm when the payment will be processed?", created_at: minsAgo(300), status: 'read', is_own: false },
  ],
  'conv-5': [
    { id: 'm14', conversation_id: 'conv-5', sender_id: 'u-me', sender_name: 'Alex Johnson', sender_type: 'company_user', content: "Welcome to VendorFlow! We're excited to start working with ProServices. Here's what we need to complete your onboarding.", created_at: daysAgo(10), status: 'read', is_own: true },
    { id: 'm15', conversation_id: 'conv-5', sender_id: 'v-u-5', sender_name: 'Lisa Park', sender_type: 'vendor_user', content: "Looking forward to our partnership. Please share your compliance documents.", created_at: daysAgo(1), status: 'read', is_own: false },
  ],
  'conv-6': [
    { id: 'm16', conversation_id: 'conv-6', sender_id: 'u-me', sender_name: 'Alex Johnson', sender_type: 'company_user', content: "We'll need adjusted delivery windows for Q4 due to warehouse capacity constraints. Can you accommodate bi-weekly deliveries?", created_at: daysAgo(5), status: 'read', is_own: true },
    { id: 'm17', conversation_id: 'conv-6', sender_id: 'v-u-1', sender_name: 'Sarah Chen', sender_type: 'vendor_user', content: "Understood. We'll adjust the delivery schedule accordingly.", created_at: daysAgo(3), status: 'read', is_own: false },
  ],
}

// ---------------------------------------------------------------------------
// Service functions (mock implementations)
// ---------------------------------------------------------------------------

export interface ConversationFilters {
  search?: string
  type?: ConversationType | ''
  vendor_id?: string
  unread_only?: boolean
}

export async function getConversations(
  _companyId: string,
  filters: ConversationFilters = {},
): Promise<Conversation[]> {
  let results = [...MOCK_CONVERSATIONS]

  if (filters.search) {
    const s = filters.search.toLowerCase()
    results = results.filter(
      (c) =>
        c.subject.toLowerCase().includes(s) ||
        c.vendor_name.toLowerCase().includes(s) ||
        (c.last_message ?? '').toLowerCase().includes(s),
    )
  }
  if (filters.type) {
    results = results.filter((c) => c.type === filters.type)
  }
  if (filters.vendor_id) {
    results = results.filter((c) => c.vendor_id === filters.vendor_id)
  }
  if (filters.unread_only) {
    results = results.filter((c) => c.unread_count > 0)
  }

  return results.sort(
    (a, b) =>
      new Date(b.last_message_at ?? b.created_at).getTime() -
      new Date(a.last_message_at ?? a.created_at).getTime(),
  )
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  return MOCK_CONVERSATIONS.find((c) => c.id === id) ?? null
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return MOCK_MESSAGES[conversationId] ?? []
}

export async function sendMessage(
  conversationId: string,
  content: string,
  _senderId: string,
): Promise<Message> {
  const newMsg: Message = {
    id: `msg-${Date.now()}`,
    conversation_id: conversationId,
    sender_id: 'u-me',
    sender_name: 'Alex Johnson',
    sender_type: 'company_user',
    content,
    created_at: new Date().toISOString(),
    status: 'sent',
    is_own: true,
  }
  if (!MOCK_MESSAGES[conversationId]) {
    MOCK_MESSAGES[conversationId] = []
  }
  MOCK_MESSAGES[conversationId].push(newMsg)
  const conv = MOCK_CONVERSATIONS.find((c) => c.id === conversationId)
  if (conv) {
    conv.last_message = content
    conv.last_message_at = newMsg.created_at
    conv.updated_at = newMsg.created_at
  }
  return newMsg
}

export async function createConversation(
  _companyId: string,
  vendorId: string,
  vendorName: string,
  type: ConversationType,
  subject: string,
): Promise<Conversation> {
  const newConv: Conversation = {
    id: `conv-${Date.now()}`,
    company_id: 'co-1',
    vendor_id: vendorId,
    vendor_name: vendorName,
    type,
    subject,
    reference_id: null,
    reference_label: null,
    last_message: null,
    last_message_at: null,
    unread_count: 0,
    participant_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  MOCK_CONVERSATIONS.unshift(newConv)
  MOCK_MESSAGES[newConv.id] = []
  return newConv
}

export async function markConversationRead(_conversationId: string): Promise<void> {
  const conv = MOCK_CONVERSATIONS.find((c) => c.id === _conversationId)
  if (conv) conv.unread_count = 0
}

export async function getTotalUnread(_companyId: string): Promise<number> {
  return MOCK_CONVERSATIONS.reduce((s, c) => s + c.unread_count, 0)
}
