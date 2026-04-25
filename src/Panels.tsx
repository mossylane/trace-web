import { useEffect, useState } from 'react'
import { api, type SpecialDay, type TraceEvent, type WeatherToday } from './lib/api'
import './Panels.css'

const MONTHS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

function formatDate(iso: string) {
  const [, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}일`
}

function daysUntil(iso: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  return `D-${diff}`
}

interface Props {
  refreshKey: number
}

export function WeatherCard() {
  const [data, setData] = useState<WeatherToday | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.weather
      .today()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="weather-card error">
        <span className="weather-icon">🌡️</span>
        <span>날씨 정보를 가져올 수 없습니다.</span>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="weather-card">
        <span className="muted">날씨 불러오는 중…</span>
      </div>
    )
  }
  return (
    <div className="weather-card">
      <div className="weather-icon">{data.icon}</div>
      <div className="weather-body">
        <div className="weather-temp">{Math.round(data.temperatureC)}°</div>
        <div className="weather-meta">
          <span className="weather-label">{data.label}</span>
          <span className="weather-loc">{data.location}</span>
        </div>
        {data.high !== null && data.low !== null && (
          <div className="weather-range">
            ↑{Math.round(data.high)}° ↓{Math.round(data.low)}°
            {data.humidity !== null && <span> · 습도 {data.humidity}%</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export function TodayPanel({ refreshKey }: Props) {
  const [events, setEvents] = useState<TraceEvent[]>([])
  const [specials, setSpecials] = useState<SpecialDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([api.events.today(), api.specialDays.today()])
      .then(([evs, sps]) => {
        if (cancelled) return
        setEvents(evs)
        setSpecials(sps)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>오늘의 일정</h3>
        <span className="panel-count">{events.length}</span>
      </div>
      <WeatherCard />
      {specials.length > 0 && (
        <div className="today-special">
          {specials.map((s) => (
            <span key={s.id} className={`special-badge kind-${s.kind}`}>
              {s.name}
            </span>
          ))}
        </div>
      )}
      {loading ? (
        <p className="muted">불러오는 중…</p>
      ) : events.length === 0 ? (
        <p className="muted">오늘은 등록된 일정이 없습니다.</p>
      ) : (
        <ul className="panel-list">
          {events.map((ev) => (
            <li key={ev.id} className={`panel-item color-${ev.color}`}>
              {ev.time && <span className="panel-time">{ev.time}</span>}
              <span className="panel-title">{ev.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function UpcomingPanel({ refreshKey }: Props) {
  const [events, setEvents] = useState<TraceEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.events
      .upcoming(7)
      .then((d) => !cancelled && setEvents(d))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>예정된 일정</h3>
        <span className="panel-count">7일</span>
      </div>
      {loading ? (
        <p className="muted">불러오는 중…</p>
      ) : events.length === 0 ? (
        <p className="muted">7일 내 예정된 일정이 없습니다.</p>
      ) : (
        <ul className="panel-list">
          {events.map((ev) => (
            <li key={ev.id} className={`panel-item color-${ev.color}`}>
              <span className="panel-when">
                <span className="panel-when-d">{daysUntil(ev.date)}</span>
                <span className="panel-when-date">{formatDate(ev.date)}</span>
              </span>
              {ev.time && <span className="panel-time">{ev.time}</span>}
              <span className="panel-title">{ev.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SpecialDaysPanel({ refreshKey }: Props) {
  const [days, setDays] = useState<SpecialDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.specialDays
      .upcoming(60)
      .then((d) => !cancelled && setDays(d))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>특별한 날</h3>
        <span className="panel-count">60일</span>
      </div>
      {loading ? (
        <p className="muted">불러오는 중…</p>
      ) : days.length === 0 ? (
        <p className="muted">60일 내 특별한 날이 없습니다.</p>
      ) : (
        <ul className="panel-list">
          {days.map((s) => (
            <li key={`${s.id}-${s.date}`} className={`panel-item special kind-${s.kind}`}>
              <span className="panel-when">
                <span className="panel-when-d">{s.date ? daysUntil(s.date) : ''}</span>
                <span className="panel-when-date">{s.date ? formatDate(s.date) : s.monthDay}</span>
              </span>
              <span className="panel-title">{s.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
