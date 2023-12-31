const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = 80;
const publicDirectoryPath = path.join( __dirname, '../public');

app.use(express.static(publicDirectoryPath));



io.on('connection', (socket) => {
    console.log('New websocket connetion');

    socket.on('join', ({username, room}, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room});

        if (error) {
            return callback(error);
        }

        socket.join(user.room);
        
        socket.emit('message', generateMessage('Admin', 'Welcome!'));

        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, coords.latitude, coords.longtitude));
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left :(`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    });

});

server.listen(port, () => {
    console.log('App is listening on port ' + port);
});