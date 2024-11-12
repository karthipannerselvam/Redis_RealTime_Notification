

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Redis = require('ioredis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const redisPub = new Redis();  
const redisSub = new Redis();  

app.use(express.static('public'));
const notificationsHistory = [];
redisSub.subscribe('notifications', (err) => {
    if (err) {
        console.error('Failed to subscribe: %s', err.message);
    }
});
redisSub.on('message', (channel, message) => {
    const { userId, type, msg } = JSON.parse(message);
    notificationsHistory.push({ userId, type, msg });
    io.emit('notification', { userId, type, msg });
});
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.emit('notificationHistory', notificationsHistory);

    socket.on('sendNotification', ({ userId, type, message }) => {
        publishNotification(userId, type, message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
function publishNotification(userId, type, message) {
    const notification = JSON.stringify({ userId, type, msg: message });
    redisPub.publish('notifications', notification);  // Use the publisher client here
}
const notificationTypes = ['comment', 'like', 'follow'];
setInterval(() => {
    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const randomMessage = `This is a ${randomType} notification!`;
    const randomUserId = Math.floor(Math.random() * 2) + 1;
    
    publishNotification(randomUserId, randomType, randomMessage);
}, 10000);
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});