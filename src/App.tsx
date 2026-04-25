import { useState } from 'react'
import Calendar from './Calendar'
import { TodayPanel, UpcomingPanel, SpecialDaysPanel } from './Panels'
import './App.css'

function App() {
  const today = new Date()
  const [refreshKey, setRefreshKey] = useState(0)
  const handleChanged = () => setRefreshKey((k) => k + 1)

  const dateLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  return (
    <div className="trace-app">
      <header className="trace-header">
        <div className="trace-brand">
          <span className="trace-logo">◇</span>
          <h1>trace</h1>
        </div>
        <p className="trace-tag">하루의 흔적을 기록하다 — {dateLabel}</p>
      </header>

      <main className="trace-main">
        <section className="trace-calendar-col">
          <Calendar onDataChanged={handleChanged} />
        </section>
        <aside className="trace-panels-col">
          <TodayPanel refreshKey={refreshKey} />
          <UpcomingPanel refreshKey={refreshKey} />
          <SpecialDaysPanel refreshKey={refreshKey} />
        </aside>
      </main>
    </div>
  )
}

export default App
