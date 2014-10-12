(function (window, document, undefined) {
	var www = window.www = window.www || {};
	// スライドショー本体
	www.SlideShow = (function () {
		//Class Private member
		var css_classname = "slideshow-image";

		//Private methods
		function show_image(img) {
			img.className = css_classname + " active";
		}

		function hide_image(img) {
			img.className = css_classname;
		}

		function pixel_to_num(pixel_str) {
			return pixel_str === "" ? 0 : parseInt(pixel_str.replace(/\.px$/, ''), 10);
		}

		function pixel_operation(pixel_str, num) {
			var cur_pixel = pixel_to_num(pixel_str);
			return (cur_pixel + num).toString() + "px";
		}

		function switch_simple(self, vector) {
			//現在の画像を隠す
			var curret_image = self._image_list[self._current_idx];
			hide_image(curret_image);
			//次の画像を表示
			var next_image = self._image_list[self._current_idx + vector];
			show_image(next_image);
		}

		function goto_simple(self, goto_idx) {
			hide_image(self._image_list[self._current_idx]);
			show_image(self._image_list[goto_idx]);
		}

		function switch_scroll_anim(self, vector) {
			var _this = self;
			var interval = 1000 / 60;
			var ul = document.querySelector("#" + _this._body_id + " ul");
			var goal_position = pixel_to_num(ul.style.left) - (400 * vector);
			function animScroll (scroll_vector) {
				ul.style.left = pixel_operation(ul.style.left, scroll_vector);
				if (pixel_to_num(ul.style.left) !== goal_position) {
					setTimeout(function () { animScroll(scroll_vector); }, interval);
				}
			}
			setTimeout(function () { animScroll(vector > 0 ? -20 : 20); }, interval);
		}

		function goto_scroll_anim(self, goto_idx) {
			var _this = self;
			if (_this._current_idx === goto_idx) {
				return;
			}
			var interval = 1000 / 60;
			var ul = document.querySelector("#" + _this._body_id + " ul");
			var goal_position = - (400 * goto_idx);
			ul.style.left = pixel_operation(ul.style.left, goal_position);
		}

		//Constructer
		function SlideShow (url_list, body_id) {
			this._image_list = [];
			this._current_idx = 0;
			this._body_id = body_id;
			//URLリストよりimgタグリストを生成
			for (var idx = 0; idx < url_list.length; idx++) {
				var image_info = url_list[idx];
				var img = new Image();
				img.src = image_info.url;
				img.className = css_classname;
				this._image_list.push(img);
			}
			//スライド表示用領域に画像リストを挿入
			var body = document.getElementById(body_id);
			var ul = document.createElement("ul");
			ul.className = "";
			for (var idx = 0; idx < this._image_list.length; idx++) {
				var img = this._image_list[idx];
				var li = document.createElement("li");
				li.appendChild(img);
				ul.appendChild(li);
			}
			body.appendChild(ul);
			this.goto(0);
		}

		//Public methods
		var p = SlideShow.prototype;

		p.go = function (forward_idx) {
			var next_idx = this._current_idx + forward_idx;
			//インデックスの範囲をチェック
			if (next_idx < 0 || next_idx >= this._image_list.length) {
				return false;
			}
			//表示画像を入れ替える
			switch_scroll_anim(this, forward_idx);
			//インデックス更新
			this._current_idx += forward_idx;
			return next_idx;
		};
		p.previous = function () {
			return this.go(-1);
		}
		p.next = function () {
			return this.go(+1);
		}

		p.goto = function (goto_idx) {
			//インデックスの範囲チェック
			if (goto_idx < 0 || this._image_list.length <= goto_idx) {
				return false;
			}
			//該当画像を表示する
			goto_scroll_anim(this, goto_idx);
			//インデックス更新
			this._current_idx = goto_idx;
			return goto_idx;
		}

		return SlideShow;
	}());
}(window, window.document));