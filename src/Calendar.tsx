import { useEffect, useMemo, useState } from 'react'
import { api, isoDate, type SpecialDay, type TraceEvent } from './lib/api'
import DayDetail from './DayDetail'
import './Calendar.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

interface Props {
  onDataChanged?: () => void
}

function Calendar({ onDataChanged }: Props) {
  const today = useMemo(() => new Date(), [])
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<Date | null>(null)
  const [events, setEvents] = useState<TraceEvent[]>([])
  const [specials, setSpecials] = useState<SpecialDay[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  const year = view.getFullYear()
  const month = view.getMonth()

  useEffect(() => {
    const firstIso = isoDate(new Date(year, month, 1))
    const lastIso = isoDate(new Date(year, month + 1, 0))
    let cancelled = false
    Promise.all([
      api.events.range(firstIso, lastIso),
      api.specialDays.month(year, month + 1),
    ])
      .then(([evs, sps]) => {
        if (cancelled) return
        setEvents(evs)
        setSpecials(sps)
      })
      .catch((err) => console.error('calendar load failed', err))
    return () => {
      cancelled = true
    }
  }, [year, month, reloadKey])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, TraceEvent[]>()
    for (const ev of events) {
      const list = map.get(ev.date) ?? []
      list.push(ev)
      map.set(ev.date, list)
    }
    return map
  }, [events])

  const specialsByDate = useMemo(() => {
    const map = new Map<string, SpecialDay[]>()
    for (const s of specials) {
      const date = s.date ?? `${year}-${s.monthDay}`
      const list = map.get(date) ?? []
      list.push(s)
      map.set(date, list)
    }
    return map
  }, [specials, year])

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells: { date: Date; inMonth: boolean }[] = []
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    })
  }

  const goPrev = () => setView(new Date(year, month - 1, 1))
  const goNext = () => setView(new Date(year, month + 1, 1))
  const goToday = () => {
    setView(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelected(today)
  }

  const handleChanged = () => {
    setReloadKey((k) => k + 1)
    onDataChanged?.()
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" className="cal-nav" onClick={goPrev} aria-label="이전 달">
          ‹
        </button>
        <button type="button" className="cal-title" onClick={goToday}>
          {year}년 {MONTHS[month]}
        </button>
        <button type="button" className="cal-nav" onClick={goNext} aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`cal-weekday${i === 0 ? ' sun' : ''}${i === 6 ? ' sat' : ''}`}
          >
            {w}
          </div>
        ))}
        {cells.map(({ date, inMonth }) => {
          const dow = date.getDay()
          const iso = isoDate(date)
          const dayEvents = eventsByDate.get(iso) ?? []
          const daySpecials = specialsByDate.get(iso) ?? []
          const isHoliday = daySpecials.some((s) => s.kind === 'holiday')
          const classes = ['cal-day']
          if (!inMonth) classes.push('out')
          if (isSameDay(date, today)) classes.push('today')
          if (selected && isSameDay(date, selected)) classes.push('selected')
          if (dow === 0 || isHoliday) classes.push('sun')
          else if (dow === 6) classes.push('sat')
          return (
            <button
              key={iso}
              type="button"
              className={classes.join(' ')}
              onClick={() => setSelected(date)}
              title={daySpecials.map((s) => s.name).join(', ')}
            >
              <span className="cal-day-num">{date.getDate()}</span>
              {daySpecials.length > 0 && (
                <span className="cal-day-special">{daySpecials[0].name}</span>
              )}
              {dayEvents.length > 0 && (
                <span className="cal-day-dots" aria-label={`일정 ${dayEvents.length}개`}>
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span key={ev.id} className={`dot dot-${ev.color}`} />
                  ))}
                  {dayEvents.length > 3 && <span className="dot-more">+{dayEvents.length - 3}</span>}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {selected && (
        <DayDetail
          date={selected}
          onClose={() => setSelected(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  )
}

export default Calendar
