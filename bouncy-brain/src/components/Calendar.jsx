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
  function handleDateClick(info) {
  // open modal for creating a task with that date
  const date = info.dateStr;
  const title = prompt("Task name?");
  if (!title) return;

  api.post("/tasks", { title, dueAt: date });
  load();
}

function handleEventClick(info) {
  const newDate = prompt("Update deadline (YYYY-MM-DD HH:mm)?", info.event.startStr);
  if (!newDate) return;
  api.put(`/tasks/${info.event.id}`, { dueAt: newDate });
  load();
}


  return (
    <div className="app">
      <div className="page-header">
        <h2>Calendar</h2>
        <p className="small">Your tasks in calendar view</p>
      </div>

      <div className="card">
        <FullCalendar
          dateClick={handleDateClick}
  
  
          eventClick={handleEventClick}

          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          height={"80vh"}
        />
      </div>
    </div>
  );
}
