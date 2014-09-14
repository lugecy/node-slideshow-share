var SlideShow = function(url_list, body_id) {
	this.body_id = body_id;
	this.image_list = [];
	this.current_idx = 0;
	var css_classname = "slideshow-image";

	this.show_image = function (img) {
		img.className = css_classname + " active";
	}
	this.hide_image = function (img) {
		img.className = css_classname;
	}

	for (var idx = 0; idx < url_list.length; idx++) {
		var image_info = url_list[idx];
		var img = new Image();
		img.src = image_info.url;
		img.className = css_classname;
		this.image_list.push(img);
	}

	var body = document.getElementById(body_id);
	for (var idx = 0; idx < this.image_list.length; idx++) {
		var img = this.image_list[idx];
		if (idx === 0) {
			this.show_image(img);
		}
		body.appendChild(img);
	}

};

SlideShow.prototype.go = function (forward_idx) {
	var next_idx = this.current_idx + forward_idx;
	//インデックスの範囲をチェック
	if (next_idx < 0 || next_idx >= this.image_list.length) {
		return;
	}
	//現在の画像を隠す
	var curret_image = this.image_list[this.current_idx];
	this.hide_image(curret_image);
	//次の画像を表示
	var next_image = this.image_list[next_idx];
	this.show_image(next_image);
	//インデックス更新
	this.current_idx = next_idx;
}