const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

export interface TraceEvent {
  id: number
  date: string
  time: string | null
  title: string
  description: string | null
  color: string
  createdAt: string
  updatedAt: string
}

export interface SpecialDay {
  id: number
  monthDay: string
  name: string
  kind: string
  date?: string
}

export interface WeatherToday {
  location: string
  temperatureC: number
  feelsLikeC: number | null
  humidity: number | null
  windKph: number | null
  weatherCode: number
  label: string
  icon: string
  high: number | null
  low: number | null
  observedAt: string
}

export interface CreateEventInput {
  date: string
  time?: string
  title: string
  description?: string
  color?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  events: {
    today: () => request<TraceEvent[]>(`/events/today`),
    upcoming: (days = 7) => request<TraceEvent[]>(`/events/upcoming?days=${days}`),
    range: (from: string, to: string) =>
      request<TraceEvent[]>(`/events/range?from=${from}&to=${to}`),
    byDate: (date: string) => request<TraceEvent[]>(`/events/date/${date}`),
    create: (input: CreateEventInput) =>
      request<TraceEvent>(`/events`, { method: 'POST', body: JSON.stringify(input) }),
    remove: (id: number) => request<{ ok: boolean }>(`/events/${id}`, { method: 'DELETE' }),
  },
  specialDays: {
    today: () => request<SpecialDay[]>(`/special-days/today`),
    upcoming: (days = 60) => request<SpecialDay[]>(`/special-days/upcoming?days=${days}`),
    month: (year: number, month: number) =>
      request<SpecialDay[]>(`/special-days/month?year=${year}&month=${month}`),
    byDate: (date: string) => request<SpecialDay[]>(`/special-days/date/${date}`),
  },
  weather: {
    today: () => request<WeatherToday>(`/weather/today`),
  },
}

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
