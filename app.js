var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var stylus = require('stylus');

var index = require('./routes/index');
var users = require('./routes/users');
var pageGetter = require('./scripts/PageGetter');


var app = express();

var emailPassword = "";
// getting password to send email from cmd argument "PW[password]"
process.argv.forEach(function (val, index, array) {
    if(val.indexOf("PW") == 0){        
        emailPassword = val.substring(2);
        console.log('Email password: ' + emailPassword);
        pageGetter.setPassword(emailPassword);
    }    
});


app.all('*',function(req,res,next)
{
    if (!req.get('Origin')) return next();

    res.set('Access-Control-Allow-Origin','*');
    res.set('Access-Control-Allow-Methods','GET,POST');
    res.set('Access-Control-Allow-Headers','X-Requested-With,Content-Type');

    if ('OPTIONS' == req.method) return res.send(200);

    next();
});




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// set REST API
var crawlingFlag = false;
app.post('/startCrawling', function(req, res) {
    if(!crawlingFlag){    
        var emailReceivers = req.body['emails[]'];
        var selectIndices = req.body['indices[]'];
        var dSecond = req.body['dSecond'];
        dSecond = (dSecond == null || dSecond < 0)?0:dSecond;
        dSecond = parseInt(dSecond);
        delayMilSec = dSecond * 1000;
        pageGetter.setDelaySeconds(delayMilSec);
        console.log("Receivers: " + emailReceivers);
        console.log("Selected Indices: " + selectIndices);
        console.log("Delayed time: " + delayMilSec + " ms");
        console.log(req.body.ProcessTime);
        // start the function to crawl
        crawlingFlag = true;
        pageGetter.intervalGrabbing(emailReceivers, selectIndices);        
    }
    res.writeHead(200, { 'Content-Type' : 'application/json' });
                "Crawling..."
    res.end();
});

app.get('/stopCrawling', function(req, res) {
    if(crawlingFlag){
        console.log("Stop the grabbing interval");
        // stop the function to crawl
        crawlingFlag = false;
        pageGetter.stopGrabbing();    
    }	
    res.writeHead(200, { 'Content-Type' : 'application/json' });
                "Crawling stopped..."
    res.end();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
