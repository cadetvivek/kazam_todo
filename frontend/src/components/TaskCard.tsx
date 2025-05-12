
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TaskCard.css';
import { api } from '../api/api';
import mqtt from 'mqtt';

export interface Task {
  text: string;
  timestamp: string;
}

const connect = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');

const TaskCard = () => {
  const [taskContent, setTaskContent] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(`${api}/fetchAllTasks`);
      if (Array.isArray(data.tasks)) {
        const parsedTasks: Task[] = data.tasks.map((item: any) => {
          if (typeof item === 'string') {
            try {
              const parsed = JSON.parse(item);
              return {
                text: parsed.task || parsed.text || item,
                timestamp: new Date().toISOString(), 
              };
            } catch (err) {
              return {
                text: item,
                timestamp: new Date().toISOString(), 
              };
            }
          }
          if (typeof item === 'object' && item !== null) {
            return {
              text: item.text || item.task || '',
              timestamp: item.timestamp || new Date().toISOString(),
            };
          }
          return {
            text: String(item),
            timestamp: new Date().toISOString(),
          };
        });
        const sortedTasks = parsedTasks.sort(
          (a: Task, b: Task) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setTasks(sortedTasks);
      } else {
        console.error("Unexpected data structure:", data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskContent.trim()) {
      connect.publish('add', taskContent);
      setTaskContent('');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [tasks]);
 
  return (
    <div className="task-card">
      <div className="task-header">
        <div className="title-container">
          <img className="note-icon" src="./note.png" alt="note_logo" />
          <h1 className="app-title">Notes App</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          value={taskContent}
          onChange={(e) => setTaskContent(e.target.value)}
          placeholder="New Note ..."
          className="task-input"
        />
        <button
          type="submit"
          className="add-button"
        >
          <img src="./plus.png" alt="Add Task" className="add-icon" />
          <span>Add</span>
        </button>
      </form>

      <div className="task-list-container">
        <h2 className="list-title">Notes</h2>
        <ul className="task-list">
          {tasks.map((task, index) => (
            <li key={index} className="task-item">
              <p className="task-text">{task.text}</p>
              <span className="task-timestamp">
                {new Date(task.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TaskCard;