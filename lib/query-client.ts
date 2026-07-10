import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 60 seconds — avoid refetching on every mount
        staleTime: 60 * 1000,
        // Retry once on failure
        retry: 1,
        // Refetch on window focus in production
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new QueryClient
    return makeQueryClient()
  }
  // Browser: reuse a singleton
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
