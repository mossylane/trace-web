import { useState } from 'react'
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

function Calendar() {
  const today = new Date()
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<Date | null>(null)

  const year = view.getFullYear()
  const month = view.getMonth()
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
  const goToday = () => setView(new Date(today.getFullYear(), today.getMonth(), 1))

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
          const classes = ['cal-day']
          if (!inMonth) classes.push('out')
          if (isSameDay(date, today)) classes.push('today')
          if (selected && isSameDay(date, selected)) classes.push('selected')
          if (dow === 0) classes.push('sun')
          if (dow === 6) classes.push('sat')
          return (
            <button
              key={date.toISOString()}
              type="button"
              className={classes.join(' ')}
              onClick={() => setSelected(date)}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
      {selected && (
        <p className="cal-selected-info">
          선택: {selected.getFullYear()}년 {MONTHS[selected.getMonth()]} {selected.getDate()}일
        </p>
      )}
    </div>
  )
}

export default Calendar
