var server = require('./server');
var workers = require('./workers');

var app = {};

app.init = function(){
	server.init();
	workers.init();
};

//ADD ERROR MESSAGES FOR ALL HTMLs
//CHECK FOR BUGS

app.init();