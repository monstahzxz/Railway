var mysql = require('mysql');
var config = require('./config');

var db = {};

/*
* INITIAL SETUP
*
*/

db.connection = mysql.createConnection({
	host : config.db.host,
	user : config.db.user,
	password : config.db.password,
	database : config.db.database
});

db.connection.connect(function(err){
	if(!err){
		console.log('Successful!');
	}
	else {
		console.log('Failed!');
	}
});


/*
* API CALLS
*
*/


db.createAccount = function(userData, callback){
	var queryString = "insert into users values('" + userData.username + "','" + userData.password + "','" + userData.name + "','" + userData.email + "','" + userData.phone + "','" + userData.gender + "','" + userData.dob + "');";
	db.connection.query(queryString, function(err, rows){
		if(!err && rows){
			callback(false);
		}
		else {
			callback(500);
		}
	});	
};

db.getTrains = function(from,to,callback){
	db.getTrainId(from,function(err,fromId){
		db.getTrainId(to,function(err,toId){
			var direction = fromId - toId < 0 ? 'up' : 'down';
			var queryString = 'select * from trains t where direction = "' + direction + '" AND exists(select * from stationsVisited s where t.trainId = s.trainId AND s.stationId = ' + fromId + ') AND exists(select * from stationsVisited s where t.trainId = s.trainId AND s.stationId = ' + toId + ');';
			
			db.connection.query(queryString, function(err, rows){
				if(!err && rows){
					callback(false,rows);
				}
				else {
					callback(404);
				}
			});
		});
	});
};

db.getTrainId = function(stationName,callback){
	var queryString = 'select stationId from stations where stationName = "' + stationName + '";';

	db.connection.query(queryString, function(err, rows){
		if(!err && rows){
			callback(false,rows[0].stationId);
		}
		else {
			callback(400);
		}
	});
};

db.getTime = function(trainId,stationName,callback){
	var queryString = 'select arrivalTime from stationsVisited where trainId = ' + trainId + ' and stationId = ANY(select stationId from stations where stationName = "' + stationName +'");'

	db.connection.query(queryString, function(err, rows){
		if(!err && rows){
			callback(rows[0].arrivalTime);
		}
		else {
			callback(400);
		}
	});
};

db.getUser = function(username,callback){
	var queryString = 'select * from users where username = "' + username + '"';

	db.connection.query(queryString, function(err, rows){
		if(!err && rows.length > 0){
			rows[0].dob.setTime(rows[0].dob.getTime() + (5.5 * 60 * 60 * 1000));
			rows[0].dob = JSON.stringify(rows[0].dob).split('"')[1].split('T')[0];
			callback(false,rows[0]);
		}
		else {
			callback(404);
		}
	});
};

db.updateUser = function(userData,callback){
	var queryString = 'update users set name = "' + userData.name + '",email = "' + userData.email + '",phone = ' + userData.phone + ',dob = "' + userData.dob + '" where username = "' + userData.username + '"';

	db.connection.query(queryString, function(err, rows){
		if(!err){
			callback(false);
		}
		else {
			callback(500);
		}
	});
};

db.verifyUser = function(username,password,callback){
	var queryString = 'select * from users where username = "' + username + '" and password = "' + password + '";';
	
	db.connection.query(queryString, function(err, rows){
		if(!err && rows.length == 1){
			callback(true);
		}
		else {
			callback(false);
		}
	});
}

db.getSeats = function(trainId,classOfSeat,date,fromId,toId,direction,callback){
	var queryString = 'select * from trainSeats where trainId = ' + trainId + ' and date = "' + date + '" and class = "' + classOfSeat + '";';
	var trainWithDataExists = 0;
	var totalSeats = 0; 
	var classPrices = {
		'GN' : 40,
		'SL' : 100,
		'AC' : 200
	};
	var price = classPrices[classOfSeat] * (direction == 'up' ? toId - fromId : fromId - toId);

	db.connection.query(queryString, function(err, rows){
		if(!err){
			trainWithDataExists = rows.length > 0 ? 1 : 0;
			if(trainWithDataExists){
				queryString = 'select remainingSeats from trainSeats where trainId = ' + trainId + ' and date = "' + date + '" and class = "' + classOfSeat + '";';
				
				db.connection.query(queryString, function(err, rows){
					if(!err && rows){
						totalSeats = rows[0].remainingSeats;
						queryString = direction == 'up' ? 
						'select boardingIn,boardingOut from stationsVisited where trainId = ' + trainId + ' and date = "' + date + '" and stationId < ' + toId + ' and class = "' + classOfSeat + '";' :
						'select boardingIn,boardingOut from stationsVisited where trainId = ' + trainId + ' and date = "' + date + '" and stationId > ' + toId + ' and class = "' + classOfSeat + '";';
												
						db.connection.query(queryString, function(err, rows){
							if(!err && rows){
								var done = 0;
								var remainingSeatsObject = {};
								remainingSeatsObject.remainingSeats = totalSeats;
								remainingSeatsObject.price = price;

								rows.forEach(function(row){
									remainingSeatsObject.remainingSeats += row.boardingOut;
									remainingSeatsObject.remainingSeats -= row.boardingIn;
									done++;
								
									if(done == rows.length){
										callback(false,remainingSeatsObject);
									}
								});
							}
							else {
								callback(500);
							}
						});
					}
					else {
						callback(500);
					}
				});
			}
			else {
				queryString = 'insert into trainSeats values(' + trainId + ',"' + date + '","' + classOfSeat + '",30,' + classPrices[classOfSeat] + ');';

				db.connection.query(queryString, function(err, rows){
					if(!err){
						queryString = 'select DISTINCT stationId,arrivalTime from stationsVisited where trainId = ' + trainId;
						db.connection.query(queryString, function(err, rows){
							rowsToBeAdded = rows;
							if(!err && rows){
								queryString = 'select * from stationsVisited where trainId = ' + trainId + ' and date = "' + date + '";';
								
								db.connection.query(queryString, function(err, rows){
									if(!err && rows.length == 0){
										var classes = ['GN','SL','AC'];

										classes.forEach(function(classOfSeat){
											rowsToBeAdded.forEach(function(row){
												queryString = 'insert into stationsVisited values(' + trainId + ',' + row.stationId + ',"' + row.arrivalTime + '",0,0,"' + date + '","' + classOfSeat + '");'; 
												db.connection.query(queryString);		
											});
										});
									}
								});

								queryString = 'select remainingSeats from trainSeats where trainId = ' + trainId + ' and date = "' + date + '" and class = "' + classOfSeat + '";';
									db.connection.query(queryString, function(err, rows){
										if(!err && rows){
											rows[0].price = price;
											callback(false,rows[0]);
										}
										else {
											callback(500);
										}
									});
							}
							else {
								callback(500);
							}
						});
					}
					else {
						callback(500);
					}
				});
			}
		}
		else {
			callback(500);
		}
	});
};

db.book = function(bookingDetails,passengerDetails,callback){
	var queryString = '';
	var bookingIdObject = {};

	db.generateId(function(id){
		bookingIdObject.bookingId = id;
		queryString = 'insert into booking values(' + id + ',"' + bookingDetails.username + '",' + bookingDetails.trainId + ',' + bookingDetails.noOfPassengers + ',"' + bookingDetails.from + '","' + bookingDetails.to + '","' + bookingDetails.classOfSeat + '","' + bookingDetails.date + '");'; 
		
		db.connection.query(queryString, function(err){
			if(err){
				callback(500);
			}
		});

		for(var i=0;i<bookingDetails.noOfPassengers;++i){
			queryString = 'insert into bookingInfo values(' + id + ',"' + passengerDetails.passengerNames[i] + '",' + passengerDetails.passengerAges[i] + ',"' + passengerDetails.passengerGenders[i] + '");';
			db.connection.query(queryString, function(err){
				if(err){
					callback(500);
				}
			});
		}
	});

	db.getTrainId(bookingDetails.from,function(err,fromId){
		db.getTrainId(bookingDetails.to,function(err,toId){
			queryString = 'update stationsVisited set boardingIn = boardingIn + ' + bookingDetails.noOfPassengers + ' where trainId = ' + bookingDetails.trainId + ' and stationId = ' + fromId + ' and date = "' + bookingDetails.date + '" and class = "' + bookingDetails.classOfSeat + '";';

			db.connection.query(queryString, function(err){
				if(err){
					callback(500);
				}
			});

			queryString = 'update stationsVisited set boardingOut = boardingOut + ' + bookingDetails.noOfPassengers + ' where trainId = ' + bookingDetails.trainId + ' and stationId = ' + toId + ' and date = "' + bookingDetails.date + '" and class = "' + bookingDetails.classOfSeat + '";';
			db.connection.query(queryString, function(err){
				if(err){
					callback(500);
				}
			});	
		});
	});

	callback(false,bookingIdObject);
};

db.generateId = function(callback){
	var id = 0;

	for(var i=0;i<5;++i){
		id = id * 10 + (Math.floor((Math.random() * 10) + 1));
	}

	callback(id);	
};

db.getHistory = function(username,callback){
	var queryString = 'select * from bookingMask where username = "' + username + '";';

	db.connection.query(queryString, function(err, rows){
		if(!err && rows.length > 0){
			callback(false,rows);
		}
		else {
			callback(500);
		}
	});
};

db.getTrainName = function(trainsWithoutNames,callback){
	var trains = trainsWithoutNames;
	var queryString = '';
	var done = 0;

	trainsWithoutNames.forEach(function(trainWithoutNames){
		queryString = 'select trainName from trains where trainId = ' + trainWithoutNames.trainId + ';';
		db.connection.query(queryString, function(err, rows){
			if(!err){
				trains[done].trainName = rows[0].trainName;
				++done;

				if(done == trains.length){
					callback(false,trains);
				}
			}
			else {
				callback(500);
			}
		});
	});
};

db.classifyTrainStatus = function(trains,callback){
	var trainsWithStatus = trains;
	var queryString = '';
	var done = 0;

	trains.forEach(function(train){
		queryString = 'select trainId from booking where bookingId = ' + train.bookingId + ';';
		db.connection.query(queryString, function(err, rows){
			if(!err && rows.length > 0){
				trainsWithStatus[done].status = 'Booked';
				++done;
			
				if(done == trainsWithStatus.length){
					callback(false,trainsWithStatus);
				}
			}
			else {
				trainsWithStatus[done].status = 'Cancelled';
				++done;

				if(done == trainsWithStatus.length){
					callback(false,trainsWithStatus);
				}
			}
		});
	});
};

db.cancel = function(bookingId,callback){
	var queryString = 'select * from booking where bookingId = ' + bookingId;
	var refundObject = {};
	var classPrices = {
		'GN' : 40,
		'SL' : 100,
		'AC' : 200
	};
	var mainRow = [];

	db.connection.query(queryString, function(err, rows){
		if(!err && rows.length > 0){
			mainRow = rows[0];

			db.getTrainId(mainRow.fromStation,function(err,fromId){
				db.getTrainId(mainRow.toStation,function(err,toId){
					var direction = toId - fromId > 0 ? 'up' : 'down';
					var price = classPrices[mainRow.class] * (direction == 'up' ? toId - fromId : fromId - toId) * mainRow.no_of_passengers;
					
					mainRow.date.setTime(mainRow.date.getTime() + (5.5 * 60 * 60 * 1000));
					
					var remainingDays = (mainRow.date.getTime() - new Date().getTime())/(1000 * 60 * 60 * 24);
					
					refundObject.refund = remainingDays > 7 ? price : price * (remainingDays/7);
					//DELETE FROM TRAINSEATS
					queryString = 'update stationsVisited set boardingIn = boardingIn - ' + mainRow.no_of_passengers + ' where trainId = ' + mainRow.trainId + ' and date = "' + JSON.stringify(mainRow.date).split('T')[0].split('"')[1] + '" and class = "' + mainRow.class + '" and stationId = ' + fromId;
					db.connection.query(queryString, function(err, rows){
						if(!err){
							queryString = 'update stationsVisited set boardingOut = boardingOut - ' + mainRow.no_of_passengers + ' where trainId = ' + mainRow.trainId + ' and date = "' + JSON.stringify(mainRow.date).split('T')[0].split('"')[1] + '" and class = "' + mainRow.class + '" and stationId = ' + toId;
							db.connection.query(queryString, function(err, rows){
								if(!err){
									queryString = 'delete from booking where bookingId = ' + bookingId;
									db.connection.query(queryString, function(err, rows){
										if(!err){
											queryString = 'delete from bookingInfo where bookingId = ' + bookingId;
											db.connection.query(queryString, function(err, rows){
												if(!err){
													callback(false,refundObject);
												}
												else {
													callback(500);
												}
											});
										}
										else {
											callback(500);
										}
									});
								}
								else {
									callback(500);
								}
							});
						}
						else {
							callback(500);
						}
					});
				});
			});
		}
		else {
			callback(404);
		}
	});
};

db.getPrice = function(bookingId,callback){
	var queryString = 'select * from booking where bookingId = ' + bookingId;
	var priceObject = {};
	var classPrices = {
		'GN' : 40,
		'SL' : 100,
		'AC' : 200
	};

	db.connection.query(queryString, function(err, rows){
		if(!err){
			db.getTrainId(rows[0].fromStation,function(err,fromId){
				db.getTrainId(rows[0].toStation,function(err,toId){
					var difference = toId > fromId ? toId - fromId : fromId - toId;

					priceObject.price = classPrices[rows[0].class] * rows[0].no_of_passengers * difference;
					callback(false,priceObject);
				});
			});
		}
		else {
			callback(500);
		}
	});
};

db.getSMSUsers = function(callback){
	var queryString = 'select * from booking where bookingId NOT IN(select bookingId from smsusers)';
	var bookingDetails = {};

	db.connection.query(queryString, function(err, rows){
		if(!err && rows.length > 0){
			bookingDetails = rows[0];
			queryString = 'insert into smsusers values(' + bookingDetails.bookingId + ',"' + bookingDetails.username + '")';
			db.connection.query(queryString, function(err, rows){
				if(!err){
					queryString = 'select phone from users where username = "' + bookingDetails.username + '"';
					db.connection.query(queryString, function(err, rows){
						if(!err){
							bookingDetails.phone = rows[0].phone;
							callback(false,bookingDetails);
						}
						else {
							callback(500);
						}
					});
				}
				else {
					callback(500);
				}
			});
		}
		else {
			callback(404);
		}
	});
};

db.getCancelUsers = function(callback){
	var queryString = 'select * from smsusers where bookingId NOT IN(select bookingId from booking)';
	var bookingDetails = {};

	db.connection.query(queryString, function(err, rows){
		if(!err && rows.length > 0){
			bookingDetails = rows[0];
			queryString = 'delete from smsusers where bookingId = ' + bookingDetails.bookingId;
			db.connection.query(queryString, function(err, rows){
				if(!err){
					queryString = 'select phone from users where username = "' + bookingDetails.username + '"';
					db.connection.query(queryString, function(err, rows){
						if(!err){
							bookingDetails.phone = rows[0].phone;
							callback(false,bookingDetails);
						}
						else {
							callback(500);
						}
					});
				}
				else {
					callback(500);
				}
			});
		}
		else {
			callback(404);
		}
	});
};


module.exports = db;