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

		function pixel_to_int(pixel_str) {
			return pixel_str === "" ? 0 : parseInt(pixel_str.replace(/\.px$/, ''), 10);
		}

		function int_to_pixel(int) {
			return int.toString() + "px";
		}

		function pixel_operation(pixel_str, num) {
			var cur_pixel = pixel_to_int(pixel_str);
			return int_to_pixel(cur_pixel + num);
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

		function switch_scroll_anim(vector) {
			var self = this;
			var fps = 60;
			var interval = 500 / fps;
			var ul = document.querySelector("#" + self._body_id + " ul");
			//フレーム毎の移動後位置を返す関数オブジェクトを定義
			var next_frame = (function(){
				var cur_pos = pixel_to_int(ul.style.left);
				var goal_pos = cur_pos - (self._screen_width * vector);
				var movement = (self._screen_width / fps) * (vector > 0 ? -1 : +1);
				return function () {
					if (cur_pos === goal_pos) { return false; }
					if (Math.abs(goal_pos - cur_pos) < Math.abs(movement)) {
						cur_pos = goal_pos;
					} else {
						cur_pos += movement;
					}
					return cur_pos;
				};
			})();
			//上記オブジェクトを呼び出して、スクリーンを移動していく
			function animScroll (next_frame) {
				var next_pos = next_frame();
				if (next_pos === false) { return; }
				ul.style.left = int_to_pixel(next_pos);
				setTimeout(function () { animScroll(next_frame); }, interval);
			}
			setTimeout(function () { animScroll(next_frame); }, interval);
		}

		function goto_scroll_anim(goto_idx) {
			var self = this;
			var ul = document.querySelector("#" + self._body_id + " ul");
			var goal_position = 0;
			for (var idx = 0; idx < goto_idx; idx++) {
				goal_position -= self._screen_width;
			}
			ul.style.left = pixel_operation(ul.style.left, goal_position);
		}

		function show_loading(body) {
			var loading_img = new Image();
			loading_img.src = "loading.gif";
			body.appendChild(loading_img);
		}

		function hide_loading(body) {
			body.removeChild(body.firstChild);
		}

		function override_style(elm, styles) {
			Object.keys(styles).forEach(function (sname) {
				elm.style[sname] = styles[sname];
			});
		}

		function setup_image_style(img) {
			override_style(img, {
				"display": "block",
				"maxWidth": "100%",
				"maxHeight": "100%",
				"margin": "0px auto"
			});
		}

		function setup_slideshow_dom(body, url_list, img_load_handler) {
			var self = this;
			//ローディング画像表示
			show_loading(body);
			//画像リスト生成
			var ul = document.createElement("ul");
			ul.className = "";
			for (var idx = 0; idx < url_list.length; idx++) {
				//画像読み込み・後の表示領域設定のためにハンドラをセット
				var image_info = url_list[idx];
				var img = new Image();
				img.onload = img_load_handler;
				img.src = image_info.url;
				img.className = css_classname;
				setup_image_style(img);
				self._image_list.push(img);
				//リスト要素としてDOM構造追加
				var li = document.createElement("li");
				li.style.display = "none"; //ローディング画像表示のために非表示に
				//slipsnap
				var ss = Flipsnap(img);
				ss.element.addEventListener('fstouchend', function (ev) {
					var vector = (ev.newPoint === -1 ? +1 : -1);
					// console.log({'originPoint': ev.originPoint, 'newPoint': ev.newPoint});
					self.go(vector);
				}, false);
				li.appendChild(img);
				ul.appendChild(li);
			}
			body.appendChild(ul);
		}

		function setup_slideshow() {
			var self = this;
			//表示領域の幅・高さを設定
			var body = document.getElementById(self._body_id);
			var width  = self._screen_width  = body.clientWidth;
			var height = self._screen_height = body.clientHeight;
			//ローディング画像を非表示に
			hide_loading(body);
			//各画像ボックスの幅等を設定
			var li_list = body.getElementsByTagName("li");
			for (var i = 0; i < li_list.length; i++) {
				var li = li_list[i];
				override_style(li, {
					"width": int_to_pixel(width),
					"height": int_to_pixel(height),
					"textAlign": "center",
				});
				li.style.display = "block"; //非表示を解除
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
			switch_scroll_anim.call(this, forward_idx);
			//インデックス更新
			this._current_idx += forward_idx;
			return next_idx;
		};
		p.previous = function () {
			return this.go(-1);
		};
		p.next = function () {
			return this.go(+1);
		};

		p.goto = function (goto_idx) {
			//インデックスの範囲チェック
			if (goto_idx < 0 || this._image_list.length <= goto_idx) {
				return false;
			}
			//該当画像を表示する
			if (this._ready) {
				goto_scroll_anim.call(this, goto_idx);	
			}
			//インデックス更新
			this._current_idx = goto_idx;
			return goto_idx;
		};

		//SlideShow Controller側での特定用
		p.getSSID = function () {
			return CryptoJS.SHA1(this._image_list.reduce(function (memo, img) { memo += img.src; return memo; }, "")).toString();
		}

		return SlideShow;
	}());
}(window, window.document));

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
n=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,
2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},
k=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,
f)).finalize(b)}}});var s=p.algo={};return p}(Math);
(function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^
k)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();
