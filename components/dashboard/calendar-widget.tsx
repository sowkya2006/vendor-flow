import { getCalendarEvents } from '@/lib/supabase/dashboard'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { CalendarWidgetClient } from './calendar-widget-client'
import type { CalendarEvent } from '@/lib/supabase/dashboard'

export async function CalendarWidget() {
  let events: CalendarEvent[] = []
  try {
    const companyId = await getCompanyId()
    events = await getCalendarEvents(companyId)
  } catch { /* not authenticated */ }

  return <CalendarWidgetClient events={events} />
}
