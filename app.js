var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var stylus = require('stylus');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var emailPassword = "";
// getting password to send email from cmd argument "PW[password]"
process.argv.forEach(function (val, index, array) {
    if(val.indexOf("PW") == 0){        
        emailPassword = val.substring(2);
        console.log('Email password: ' + emailPassword);
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


/* ===== for crawling functions ===== */
var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    phantom = require('phantom'),
    gmailSend = require('gmail-send');

var send = gmailSend({
	user: 'xemeusch@gmail.com',               // Your GMail account used to send emails
	pass: emailPassword,                      // Application-specific password
	to:   'xemeusch@gmail.com',               // Send back to yourself;
										// you also may set array of recipients:
										// [ 'user1@gmail.com', 'user2@gmail.com' ]
	// from:   '"User" <user@gmail.com>'  // from: by default equals to user
	// replyTo:'user@gmail.com'           // replyTo: by default undefined
	subject: 'test subject',
	// text:    'test text'
	html:    '<b>html text text</b>'
});

// Override any default option and send email
var sendingGmail = function(subject, content, receiver){
	var sendingObject = {
	  'subject': subject,
	  'html': content, // better be html code
	  'to' : receiver
	};

	var callbk = function (err, res) {
	  console.log('Alerting email sent: err:', err, '; res:', res);
	};

    console.log("Sending email to " + receiver);
	send(sendingObject, callbk);
}

var sendingBatchGmails = function(subject, content, receiverList){
    if(receiverList != null && receiverList.length > 0){
        for(var i = 1; i < receiverList.length; i++){
            var receiver = receiverList[i];
            sendingGmail(subject, content, receiver);
        }        
    }
}

var emailContentBuilder = function(text, Housings){
    if(Housings != null && Housings.length > 0){
        for(var k = 0; k < Housings.length; k++){
            var housingObj = Housings[k];
            var link = housingObj.href;
            var price = housingObj.price;
            var name = housingObj.name;
            // var availNumber = parseInt(housingObj.available);
            var linkText = "<a href='" + link + "' target='_blank'> " + name + "(" + housingObj.available + ") with Price: " + price + "</a>"
            if(text == null || text.trim().length == 0){
                text = linkText;
            }else{
                text = text + "<br/>" + linkText;
            }
        }        
        return text;
    }

    return "";
}

var phInstance = null;
var timeOutList = [];
var stopPhantom = function(){
    for(var j = 0; j < timeOutList.length; j++){
        clearTimeout(timeOutList[j]);
    }
    if(phInstance){
        console.log("Stop phantom");
        phInstance.exit();
    }
}
var delayMilSec = 0
var getPage = function(url, selectIndices, callback, links) {
    var links = links || [];

    var sitepage = null;
    phInstance = null;

    phantom.create()
        .then(instance => {
            console.log("PhantomJS is running");
            phInstance = instance;
            return instance.createPage();
        })
        .then(page => {
            // use page
            sitepage = page;
            console.log("Ready to open the page");
            sitepage.open(url).then(function(status){
                console.log("Connection: " + status);
                if (status !== "success") {
                    console.log("Unable to access network");
                } else {
                    console.log("Operations begin with delay: " +  + delayMilSec + " ms");
                        timeOutList = [];
                        var timeout1 = setTimeout(function(){
                            // sitepage.evaluate(function(){
                            //     var sel1 = document.getElementById("RegioDropDown");
                            //     sel1.selectedIndex = 2;
                            //     var event1 = document.createEvent("UIEvents"); // or "HTMLEvents"
                            //     event1.initUIEvent("change", true, true);
                            //     sel1.dispatchEvent(event1);

                            //     var sel2 = document.getElementById("ContingenthouderDropDown");
                            //     sel2.selectedIndex = 2;
                            //     var event2 = document.createEvent("UIEvents"); // or "HTMLEvents"
                            //     event2.initUIEvent("change", true, true);
                            //     sel2.dispatchEvent(event2);

                            //     var sel3 = document.getElementById("ContingentDoelgroepDropDown");
                            //     sel3.selectedIndex = 6;
                            //     var event3 = document.createEvent("UIEvents"); // or "HTMLEvents"
                            //     event3.initUIEvent("change", true, true);
                            //     sel3.dispatchEvent(event3);

                            //     var sel4 = document.getElementById("ContingentDoelgroepDropDown");
                            //     sel4.selectedIndex = 10;
                            //     var event4 = document.createEvent("UIEvents"); // or "HTMLEvents"
                            //     event4.initUIEvent("change", true, true);
                            //     sel4.dispatchEvent(event4);
                            // });

                            var selector = "RegioDropDown";
                            var index = selectIndices[0] || 1;
                            var selectEle = sitepage.evaluate(function(selector, index){
                                var sel = document.getElementById(selector);
                                sel.selectedIndex = index;
                                var event = document.createEvent("UIEvents"); // or "HTMLEvents"
                                event.initUIEvent("change", true, true);
                                sel.dispatchEvent(event);
                                return document.body.innerHTML;
                            }, selector, index).then(function(selectEle){

                            });
                        }, 100 + delayMilSec);
                        timeOutList.push(timeout1);

                        var timeout2 = setTimeout(function(){
                            var selector = "ContingenthouderDropDown";
                            var index = selectIndices[1] || 1;
                            var selectEle = sitepage.evaluate(function(selector, index){
                                var sel = document.getElementById(selector);
                                sel.selectedIndex = index;
                                var event = document.createEvent("UIEvents"); // or "HTMLEvents"
                                event.initUIEvent("change", true, true);
                                sel.dispatchEvent(event);
                                return document.body.innerHTML;
                            }, selector, index).then(function(selectEle){

                            });
                        }, 400 + delayMilSec);
                        timeOutList.push(timeout2);

                        var timeout3 = setTimeout(function(){
                            var selector = "ContingentDoelgroepDropDown";
                            var index = selectIndices[2] || 4;
                            var selector2 = "ContingentPeriodeDropDown";
                            var index2 = selectIndices[3] || 8;
                            var selectEle = sitepage.evaluate(function(selector, index, selector2, index2){
                                var sel = document.getElementById(selector);
                                sel.selectedIndex = index;
                                var event = document.createEvent("UIEvents"); // or "HTMLEvents"
                                event.initUIEvent("change", true, true);
                                sel.dispatchEvent(event);

                                var sel2 = document.getElementById(selector2);
                                sel2.selectedIndex = index2;
                                var event2 = document.createEvent("UIEvents"); // or "HTMLEvents"
                                event2.initUIEvent("change", true, true);
                                sel2.dispatchEvent(event2);

                                return document.body.innerHTML;
                            }, selector, index, selector2, index2).then(function(selectEle){

                            });
                        }, 2000 + delayMilSec);
                        timeOutList.push(timeout3);

                        var timeout4 = setTimeout(function(){
                            var outcome = sitepage.evaluate(function(){
                            var mapper = { "adres": "Address",
                                            "type": "Type",
                                            "grootte": "Size",
                                            "adressen": "Available",
                                            "prijs": "Price"
                                        }

                                var getChildrenEle = function(parent){
                                    var children = parent.childNodes;
                                    var elementChild = [];
                                    for (i = 0; i < children.length; i++) {
                                        if(children[i].nodeType == 1){
                                            elementChild.push(children[i]);
                                        }
                                    }
                                    return elementChild;
                                }
                                var buildObjects = function(children){
                                    var returnObj = {};
                                    for(var i = 0; i < children.length; i++){
                                        var clas = children[i].getAttribute("class")
                                        var text = children[i].textContent.split("\n").join("").trim();
                                        returnObj[mapper[clas]] = text;
                                    }
                                    return returnObj;
                                }

                                var returnList = [];
                                try{
                                    var aList = document.querySelectorAll("#Advertenties > a");
                                    if(aList.length > 0){
                                        for(var j = 0; j < aList.length; j++){
                                            var link = "https://booking.sshxl.nl" + aList[j].getAttribute("href");
                                            var children = getChildrenEle(aList[j].children[1]);
                                            var tempObj = buildObjects(children);
                                            tempObj.link = link;
                                            returnList.push(tempObj);
                                        }
                                    }
                                }catch(err){
                                    console.log("Page fectching error: " + err);
                                    return "[]";
                                }
                                return JSON.stringify(returnList);
                            })
                            .then(function(outcome){                           
                                console.log("Finished loading page");
                                callback(outcome);
                                phInstance.exit();
                            });
                        }, 50000 + delayMilSec);
                        timeOutList.push(timeout4);
                };
            });
        })
        .catch(error => {
            console.log(error);
            phInstance.exit();
        });

};

var Housing = function(Name, Price, Href, Available){
    this.name = Name;
    this.price = Price;
    this.href = Href;
    this.available = Available;
};

var calculateSummary = function(list){
    if(list == null || list.length == 0){
        return {};
    }
    console.log("Process summary");
    var summaryObj = {};
    for(var i = 0; i < list.length; i++){
        var itm = list[i];
        if(summaryObj[itm.Type] == null){
            summaryObj[itm.Type] = parseInt(itm.Available);
        }else{
            summaryObj[itm.Type] = summaryObj[itm.Type] + parseInt(itm.Available);
        }
    }
    // console.log(summaryObj);
    return summaryObj;
}

var compareTwoObject = function(oldO, newO){ 
    console.log("Compare two summary");
    console.log(oldO);
    console.log(newO);
    var keyType = [];
    for(key in newO){
        if(oldO[key] == null){
            keyType.push(key);
        }else{
            if(newO[key] > oldO[key]){
                keyType.push(key);
            }
        }
    }
    return keyType;
}

var previousReturnList = [];
var firstTimeFlag = true;
var dataChecker = function(newList){
    var HouseLinks = [];
    
    // Checking for the first time
    if(firstTimeFlag){     
        console.log("Checking for the first time");
        firstTimeFlag = false;
        previousReturnList = newList;
        return [false, HouseLinks];
    }

    // checking after first time    
    console.log("Checking for updated housing");
    if(previousReturnList == null || previousReturnList.length == 0){
        previousReturnList = newList;
        return [false, HouseLinks];
    }
    
    var previousSummary = calculateSummary(previousReturnList);
    var newSummary = calculateSummary(newList);

    var updatedTypeList = compareTwoObject(previousSummary, newSummary);
    console.log(updatedTypeList);

    for(var index = 0; index < newList.length; index++){
        var houseItem = newList[index];
        if(updatedTypeList.indexOf(houseItem.Type) > -1){
            HouseLinks.push(new Housing(houseItem.Type, houseItem.Price, houseItem.link, houseItem.Available));
        }
    }

    previousReturnList = newList;
    if(HouseLinks.length > 0){
        return [true, HouseLinks, JSON.stringify(updatedTypeList)];
    }else{
        return [false, HouseLinks];
    }   
    
}

var toGetPageFn = function(emailReceivers, selectIndices){
    console.log("");
    console.log("======================================================");
    console.log("");
    console.log("開始讀取......");
    getPage('https://booking.sshxl.nl/accommodations', selectIndices, function(outcome) {
        var jsonObj = JSON.parse(outcome);
        console.log("Total " + jsonObj.length + " items found.");
        if(emailReceivers == null || emailReceivers.length == 1 || typeof emailReceivers == 'string'){
            emailReceivers = ["", "xemeusch@gmail.com"];
        }        

        var checkingResult = dataChecker(jsonObj);
        if(true){
            // checked is true, send email alert
            var emailContent = emailContentBuilder("New room(s) available, please click the following link(s) to check. <br/>", checkingResult[1]);
            sendingBatchGmails("SSH Housing alert! " + checkingResult[2], emailContent, emailReceivers);

            // save to both JSON files
            fs.writeFile('ssh_result.json', outcome, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("抓取結束1/2");
            });
            var timeStmp = new Date();
            var strTime = "" + timeStmp.getFullYear() + "-" + (timeStmp.getMonth()+1) + "-" + timeStmp.getDate() + "_"
            + timeStmp.getHours() + "-" + timeStmp.getMinutes() + "-" + timeStmp.getSeconds();
            fs.writeFile('archived/ssh_result' + strTime + '.json', outcome, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("抓取結束2/2");
            });

        }else{
            // no update, just update JSON
            fs.writeFile('ssh_result.json', outcome, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("抓取結束");
            });
        }

        // write for client access
        if(jsonObj.length > 0){
            fs.writeFile('public/ssh_result.json', outcome, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("===***=== JSON written for client access ===***===");
            });
        }        
        
    });
}

var grabInterval;
var intervalGrabbing = function(emailReceivers, selectIndices){
    console.log("開始週期取值......");
    toGetPageFn(emailReceivers, selectIndices);

    grabInterval = setInterval(function(){
        toGetPageFn(emailReceivers, selectIndices);
    }, 90000 + delayMilSec);
};
var stopGrabbing = function(){
	console.log("停止週期取值......");
	clearInterval(grabInterval);
    stopPhantom();
}
/* ===== for crawling functions ===== */

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
        console.log("Receivers: " + emailReceivers);
        console.log("Selected Indices: " + selectIndices);
        console.log("Delayed time: " + delayMilSec + " ms");
        console.log(req.body.ProcessTime);
        // start the function to crawl
        crawlingFlag = true;
        intervalGrabbing(emailReceivers, selectIndices);        
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
        stopGrabbing();    
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
