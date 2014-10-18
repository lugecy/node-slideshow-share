var http = require("http");
var fs = require("fs");
var url = require("url");
var socketio = require("socket.io");

var server = http.createServer(function (req, res) {
	var pathname = url.parse(req.url).pathname;
	var ctype = "text/html";
	if (pathname === "/") {
		pathname = "/index.html";
	}
	if (pathname.slice(-4) === ".jpg") {
		ctype = "image/jpg";
	}
	if (pathname.slice(-4) === ".gif") {
		ctype = "image/gif";
	}
	if (pathname.slice(-3) === ".js") {
		ctype = "text/javascript";
	}
	if (pathname.slice(-4) === ".css") {
		ctype = "text/css";
	}
	if (!fs.existsSync("."+pathname)) {
		res.writeHead(404, {"Content-Type":"text/html"});
		res.end("");
		return;
	}
	res.writeHead(200, {"Content-Type": ctype});
	var output = fs.readFileSync(pathname.slice(1));
	res.end(output);
}).listen(process.env.VMC_APP_PORT || 3000);

// 各クライアント間の通信用
var io = socketio.listen(server);
var stages = {};
io.sockets.on("connection", function (socket) {
	socket.on("C2S_initialze", function (data) {
		var stage;
		console.log(data);
		if (!(stages.hasOwnProperty(data.SSID))) {
			stage = stages[data.SSID] = { "clients": [], "cursor": 0 };
		} else {
			stage = stages[data.SSID];
		}
		stage.clients.push(socket);
		socket.emit("S2C_inform_current_idx", {value: stage.cursor});
	});
	socket.on("C2S_movement_broadcast", function (data) {
		var stage = findStageInClient(socket);
		if (!stage) { return; }
		stage.cursor += data.value;
		for (var idx=0; idx < stage.clients.length; idx++) {
			var s = stage.clients[idx];
			if (s === socket) { continue; }
			s.emit("S2C_movement", {value: data.value});
		}
	});
	socket.on("disconnect", function () {
		deleteClientFromStage(socket);
	});
});

function findStageInClient(socket) {
	var keys = Object.keys(stages);
	for (var s_idx=0; s_idx < keys.length; s_idx++) {
		var stage = stages[keys[s_idx]];
		for (var c_idx=0; c_idx < stage.clients.length; c_idx++) {
			if (socket === stage.clients[c_idx]) {
				return stage;
			}
		}
	}
	return false;
}
function deleteClientFromStage(socket) {
	var stage = findStageInClient(socket);
	if (!stage) { return; }
	for (var idx=0; idx < stage.clients.length; idx++) {
		if (stage.clients[idx] === socket) {
			stage.clients.splice(idx, 1);
		}
	}
}