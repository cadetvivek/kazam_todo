import app from './index';
import mongoose from 'mongoose';
import './mqttConnection/client';
import dotenv from "dotenv"

dotenv.config();

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI as string, {
    dbName: process.env.MONGO_DB,
  })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
