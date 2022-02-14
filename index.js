const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const mysql      = require('mysql');
const mysql_con  = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'nastolki',
});

let connections = [];

io.on('connection', (socket) => {
    socket.on('init', (info) => {
        info.uid = socket.id;

        connections.push(info);
        socket.join(info.chat);
    });

    socket.on('disconnect', (reason) => {
        connections = connections.filter(c => c.uid !== socket.id);
    });

    socket.on('send-new-message', (info) => {
        const clients = connections.filter((c) => c.chat === info.chat);
        const author = connections.find((c) => c.uid === socket.id);

        mysql_con.query(`
            INSERT INTO chat_messages 
            (game_session_id, user_id, message, created_at)
            VALUES (${info.chat},${info.user_id},'${info.message}', NOW())
        `);

        io.to(info.chat).emit('receive-new-message', {
            message: info.message,
            time: new Date().toLocaleTimeString('ru-RU', { hour12: false, 
                hour: "numeric", 
                minute: "numeric"
            }),
            user: {
                name: author.user.name,
                image: author.user.image,
            }
        });
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});