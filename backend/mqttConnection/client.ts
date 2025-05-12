import mqtt from 'mqtt';
import { addTaskToRedis } from '../controllers/tasksControllers';

const client = mqtt.connect('mqtt://broker.hivemq.com'); 

client.on('connect', () => {
  console.log('MQTT connected');
  client.subscribe('add', (err) => {
    if (!err) console.log('Subscribed to add');
  });
});

client.on('message',  (topic, message) => {
  if (topic === 'add') {
      console.log('Received task:', message.toString());
    const task = message.toString();
     addTaskToRedis(task);
  }
});
