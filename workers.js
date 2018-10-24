var workers = {};
var db = require('./db');
var twilio = require('./twilio');

workers.syncSMS = function(){
	db.getSMSUsers(function(err,bookingDetails){
		if(!err){
			var message = 'Your booking id: ' + bookingDetails.bookingId + '\nTrain no.: ' + bookingDetails.trainId + '\nDate of journey: ' + bookingDetails.date + '\nClass: ' + bookingDetails.class;
			console.log('+91' + bookingDetails.phone);
			twilio.sendMessage(message,'+91' + bookingDetails.phone,function(){
				console.log('Message sent to ' + bookingDetails.username);
			});
		}
		else {
			console.log("erroBOOK");
		}
	});

	db.getCancelUsers(function(err,bookingDetails){
		if(!err){
			var message = 'Your booking with booking id : ' + bookingDetails.bookingId + ' has been cancelled';
			console.log('+91' + bookingDetails.phone);
			twilio.sendMessage(message,'+91' + bookingDetails.phone,function(){
				console.log('Message sent to ' + bookingDetails.username);
			});
		}
		else {
			console.log("erroCANCEL");
		}
	});
};

workers.init = function(){
	//Add worker functions here
	setInterval(function(){
		workers.syncSMS();
	},10*1000);
};


module.exports = workers;