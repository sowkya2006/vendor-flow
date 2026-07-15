'use server'

import { revalidatePath } from 'next/cache'
import {
  markOneRead,
  markAllRead,
  deleteNotification,
  deleteAllRead,
} from '@/lib/supabase/notifications'

export async function markOneReadAction(id: string) {
  await markOneRead(id)
  revalidatePath('/notifications')
}

export async function markAllReadAction() {
  await markAllRead()
  revalidatePath('/notifications')
}

export async function deleteNotificationAction(id: string) {
  await deleteNotification(id)
  revalidatePath('/notifications')
}

export async function deleteAllReadAction() {
  await deleteAllRead()
  revalidatePath('/notifications')
}
