import express from 'express';
import { fetchAllTasksHandler } from '../controllers/tasksControllers';

const router = express.Router();

router.get('/fetchAllTasks', fetchAllTasksHandler);

export default router;
