import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { api } from '../api';

export default function Calendar() {
  const [events, setEvents] = useState([]);

  async function load() {
    const res = await api.get('/tasks');
    const tasks = res.tasks || [];

    setEvents(tasks.map(t => ({
      id: t._id,
      title: t.title,
      date: t.dueAt ? new Date(t.dueAt).toISOString() : null
    })));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="app">
      <div className="page-header">
        <h2>Calendar</h2>
        <p className="small">Your tasks in calendar view</p>
      </div>

      <div className="card">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          height={"80vh"}
        />
      </div>
    </div>
  );
}
