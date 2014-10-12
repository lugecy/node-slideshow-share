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
			var fps = 60;
			var interval = 500 / fps;
			var ul = document.querySelector("#" + _this._body_id + " ul");
			var scroll_width = _this._screen_width;
			var goal_position = pixel_to_num(ul.style.left) - (scroll_width * vector);
			function animScroll (scroll_vector) {
				ul.style.left = pixel_operation(ul.style.left, scroll_vector);
				var cur_pos = pixel_to_num(ul.style.left);
				if (cur_pos !== goal_position) {
					if (Math.abs(goal_position - cur_pos) < Math.abs(scroll_vector)) {
						scroll_vector = goal_position - cur_pos;
					}
					setTimeout(function () { animScroll(scroll_vector); }, interval);
				}
			}
			var move_length = scroll_width / fps;
			setTimeout(function () { animScroll(move_length * (vector > 0 ? -1 : +1)); }, interval);
		}

		function goto_scroll_anim(self, goto_idx) {
			var _this = self;
			var ul = document.querySelector("#" + _this._body_id + " ul");
			var goal_position = 0;
			for (var idx = 0; idx < goto_idx; idx++) {
				goal_position -= _this._screen_width;
			}
			ul.style.left = pixel_operation(ul.style.left, goal_position);
		}

		function setup_slideshow_dom(body, url_list, img_load_handler) {
			var self = this;
			var ul = document.createElement("ul");
			ul.className = "";
			for (var idx = 0; idx < url_list.length; idx++) {
				//画像読み込み・後の表示領域設定のためにハンドラをセット
				var image_info = url_list[idx];
				var img = new Image();
				img.onload = img_load_handler;
				img.src = image_info.url;
				img.className = css_classname;
				self._image_list.push(img);
				//リスト要素としてDOM構造追加
				var li = document.createElement("li");
				var box = document.createElement("div");
				box.appendChild(img);
				li.appendChild(box);
				ul.appendChild(li);
			}
			body.appendChild(ul);
		}

		function setup_slideshow() {
			var self = this;
			var padding = 8;
			//画像リストの最大幅・高さを求める
			var max_width = 0, max_height = 0;
			for (var idx = 0; idx < self._image_list.length; idx++) {
				if (max_width < self._image_list[idx].naturalWidth) {
					max_width = self._image_list[idx].naturalWidth;
				}
				if (max_height < self._image_list[idx].naturalHeight) {
					max_height = self._image_list[idx].naturalHeight;
				}
			}
			//表示領域の幅・高さを設定
			var width  = self._screen_width  = max_width + padding * 2;
			var height = self._screen_height = max_height + padding * 2;
			var body = document.getElementById(self._body_id);
			body.style.width = width.toString() + "px";
			body.style.height = height.toString() + "px";
			//各画像ボックスの幅等を設定
			var li_list = body.getElementsByTagName("li");
			for (var i = 0; i < li_list.length; i++) {
				var li = li_list[i];
				li.style.width = width.toString() + "px";
				var box = li.querySelector("div");
				box.style.width = max_width + "px";
				box.style.margin = "0px auto";
				box.style.textAlign = "center";
			}
			//表示すべき画像へ移動
			self._ready = true;
			self.goto(self._current_idx);
		}

		//Constructer
		function SlideShow (url_list, body_id) {
			this._image_list = [];
			this._current_idx = 0;
			this._body_id = body_id;
			this._ready = false;
			var img_loaded_count = 0;
			//スライド表示用領域に画像リストを挿入
			var body = document.getElementById(body_id);
			setup_slideshow_dom.call(this, body, url_list, function () { img_loaded_count++; });
			//スライド表示用領域の大きさを決定するために、
			//全ての画像読み込みを待つ(ポーリング)
			var self = this;
			function slideshowReadyFunc () {
				if (img_loaded_count === self._image_list.length) {
					setup_slideshow.call(self);
				} else {
					setTimeout(slideshowReadyFunc, 500);
				}
			}
			setTimeout(slideshowReadyFunc, 500);
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
			if (this._ready) {
				goto_scroll_anim(this, goto_idx);	
			}
			//インデックス更新
			this._current_idx = goto_idx;
			return goto_idx;
		}

		return SlideShow;
	}());
}(window, window.document));