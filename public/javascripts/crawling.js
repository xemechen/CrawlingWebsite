'use strict'
console.log("In the page of crawling");
var connectionDomain = window.location.host;

var app = angular.module("housingApp", []); 
app.controller("retrievingCtrl", function($scope) {
	var prf = function(toPrint){
		console.log(toPrint);
	}

	$scope.select = {};	
	$scope.updatingOptions = false;
	$scope.crawlingStatus = false;

	var optionProc = function(returnData, firstLoadingFlag){
		crawlingFlag = true;
		firstLoadingFlag = firstLoadingFlag == 'success'? false: firstLoadingFlag? firstLoadingFlag:false;
		prf(returnData);
		if(returnData){	
			$scope.errorOption = "";
			$scope.updatingOptions = false;		
			$scope.optionData = returnData;	
			$scope.select.one = 2;
			$scope.select.two = 2;
			$scope.select.three = 8;
			$scope.select.four = 13;
			$scope.$apply();
		}
	}

	var crawlingFlag = true;
	$scope.updateOptions = function() {
		if(crawlingFlag){
			crawlingFlag = false;
			$scope.updatingOptions = true;
			$.ajax({
		        type: 'GET',
		        url: 'http://'+connectionDomain+'/crawlingOptions',
		        success: optionProc,
		        error: function(){
		        	$scope.errorOption = "Cannot get the data"; 
		        	crawlingFlag = true; 
		        	$scope.updatingOptions = false;
		        	$scope.$apply();
		        }
		    });
		}
	};
	var calling = "";
	$scope.startCrawling = function() {
		if(crawlingFlag){
			crawlingFlag = false;
			prf("Calling server to start crawling");
			// process receivers
			var emails = $(".input-email");
			var receivers = [""]; // leading text
			for(var i = 0; i < emails.length; i++){
				var email = $(emails[i]).val();
				if(email != null && email.trim().length > 0 && receivers.indexOf(email.trim()) == -1){
					receivers.push(email.trim());
				}
			}
			prf(receivers);

			var dataObj = {
				'emails': receivers, 'ProcessTime': new Date()
			};

			// process index
			var indices = $(".select-index");
			var procIndices = [];
			for(var i = 0; i < indices.length; i++){
				var ind = $(indices[i]).val();
				if(ind != null){
					procIndices.push(ind);
				}
			}
			prf(procIndices);
			if(procIndices.length == indices.length){
				dataObj.indices = procIndices;
			}

			// process delayed second
			var dSecond = $("#delayed-second").val();
			if(dSecond != null && dSecond >= 0){
				dataObj.dSecond = dSecond;
			}
			prf("Delay second: " + dSecond);

			$scope.crawlingStatus = true;
		    $.ajax({
		        type: 'POST',
		        url: 'http://'+connectionDomain+'/startCrawling',
		        data: dataObj,
		        success: function(a, b, c){
		        },
		        error: function(){
		        	crawlingFlag = true; 
		        	$scope.crawlingStatus = false;
		        	$scope.$apply();
		        }
		    });
		}
	};

	$scope.stopCrawling = function() {
		if(!crawlingFlag){
			crawlingFlag = false;
			prf("Calling server to stop crawling");
			$scope.crawlingStatus = false;
		    $.ajax({
		        type: 'GET',
		        url: 'http://'+connectionDomain+'/stopCrawling',
		        success: function(){
		        	crawlingFlag = true;
		        	$scope.crawlingStatus = false;
		        	$scope.$apply();
		        },
		        error: function(){
		        	crawlingFlag = false; 
		        	$scope.crawlingStatus = false;
		        	$scope.$apply();
		        }
		    });
		}
	};

    var extractProperty = function(list, fieldName){
		var toReturn = [];
		for(var i = 0; i < list.length; i++){
			var object = list[i];
			var val = object[fieldName];
			if(toReturn.indexOf(val) == -1){
				toReturn.push(val);	
			}		
		}
		return toReturn;
	};

	$scope.mapper = { "Address": "Address", 
					"Type": "Type", 
					"Size": "Size", 
					"Available": "Available", 
					"Price": "Price" 
				};

	$scope.summary = {};
	var calculateSummary = function(list){
		$scope.summary = {};
		if(list == null || list.length == 0){
			return null;
		}

		for(var i = 0; i < list.length; i++){
			var itm = list[i];
			if($scope.summary[itm.Type] == null){
				$scope.summary[itm.Type] = parseInt(itm.Available);
			}else{
				$scope.summary[itm.Type] = $scope.summary[itm.Type] + parseInt(itm.Available);
			}
		}
		console.log($scope.summary);
	}

	var ajaxToGetJSON = function(){
		$.ajax({
		    dataType: "json",
		    url: "ssh_result.json",
		    mimeType: "application/json",
		    success: function(result){
		        calculateSummary(result);			
			    $scope.result = result;
			    $scope.$apply();
		    }
		});		
	}
	$scope.result = [];

	$scope.crawlingButton = true;
	$scope.submitPass = function(){
		if($scope.passcode && $scope.passcode.trim().length > 0){
			prf($scope.passcode.trim());
			$.ajax({
			    type: 'POST',
		        url: 'http://'+connectionDomain+'/submitPass',
		        data: {'passcode': $scope.passcode.trim()},
		        success: function(a, b, c){
		        	$scope.crawlingButton = true;
		        	$scope.$apply();
		        }
			});		
		}
	}

	$scope.checkPass = function(){
		$.ajax({
		    type: 'GET',
	        url: 'http://'+connectionDomain+'/submitPass',
	        success: function(a, b, c){
	        	$scope.crawlingButton = true;
	        	$scope.$apply();
	        }
		});		
	}

	var jsonIntval;
	$scope.getJson = function(){
		console.log("Start getting JSON");
		ajaxToGetJSON();
		// $.getJSON("movie-crawler-master/ssh_result.json", function(result) {	
		// 	calculateSummary(result);			
		//     $scope.result = result;
		//     $scope.$apply();
		//     // $('.inner-data').html(JSON.stringify(processed)); // this will show the info it in firebug console
		// });	
		jsonIntval = setInterval(function(){			
			ajaxToGetJSON();
		}, 8000);
	};

	$scope.stopJson = function(){
		clearInterval(jsonIntval);
		console.log("Stop getting JSON");
	}

	$scope.ajaxToGetOptions = function(){
		$.ajax({
		    dataType: "json",
		    url: "ssh_options.json",
		    mimeType: "application/json",
		    success: function(result){			
			    optionProc(result, true);
		    }
		});		
	}
	
	$scope.checkPass();
	$scope.ajaxToGetOptions();
	ajaxToGetJSON();
});