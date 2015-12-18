/**
 * @name	jQuery.touchSlider
 * @version	201209_2
 * @since	201106
 * @param Object	settings	환경변수 오브젝트
 *		roll			-	循环显示 (default true)
        auto            -   自动播放 (default false)
		delay           -   播放延时 (default 5000) 
 *		flexible		-	流动布局 (default false)
 *		view			-	可见数量 (default 1)
 *		speed			-	动画速度 (default 75)
 *		range			-	判定范围 (default 0.15)
 *		page			-	起始页 (default 1)
 *		transition		-	CSS3 transition 使用 (default false)
 *		btn_prev		-	prev 上一个(jQuery Object, default null)
 *		btn_next		-	next 下一个 (jQuery Object, default null)
 *		paging			-	page 按钮 (jQuery Object, default null)
 *		initComplete	-	重置回叫
 *		counter			-	幻灯片回叫
 *
 * @example
	$("#target").touchSlider({
		flexible : true
	});
*/

(function ($) {
	
	$.fn.touchSlider = function (settings) {
		
		settings.supportsCssTransitions = (function (style) {
			var prefixes = ['Webkit','Moz','Ms'];
			for(var i=0, l=prefixes.length; i < l; i++ ) {
				if( typeof style[prefixes[i] + 'Transition'] !== 'undefined') {
					return true;
				}
			}
			return false;
		})(document.createElement('div').style);
		
		settings = jQuery.extend({
			roll : true,
			auto : false,
			delay: 5000,
			flexible : false,
			btn_prev : null,
			btn_next : null,
			paging : null,
			speed : 75,
			view : 1,
			range : 0.15,
			page : 1,
			transition : false,
			initComplete : null,
			lister:'ul li',
			hrw:null,
			counter : null,
			multi : false,
			index:0
		}, settings);
		
		var opts = [];
		opts = $.extend({}, $.fn.touchSlider.defaults, settings);

		return this.each(function () {
			
			$.fn.extend(this, touchSlider);
			
			var _this = this;
			
			this.opts = opts;
			
			this._auto = this.opts.auto;
			this._index = this.opts.index;
			this._delay = this.opts.delay;
			this._speed = this.opts.speed;
			this._tg = $(this);
			this._list = this._tg.find(this.opts.lister);
			this._list_parent = this._tg.find(this.opts.lister).parent();
		    this._list.show();
			this._width  = parseInt(this._tg.css("width"));
			if(opts.hrw)
			   this._height = this._width*opts.hrw;	
			else
			   this._height = parseInt(this._list.css("height"));	
			

			this._item_w = parseInt(this._list.css("width"));
			
			if(this.opts.view =='auto'){

				   this._view =Math.ceil(this._width/parseInt(this._list.css("width")));
			}
			else
			{
				 this._view=this.opts.view;
			}
				console.log('this.opts.view,this._view',this.opts.view,this._view);

			this._len = this._list.length;
			this._list_w = this._item_w*this._len;
			
			this._range = this.opts.range * this._width;
			this._pos = [];
			this._start = [];
			this._startX = 0;
			this._startY = 0;
			this._left = 0;
			this._top = 0;
			this._drag = false;
			this._scroll = false;
			this._btn_prev;
			this._btn_next;
			this._timer=null;
			
			this.init();
			
			$(this)
			.bind("touchstart", this.touchstart)
			.bind("touchmove", this.touchmove)
			.bind("touchend", this.touchend)
			.bind("dragstart", this.touchstart)
			.bind("drag", this.touchmove)
			.bind("dragend", this.touchend)
			
			$(window).bind("orientationchange resize", function () {
				_this.resize(_this);
			});
		});
	
	};
	
	var touchSlider = {
		
		init : function () {
			var _this = this;
			this._list_parent.css({
				"width":this._width + "px",
				"height":this._height + "px",
				"overflow":"visible"
			});
			 this._list.show();
			 
			 console.log('this._width,this._view,this.opts.flexible',this._width,this._view,this.opts.flexible);
			 
			if(this.opts.flexible)this._item_w = this._width / this._view;//重新定义width
			//if(this.opts.roll) this._len = Math.ceil(this._len / this._view) * this._view;
			
			var page_gap = (this.opts.page > 1 && this.opts.page <= this._len) ? (this.opts.page - 1) * this._item_w : 0;
			var $posi=0;
			this._list_w=0;
			for(var i=0; i<this._len; ++i) {
				var $listiwidth=this.opts.flexible?this._item_w:parseInt(this._list.eq(i).css("width"));//如果是自适应，则重新定义每个单元的width
				
				this._list_w +=$listiwidth;//计算横幅总长度
				
				console.log('i,this._len,this._list_w,this._item_w,$listiwidth',i,this._len,this._list_w,this._item_w,$listiwidth);
				//$listiwidth=this._item_w;
				
				//this._pos[i] = this._item_w * i - page_gap;
				this._pos[i]=$posi;
				this._start[i] = this._pos[i];
				this._list.eq(i).css({
					"float" : "none",
					"display" : "block",
					"position" : "absolute",
					"top" : "0",
					"left" : this._pos[i] + "px",
					"width" : $listiwidth + "px",
					"height":this._height + "px",
				});
				if(this.opts.supportsCssTransitions && this.opts.transition) {
					this._list.eq(i).css({
						"-moz-transition" : "0ms",
						"-moz-transform" : "",
						"-ms-transition" : "0ms",
						"-ms-transform" : "",
						"-webkit-transition" : "0ms",
						"-webkit-transform" : "",
						"transition" : "0ms",
						"transform" : ""
					});
				}
				$posi+=$listiwidth;
			}
			
			console.log('this._list_w',this._list_w);
			
			
			
			if(this.opts.btn_prev && this.opts.btn_next) {
				this.opts.btn_prev.bind("click", function() {
					_this.animate(1, true);
					return false;
				});
				this.opts.btn_next.bind("click", function() {
					_this.animate(-1, true);
					return false;
				});
			}

						
			if (this.opts.paging) {
				
				$(this._list).each(function(i, el) {
					// var btn_page = _this.opts.paging.eq(0).clone();
					var btn_page = _this.opts.paging.eq(i);
					// _this.opts.paging.before(btn_page);

					btn_page.bind("click", function(e) {
						_this.go_page(i, e);
						return false;
					});
				});
              if(this._width>this._list_w)
				   this.opts.paging.remove();
			}

			if (this._auto) {
				this._timer = setInterval(function() {
					_this.animate(-1, true);
				}, _this._delay + _this._speed);

				//console.log('_this.timer',this._timer);
				$(this).bind("touchstart mouseover", function() {
					clearInterval(_this._timer);
					_this._timer=false;
					//console.log('clearInterval_this.timer',_this._timer);
					_this.drag = true;
				}).bind("touchend mouseout", function() {
					if(!_this._timer){
					_this._timer = setInterval(function() {
						_this.animate(-1, true);
					}, _this._delay + _this._speed);
					//console.log('setInterval_this.timer',_this._timer);
					}
				});	
			}	
			//this.counter();
			this.initComplete();
			
			
		},
		
		initComplete : function () {
			if(typeof(this.opts.initComplete) == "function") {
				this.opts.initComplete(this);
			}
		},
		
		resize : function (e) {
			if(e.opts.flexible) {
				var tmp_w = e._item_w;
				
				e._width = parseInt(e._tg.css("width"));
				e._item_w = e._width / e._view;
				e._range = e.opts.range * e._width;
				
				
				if(this.opts.hrw)
					e._height = e._width*e.opts.hrw;	
					else
					e._height = parseInt(e._list.css("height"));	
				
				for(var i=0; i<e._len; ++i) {
					e._pos[i] = e._pos[i] / tmp_w * e._item_w;
					e._start[i] = e._start[i] / tmp_w * e._item_w;
					e._list.eq(i).css({
						"left" : e._pos[i] + "px",
						"width" : e._item_w + "px",
						"height":e._height + "px"
					});
					if(this.opts.supportsCssTransitions && this.opts.transition) {
						e._list.eq(i).css({
							"-moz-transition" : "0ms",
							"-moz-transform" : "",
							"-ms-transition" : "0ms",
							"-ms-transform" : "",
							"-webkit-transition" : "0ms",
							"-webkit-transform" : "",
							"transition" : "0ms",
							"transform" : ""
						});
					}
				}
			}
			
			this.counter();
		},
		
		touchstart : function (e) { 
			if((e.type == "touchstart" && e.originalEvent.touches.length <= 1) || e.type == "dragstart") {
				this._startX = e.pageX || e.originalEvent.touches[0].pageX;
				this._startY = e.pageY || e.originalEvent.touches[0].pageY;
				this._scroll = false;
				
				this._start = [];
				for(var i=0; i<this._len; ++i) {
					this._start[i] = this._pos[i];
				}
			}
		},
		
		touchmove : function (e) { 
			if((e.type == "touchmove" && e.originalEvent.touches.length <= 1) || e.type == "drag") {
				this._left = (e.pageX || e.originalEvent.touches[0].pageX) - this._startX;
				this._top = (e.pageY || e.originalEvent.touches[0].pageY) - this._startY;
				var w = this._left < 0 ? this._left * -1 : this._left;
				var h = this._top < 0 ? this._top * -1 : this._top;
				
				if (w < h || this._scroll) {
					this._left = 0;
					this._drag = false;
					this._scroll = true;
				} else {
					e.preventDefault();
					this._drag = true;
					this._scroll = false;
					this.position(e);
				}
				
				for(var i=0; i<this._len; ++i) {
					var tmp = this._start[i] + this._left;
					
					if(this.opts.supportsCssTransitions && this.opts.transition) {
						var trans = "translate3d(" + tmp + "px,0,0)";
						this._list.eq(i).css({
							"left" : "",
							"-moz-transition" : "0ms",
							"-moz-transform" : trans,
							"-ms-transition" : "0ms",
							"-ms-transform" : trans,
							"-webkit-transition" : "0ms",
							"-webkit-transform" : trans,
							"transition" : "0ms",
							"transform" : trans
						});
					} else {
						this._list.eq(i).css("left", tmp + "px");
					}
					
					this._pos[i] = tmp;
				}
			}
		},
		
		touchend : function (e) {
			if((e.type == "touchend" && e.originalEvent.touches.length <= 1) || e.type == "dragend") {
				if(this._scroll) {
					this._drag = false;
					this._scroll = false;
					return false;
				}
				
				this.animate(this.direction());
				this._drag = false;
				this._scroll = false;
			}
		},
		
		position : function (d) { 
			
			//var gap = this._view * this._item_w;
			//console.log('position this._list_w this._item_w',this._list_w,this._item_w);
			if(this._list_w<=this._item_w) return;
			
			var gap = parseInt(this._list.eq(this._index).css("width"));
			
			
			if(d == -1 || d == 1) {
				this._startX = 0;
				this._start = [];
				for(var i=0; i<this._len; ++i) {
					this._start[i] = this._pos[i];
				}
				this._left = d * gap;
					
			} else {
				if(this._left > gap) {
					this._left = gap;
				}
				if(this._left < - gap) {
					this._left = - gap;
					}
			}
			
			if(this.opts.roll) {//如果循环
				var tmp_pos = [];
				for(var i=0; i<this._len; ++i) {
					tmp_pos[i] = this._pos[i];
				}
				
				tmp_pos.sort(function(a,b){return a-b;});

				var max_chk = this._len-1;
				//console.log('position tmp_pos',tmp_pos);

				var p_min = $.inArray(tmp_pos[0], this._pos);//最左边的
				var p_max = $.inArray(tmp_pos[max_chk], this._pos);//最右边的

				//console.log('p_min,p_max',p_min,p_max);
				
				if(this._view <= 1) max_chk = this._len - 1;
				if(this.opts.multi) {
					if((d == 1 && tmp_pos[0] >= 0) || (this._drag && tmp_pos[0] >= 100)) {//向右移动
						for(var i=0; i<this._view; ++i, ++p_max) {
							this._start[p_max] = this._start[p_min] - gap;
							p_min=p_max;
							this._list.eq(p_max).css("left", this._start[p_max] + "px");
						}
					} else if((d == -1 && tmp_pos[0] <= 0) || (this._drag && tmp_pos[0] <= -100)) {
						for(var i=0; i<this._view; ++i, ++p_min) {
							this._start[p_min] = this._start[p_max] + gap;
							p_max=p_min;
							this._list.eq(p_min).css("left", this._start[p_min] + "px");
						}
					}
				} else {

					if((d == 1 && tmp_pos[0] >= 0) || (this._drag && tmp_pos[0] > 0)) {
						
						//console.log('this._start1,d',this._start,d);
						
						//for(var i=0; i<this._view; ++i, --p_max) {
							this._start[p_max] = this._start[p_min] - parseInt(this._list.eq(p_min).css("width"));
							p_min=p_max;
							this._list.eq(p_max).css("left", this._start[p_max] + "px");
						//}
					} else if((d == -1 && tmp_pos[max_chk] <= 0) || (this._drag && tmp_pos[p_max] <=(this._width- parseInt(this._list.eq(p_max).css("width"))))) {
						
						//console.log('this._start-1,d',this._start,tmp_pos[p_max]);
						
						//for(var i=0; i<this._view; ++i, ++p_min) {
							//console.log('p_max p_min',p_max,p_min);
							this._start[p_min] = this._start[p_max] + parseInt(this._list.eq(p_max).css("width"));
							p_max=p_min;
							this._list.eq(p_min).css("left", this._start[p_min] + "px");
						//}
						
					}
					//console.log('tmp_pos[p_max] <=(this._width- this._list.eq(p_max).css("width"))',tmp_pos[p_max],this._width, this._list.eq(p_max).css("width"));
					//console.log('this._start_end,d',this._start,tmp_pos[max_chk],max_chk);
				}
			} else {
				if(this.limit_chk()) this._left = this._left / 2;
			}
		},
		
		animate : function (d, btn_click) {

			
			
			if(this._drag || !this._scroll || btn_click) {
				var _this = this;
				var speed = this._speed;
				
				if(btn_click) this.position(d);
				
				//var gap = d * (this._item_w * this._view);

				var gap =0;
			if(this._list_w>this._width){//如果总宽度大于可见宽度 则计算偏移
				if (!isNaN(d)) {
					if (d < 0) {
						gap =-parseInt(this._list.eq(this._index).css("width"));
						this._index -= d;
						if (this._index > this._len - 1)
							{
						    	this._index   =  0;
							}
					} else if (d > 0) {
						this._index -= d;
						if (this._index < 0)
							{
							this._index = this._len - 1;

							}
						 gap =parseInt(this._list.eq(this._index).css("width")); 
					} else {
						gap = 0;
					}

				} else {
					return false;
				}
				 }
				if(this._left == 0||this._len==1 || (!this.opts.roll && this.limit_chk()) ) gap = 0;
				
				this._list.each(function (i, el) {
					_this._pos[i] = _this._start[i] + gap;

					if(_this.opts.supportsCssTransitions && _this.opts.transition) {
						var transition = speed + "ms";
						
						var transform = "translate3d(" + _this._pos[i] + "px,0,0)";
						
						if(btn_click) transition = "0ms";
						
						$(this).css({
							"left" : "",
							"-moz-transition" : transition,
							"-moz-transform" : transform,
							"-ms-transition" : transition,
							"-ms-transform" : transform,
							"-webkit-transition" : transition,
							"-webkit-transform" : transform,
							"transition" : transition,
							"transform" : transform
						});
					} else {
						$(this).stop();
						//console.log('_this._pos',_this._pos);
						$(this).animate({"left": _this._pos[i] + "px"}, speed);
					}
				});			
				
	
				this.counter();
			}
		},
		
		direction : function () { 
			var r = 0;
		
			if(this._left < -(this._range)) r = -1;
			else if(this._left > this._range) r = 1;
			
			if(!this._drag || this._scroll) r = 0;
			
			return r;
		},
		
		limit_chk : function () {
			var last_p = parseInt((this._len - 1) / this._view) * this._view;
			return ( (this._start[0] == 0 && this._left > 0) || (this._start[last_p] == 0 && this._left < 0) );
		},
		
		go_page : function (i, e) {
			//var crt = ($.inArray(0, this._pos) / this._view) + 1;
			
			var crt =this._index;
			var cal = crt - (i + 1);
			
			while(cal != 0) {
				if(cal < 0) {
					this.animate(-1, true);
					cal++;
				} else if(cal > 0) {
					this.animate(1, true);
					cal--;
				}
			}
		},
		
		counter : function () {
			if(typeof(this.opts.counter) == "function") {
				var param = {
					total : Math.ceil(this._len / this._view),
					current : this._index
				};
				this.opts.counter(param);
			}
		}
		
	};

})(jQuery);