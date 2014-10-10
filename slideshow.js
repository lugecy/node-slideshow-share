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

		//Constructer
		function SlideShow (url_list, body_id) {
			this._image_list = [];
			this._current_idx = 0;
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
			for (var idx = 0; idx < this._image_list.length; idx++) {
				var img = this._image_list[idx];
				if (idx === 0) {
					show_image(img);
				}
				body.appendChild(img);
			}
		}

		//Public methods
		var p = SlideShow.prototype;

		p.go = function (forward_idx) {
			var next_idx = this._current_idx + forward_idx;
			//インデックスの範囲をチェック
			if (next_idx < 0 || next_idx >= this._image_list.length) {
				return;
			}
			//現在の画像を隠す
			var curret_image = this._image_list[this._current_idx];
			hide_image(curret_image);
			//次の画像を表示
			var next_image = this._image_list[next_idx];
			show_image(next_image);
			//インデックス更新
			this._current_idx = next_idx;
		};
		p.previous = function () {
			this.go(-1);
		}
		p.next = function () {
			this.go(+1);
		}

		return SlideShow;
	}());
}(window, window.document));