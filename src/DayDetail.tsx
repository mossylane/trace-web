import { useEffect, useState } from 'react'
import { api, isoDate, type SpecialDay, type TraceEvent } from './lib/api'
import './DayDetail.css'

const MONTHS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const COLORS = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']

interface Props {
  date: Date
  onClose: () => void
  onChanged: () => void
}

function DayDetail({ date, onClose, onChanged }: Props) {
  const iso = isoDate(date)
  const [events, setEvents] = useState<TraceEvent[]>([])
  const [specials, setSpecials] = useState<SpecialDay[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('default')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([api.events.byDate(iso), api.specialDays.byDate(iso)])
      .then(([evs, sps]) => {
        if (cancelled) return
        setEvents(evs)
        setSpecials(sps)
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [iso])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await api.events.create({
        date: iso,
        title: title.trim(),
        time: time || undefined,
        description: description.trim() || undefined,
        color,
      })
      setEvents((prev) =>
        [...prev, created].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99')),
      )
      setTitle('')
      setTime('')
      setDescription('')
      setColor('default')
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    setError(null)
    try {
      await api.events.remove(id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="day-detail-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="day-detail" onClick={(e) => e.stopPropagation()}>
        <header className="day-detail-header">
          <div>
            <h3>
              {date.getFullYear()}년 {MONTHS[date.getMonth()]} {date.getDate()}일
              <span className="day-detail-dow"> ({WEEKDAYS[date.getDay()]})</span>
            </h3>
            {specials.length > 0 && (
              <p className="day-detail-special">
                {specials.map((s) => (
                  <span key={s.id} className={`special-badge kind-${s.kind}`}>
                    {s.name}
                  </span>
                ))}
              </p>
            )}
          </div>
          <button type="button" className="day-detail-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <section className="day-detail-section">
          <h4>일정 {events.length > 0 && <span className="muted">({events.length})</span>}</h4>
          {loading ? (
            <p className="muted">불러오는 중…</p>
          ) : events.length === 0 ? (
            <p className="muted">아직 등록된 일정이 없습니다.</p>
          ) : (
            <ul className="event-list">
              {events.map((ev) => (
                <li key={ev.id} className={`event-item color-${ev.color}`}>
                  <div className="event-main">
                    {ev.time && <span className="event-time">{ev.time}</span>}
                    <span className="event-title">{ev.title}</span>
                  </div>
                  {ev.description && <p className="event-desc">{ev.description}</p>}
                  <button
                    type="button"
                    className="event-del"
                    onClick={() => handleDelete(ev.id)}
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="day-detail-section">
          <h4>새 일정 추가</h4>
          <form className="event-form" onSubmit={handleAdd}>
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="시간"
            />
            <textarea
              placeholder="메모 (선택)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch color-${c}${color === c ? ' active' : ''}`}
                  onClick={() => setColor(c)}
                  aria-label={`색상 ${c}`}
                />
              ))}
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="event-submit" disabled={submitting}>
              {submitting ? '추가 중…' : '추가'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default DayDetail
