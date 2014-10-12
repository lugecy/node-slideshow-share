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
			var scroll_width = _this._image_list[_this._current_idx - (vector < 0 ? 1 : 0)].naturalWidth;
			var goal_position = pixel_to_num(ul.style.left) - (scroll_width * vector);
			function animScroll (scroll_vector) {
				ul.style.left = pixel_operation(ul.style.left, scroll_vector);
				var cur_pos = pixel_to_num(ul.style.left);
				if (cur_pos !== goal_position) {
					if (Math.abs(goal_position - cur_pos) < scroll_vector) {
						if (goal_position < cur_pos) {
							scroll_vector = goal_position - cur_pos;
						} else {
							scroll_vector = goal_position - cur_pos;
						}
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
			for (var idx = 0; idx < _this._current_idx; idx++) {
				goal_position -= _this._image_list[idx].naturalWidth;
			}
			ul.style.left = pixel_operation(ul.style.left, goal_position);
		}

		//Constructer
		function SlideShow (url_list, body_id) {
			this._image_list = [];
			this._current_idx = 0;
			this._body_id = body_id;
			this._ready = false;
			var max_width = 0, max_height = 0, img_loaded_count = 0;
			//URLリストよりimgタグリストを生成
			for (var idx = 0; idx < url_list.length; idx++) {
				var image_info = url_list[idx];
				var img = new Image();
				//後述のスライド表示用領域を決定するためのハンドラ
				img.onload = function () {
					if (max_width < this.naturalWidth) {
						max_width = this.naturalWidth;
					}
					if (max_height < this.naturalHeight) {
						max_height = this.naturalHeight;
					}
					img_loaded_count++;
				};
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
			//スライド表示用領域の大きさを決定するために、全ての画像読み込みを待つ必要があるため、
			//ポーリングする
			var self = this;
			function slideshowReadyFunc () {
				if (img_loaded_count === self._image_list.length) {
					body.style.width = max_width.toString() + "px";
					body.style.height = max_height.toString() + "px";
					self._ready = true;
					self.goto(self._current_idx);
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