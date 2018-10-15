var fs = require('fs');
var path = require('path');
var db = require('./db');

var helpers = {};

helpers.parseJsonToObject = function(str){
	try{
		var obj = JSON.parse(str);
		return obj;
	}catch(e){
		return {};
	}
};

helpers.trainList = function(trainData, callback){
	var from = typeof(trainData.from) == 'string' ? trainData.from.trim() : false;
	var to = typeof(trainData.to) == 'string' ? trainData.to.trim() : false;
	var date = typeof(trainData.date) == 'string' ? trainData.date.trim() : false;

	db.getTrains(from,to,function(err,trains){
		if(!err && trains.length > 0){	
			callback(false,trains);
		}
		else {
			callback({'Error' : 'No trains found!'});
		}
	});
};

helpers.fillFromToDiv = function(from, to, trainId){
	var str = '<div class="ftLogoWrapper">';

	str += '<div class="fromToLogo fromLogo">' + from + '</div>';
	str += '<div class="fromToLogo arrowLogo">&xrarr;</div>'
	str += '<div class="fromToLogo toLogo">' + to + '</div>';
	str += '<div class="trainLogo">Train no.: ' + trainId + '</div>';
	str += '</div>';

	return str;
}

helpers.fillHistoryListForm = function(trains,callback){
	var finalHtmlString = '';
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	
	for(var i=0;i<trains.length;++i){
		var htmlStringHeader = '<div class="historyWrapper">';
		var htmlStringIndex = '<div class="historyMember">';
		var htmlStringFooter = '</div>';

		trains[i].date.setTime(trains[i].date.getTime() + (5.5 * 60 * 60 * 1000));
		trains[i].date = JSON.stringify(trains[i].date).split('"')[1].split('T')[0].split('-')[2] + ' ' + months[trains[i].date.getMonth()] + ' ' + JSON.stringify(trains[i].date).split('"')[1].split('T')[0].split('-')[0];

		finalHtmlString += htmlStringHeader + htmlStringIndex + trains[i].bookingId + htmlStringFooter;
		finalHtmlString += htmlStringIndex + trains[i].trainName + ' (' + trains[i].trainId + ')' + htmlStringFooter;
		finalHtmlString += htmlStringIndex + trains[i].date + htmlStringFooter;
		finalHtmlString += htmlStringIndex + trains[i].no_of_passengers + htmlStringFooter;
		finalHtmlString += htmlStringIndex + trains[i].class + htmlStringFooter;
		finalHtmlString += '<div class="historyMember ';
		finalHtmlString += trains[i].status == 'Booked' ? 'booked">' : 'cancelled">';
		finalHtmlString += trains[i].status + htmlStringFooter;
		finalHtmlString += htmlStringFooter;
	}

	callback(finalHtmlString);
};

helpers.fillTrainListForm = function(trainObject,arrival,departure,duration,done,callback){
	var htmlStringHeader = '<div class="trainBookWrapper train' + done + '">';
	var htmlStringIndex = '<div class="trainBookListMember">';
	var htmlStringFooter = '</div>';
	var finalHtmlString = '';
	var htmlButton = '<div class="trainBookListMember"><button' + ' class="train' + done + '">Check avialability and fare</button></div>';
	var htmlClass = '<select class="selector"><option value="GN" selected="selected">General</option><option value="SL">Sleeper</option><option value="AC">AC 3 tier</option></select>';

	finalHtmlString += htmlStringHeader + htmlStringIndex + trainObject.trainName + ' (' + trainObject.trainId + ')' + htmlStringFooter;
	finalHtmlString += htmlStringIndex + departure + htmlStringFooter;
	finalHtmlString += htmlStringIndex + arrival + htmlStringFooter;
	finalHtmlString += htmlStringIndex + duration + htmlStringFooter;
	finalHtmlString += htmlStringIndex + htmlClass + htmlStringFooter;
	finalHtmlString += htmlButton;
	finalHtmlString += htmlStringFooter;
	//console.log(finalHtmlString);
	callback(finalHtmlString);
};

helpers.trainDuration = function(arrival,departure,callback){
	var hr1 = parseInt(arrival.split(':')[0]); 
	var hr2 = parseInt(departure.split(':')[0]);
	var min1 = parseInt(arrival.split(':')[1]);
	var min2 = parseInt(departure.split(':')[1]);

	var duration = (hr1 * 60 + min1) - (hr2 * 60 + min2);
	
	duration = duration > 0 ? duration : duration * -1;

	var durationHr = parseInt(duration / 60).toString();

	durationHr = parseInt(duration / 60) < 9 ? '0' + durationHr : durationHr;
	
	var durationMin = duration - parseInt(duration / 60) * 60;
	
	durationMin = duration - parseInt(duration / 60) * 60 < 10 ? '0' + durationMin : durationMin;

	var durationString = durationHr + ':' + durationMin;
	
	callback(durationString);
};

helpers.getTemplate = function(templateName,templateData,callback){
	templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
	if(templateName){
		var templatesDir = path.join(__dirname,'/./templates/');
		fs.readFile(templatesDir + templateName + '.html','utf-8',function(err,templateStr){
			if(!err){
				helpers.addHeaderAndFooter(templateStr,function(err,finalTemplateStr){
					var finalTemplateStrWithData = helpers.addTemplateData(finalTemplateStr,templateData);

					callback(false,finalTemplateStrWithData);
				});
			}
			else {
				callback('No template could be found');
			}
		});
	}
};

helpers.addTemplateData = function(templateStr,templateData){
	for(key in templateData){
		if(templateData.hasOwnProperty(key)){
			var replace = templateData[key];
			var find = '{' + key + '}';

			templateStr = templateStr.replace(find,replace);
		}
	}

	return templateStr;
};

helpers.addHeaderAndFooter = function(templateStr,callback){
	templateStr = typeof(templateStr) == 'string' && templateStr.length > 0 ? templateStr : false;
	var finalTemplateStr = '';
	if(templateStr){
		var templatesDir = path.join(__dirname,'/./templates/');
		fs.readFile(templatesDir + 'header.html','utf-8',function(err,headerStr){
			if(!err){
				finalTemplateStr += headerStr;
				finalTemplateStr += templateStr;
				fs.readFile(templatesDir + 'footer.html','utf-8',function(err,footerStr){
					if(!err){
						finalTemplateStr += footerStr;
						callback(false,finalTemplateStr);
					}
					else {
						callback('Footer not found!')
					}
				});
			}
			else {
				callback('Header not found!');
			}
		});
	}
};


helpers.getStaticAsset = function(fileName,callback){
	fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
	if(fileName){
		var publicDir = path.join(__dirname,'/./public/');
		fs.readFile(publicDir+fileName,function(err,data){
			if(!err && data){
				callback(false,data);
			}
			else {
				callback('No file could be found');
			}
		});
	}
	else {
		callback('A valid filename was not specified');
	}
};

module.exports = helpers;