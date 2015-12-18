/**
 * @file ${FILE_NAME}. Created by PhpStorm.
 * @desc ${FILE_NAME}.
 *
 * @author yangjunbao
 * @since 15/10/29 上午10:30
 * @version 1.0.0
 */

/**
 * 公共库定义
 *
 * 命名空间: window._
 *  全局变量:
 *     {Zepto}      _.$body             body元素
 *     {jQuery}      _.$navbar           底部导航tab
 *     {string}     _.touchEnd          触摸结束事件名
 *     {string}     _.cssAnimateEnd     css动画播放结束事件名
 *  方法列表:
 *      static  {void}      _.go({string|int} [url])        链接跳转
 *      static  {void}      _.search({string} word)         搜索跳转
 *      static  {void}      _.addCart({string} foodId, {Function} [callback]) 添加购物车
 *      constructor Overlay     _.Overlay({Object} options)     浮层
 *      static  Overlay     _.alert({Object} options)    警告浮屠
 *      static  Overlay     _.confirm({Object} options)  确认浮屠
 *
 * 扩展Zepto
 *      $.cssAnimateOnce({string} type, {Function} [callback])  执行单次动画
 *      $.tipsBox({string} content, {string} [type])            浮屠提示
 */
(function ($) {
    /**
     * 重构$.ajax, 如果需要验证, 强制跳转
     */
    var ajax = $.ajax;
    $.ajax = function (settings) {
        settings = settings || {};
        var fn = settings.error;
        settings.error = function (xhr, errorType, error) {
            if (xhr.status === 401) {
                _.go('/login');
            } else {
                fn && fn.call(settings.context, xhr, errorType, error);
            }
        };
        ajax.call($, settings);
    };

    /**
     * @type {Object}
     *
     * the namespace for global library
     */
    window._ = window._ || {}; 

    /**
 *
     * @param {string} names
     * @param {string} [pr]
     * @param {{}} [obj]
     *
     * @returns {string}
     */
    _.fixedAttr = function (names, pr, obj) {
        obj = obj || window;
        var attrs = names.split(' '),
            i = 0;
        for (; i < attrs.length; i++) {
            if (obj.hasOwnProperty(pr + attrs[i])) {
                return attrs[i];
            }
        }
        return attrs[0];
    };
    _.fixedCssName = (function () {
        var mod = $('<div/>').css({display: 'none'}).appendTo($(document.body)).get(0).style,
            prs = ['', 'webkit', 'moz', 'ms', 'o', 'Webkit', 'Moz', 'Ms', 'O'],
            cachedNames = {};
        return function (name) {
            var i,
                upper;
            if (cachedNames[name]) {
                return cachedNames[name];
            }
            upper = name[0].toUpperCase() + name.substr(1);
            for (i in prs) {
                if (prs.hasOwnProperty(i)) {
                    if (mod.hasOwnProperty(prs[i] + name)) {
                        cachedNames[name] = prs[i] + name;
                        return prs[i] + name;
                    } else if (mod.hasOwnProperty(prs[i] + upper)) {
                        cachedNames[name] = prs[i] + upper;
                        return prs[i] + upper;
                    }
                }
            }
        }
    })();
    /**
     * 全局变量
     */
    _.$body = $(document.body);
    _.$header = $('#header');
    _.$navbar = $('#navbar');
    _.touchStart = 'touchstart MSPointerDown pointerdown';
    _.touchMove = 'touchmove MSPointerMove pointermove';
    _.touchEnd = 'touchend MSPointerUp pointerup';
    _.onClick='click';
    _.cssAnimateEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

    /**
     * 链接跳转
     *
     * @param {string|int} [url]
     *
     * redirect to the url
     *      if url is int, use history.go(url)
     *      else use location.href=url
     *
     *      the default value is -1, (go back)
     */
    _.go = function (url) {
        if (url === undefined) {
            url = -1;
        }
        if (typeof url === 'number') {
            history.go(url);
        } else {
            location.href = url;
        }
    };

    /**
     * 搜索接口
     *
     * @param {string} word
     *
     * TODO: finish this by RD give relative api
     */
    _.search = function (word) {
        location.href = '/search?wd=' + word;
    };

    /**
     * 添加购物车
     */
    _.addCart = function (foodId,code, num, callback) {
    	$.post('index.php?route=checkout/cart/update', {
            product_id: foodId,
            promotion_code:code,
            quantity: num
        }, function (json) {
              if (json['redirect']) {
				location = json['redirect'];
			  }
        
            if (json['success']) { // success
                var $dom = _.$navbar.find('.cart-num');
                $dom.html(+$dom.html() + parseInt(num)).cssAnimateOnce('pulse fast');
                callback && callback();
            }
        },'json');
    };

    /**
     * 点赞
     */

    _.addFollow = function (foodId, callback){
        console.log(foodId);
    	$.ajax({
    		url: 'index.php?route=product/home/follow&product_id=' + foodId,
    		dataType: 'json',
    		success: function(data) {
    			console.log(data);
    			if(data['status']=='1'){
    				location.href="index.php?route=account/account";
    			}else if(data['status']=='2'){

    				 callback && callback();
	
    			}else{
    				alert(data['info']);
    			}
    		}
    	});
    	};
    
    
    /**
     * 弹层
     *      content水平垂直居中
     *
     * TODO ios弹层调起输入法BUG
     * TODO Firefox|WindowsPhone|Opera适配
     *
     * popup overlay constructor
     * use: overlay = new _.Overlay({
     *      content: 'some content'
     *  });
     *
     *  overlay.show()
     *      .hide()
     *      .on()
     *      .off()
     *      .destroy()
     */
    _.Overlay = (function () {
        /**
         * 浮层，居中显示
         * @constructor
         * @alias module:overlay
         * @param {Object} [option]
         * @param {string|HTMLElement|Zepto} [option.content] 内容
         * @param {boolean} [option.destroyOnMaskClicked] 点击遮罩层时是否销毁实例
         */
        var Overlay = function (option) {
            option = $.extend({
                content: '',
                hasMask: true,
                destroyOnMaskClicked: false,
                hide: false,
                className: ''
            }, option);
            this._overlay = $('<div class="overlay-content"></div>');
            var contentContainer = $('<div class="overlay-content-container"></div>');
            this._container = $('<div class="overlay-container"></div>');
            // 阻止滚动
            if (option.hasMask) {
                this._container.on(_.touchMove, function (e) {
                    e.preventDefault();
                });
                if (option.destroyOnMaskClicked) {
                    //点击遮罩层destroy实例
                    this._container.on(_.touchEnd, $.bind(function (e) {
                        if (e.target.className.indexOf('overlay-container') > -1) {
                            this.destroy();
                        }
                    }, this));
                }
            } else {
                this._container.addClass('unmasked');
            }
            if (option.className) {
                this._container.addClass(option.className);
            }
            this.content(option.content);
            this._container.append(contentContainer.append(this._overlay)).appendTo(document.body);
            if (option.hide) {
                this._status = 0;
                this._container.hide();
            } else {
                this.show();
            }
        };
        Overlay.prototype = {
            /**
             *
             * @returns {_.Overlay}
             */
            show: function () {
                this._status = 1;
                this._container.show().cssAnimateOnce('fadeIn ffast');
                return this;
            },
            /**
             *
             * @returns {_.Overlay}
             */
            hide: function () {
                this._status = 0;
                this._container.cssAnimateOnce('fadeOut ffast', function () {
                    $(this).hide();
                });
                return this;
            },
            /**
             *
             */
            destroy: function () {
                this._status === 0
                    ? this._container.remove()
                    : this._container.cssAnimateOnce('fadeOut ffast', function () {
                    $(this).remove();
                });
            },
            on: function () {
                $.fn.on.apply(this._overlay, arguments);
                return this;
            },
            off: function () {
                $.fn.off.apply(this._overlay, arguments);
                return this;
            },
            content: function (content) {
                if (content === null) {
                    return this._overlay.children();
                } else {
                    this._overlay.html(content);
                    return this;
                }
            }
        };
        return Overlay;
    })();

    /**
     * 警告浮屠
     *
     * @param {*} options
     * @param {Function} [callback]
     * @param {string} [btnText]
     * @returns {_.Overlay}
     */
    _.alert = function (options, callback, btnText) {
        var o = {
            btnText: '好的',
            content: '',
            callback: null
        };
        if (typeof options === 'string') {
            options = {content: options};
            if (callback)options.callback = callback;
            if (btnText) options.btnText = btnText;
        }
        options = $.extend(o, options);
        var overlay = new _.Overlay({
            className: 'overlay-alert',
            content: '<div class="overlay-alert-content">' + options.content + '</div><div class="overlay-alert-btn">' + options.btnText + '</div>'
        });
        overlay.on('click', '.overlay-alert-btn', function () {
            overlay.destroy();
            options.callback && options.callback();
        });
        return overlay;
    };

    /**
     *
     * @param {*} options
     * @param {Function} confirmCallback
     * @param {Function} cancelCallback
     * @param {string} confirmText
     * @param {string} cancelText
     * @returns {_.Overlay}
     */
    _.confirm = function (options, confirmCallback, cancelCallback, confirmText, cancelText) {
        var o = $.extend({
            content: '',
            confirmText: '确定',
            cancelText: '取消',
            cancelCallback: null,
            confirmCallback: null
        });
        if (typeof options === 'string') {
            options = {content: options};
            if (confirmCallback) options.confirmCallback = confirmCallback;
            if (cancelCallback) options.cancelCallback = cancelCallback;
            if (confirmText) options.confirmText = confirmText;
            if (cancelText) options.cancelText = cancelText;
        }
        options = $.extend(o, options);
        var content = '<div class="overlay-confirm-content">' + options.content + '</div>'
            + '<div class="overlay-confirm-btn"><span class="confirm-cancel">'
            + options.cancelText + '</span><span class="confirm-confirm">'
            + options.confirmText + '</span></div>';
        var overlay = new _.Overlay({
            content: content,
            className: 'overlay-confirm'
        });
        overlay.on('click', '.confirm-cancel', function () {
            overlay.destroy();
            options.cancelCallback && options.cancelCallback();
        }).on('click', '.confirm-confirm', function () {
            overlay.destroy();
            options.confirmCallback && options.confirmCallback();
        });
        return overlay;
    };

    /**
     * Toast弱提示浮屠
     * @param {string} content
     * @param {int} duration
     * @param {string} [icon]
     */
    _.toast = function (content, duration, icon) {
        var temp = '';
            
        if (icon) {
            temp += '<div class="toast-icon-wrapper"><i class="icon ' + icon + '"></i></div>';
        }
        temp += '<div class="toast-content">' + content + '</div>';
        var overlay = new _.Overlay({
            className: 'overlay-toast',
            content: temp,
            hasMask: false
        });
        overlay.on('click', '.toast-content', function () {
            overlay.destroy();
        });
        if(duration){
        setTimeout(function () {
            overlay.destroy();
        }, duration);
        }
        else
        {
        	return overlay;
        }
        
    };

    _.location = (function () {
        var searchCache = null;
        return {
            /**
             * 获取查询字符串
             * @param {string} [name] 按名称获取, 默认返回全部
             * @param {boolean|string} [allOrDefault] 如果为true, 返回此名称下的所有查询, 为数组或undefined, 否则返回
             *                      此字段下的首个值m, 如果!!allOrDefault===true, 则在!!m===false时返回此值, 否则返回
             *                      空字符串
             * @returns {undefined|string|[]}
             */
            search: function (name, allOrDefault) {
                if (searchCache === null) {
                    searchCache = {};
                    location.search.substr(1).split('&').forEach(function (query) {
                        if (query) {
                            query = query.split('=');
                            if (query[0]) {
                                if (!searchCache[query[0]]) {
                                    searchCache[query[0]] = [];
                                }
                                searchCache[query[0]].push(query[1] || '');
                            }
                        }
                    })
                }
                return name ?
                    (allOrDefault === true
                        ? searchCache[name]
                        : (searchCache[name] ? searchCache[name][0] : (allOrDefault || '')))
                    : searchCache;
            }
        }
    })();

    _.lpad = function (ori, len, char) {
        var str = String(ori),
            i,
            max = '';
        l = str.length;
        len = len || 2;
        char = char || '0';
        for (i = 0; i < len; i += char.length) {
            max += char;
        }
        return max.substr(0, len - l) + str;
    };

    _.formatTime = function (t, f) {
        var floor = Math.floor,
            size,
            i,
            char,
            next,
            out,
            oneDay = 24 * 3600e3,
            oneHour = 3600e3,
            oneMinute = 60e3,
            oneSecond = 1e3,
            day = floor(t / oneDay),
            hour = floor((t % oneDay) / oneHour),
            minute = floor((t % oneHour) / oneMinute),
            second = floor((t % oneMinute) / oneSecond),
            microSecond = t % oneSecond;
        return f.replace(/[\\a-z{}]+/g, function (format) {
            size = format.length;
            out = '';
            chkchar='';
            key=false;
            for (i = 0; i < size; i++) {
                char = format[i];
                if (char == '{') {
                	key=true;
                	chkchar='';
                	continue;
                }
                
                if(key){
                	 if (char == '}') {
                     	key=false;
                     }
                	 else{
                	 chkchar+=char;
                	 continue;
                	 }
                }
                else
                {
                	 out += char;
                	 continue;
                } 
               
                switch (chkchar) {
                    case 'd':
                        out += day;
                        break;
                    case 'dd':
                        out += _.lpad(day);
                        break;
                    case 'h':
                        out += hour;
                        break;
                    case 'hh':
                        out += _.lpad(hour);
                        break;
                    case 'm':
                        out += minute;
                        break;
                    case 'mm':
                        out += _.lpad(minute);
                        break;
                    case 's':
                        out += second;
                        break;
                    case 'ss':
                        out += _.lpad(second);
                        break;
                    case 'i':
                    case 'ii':
                        out += microSecond;
                        break;
                    default :
                        out += format;
                }
            }
            return out;
        });
    };
    /**
     * 滚动选择组件
     */
    _.Scroller = (function () {
        var config = {
                columns: [{
                    id: '',
                    items: []
                }],
                defaultValue: [],
                upperLine: 2,
                downLine: 2,
                hide: true,
                showFocusBorder: true,
                onChange: null,
                title: '',
                confirmText: '确定',
                confirmCallback: null,
                cancelText: '取消',
                cancelCallback: null,
                position: 'bottom',
                speedUnit: 0.002,
                timeUnit: 0.005
            },
            unitHeight = 30,
            mod = $('<div/>').css({display: 'none'}).appendTo($(document.body)).get(0).style,
            fixedCssName = function (name) {
                var prs = ['', 'webkit', 'moz', 'ms', 'o', 'Webkit', 'Moz', 'Ms', 'O'],
                    i,
                    upper = name[0].toUpperCase() + name.substr(1);
                for (i in prs) {
                    if (prs.hasOwnProperty(i)) {
                        if (mod.hasOwnProperty(prs[i] + name)) {
                            return prs[i] + name;
                        } else if (mod.hasOwnProperty(prs[i] + upper)) {
                            return prs[i] + upper;
                        }
                    }
                }
            };

        /**
         * @param options
         * @constructor
         *
         * @param {{}}          options  各项配置
         * @param {{}}          options.columns  各列
         * @param {string}      options.columns[id][key].label 列展示值
         * @param {boolean}     options.columns[id][key].disabled 是否禁止选择
         * @param {string}      options.lineHeight 行高
         * @param {int}         options.fontSize 字体大小
         * @param {boolean}     options.showFocusBorder 中部行border
         * @param {Function}    options.onChange 滚动后回调
         * @param {string}      options.confirmText 确定按钮
         * @param {Function}    options.confirmCallback 确定回调
         * @param {string}      options.cancelText 取消按钮
         * @param {Function}    options.cancelCallback 取消回调
         * @param {string}      options.position    位置: 'center': 居中, 'bottom': 底部
         */
        function Scroller(options) {
            var i,
                j,
                column,
                item,
                disabled,
                columnHtml = '',
                overlay,
                status = {
                    scrolling: false,
                    startTime: 0,
                    startPos: {x: 0, y: 0},
                    prevPos: {x: 0, y: 0}
                },
                values = [],
                that = this,
                $content = $('<div/>').addClass('scroller-content'),
                $buttons = $('<div/>').addClass('scroller-buttons clearfix'),
                $columns = $('<div/>').addClass('scroller-columns');
            options = $.extend({}, config, options);
            for (i in options.columns) {
                if (options.columns.hasOwnProperty(i)) {
                    column = options.columns[i];
                    columnHtml += '<div class="scroller-column scroller-column-' + column.id +
                    '"><div class="scroller-hover upper"></div><div class="scroller-hover down"></div><div class="scroller-column-items">';
                    for (j in column.items) {
                        if (column.items.hasOwnProperty(j)) {
                            item = column.items[j];
                            options.defaultValue[i] = options.defaultValue[i] || item.value;
                            disabled = item.disabled ? ' disabled' : '';
                            // disabled += j == 2 ? ' col-red' : '';
                            columnHtml += '<div class="scroller-item' + disabled + '">' + item.label + '</div>';
                        }
                    }
                    columnHtml += '</div></div>';
                }
            }
            $buttons.append($('<div/>').addClass('pull-left scroller-cancel').html(options.cancelText))
                .append($('<div/>').addClass('pull-right scroller-confirm').html(options.confirmText));
            $buttons.append($('<div/>').addClass('scroller-title text-center').html(options.title));
            $columns.html(columnHtml);
            if (options.showFocusBorder) {
                $columns.append('<div class="scroller-focus-border"></div>');
            }
            $content.append($buttons).append($columns);
            overlay = new _.Overlay({
                content: $content,
                hide: options.hide,
                className: 'overlay-scroller ' + options.position
            });
            overlay.on(_.touchStart, '.scroller-column', function (e) {
                var $this = $(this),
                    $items = $this.find('.scroller-column-items');
                e.preventDefault();
                if (status.scrolling) return;
                status.startTime = +new Date;
                status.startPos = $.eventPos(e);
                status.prevPos = $.eventPos(e);
                $items.find('.col-red').removeClass('col-red');
            }).on(_.touchMove, '.scroller-column', function (e) {
                e.preventDefault();
                var prevY = status.prevPos.y,
                    $this = $(this),
                    pos = $.eventPos(e),
                    $items = $this.find('.scroller-column-items'),
                    top = parseInt($items.css('top'), 10);
                if (prevY) {
                    $items.css({
                        top: top + pos.y - prevY
                    });
                }
                status.prevPos = pos;
            }).on(_.touchEnd, '.scroller-column', function (e) {
                e.preventDefault();
                var time = +new Date,
                    pos = $.eventPos(e),
                    $this = $(this),
                    dur = time - status.startTime,
                    delta = pos.y - status.startPos.y,
                    $items = $this.find('.scroller-column-items'),
                    top = parseInt($items.css('top'), 10),
                    finalTop = top,
                    closet,
                    $item,
                    transTime = 0.1,
                    speed = delta / dur;
                if (dur > 300 || Math.abs(delta) < 10) {
                    finishScroll($this);
                } else {
                    finalTop = speed * Math.abs(speed) / options.speedUnit;
                    closet = closestItem($this, finalTop + top);
                    finalTop = (-closet[0] + 2) * unitHeight;
                    $item = finalTop[1];
                    transTime = Math.abs(finalTop - top) * options.timeUnit;
                    transTime = Math.min(transTime, 1);
                    $items.css(fixedCssName('transition'), 'all ' + transTime + 's ease-out');
                    $items.css('top', finalTop + 'px');
                    setTimeout(function () {
                        finishScroll($this);
                    }, transTime * 1e3);
                }
            }).on(_.touchEnd, '.scroller-confirm', function () {
                var values = [],
                    index,
                    $column,
                    $this;
                overlay._overlay.find('.scroller-item.col-red').each(function () {
                    $this = $(this);
                    index = $this.index();
                    $column = $this.closest('.scroller-column');
                    values.push(options.columns[$column.index()].items[index].value);
                });
                overlay.hide();
                options.confirmCallback && options.confirmCallback(values);
            }).on(_.touchEnd, '.scroller-cancel', function () {
                overlay.hide();
                options.cancelCallback && options.cancelCallback();
            });

            function closestItem($column, top) {
                var index = $column.index(),
                    $items = $column.find('.scroller-column-items'),
                    items = options.columns[index].items,
                    total = items.length,
                    pos = Math.round((unitHeight * 2 - top) / unitHeight),
                    i,
                    itemIndex = 0,
                    $item;
                if (pos < 0) pos = 0;
                if (pos >= total) pos = total - 1;
                for (i = 0; i < total; i++) {
                    if (pos + i < total && !items[pos + i].disabled) {
                        itemIndex = pos + i;
                        break;
                    }
                    if (pos - i >= 0 && !items[pos - i].disabled) {
                        itemIndex = pos - i;
                        break;
                    }
                }
                $item = $items.find('.scroller-item:nth-child(' + (itemIndex + 1) + ')');
                return [itemIndex, $item]
            }

            function finishScroll($column, repos) {
                var index = $column.index(),
                    $items = $column.find('.scroller-column-items'),
                    top = parseInt($items.css('top'), 10),
                    items = options.columns[index].items,
                    closest = closestItem($column, top),
                    itemIndex = closest[0],
                    $item = closest[1];
                $items.css(fixedCssName('transition'), 'all 0s ease-out');
                $items.css('top', ((-itemIndex + 2) * unitHeight) + 'px');
                $item.addClass('col-red').siblings('.col-red').removeClass('col-red');
                values[index] = items[index].value;
                options.onChange && options.onChange.call(that, options.columns[index].id, items[itemIndex].value, index, itemIndex);
            }

            this._content = overlay;
            this._options = options;
            this.closestItem = closestItem;
            this.finishScroll = finishScroll;
            this.init();
            this.values = function () {
                return values;
            };
        }

        Scroller.prototype = {
            init: function () {
                var that = this,
                    $item,
                    top,
                    $column;
                this._content._overlay.find('.scroller-column').each(function () {
                    $column = $(this);
                    $item = $column.find('.scroller-item:not(.disabled)').eq(0).addClass('col-red');
                    top = (2 - $item.index())*unitHeight;
                    $column.find('.scroller-column-items').css('top', top + 'px')
                });
            },
            // 禁用某些值, 只发生在其它列值可用的情况下
            // 所以不用考虑重新定位问题
            disable: function (column, indexes) {
                var $column = this._content._overlay.find('.scroller-column:nth-child(' + (column + 1) + ')'),
                    $items = $column.find('.scroller-column-items'),
                    closest,
                    i,
                    top = parseInt($items.css('top'), 10);
                indexes = Array.isArray(indexes) ? indexes : [indexes];
                for (i = 0; i < indexes.length; i++) {
                    this._options.columns[column].items[indexes[i]].disabled = true;
                    $items.find('.scroller-item:nth-child(' + (indexes[i] + 1) + ')').addClass('disabled');
                }
                return this;
            },
            enable: function (column, indexes) {
                var $column = this._content._overlay.find('.scroller-column:nth-child(' + (column + 1) + ')'),
                    $items = $column.find('.scroller-column-items'),
                    i;
                indexes = Array.isArray(indexes) ? indexes : [indexes];
                for (i = 0; i < indexes.length; i++) {
                    this._options.columns[column].items[indexes[i]].disabled = false;
                    $items.find('.scroller-item:nth-child(' + (indexes[i] + 1) + ')').removeClass('disabled');
                }
                return this;
            },
            show: function () {
                this._content.show()
            },
            hide: function () {
                this._content.hide()
            }
        };
        return Scroller;
    })()
})(jQuery);

(function ($) {
    /**
     *
     * @param {string} type
     * @param {Function} [callback]
     * @returns {$.fn}
     */
    $.fn.cssAnimateOnce = function (type, callback) {
        this.each(function () {
            $(this).addClass('animated ' + type).one(_.cssAnimateEnd, function () {
                $(this).removeClass('animated ' + type);
                callback && callback.call(this);
            });
        });
        return this;
    };

    /**
     *
     * @param {string} content
     * @param {string} [type]
     * @returns {$.fn}
     */
    $.fn.tipsBox = function (content, type) {
        type = type || 'zoomOutUp';
        this.each(function () {
            var $this = $(this),
                pos = $this.offset(),
                width = $this.width();
            $(content).appendTo(_.$body).css({
                position: 'absolute',
                top: pos.top - 15,
                left: pos.left + width / 2
            }).cssAnimateOnce(type, function () {
                $(this).remove();
            });
        });
        return this;
    };

    $.fn.forceShow = function () {
        this.removeClass('force-hidden');
    };
    $.fn.forceHide = function () {
        this.addClass('force-hidden');
    };
    $.fn.countDown = function (format,callback,pick,sp) {

    	 var now = +new Date(),
        $this = this,
        returntype=0,
        pick = pick || 900,stopPoint=0;
        $this.startTime = $this.startTime||+$this.data('start-time');
        $this.endTime = $this.endTime||+$this.data('end-time');
    	 
        $this.format=$this.format||format;
        
        if($this.startTime >=now){

        	returntype=1;
        	stopPoint=$this.startTime;

        }
        else if($this.endTime >now)
        {   returntype=2;
        	stopPoint=$this.endTime;
        }
        else if(sp>now)
        {
        	stopPoint=sp;
        }else
        	{
        	  $this.html(_.formatTime(0,$this.format));
      	      callback && callback($this,returntype);
      	    return returntype;
        	
        	}
        
        (function () {
            var now = +new Date(),
                remain = stopPoint - now;
            
              
            if (remain >= 0) {
            	//console.log('_.formatTime(remain,format)',_.formatTime(remain,$this.format),remain);
            	
                   $this.html(_.formatTime(remain,$this.format));
                   setTimeout(arguments.callee, pick);
            } else {
                callback && callback($this,returntype);
            }
        })();
        
    };

    $.eventPos = function (e) {
        var owner = e.touches[0] ? e.touches[0]
            : (e.targetTouches[0] ? e.targetTouches[0]
            : (e.changedTouches[0] ? e.changedTouches[0] : e));
        return {
            x: owner.pageX,
            y: owner.pageY
        };
    };

    /**
     * 平滑滚动
     *
     * @param {int} len 要滚动的距离, 为正向下/右, 为负向上/左
     * @param {int} speed 滚动速度(时间)
     * @param {string} dir 滚动方向, 'X'或'Y', 水平或者垂直
     * @param {Function} callback 回调函数
     * @returns {$.fn}
     */
    $.fn.smoothScroll = function (len, speed, dir, callback) {
        var name,
            value,
            $parent = this.parent(),
            $this = this;
        dir = dir || 'Y';
        speed = typeof speed === 'number' ? speed : 400;
        name = dir === 'X' ? 'left' : 'top';
        value = parseInt(this.css(name), 10);
        $parent.css('position') === 'static' && ($parent.css('position', 'relative'));
        $parent.css({
            height: $parent.height() + 'px',
            width: $parent.width() + 'px'
        });
        if (this.css('position') === 'static') {
            this.css({
                top: 0,
                position: 'absolute',
                width: this.width() + 'px',
                height: this.height() + 'px'
            });
        }
        if (!value) {
            $this.css(name, '0px');
            value = 0;
        }
        this.css(_.fixedCssName('transition'), 'all ' + speed + 'ms ease-out');
        // why?
        setTimeout(function () {
            $this.css(name, (value + len) + 'px');
        }, 0);
        setTimeout(function () {
            callback && callback.call($this, value + len);
        }, speed);
        return this;
    };

    $.fn.smoothScrollTo = function (pos, speed, dir, callback) {
        var name,
            value,
            $parent = this.parent(),
            $this = this;
        dir = dir || 'Y';
        speed = typeof speed === 'number' ? speed : 400;
        name = dir === 'X' ? 'left' : 'top';
        $parent.css('position') === 'static' && ($parent.css('position', 'relative'));
        $parent.css({
            height: $parent.height() + 'px',
            width: $parent.width() + 'px'
        });
        if (this.css('position') === 'static') {
            this.css({
                top: 0,
                position: 'absolute',
                width: this.width() + 'px',
                height: this.height() + 'px'
            });
        }
        this.css(_.fixedCssName('transition'), 'all ' + speed + 'ms ease-out');
        // why?
        setTimeout(function () {
            $this.css(name, pos + 'px');
        }, 0);
        setTimeout(function () {
            callback && callback.call($this, pos);
        }, speed);
        return this;
    };

/**
     *
     * @param {Function} [callback]
     * @param {string} [dir]
     * @param {number} [speedUnit]
     * @param {number} [timeUnit]
     */
    $.fn.scroller = function (callback, dir, full, speedUnit, timeUnit) {
        dir = dir || 'Y';
        speedUnit = speedUnit || 0.003;
        timeUnit = timeUnit || 0.005;
        full = !!full;  // 是否允许父元素出现空, true允许完全滚动到父元素之外, false要求至少要将父元素填满
        var startTime = 0,
            startPos = {
                x: 0,
                y: 0
            },
            prevTime = 0,
            prevPos = {
                x: 0,
                y: 0
            },
            curTime = 0,
            curPos = {
                x: 0,
                y: 0
            },
            eDir = dir === 'X' ? 'x' : 'y',
            name = eDir === 'x' ? 'left' : 'top',
            value,
            len,
            delta,
            t,
            that = this,
            $parent = this.parent(),
            max = name === 'left' ? this.width() : this.height(),
            wrapperSize = name === 'left' ? $parent.width() : $parent.height(),
            offset,
            speed,
            transTime,
            transLen,
            min = Math.min,
            abs = Math.abs;
        max = full ? max : Math.max(0, max - wrapperSize);
        this.on(_.touchStart, function (e) {
            e.stopPropagation();
            startTime = +new Date;
            startPos = $.eventPos(e);
            prevTime = startTime;
            prevPos = $.eventPos(e);
        }).on(_.touchMove, function (e) {
            e.preventDefault();
            e.stopPropagation();
            curTime = +new Date;
            curPos = $.eventPos(e);
            that.smoothScroll(curPos[eDir] - prevPos[eDir], 0, dir);
            prevTime = curTime;
            prevPos = curPos;
        }).on(_.touchEnd, function (e) {
            e.stopPropagation();
            curTime = +new Date;
            curPos = $.eventPos(e);
            t = curTime - startTime;
            delta = curPos[eDir] - startPos[eDir];
            offset = that.position()[name];
            speed = delta / t;
            if (offset >= 0 || (max + offset < 0)) {
                transLen = offset >= 0 ? -offset : -(offset + max);
                that.smoothScroll(transLen, min(abs(transLen) + 50, 500), dir, callback);
            } else if (t > 300 || abs(delta) < 10) {
                callback && callback.call(that, offset);
            } else {
                transLen = speed * abs(speed) / speedUnit;
                transTime = abs(transLen) * timeUnit * 1e3;
                transLen = transLen + offset >= 0
                    ? -offset
                    : (transLen + offset + max < 0 ? -(offset + max) : transLen);
                that.smoothScroll(transLen, min(transTime, 500), dir, callback);
            }
        })
    };
    /**
     *
     * @param {string} dir  滚动方向 'x' 水平, 'y' 垂直
     * @param {int} vigor   力度
     * @param {int} step    步长(成倍滚动)
     * @param {int} speed   时间
     */
    $.fn.jsScroll = function (dir, vigor, step, speed) {
        var startTime = 0,
            startPos = {
                x: 0,
                y: 0
            },
            currentTime = 0,
            currentPos = {
                x: 0,
                y: 0
            },
            endTime = 0,
            endPos = {
                x: 0,
                y: 0
            };
        this.on(_.touchStart, function (e) {
            startTime = +new Date;
            startPos = $.eventPos(e);
        }).on(_.touchMove, function (e) {
            currentTime = +new Date;
            currentPos = $.eventPos(e);
        }).on(_.touchEnd, function (e) {
            endTime = +new Date;
            endPos = $.eventPos(e);
        })
    }
})(jQuery);


/**
 * 页面初始化
 *
 * 1. 所有.banner.banner-default类的元素进行轮播处理
 * 2. 键盘弹起时隐藏底部导航条
 * 3. 顶部搜索框处理
 * 4. 顶部消息按钮处理
 * 5. 添加到
 */
(function () {
    $(document).ready(function () {
        // banner module
        // TODO: add swipe support
      $.fn.unslider && $('.banner.banner-default').each(function () {
            var $this = $(this);
            $this.unslider({
                autoplay:!$this.hasClass('static'),
                speed: 500,
                delay: 3000,
                dots: !$this.hasClass('no-dot'),
                swipe: !$this.hasClass('no-swipe'),
                fluid: true
            });
        });
     
        

        // 输入框弹起
        _.$body.on('focus', 'input[type=text], input[type=number], input[type=password], textarea', function () {
            _.$navbar.hide();
        }).on('blur', 'input[type=text], input[type=number], input[type=password], textarea', function () {
            _.$navbar.show();
        });

        // header
        // search module
        var $searchInputWrapper = _.$header.find('.search-input').hide(),
            $searchInput = $searchInputWrapper.find('input'),
            status = 0;
        _.$header.find('.search').on('click', function () {
            if (status === 0) {
                $searchInputWrapper.show().siblings().hide();
                $searchInput.focus();
                status = 1;
            } else {
                $searchInputWrapper.hide().siblings().show();
                status = 0;
            }
        });
        $searchInput.on('keyup', function (e) {
            if (e.keyCode === 13) {
                _.search(this.value);
            }
        });
        // message, TODO
        _.$header.find('.message').on(_.touchEnd, function () {

        });

        // add cart
 /*       _.$body.on(_.touchEnd, '.btn-add-cart', function () {
            var $this = $(this);
            _.addCart($this.data('id'),$this.data('code'),1, function () {
                $this.tipsBox('<span class="col-red fz-14 bold">+1</span>');
            });
        });
  */
        $('.btn-add-cart').bind('click', function () {
            var $this = $(this);
            _.addCart($this.data('id'),$this.data('code'),1, function () {
                $this.tipsBox('<span class="col-red fz-14 bold">+1</span>');
            });
        });
    });
})(jQuery);

window.onload = function(){
	$('.waiting').remove();
};
