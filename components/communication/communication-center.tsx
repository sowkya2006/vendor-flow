'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Search, Plus, Send, Paperclip, ChevronLeft, MoveHorizontal as MoreHorizontal, ListFilter as Filter, CheckCheck, Check, X, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { VendorSummary } from '@/types/vendor'
import type {
  Conversation,
  Message,
  ConversationType,
} from '@/types/communication'
import {
  CONVERSATION_TYPE_LABELS,
  CONVERSATION_TYPE_COLORS,
} from '@/types/communication'
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markConversationRead,
} from '@/lib/supabase/communication'
import type { ConversationFilters } from '@/lib/supabase/communication'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommunicationCenterProps {
  vendors: VendorSummary[]
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}) {
  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false })
    : ''

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-4 text-left transition-colors',
        'hover:bg-[--color-background-subtle] border-b border-[--color-border] last:border-0',
        isActive && 'bg-[--color-primary]/5 border-l-2 border-l-[--color-primary]',
      )}
    >
      {/* Vendor avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[--color-primary]/10 text-[10px] font-bold text-[--color-primary] uppercase">
        {conversation.vendor_name.slice(0, 2)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm',
              conversation.unread_count > 0
                ? 'font-semibold text-[--color-foreground]'
                : 'font-medium text-[--color-foreground-muted]',
            )}
          >
            {conversation.vendor_name}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {conversation.unread_count > 0 && (
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[--color-primary] px-1.5 text-[10px] font-bold text-white">
                {conversation.unread_count}
              </span>
            )}
            <span className="text-[11px] text-[--color-foreground-subtle] whitespace-nowrap">
              {timeAgo}
            </span>
          </div>
        </div>

        <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
          {conversation.subject}
        </p>

        {conversation.last_message && (
          <p
            className={cn(
              'mt-0.5 truncate text-xs',
              conversation.unread_count > 0
                ? 'text-[--color-foreground]'
                : 'text-[--color-foreground-subtle]',
            )}
          >
            {conversation.last_message}
          </p>
        )}

        <div className="mt-1">
          <span
            className={cn(
              'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              CONVERSATION_TYPE_COLORS[conversation.type],
            )}
          >
            {CONVERSATION_TYPE_LABELS[conversation.type]}
          </span>
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: Message }) {
  const time = formatDistanceToNow(new Date(message.created_at), { addSuffix: true })

  return (
    <div className={cn('flex gap-2.5', message.is_own ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-1',
          message.is_own
            ? 'bg-[--color-primary]/10 text-[--color-primary]'
            : 'bg-[--color-foreground-subtle]/20 text-[--color-foreground-muted]',
        )}
      >
        {message.sender_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[72%] space-y-1', message.is_own ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[--color-foreground-subtle]">
            {message.is_own ? 'You' : message.sender_name}
          </span>
          <span className="text-[11px] text-[--color-foreground-subtle]">{time}</span>
        </div>

        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            message.is_own
              ? 'bg-[--color-primary] text-white rounded-tr-sm'
              : 'bg-[--color-background-subtle] text-[--color-foreground] rounded-tl-sm border border-[--color-border]',
          )}
        >
          {message.content}
        </div>

        {/* Status for own messages */}
        {message.is_own && (
          <div className="flex justify-end">
            {message.status === 'read' ? (
              <CheckCheck className="h-3.5 w-3.5 text-[--color-primary]" />
            ) : (
              <Check className="h-3.5 w-3.5 text-[--color-foreground-subtle]" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface NewConversationFormProps {
  vendors: VendorSummary[]
  onCancel: () => void
  onCreated: (conv: Conversation) => void
}

function NewConversationForm({ vendors, onCancel, onCreated }: NewConversationFormProps) {
  const [isPending, startTransition] = useTransition()
  const [vendorId, setVendorId] = useState('')
  const [type, setType] = useState<ConversationType>('general')
  const [subject, setSubject] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vendorId || !subject.trim()) {
      toast.error('Please select a vendor and enter a subject.')
      return
    }
    const vendor = vendors.find((v) => v.id === vendorId)
    if (!vendor) return

    startTransition(async () => {
      const conv = await createConversation('co-1', vendor.id, vendor.name, type, subject.trim())
      toast.success('Conversation started')
      onCreated(conv)
    })
  }

  const TYPES: ConversationType[] = ['rfq', 'quotation', 'purchase_order', 'invoice', 'general']

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <h3 className="text-sm font-semibold text-[--color-foreground]">New Conversation</h3>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[--color-foreground-muted]">Vendor *</label>
        <Select value={vendorId} onValueChange={setVendorId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a vendor…" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[--color-foreground-muted]">Topic</label>
        <Select value={type} onValueChange={(v) => setType(v as ConversationType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {CONVERSATION_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[--color-foreground-muted]">Subject *</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Follow-up on RFQ-2024-0847"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !vendorId || !subject.trim()}>
          {isPending ? 'Starting…' : 'Start Conversation'}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CommunicationCenter({ vendors }: CommunicationCenterProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [isSending, startSendTransition] = useTransition()
  const [draftMessage, setDraftMessage] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ConversationType | ''>('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null

  // Load conversations
  const loadConversations = useCallback(async (filters: ConversationFilters = {}) => {
    setLoading(true)
    const data = await getConversations('co-1', filters)
    setConversations(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadConversations({ search, type: typeFilter || undefined, unread_only: unreadOnly || undefined })
  }, [search, typeFilter, unreadOnly, loadConversations])

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) return
    setMsgsLoading(true)
    getMessages(activeId).then((msgs) => {
      setMessages(msgs)
      setMsgsLoading(false)
      markConversationRead(activeId)
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, unread_count: 0 } : c)),
      )
    })
  }, [activeId])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function selectConversation(id: string) {
    setActiveId(id)
    setMobileView('thread')
    setShowNewForm(false)
  }

  function handleSend() {
    if (!activeId || !draftMessage.trim()) return
    const content = draftMessage.trim()
    setDraftMessage('')

    startSendTransition(async () => {
      const msg = await sendMessage(activeId, content, 'u-me')
      setMessages((prev) => [...prev, msg])
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, last_message: content, last_message_at: msg.created_at }
            : c,
        ),
      )
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleConversationCreated(conv: Conversation) {
    setConversations((prev) => [conv, ...prev])
    setShowNewForm(false)
    selectConversation(conv.id)
  }

  const TYPES: Array<{ value: ConversationType | ''; label: string }> = [
    { value: '', label: 'All Topics' },
    ...Object.entries(CONVERSATION_TYPE_LABELS).map(([v, l]) => ({
      value: v as ConversationType,
      label: l,
    })),
  ]

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── LEFT PANEL — Conversation List ─────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col w-full lg:w-80 xl:w-96 shrink-0',
          'border-r border-[--color-border] bg-[--color-card]',
          mobileView === 'thread' && 'hidden lg:flex',
        )}
      >
        {/* Header */}
        <div className="border-b border-[--color-border] px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[--color-foreground]">
                Messages
              </h1>
              {totalUnread > 0 && (
                <span className="rounded-full bg-[--color-primary] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {totalUnread}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowNewForm(true); setActiveId(null) }}
              className="h-7 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--color-foreground-muted]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ConversationType | '')}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value || 'all'} value={t.value || 'all-topics'}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={() => setUnreadOnly((v) => !v)}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors',
                unreadOnly
                  ? 'border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]'
                  : 'border-[--color-border] text-[--color-foreground-muted] hover:bg-[--color-accent]',
              )}
            >
              <Filter className="h-3 w-3" />
              Unread
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-0 divide-y divide-[--color-border]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-4 py-4">
                  <div className="h-9 w-9 rounded-full bg-[--color-muted] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 rounded bg-[--color-muted] animate-pulse" />
                    <div className="h-2.5 w-full rounded bg-[--color-muted] animate-pulse" />
                    <div className="h-2.5 w-3/4 rounded bg-[--color-muted] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--color-background-subtle] text-[--color-foreground-subtle]">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-[--color-foreground]">No conversations</p>
              <p className="text-xs text-[--color-foreground-muted]">
                {search || typeFilter || unreadOnly
                  ? 'Try adjusting your filters.'
                  : 'Start a conversation with a vendor.'}
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                onClick={() => selectConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — Thread / New Form ────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-1 flex-col bg-[--color-background-subtle]',
          mobileView === 'list' && 'hidden lg:flex',
        )}
      >
        {/* New conversation form */}
        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              className="h-full overflow-y-auto bg-[--color-card]"
            >
              <div className="border-b border-[--color-border] px-5 py-4 flex items-center gap-3">
                <button
                  onClick={() => setShowNewForm(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[--color-border]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-[--color-foreground-muted]" />
                </button>
                <h2 className="text-sm font-semibold text-[--color-foreground]">
                  New Conversation
                </h2>
              </div>
              <NewConversationForm
                vendors={vendors}
                onCancel={() => setShowNewForm(false)}
                onCreated={handleConversationCreated}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!showNewForm && !activeConversation && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[--color-card] border border-[--color-border] text-[--color-foreground-muted] shadow-[--shadow-sm]">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[--color-foreground]">
                Select a conversation
              </p>
              <p className="text-xs text-[--color-foreground-muted] max-w-xs">
                Choose a conversation from the list or start a new one to communicate with your vendors.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewForm(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </Button>
          </div>
        )}

        {/* Message thread */}
        {!showNewForm && activeConversation && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-[--color-border] bg-[--color-card] px-5 py-3.5 shadow-[--shadow-xs]">
              {/* Mobile back */}
              <button
                onClick={() => setMobileView('list')}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[--color-border] lg:hidden"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="h-4 w-4 text-[--color-foreground-muted]" />
              </button>

              {/* Vendor avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[--color-primary]/10 text-[10px] font-bold text-[--color-primary] uppercase">
                {activeConversation.vendor_name.slice(0, 2)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[--color-foreground] truncate">
                  {activeConversation.vendor_name}
                </p>
                <p className="text-xs text-[--color-foreground-muted] truncate">
                  {activeConversation.subject}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    CONVERSATION_TYPE_COLORS[activeConversation.type],
                  )}
                >
                  {CONVERSATION_TYPE_LABELS[activeConversation.type]}
                </span>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[--color-border]"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4 text-[--color-foreground-muted]" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {msgsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex gap-2.5',
                        i % 2 === 0 ? 'flex-row' : 'flex-row-reverse',
                      )}
                    >
                      <div className="h-7 w-7 rounded-full bg-[--color-muted] animate-pulse shrink-0" />
                      <div
                        className={cn(
                          'space-y-1 max-w-sm',
                          i % 2 === 0 ? 'items-start' : 'items-end',
                        )}
                      >
                        <div className="h-2.5 w-20 rounded bg-[--color-muted] animate-pulse" />
                        <div className="h-12 w-64 rounded-2xl bg-[--color-muted] animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--color-card] border border-[--color-border] text-[--color-foreground-subtle]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-[--color-foreground-muted]">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <MessageBubble message={msg} />
                    </motion.div>
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div className="border-t border-[--color-border] bg-[--color-card] px-4 pb-4 pt-3">
              <div className="flex items-end gap-2.5 rounded-xl border border-[--color-border] bg-[--color-background-subtle] p-2">
                <button
                  className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[--color-foreground-muted] hover:bg-[--color-border] transition-colors"
                  aria-label="Attach file"
                  type="button"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <Textarea
                  ref={textareaRef}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  className="min-h-[2.25rem] max-h-32 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-[--color-foreground-subtle]"
                  rows={1}
                />

                <Button
                  size="icon-sm"
                  disabled={!draftMessage.trim() || isSending}
                  onClick={handleSend}
                  className="mb-0.5 shrink-0"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <p className="mt-1.5 text-center text-[10px] text-[--color-foreground-subtle]">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
