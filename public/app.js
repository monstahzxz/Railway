var app = {};


app.config = {};
app.requestNeeded = ['accountCreate','login'];

app.request = function(headers,path,method,queryStringObject,payload,callback){
	headers = typeof(headers) == 'object' && headers !== null ? headers : {};
	path = typeof(path) == 'string' ? path : '/';
	method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method : 'GET';
	queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
	payload = typeof(payload) == 'object' && payload !== null ? payload : {};
	callback = typeof(callback) == 'function' ? callback : false;
	
	var requestUrl = path + '?';
	var counter = 0;

	for(var queryKey in queryStringObject){
		if(queryStringObject.hasOwnProperty(queryKey)){
			counter++;

			if(counter > 1){
				requestUrl += '&';
			}

			requestUrl += queryKey + '=' + queryStringObject[queryKey];
		}
	}

	var xhr = new XMLHttpRequest();
	xhr.open(method, requestUrl, true);
	xhr.setRequestHeader('Content-Type','application/json');

	for(var headerKey in headers){
		if(headers.hasOwnProperty(headerKey)){
			xhr.setRequestHeader(headerKey, headers[headerKey]);
		}
	}

	xhr.onreadystatechange = function(){
		if(xhr.readyState == XMLHttpRequest.DONE){
			var statusCode = xhr.status;
			var responseReturned = xhr.responseText;

			if(callback){
				try{
					var parsedResponse = JSON.parse(responseReturned);
					callback(statusCode, parsedResponse);
				} catch(e){
					callback(statusCode,false);
				}
			}
		}
	};

	var payloadString = JSON.stringify(payload);
	xhr.send(payloadString);
};


app.loadDataOnPage = function(){
	var bodyClasses = document.querySelector("body").classList;
	var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

	if(app.config.loggedIn == 'true'){
		document.querySelector(".nav .signup").style.display = 'none';
		document.querySelector(".nav .loginNav").style.display = 'none';
	}

	if(app.config.loggedIn == 'false'){
		document.querySelector(".nav .logout").style.display = 'none';
		document.querySelector(".nav .settings").style.display = 'none';
		document.querySelector(".nav .loggedInHome").style.display = 'none';
	}

	if(primaryClass == 'accountCreatePage'){
		if(app.config.loggedIn == 'true'){
			app.logUserOut();
			window.location = '/account/create';
		}
	}

	else if(primaryClass == 'indexPage'){
		app.loadIndexPage();
	}

	else if(primaryClass == 'trainBookPage'){
		app.loadTrainBookPage();
	}

	else if(primaryClass == 'loginPage'){
		app.loadLoginPage();
	}
	else if(primaryClass == 'trainPassengerPage'){
		app.loadTrainPassengerPage();
	}
	else if(primaryClass == 'trainBookedPage'){
		app.loadTrainBookedPage();
	}
	else if(primaryClass == 'trainCancelledPage'){
		app.loadTrainCancelledPage();
	}
};


app.loadTrainCancelledPage = function(){
	if(app.config.loggedIn == 'false'){
		app.logUserOut();
	}
	else {
		var refund = localStorage.getItem('refund');
		
		document.querySelector(".cancelledRefund").innerHTML = document.querySelector(".cancelledRefund").innerHTML.replace('{refund}',parseFloat(refund).toFixed(2));
		localStorage.setItem('refund',false);

		var button = document.querySelector("button");

		button.addEventListener('click',function(e){
			window.location = '/index';
		});
	}
};

app.loadTrainBookedPage = function(){
	if(app.config.loggedIn == 'false'){
		app.logUserOut();
	}
	else {
		var path = 'http://localhost:3000/train/getPrice';
		var method = 'get';
		var queryStringObject = {
			'bId' : localStorage.getItem('bookingId')
		};

		app.request(undefined,path,method,queryStringObject,undefined,function(statusCode,responsePayload){
			if(statusCode == 200){
				document.querySelector(".fillId").innerHTML = document.querySelector(".fillId").innerHTML.replace('{booking.id}',localStorage.getItem('bookingId'));
				document.querySelector(".fillPrice").innerHTML = document.querySelector(".fillPrice").innerHTML.replace('{booking.amount}',responsePayload.price);
				localStorage.setItem('bookingId',false);

				var button = document.querySelector("button");

				button.addEventListener('click',function(e){
					window.location = '/index';
				});
			}
		});
	}
};

app.loadTrainPassengerPage = function(){
	if(app.config.loggedIn == 'false'){
		app.logUserOut();
	}
	else {
		var select = document.querySelector("select");
		var htmlTag = '<div class="ftHeader"><div class="inputWrapperT2"><div class="inpurLabelT2">Passenger Name: </div><input type="text" name="passengerName"/></div><div class="inputWrapperT2"><div class="inpurLabelT2">Age: </div><input type="text" name="age"/></div><div class="inputWrapperT2"><div class="inpurLabelT2">Gender: </div><input type="radio" name="gender" value="M"/>Male<input type="radio" name="gender" value="F"/>Female<input type="radio" name="gender" value="O"/>Other</div></div>'
		var buttonTag = '<button type="submit">Confirm Booking!</button>';

		select.addEventListener('change',function(e){
			var noOfPassengers = select.value;
			document.querySelector("form").innerHTML = '';

			for(var i=0;i<noOfPassengers;++i){
				var htmlTagNow = htmlTag.split('"passengerName"').join('"passengerName' + i + '"');
				htmlTagNow = htmlTagNow.split('"age"').join('"age' + i + '"');
				htmlTagNow = htmlTagNow.split('"gender"').join('"gender' + i + '"');
				document.querySelector("form").innerHTML += htmlTagNow;
			}

			document.querySelector("form").innerHTML += buttonTag;
		});
	}
};

app.loadTrainBookPage = function(){
	if(app.config.loggedIn == 'false'){
		app.logUserOut();
	}
	else {
		var buttons = document.querySelectorAll("button");
		buttons.forEach(function(button){
			button.addEventListener('click',function(e){
				var train = button.classList.value;
				var trainId = document.querySelector('.' + train + " div").innerHTML.split("(")[1].split(")")[0];
				var classOfSeat = document.querySelectorAll("select")[train[5]].options[document.querySelectorAll("select")[train[5]].selectedIndex].value;
				var date = localStorage.getItem('date');
				var queryStringObject = {
					'trainId' : trainId,
					'classOfSeat' : classOfSeat,
					'date' : date,
					'to' : window.location.search.split('to=')[1].split('&')[0],
					'from' : window.location.search.split('from=')[1].split('&')[0]
				};
				var path = 'http://localhost:3000/train/seats';
				var method = 'get';

				app.request(undefined,path,method,queryStringObject,undefined,function(statusCode,responsePayload){
					if(statusCode == 200){console.log("OK");
						//add responsePayload.remainingSeats to html (edit trainBook by adding empty div and using innerHTML)
						//update train seats according to FROM location (seats add back up after passenger exits his station)
						//make new table for each booking and subtract all from < this.from when returning remainingSeats
						//totalSeats from trainSeats - forEachStationBeforeTo (boardingIn) + boardingOut (y)
						if(responsePayload.remainingSeats > 0){
							document.querySelectorAll("." + train + " div")[5].innerHTML = '<div class="seatsLabel">Available seats<div class="seats">' + responsePayload.remainingSeats + '</div></div><div class="fareLabel">Fare per head<div class="fare">' + responsePayload.price + '</div></div><div><button class="train0">Book this train!</button></div>';
						
							bookTrainButton = document.querySelector("." + train + " button");
							bookTrainButton.addEventListener('click',function(e){
								window.location = 'train/passenger?trainId=' + trainId + '&class=' + classOfSeat + '&to=' + queryStringObject.to + '&from=' + queryStringObject.from;
							});	
						}
						else {console.log("FAIL");
							document.querySelectorAll("." + train + " div")[5].innerHTML = '<div class="seatsLabelNull">Available seats<div class="seats">0</div></div>';

						}
					}
					else {
						window.location = '/';
					}
				});
			});
		});
	}
};

app.loadIndexPage = function(){
	if(app.config.loggedIn == 'false'){
		app.logUserOut();
	}
	else {
		document.querySelector(".welcomeMessage").innerHTML = 'Welcome ' + app.config.username + '!';
		document.querySelectorAll(".sidebar li")[1].innerHTML = document.querySelectorAll(".sidebar li")[1].innerHTML.replace('/history','/history?username=' + app.config.username);
	}
};

app.bindForms = function(){
	if(document.querySelector("form")){
		var allForms = document.querySelectorAll("form");

		for(var i=0;i<allForms.length;++i){
			allForms[i].addEventListener('submit', function(e){
				e.preventDefault();
				console.log(this);
				var formId = this.id;
				var path = this.action;
				var method = this.method.toUpperCase();

				var payload = {};
				var elements = this.elements;

				for(var i=0;i<elements.length;++i){
					if(elements[i].type !== 'submit'){
						var classOfElement = typeof(elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
						var valueOfElement = elements[i].value;
						var nameOfElement = elements[i].name;

						if(elements[i].type =='radio' && elements[i].checked && valueOfElement){
							payload[nameOfElement] = valueOfElement;
						}
						else if(elements[i].type != 'radio'){
							payload[nameOfElement] = valueOfElement;
						}	
					}
				}

				var queryStringObject = method == 'GET' ? payload : {};
				
				if(formId == 'trainPassenger'){
					payload.to = window.location.search.split('to=')[1].split('&')[0];
					payload.from = window.location.search.split('from=')[1].split('&')[0];
					payload.username = localStorage.getItem('username');
					payload.noOfPassengers = document.querySelector("select").value;
					payload.trainId = window.location.search.split('trainId=')[1].split('&')[0];
					payload.classOfSeat = window.location.search.split('class=')[1].split('&')[0];
					payload.date = localStorage.getItem('date');
				}

				//if(app.requestNeeded.indexOf(formId) > -1){
					app.request(undefined,path,method,queryStringObject,payload,function(statusCode,responsePayload){
						if(statusCode == 200){
							console.log(formId);
							app.formResponse(formId,payload,responsePayload);
						}
						else {
							var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An unknown error has occured';

							document.querySelector('#' + formId + ' .error').innerHTML = error;
							document.querySelector('#' + formId + ' .error').style.display = 'block';
						}
					});
				//}
				//else {
				//	app.formResponse(formId,payload,{});
				//}
			});
		}
	}
};

app.formResponse = function(formId,requestPayload,responsePayload){
	if(formId == 'accountCreate'){
		app.setSessionStatus('true',requestPayload.username);
		window.location = '/index';
	}

	else if(formId == 'trainSearch'){
		localStorage.setItem('date',requestPayload.date);
		window.location = 'train/book?from=' + requestPayload.from + '&to=' + requestPayload.to + '&date=' + requestPayload.date;
	}

	else if(formId == 'login'){
		app.setSessionStatus('true',requestPayload.username);
		window.location = '/index';
	}

	else if(formId == 'trainPassenger'){
		localStorage.setItem('bookingId',responsePayload.bookingId);
		window.location = 'train/booked';
	}

	else if(formId == 'trainCancel'){
		console.log(responsePayload.refund);
		localStorage.setItem('refund',responsePayload.refund);
		window.location = 'train/cancelled';
	}
}

app.getSessionStatus = function(){
	var loggedIn = localStorage.getItem('loggedIn');
	var username = localStorage.getItem('username');

	if(loggedIn == 'true'){
		app.config.loggedIn = 'true';
		app.config.username = username;
	}
	else {
		app.config.loggedIn = 'false';
		app.config.username = false;
	}
};

app.setSessionStatus = function(setState,setUsername){
	localStorage.setItem('username',setUsername);
	localStorage.setItem('loggedIn',setState);
	localStorage.setItem('date',false);
	localStorage.setItem('bookingId',false);
};

app.logUserOut = function(){
	app.setSessionStatus('false',false);
	window.location = '/';
};

app.bindLogout = function(){
	document.querySelector(".header .logout").addEventListener('click', function(e){
		e.preventDefault();
		app.logUserOut();
	});
};



app.init = function(){
	app.bindForms();
	app.getSessionStatus();
	app.bindLogout();
	app.loadDataOnPage();
}

window.onload = function(){
	app.init();
};