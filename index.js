var server = require('./server');
var workers = require('./workers');

var app = {};

app.init = function(){
	server.init();
	workers.init();
};

app.init();