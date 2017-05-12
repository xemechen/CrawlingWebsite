this.title = 'AmazonJP';
this.url = 'https://www.amazon.co.jp/Nintendo-Switch-Joy-Con-%E3%83%8D%E3%82%AA%E3%83%B3%E3%83%96%E3%83%AB%E3%83%BC-%E3%83%8D%E3%82%AA%E3%83%B3%E3%83%AC%E3%83%83%E3%83%89/dp/B01NCXFWIZ',
// this.url = 'https://booking.sshxl.nl/accommodations';
this.fileName = "amazon_result",
this.optionFileName = "amazon_options",
this.selectorList = ["#RegioDropDown",
                    "#ContingenthouderDropDown",
                    "#ContingentDoelgroepDropDown",
                    "#ContingentPeriodeDropDown"]; // file name to save

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
this.dataChecker = function(newList){
    var HouseLinks = [];
    
    // Checking for the first time
    if(firstTimeFlag){     
        console.log("Checking for the first time");
        firstTimeFlag = false;
        previousReturnList = newList;
        return [false, HouseLinks];
    }
    
    // console.log("Checking for updated housing");
    // if(previousReturnList == null || previousReturnList.length == 0){
    //     previousReturnList = newList;
    //     return [false, HouseLinks];
    // }

    // checking after first time    
    
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

this.emailSubject = "SSH Housing alert! ";
this.emailContentBuilder = function(Housings){
	var text = "New room(s) available, please click the following link(s) to check. <br/>";
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

this.getPageOptions = function(sitepage, fs, callbackFn){
	var selectId = "RegioDropDown";
	var textSearch = "Groningen";
	sitepage.evaluate(function(selectId, textSearch, selectorList){
		var output = {};
		for(var j = 0; j < selectorList.length; j++){
			var sgSelector = selectorList[j];
			var options = $(sgSelector).children();
			var optionList = [];
            for(var i = 0; i < options.length; i++){
            	var optionText = $(options[i]).text().trim();
            	if(optionText.length > 0){
            		optionList.push({'selIndex':i, 'selText':optionText});
            	};
            }
            if(optionList.length > 0){
            	output[sgSelector] = optionList;
            }
		}
        
        return JSON.stringify(output);
    }, selectId, textSearch, this.selectorList).then(function(output){
    	var fsFlag = true;
    	var outputJson = JSON.parse(output);
    	if(outputJson == null){
    		fsFlag = false;	
    	}else{
    		for(key in outputJson){
    			if(outputJson[key] == null || outputJson[key].length == 0){
					fsFlag = false;
    			}
    		}
    	}
    	
    	if(fsFlag){
            fs.writeFile('public/' + this.optionFileName +'.json', output, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("===***=== Select Options written for client access ===***===");
            });
        }
		callbackFn(output);
    });
}

var timeOutList = [];
var phInstance;
this.pageOperations = function(phInstanceParam, sitepage, dataPackage, waitFour, testing, delayMilSec, callback, callback2){	
	console.log("Calling page operations in component");
	phInstance = phInstanceParam;

    // create selecting function
    var selecting = function(selector, index){
        var selectEle = sitepage.evaluate(function(selector, index){
        	try{
        		var sel = document.getElementById(selector);
                sel.selectedIndex = index;
                var event = document.createEvent("UIEvents"); // or "HTMLEvents"
                event.initUIEvent("change", true, true);
                sel.dispatchEvent(event);
                return null;
                // return document.body.innerHTML;	
        	}catch(err){
        		return err;
        	}
            
        }, selector, index).then(function(processOutput){
        	if(processOutput != null && processOutput.length > 0){
        		console.log("Operation error: " + processOutput);	
        	}                        	
        });
    };

    var clicking = function(filter){
        var selectEle = sitepage.evaluate(function(filter){
        	try{
        		index = index || 0;
        		var target = filter();
                var event = document.createEvent("UIEvents"); // or "HTMLEvents"
                event.initUIEvent("click", true, true);
                target[index].dispatchEvent(event);
                return null;
                // return document.body.innerHTML;	
        	}catch(err){
        		return err;
        	}
            
        }, filter).then(function(processOutput){
        	if(processOutput != null && processOutput.length > 0){
        		console.log("Operation error: " + processOutput);	
        	}                        	
        });
    };

    var filter = function(){
    	var allLinks = document.querySelectorAll("a");
    	for(var i = 0; i < allLinks.length; i++){
    		if($(allLinks[i]).text().trim().indexOf('新品の出品') > -1){
    			return allLinks[i];
    		}
    	}
    	return document.body;
    }

    console.log("Clicking link");
	clicking(filter);

	var test1 = function(){
		return document.querySelectorAll("#olpOfferList div.a-row").length > 0;
	};

    waitFour(testing, test1, function(){
    	// callback function when page is loaded
    	console.log("Calling onReady function");
		sitepage.evaluate(function(){
        	return document.querySelectorAll("#olpOfferList div.a-row").length;            
        }).then(function(processOutput){
        	console.log("Output: "+ processOutput);	
        });        
    }, 90000 + delayMilSec);
}

this.stopPhantom = function(){
    for(var j = 0; j < timeOutList.length; j++){
        clearTimeout(timeOutList[j]);
    }
}

module.exports = this;