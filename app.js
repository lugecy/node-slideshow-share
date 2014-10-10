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
	if (pathname.slice(-3) === ".js") {
		ctype = "text/javascript";
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
var current_idx = 0;
io.sockets.on("connection", function (socket) {
	socket.on("C2S_fetch_current_idx", function () {
		socket.emit("S2C_inform_current_idx", {value: current_idx});
	});
	socket.on("C2S_movement_broadcast", function (data) {
		current_idx += data.value;
		socket.broadcast.emit("S2C_movement", {value: data.value});
	});
	socket.on("disconnect", function () {
		;
	});
});
