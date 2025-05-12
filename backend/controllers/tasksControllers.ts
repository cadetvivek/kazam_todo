import { Request, Response } from 'express';
import redis from '../utils/redisClients';
import taskModel from '../models/tasks';  
import dotenv from 'dotenv';

dotenv.config();

const redisKey = process.env.REDIS_KEY as string;

export const addTaskToRedis = async (task: string): Promise<void> => {
  const cached = await redis.get(redisKey);
  const taskList = cached ? JSON.parse(cached) : [];

  taskList.push({ text: task, timestamp: new Date().toISOString() });

  if (taskList.length >= 50) {
   
    const tasksToInsert = taskList.map((t: any) => ({
      text: t.text,
      createdAt: new Date(t.timestamp)
    }));

    try {
      await taskModel.insertMany(tasksToInsert); 
      await redis.del(redisKey);
    } catch (error) {
      console.error('Error moving tasks to MongoDB:', error);
      throw error;
    }
  } else {
    await redis.set(redisKey, JSON.stringify(taskList));
  }
};

export const fetchAllTasks = async (): Promise<{ text: string; timestamp: string }[]> => {
  const redisTasksRaw = await redis.get(redisKey);

  const redisTasks = redisTasksRaw
    ? JSON.parse(redisTasksRaw).map((task: any) => {
        if (typeof task === 'string') {
          try {
            const parsed = JSON.parse(task);
            return {
              text: parsed.text || parsed.task || task,
              timestamp: parsed.timestamp || new Date().toISOString(),
            };
          } catch (e) {
            return {
              text: task,
              timestamp: new Date().toISOString(),
            };
          }
        }

        return {
          text: task.text || task.task || '',
          timestamp: task.timestamp || new Date().toISOString(),
        };
      })
    : [];

  const mongoTasks = await taskModel.find({}).sort({ createdAt: -1 });

  const mongoTaskObjects = mongoTasks.map((doc) => ({
    text: doc.text,
    timestamp: doc.createdAt.toISOString(),
  }));

  const allTasks = [...redisTasks, ...mongoTaskObjects].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return allTasks;
};

export const fetchAllTasksHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const allTasks = await fetchAllTasks();
    res.status(200).json({ tasks: allTasks });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
