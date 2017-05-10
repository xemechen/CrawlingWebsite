'use strict'
console.log("In the page of crawling");

var app = angular.module("housingApp", []); 
app.controller("retrievingCtrl", function($scope) {
	var prf = function(toPrint){
		console.log(toPrint);
	}

	$scope.select = {};	
	$scope.updatingOptions = '';

	var optionProc = function(returnData, firstLoadingFlag){
		firstLoadingFlag = firstLoadingFlag == 'success'? false: firstLoadingFlag? firstLoadingFlag:false;
		prf(returnData);
		if(returnData){	
			$scope.updatingOptions = firstLoadingFlag? $scope.updatingOptions:"Successfully";		
			$scope.optionData = returnData;	
			$scope.select.one = 2;
			$scope.select.two = 2;
			$scope.select.three = 8;
			$scope.select.four = 13;
			$scope.$apply();
		}
	}

	$('#crawling-options').click(function() {
		$scope.updatingOptions = "Retrieving options...";
		$scope.$apply();
		$.ajax({
	        type: 'GET',
	        url: 'http://127.0.0.1:3000/crawlingOptions',
	        success: optionProc,
	        error: function(){$scope.updatingOptions = "Cannot get the data";}
	    });
	});
	var calling = "";
	$('#crawling-start').click(function() {
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

	    $.ajax({
	        type: 'POST',
	        url: 'http://127.0.0.1:3000/startCrawling',
	        data: dataObj
	    });
	});

	$('#crawling-stop').click(function() {
		prf("Calling server to stop crawling");
	    $.ajax({
	        type: 'GET',
	        url: 'http://127.0.0.1:3000/stopCrawling'
	    });
	});

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
		if(list == null || list.length == 0){
			return null;
		}
		
		$scope.summary = {};
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

	var ajaxToGetOptions = function(){
		$.ajax({
		    dataType: "json",
		    url: "ssh_options.json",
		    mimeType: "application/json",
		    success: function(result){			
			    optionProc(result, true);
		    }
		});		
	}
	
	ajaxToGetOptions();
	ajaxToGetJSON();
});