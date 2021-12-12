const express = require('express');
const app = express();
const config = require('../config/config');

let server = require('http').Server(app);

server.listen(config.socketPort, function (err) {
  if (err) {
    console.error('err:', err);
  } else {
    console.info(`===> socket server is running at ${config.socketHost}:${config.socketPort}`)
  }
});

const createRoomServer = require('./room');

createRoomServer(server);