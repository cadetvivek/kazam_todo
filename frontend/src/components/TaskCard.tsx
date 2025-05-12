import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/TaskCard.css'
import { api } from '../api/api';
import mqtt from 'mqtt';
export interface Task {
  text: string;
  timestamp: string;
}
const connect =mqtt.connect( 'wss://broker.hivemq.com:8884/mqtt')
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
    <div className="taskCard">
        <div className='flex items-center justify-left mb-4'>
            <img style={{width: '50px', height: '50px'}} src="./note.png" alt="note_logo" />
            <h1 className='text-3xl font-bold'><em>Notes App</em></h1>
        </div>
      <form onSubmit={handleSubmit} className="inputTask">
        <input
          type="text"
          value={taskContent}
          onChange={(e) => setTaskContent(e.target.value)}
          placeholder="New Note ..."
        />
        <button
          type="submit"
          className="addButton flex items-center justify-center "
        >
          <img src="./plus.png" alt="Add Task" className="addTaskIcon" />
          Add
        </button>
      </form>

      <div className="taskList">
        <h2 className='sticky top-0 text-3xl font-bold' style={{marginLeft:'2%'}}><em>Notes</em></h2>
        <ul>
          {tasks.map((task, index) => (
            <li key={index}>{task.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TaskCard;
