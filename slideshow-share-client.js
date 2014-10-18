(function (window, document, undefined) {
	var www = window.www = window.www || {};	
	//WebSocketでのスライドショー共有
	www.SlideShowController = (function () {
		function SlideShowController (slideshow) {
			this.slideshow = slideshow;
			//WebSocket初期化
			var host = window.location.hostname;
			var s = this._socket = io.connect("http://" + host);
			s.on("connect", function () {});
			s.on("disconnect", function (client) {});
			var _this = this;
			//現在共有されているページを取得・現在位置まで移動する
			s.on("S2C_inform_current_idx", function (data) {
				_this.slideshow.goto(data.value);
			});
			//他クライアントから指示を処理
			s.on("S2C_movement", function (data) {
				_this.recv(data.value);
			});
			//サーバーから現在のページを取得
			s.emit("C2S_initialze", {"SSID": slideshow.getSSID()});
		}
		var p = SlideShowController.prototype;
		//各クライアントに進む/戻るイベントを送信
		p.send = function (forward_idx) {
			this._socket.emit("C2S_movement_broadcast", {value: forward_idx});
		};
		//他クライアントからの進む/戻るイベントを受信・処理
		p.recv = function (forward_idx) {
			this.slideshow.go(forward_idx)
		};
		return SlideShowController;
	}());
}(window, window.document));
