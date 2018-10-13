var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var handlers = require('./handlers');
var helpers = require('./helpers');
var config = require('./config');

var server = {};


server.httpServer = http.createServer(function(req,res){
	server.unifiedServer(req,res);
});

server.unifiedServer = function(req,res){
	var parsedUrl = url.parse(req.url,true);

	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g,'');


	var method = req.method.toLowerCase();
	var queryStringObject = parsedUrl.query;
	var headers = req.headers;

	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data',function(data){
		buffer += decoder.write(data);
	});

	req.on('end',function(){
		buffer += decoder.end();
		var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
		chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
		
		var data = {
			'queryStringObject' : queryStringObject,
			'trimmedPath' : trimmedPath,
			'method' : method,
			'headers' : headers,
			'payload' : helpers.parseJsonToObject(buffer)
		};
		
		try{
			chosenHandler(data,function(statusCode,payload,contentType){
				server.processHandlerResponse(res,method,trimmedPath,statusCode,payload,contentType);
			});
		}catch(e){
			console.log(e);
			server.processHandlerResponse(res,method,trimmedPath,500,{'Error' : 'An unknwon error has occured'},'json');
		}	
	});
};

server.processHandlerResponse = function(res,method,trimmedPath,statusCode,payload,contentType){
	contentType = typeof(contentType) == 'string' ? contentType : 'json';
	statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
	var payloadString = '';
			
	if(contentType == 'json'){
		res.setHeader('Content-Type','application/json');
		payload = typeof(payload) == 'object' ? payload : {};
		payloadString = JSON.stringify(payload);
	}

	if(contentType == 'html'){
		res.setHeader('Content-Type','text/html');
		payloadString = typeof(payload) == 'string' ? payload : '';
	}

	if(contentType == 'favicon'){
		res.setHeader('Content-Type','image/x-icon');
		payloadString = typeof(payload) !== 'undefined' ? payload : '';
	}

	if(contentType == 'css'){
		res.setHeader('Content-Type','text/css');
		payloadString = typeof(payload) !== 'undefined' ? payload : '';
	}

	if(contentType == 'png'){
		res.setHeader('Content-Type','image/png');
		payloadString = typeof(payload) !== 'undefined' ? payload : '';
	}

	if(contentType == 'jpeg'){
		res.setHeader('Content-Type','image/jpeg');
		payloadString = typeof(payload) !== 'undefined' ? payload : '';
	}

	if(contentType == 'plain'){
		res.setHeader('Content-Type','text/plain');
		payloadString = typeof(payload) !== 'undefined' ? payload : '';
	}


	res.writeHead(statusCode);
	res.end(payloadString);
};


server.router = {
	'' : handlers.home,
	'notFound' : handlers.notFound,
	'index' : handlers.index,
	'public' : handlers.public,
	'users' : handlers.users,
	'users/login' : handlers.userLogin,
	'account/create' : handlers.accountCreate,
	'account/login' : handlers.login,
	'train/search' : handlers.trainSearch,
	'train/book' : handlers.trainBook,
	'train/list' : handlers.trainList,
	'train/seats' : handlers.trainSeats,
	'train/passenger' : handlers.trainPassenger,
	'train/confirm' : handlers.trainConfirm,
	'train/booked' : handlers.trainBooked
};


server.httpServer.listen(config.httpPort,function(){
	console.log('\x1b[36m%s\x1b[0m',"The server is now listening on " + config.httpPort);
})