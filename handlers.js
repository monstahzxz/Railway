var db = require('./db');
var helpers = require('./helpers');
var config = require('./config');

var handlers = {};

handlers.notFound = function(data, callback){
	callback(404);
}

/*
*TEMPLATE HANDLERS
*
*/

handlers.home = function(data, callback){
	if(data.method == 'get'){
		helpers.getTemplate('home',{},function(err, templateStr){
			if(!err && templateStr){
				callback(200,templateStr,'html');
			}
			else {
				callback(404);
			}
		});
	}
};

handlers.index = function(data, callback){
	var templateData = {
		'body.class' : 'indexPage'
	};

	if(data.method == 'get'){
		helpers.getTemplate('index',templateData,function(err, templateStr){
			if(!err && templateStr){
				callback(200,templateStr,'html');
			}
			else {
				callback(404);
			}
		});
	}
};

handlers.public = function(data,callback){
	if(data.method == 'get'){
		var trimmedAssetName = data.trimmedPath.replace('public/','').trim();
		if(trimmedAssetName.length > 0){
			helpers.getStaticAsset(trimmedAssetName,function(err,data){
				if(!err && data){
					var contentType = 'plain';

					if(trimmedAssetName.indexOf('.css') > -1){
						contentType = 'css';
					}
					if(trimmedAssetName.indexOf('.png') > -1){
						contentType = 'png';
					}
					if(trimmedAssetName.indexOf('.jpeg') > -1){
						contentType = 'jpeg';
					}
					if(trimmedAssetName.indexOf('.ico') > -1){
						contentType = 'favicon';
					}

					callback(200,data,contentType);
				}
				else {
					callback(404);
				}
			});
		}
		else {
			callback(404);
		}
	}
	else {
		callback(405);
	}
};

handlers.login = function(data, callback){
	var templateData = {
		'body.class' : 'loginPage'
	};

	if(data.method == 'get'){
		helpers.getTemplate('login',templateData,function(err,templateStr){
			if(!err && templateStr){
				callback(200,templateStr,'html');
			}
			else {
				callback(404);
			}
		});
	}
	else {
		callback(405);
	}
};

handlers.accountCreate = function(data, callback){
	var templateData = {
		'body.class' : 'accountCreatePage'
	};

	if(data.method == 'get'){
		helpers.getTemplate('accountCreate',templateData,function(err,templateStr){
			if(!err && templateStr){
				callback(200,templateStr,'html');
			}
			else {
				callback(404);
			}
		});
	}
	else {
		callback(405);
	}
};

handlers.trainSearch = function(data, callback){
	if(data.method == 'get'){
		helpers.getTemplate('trainSearch',{},function(err,templateStr){
			if(!err && templateStr){
				callback(200,templateStr,'html');
			}
			else {
				callback(404);
			}
		});
	}
	else {
		callback(405);
	}
};

handlers.trainBook = function(data, callback){
	var trainData = {};

	trainData.from = typeof(data.queryStringObject.from) == 'string' && config.validStates.indexOf(data.queryStringObject.from) > -1 ? data.queryStringObject.from : false;
	trainData.to = typeof(data.queryStringObject.to) == 'string' && config.validStates.indexOf(data.queryStringObject.to) > -1 ? data.queryStringObject.to : false;
	trainData.date = typeof(data.queryStringObject.date) == 'string' ? data.queryStringObject.date : false;

	var templateData = {
		'body.class' : 'trainBookPage',
		'trains' : ''
	};
	var done = 0;

	if(trainData.from && trainData.to && trainData.date){
		helpers.trainList(trainData,function(err,trainsObject){
			if(!err && trainsObject){
				trainsObject.forEach(function(train){
					db.getTime(train.trainId,trainData.to,function(arrival){
						db.getTime(train.trainId,trainData.from,function(departure){
							helpers.trainDuration(arrival,departure,function(duration){
								helpers.fillTrainListForm(train,arrival,departure,duration,done,function(string){
									templateData.trains += string;
									done++;

									if(data.method == 'get'){
										if(done == trainsObject.length){
											helpers.getTemplate('trainBook',templateData,function(err,templateStr){
												if(!err && templateStr){
													callback(200,templateStr,'html');
												}
												else {
													callback(404);
												}
											});
										}
									}
									else {
										callback(405);
									}
								});
							});
						});
					});
				});
			}
			else {
				callback(404,{'Error' : 'No trains found!'});
			}
		});		
	}
	else {
		callback(400,{'Error' : 'Missing or invalid data'});
	}
};

handlers.trainPassenger = function(data, callback){
	if(data.method = 'get'){
		var from = typeof(data.queryStringObject.from) == 'string' ? data.queryStringObject.from : false;
		var to = typeof(data.queryStringObject.to) == 'string' ? data.queryStringObject.to : false;
		var classOfSeat = typeof(data.queryStringObject.class) == 'string' ? data.queryStringObject.class : false;
		var trainId = typeof(data.queryStringObject.trainId) == 'string' ? data.queryStringObject.trainId : false;

		var templateData = {
			'body.class' : 'trainPassengerPage',
			'from-to' : helpers.fillFromToDiv(from,to,trainId)
		}


		helpers.getTemplate('trainPassenger',templateData,function(err,templateStr){
			if(!err && templateStr){
				callback(200,templateStr,'html');
			}
			else {
				callback(404);
			}
		});
	}		
	else {
		callback(405);
	}
};

handlers.trainBooked = function(data, callback){
	if(data.method == 'get'){
		helpers.getTemplate('trainBooked',{},function(err,templateStr){
			if(!err && templateStr){
				callback(200,templateStr,'html');
			}
			else {
				callback(404);
			}
		});
	}
};

/*
* API HANDLERS
*
*/

/*
* USERS HANDLERS
*
*/
handlers.users = function(data, callback){
	var acceptableMethods = ['post','get','delete'];
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._users[data.method](data, callback);
	}
	else{
		callback(405);
	}
};

handlers._users = {};

handlers._users.post = function(data, callback){
	var username = typeof(data.payload.username) == 'string' ? data.payload.username.trim() : false;
	var password = typeof(data.payload.password) == 'string' ? data.payload.password.trim() : false;
	var name = typeof(data.payload.name) == 'string' ? data.payload.name.trim() : false;
	var email = typeof(data.payload.email) == 'string' ? data.payload.email.trim() : false;
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var gender = typeof(data.payload.gender) == 'string' && data.payload.gender.trim().length == 1 ?  data.payload.gender.trim().length : false;
	var dob = typeof(data.payload.dob) == 'string' ? data.payload.dob.trim() : false;

	var userData = {
		'username' : username,
		'password' : password,
		'name' : name,
		'email' : email,
		'phone' : phone,
		'gender' : gender,
		'dob' : dob
	};

	if(username &&
		password &&
		name &&
		email &&
		phone &&
		gender &&
		dob){
		db.createAccount(userData, function(err){
			if(!err){
				callback(200);
			}
			else {
				callback(500,{'Error' : 'Username already taken!'});
			}
		});
	}
	else {
		callback(400,{'Error' : 'Missing required fields'});
	}
};

handlers.userLogin = function(data, callback){
	var username = typeof(data.payload.username) == 'string' ? data.payload.username.trim() : false;
	var password = typeof(data.payload.password) == 'string' ? data.payload.password.trim() : false;
	
	if(username && password){
		db.verifyUser(username,password,function(userValid){
			if(userValid){
				callback(200);
			}
			else {
				callback(404,{'Error' : 'Invalid username or password!'});
			}
		});
	}
	else {
		callback(400,{'Error' : 'Missing required fields!'});
	}
};

handlers.trainSeats = function(data, callback){
	if(data.method == 'get'){
		var date = typeof(data.queryStringObject.date) == 'string' ? data.queryStringObject.date : false;
		var trainId = typeof(data.queryStringObject.trainId) == 'string' ? parseInt(data.queryStringObject.trainId) : false;
		var classOfSeat = typeof(data.queryStringObject.classOfSeat) == 'string' ? data.queryStringObject.classOfSeat : false;
		var to = typeof(data.queryStringObject.to) == 'string' ? data.queryStringObject.to : false;
		var from = typeof(data.queryStringObject.from) == 'string' ? data.queryStringObject.from : false;

		db.getTrainId(to,function(err,toId){
			db.getTrainId(from,function(err,fromId){
				var direction = fromId - toId < 0 ? 'up' : 'down';
				db.getSeats(trainId,classOfSeat,date,fromId,toId,direction,function(err,seats){
					if(!err && seats){
						callback(200,seats,'json');
					}
					else {
						callback(500,{'Error' : 'An unknwon error has occurred'});
					}
				});
			});
		});
	}
};

handlers.trainConfirm = function(data, callback){
	var bookingDetails = {};

	bookingDetails.username = typeof(data.payload.username) == 'string' ? data.payload.username : false;
	bookingDetails.to = typeof(data.payload.to) == 'string' ? data.payload.to : false;
	bookingDetails.from = typeof(data.payload.from) == 'string' ? data.payload.from : false;
	bookingDetails.noOfPassengers = typeof(data.payload.noOfPassengers) == 'string' ? parseInt(data.payload.noOfPassengers) : false;
	bookingDetails.trainId = typeof(data.payload.trainId) == 'string' ? data.payload.trainId : false;
	bookingDetails.classOfSeat = typeof(data.payload.classOfSeat) == 'string' ? data.payload.classOfSeat : false;
	bookingDetails.date = typeof(data.payload.date) == 'string' ? data.payload.date : false;
	
	var passengerDetails = {
		'passengerNames' : [],
		'passengerAges' : [],
		'passengerGenders' : []
	};

	for(var i=0;i<bookingDetails.noOfPassengers;++i){
		var passengerName = typeof(data.payload['passengerName' + i]) == 'string' ? data.payload['passengerName' + i] : false;
		var passengerAge = typeof(data.payload['age' + i]) == 'string' ? data.payload['age' + i] : false;
		var passengerGender = typeof(data.payload['gender' + i]) == 'string' ? data.payload['gender' + i] : false;

		passengerDetails.passengerNames.push(passengerName);
		passengerDetails.passengerAges.push(passengerAge);
		passengerDetails.passengerGenders.push(passengerGender);
	}
	//Do the actual booking with db
	db.book(bookingDetails,passengerDetails,function(bookingIdObject){
		callback(200,bookingIdObject,'json');
	});
};


module.exports = handlers;