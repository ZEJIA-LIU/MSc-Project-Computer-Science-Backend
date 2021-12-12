const express = require('express');
const path = require('path');
const connectHistoryApiFallback = require('connect-history-api-fallback');
const config = require('./config/config');
const favicon = require('serve-favicon');
// const favicon = require('static-favicon');
// const logger = require('morgan');
// const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser');
// const httpProxy = require('http-proxy');
// const cors = require('cors');

var app = express();

// app.use(cors); // 跨域

// 标签页图标
app.use(favicon(path.join(__dirname, 'public/logo.ico')));
// app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: false}));
// app.use(cookieParser());

//设置跨域访问  
// app.all('*', function(req, res, next) {  
//     res.header("Access-Control-Allow-Origin", "*");  
//     // res.header("Access-Control-Allow-Credentials", true);
//     res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");  
//     res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
//     res.header("X-Powered-By",' 3.2.1')  
//     res.header("Content-Type", "application/json");  
//     next();  
// });

// const targetUrl = `http://${config.apiHost}:${config.apiPort}`;
// const proxy = httpProxy.createProxyServer({
//     target: targetUrl
// });

// app.use('/api',(req,res)=>{
//     proxy.web(req,res,{target:targetUrl})
// });

app.use('/avatar', express.static(path.join(__dirname, 'avatar')));

app.use(connectHistoryApiFallback());
app.use('/', express.static(path.join(__dirname, 'public')));
// app.use('/', express.static(favicon(path.join(__dirname, 'public', 'logo.ico'))));

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.listen(config.port,(err)=>{
    if(err){
        console.error(err)
    }else{
        console.log(`===> open http://${config.host}:${config.port} in a browser to view the app`);
    }
});
