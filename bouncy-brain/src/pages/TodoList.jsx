import React, { useState } from 'react';


const TodoList = () => {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);

  const addTask = () => {
    if (task.trim()) {
      setTasks([...tasks, { text: task, done: false }]);
      setTask('');
    }
  };

  const toggleTask = (index) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="todo-list">
      <h2>📝 To-Do List</h2>
      <div className="input-group">
        <input 
          type="text" 
          value={task} 
          onChange={(e) => setTask(e.target.value)} 
          placeholder="Add a new task..." 
        />
        <button onClick={addTask}>Add</button>
      </div>
      <ul>
        {tasks.map((t, i) => (
          <li key={i} className={t.done ? 'done' : ''}>
            <span onClick={() => toggleTask(i)}>{t.text}</span>
            <button onClick={() => removeTask(i)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
