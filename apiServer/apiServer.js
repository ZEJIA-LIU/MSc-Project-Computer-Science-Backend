/**
 * api请求server
 *
 * 0：成功
 * 1：数据不合法
 * 2：权限问题
 * 3：后端错误
 */

const express = require('express');
const bodyParser = require('body-parser');
// import bodyParser from 'body-parser'
// import mongoose from 'mongoose'
// import cookieParser from 'cookie-parser'
const cookieParser = require('cookie-parser');
// import session from 'express-session'
const config = require('../config/config');
// const cors = require('cors');    

const port = config.apiPort;

const app = express();
// app.use(cors); // 跨域
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({limit: '5mb', extended: false}));
app.use(cookieParser('express_react_cookie'));
// app.use(session({
//     secret:'express_react_cookie',
//     resave: true,
//     saveUninitialized:true,
//     cookie: {maxAge: 60 * 1000 * 30}//过期时间
// }));


//设置跨域访问  
app.all('*', function(req, res, next) {  
  res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");  
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
  res.header("X-Powered-By",' 3.2.1')  
  res.header("Content-Type", "application/json");  
  next();  
});

app.use('/run', require('./run'));
app.use('/user', require('./user'));

// var server = require('http').Server(app);

app.listen(port, function (err) {
  if (err) {
    console.error('err:', err);
  } else {
    console.info(`===> api server is running at ${config.apiHost}:${config.apiPort}`)
  }
});


// const createRoomServer = require('./room');

// createRoomServer(server);