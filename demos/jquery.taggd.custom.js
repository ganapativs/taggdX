/**
 * Created by Ganapati on 13-03-2015.
 */
/*!
 * jQuery Taggd
 * A helpful plugin that helps you adding 'tags' on images.
 *
 * License: MIT
 */

(function($) {
    'use strict';

    var defaults = {
        edit: false,

        align: {
            x: 'center',
            y: 'center',
            x1: 'center',
            y1: 'center'
        },

        array:[],

        handlers: {},

        offset: {
            left: 0,
            top: 0
        },

        strings: {
            save: '&#x2713;',
            delete: '&#x00D7;'
        }
    };

    var methods = {
        show: function() {
            var $this = $(this),
                $label = $this.next();

            $this.addClass('active');
            $label.addClass('show').find('input').focus();
        },

        hide: function() {
            var $this = $(this);

            $this.removeClass('active');
            $this.next().removeClass('show');
        },

        toggle: function() {
            var $hover = $(this).next();

            if($hover.hasClass('show')) {
                methods.hide.call(this);
            } else {
                methods.show.call(this);
            }
        }
    };


    /****************************************************************
     * TAGGD
     ****************************************************************/

    var Taggd = function(element, options, data) {
        var _this = this;

        if(options.edit) {
            options.handlers = {
                click: function() {
                    _this.hide();
                    methods.show.call(this);
                }
            };
        }

        this.element = $(element);
        this.options = $.extend(true, {}, defaults, options);
        this.data = data;
        this.initialized = false;

        if(!this.element.height() || !this.element.width()) {
            this.element.on('load', _this.initialize.bind(this));
        } else this.initialize();
    };


    /****************************************************************
     * INITIALISATION
     ****************************************************************/

    Taggd.prototype.initialize = function() {
        var _this = this;

        this.initialized = true;

        this.initWrapper();
        this.addDOM();

        if(this.options.edit) {
            this.element.on('click', function(e) {
                var poffset = $(this).parent().offset(),
                    x = (e.pageX - poffset.left) / _this.element.width(),
                    y = (e.pageY - poffset.top) / _this.element.height();

                _this.addData({
                    x: x,
                    y: y,
                    x1:.1,
                    y1:.1,
                    text: ''
                });

                 _this.show(_this.data.length - 1);
            });
        }

        $(window).resize(function() {
            _this.updateDOM();
        });
    };

    Taggd.prototype.initWrapper = function() {
        var wrapper = $('<div class="taggd-wrapper" />');
        this.element.wrap(wrapper);

        this.wrapper = this.element.parent('.taggd-wrapper');
    };

    Taggd.prototype.alterDOM = function() {
        var _this = this;

        this.wrapper.find('.taggd-item-hover').each(function() {
            var $e = $(this),

                $input = $('<input type="text" size="16" />')
                    .val($e.text()),
                $button_ok = $('<button />')
                    .html(_this.options.strings.save),
                $button_delete = $('<button />')
                    .html(_this.options.strings.delete);

            $button_ok.on('click', function() {
                _this.hide();
            });

            $button_delete.on('click', function() {
                var x = $e.attr('data-x'),
                    y = $e.attr('data-y');

                _this.options.array.pop();

                var dataI=$e.attr('d_count');
                $(".image_tag[data-no*='"+dataI+"']").remove();
                console.log('len: '+$('.image_tag').length);
                $('.image_tag').each(function (index) {
                    $(this).attr('data-no',index);
                });

                _this.data = $.grep(_this.data, function(v) {
                    return v.x != x || v.y != y;
                });

                _this.addDOM();
                _this.element.triggerHandler('change');


            });

            $input.on('change', function() {
                var x = $e.attr('data-x'),
                    y = $e.attr('data-y'),
                    item = $.grep(_this.data, function(v) {
                        return v.x == x && v.y == y;
                    }).pop();

                if(item) item.text = $input.val();

                _this.addDOM();
                _this.element.triggerHandler('change');
            });

            $e.empty().append($input, $button_ok, $button_delete);
        });

        _this.updateDOM();
    };

    /****************************************************************
     * DATA MANAGEMENT
     ****************************************************************/

    Taggd.prototype.addData = function(data) {
        if($.isArray(data)) {
            this.data = $.merge(this.data, data);
        } else {
            this.data.push(data);
        }

        if(this.initialized) {
            this.addDOM();
            this.element.triggerHandler('change');
        }
    };

    Taggd.prototype.setData = function(data) {
        this.data = data;

        if(this.initialized) {
            this.addDOM();
        }
    };

    Taggd.prototype.clear = function() {
        if(!this.initialized) return;
        this.wrapper.find('.taggd-item, .taggd-item-hover').remove();
        this.wrapper.find('.image_tag').remove();
        this.options.array.length=0;
    };


    /****************************************************************
     * EVENTS
     ****************************************************************/

    Taggd.prototype.on = function(event, handler) {
        if(
            typeof event !== 'string' ||
            typeof handler !== 'function'
        ) return;

        this.element.on(event, handler);
    };


    /****************************************************************
     * TAGS MANAGEMENT
     ****************************************************************/

    Taggd.prototype.iterateTags = function(a, yep) {
        var func;

        if($.isNumeric(a)) {
            func = function(i, e) { return a === i; };
        } else if(typeof a === 'string') {
            func = function(i, e) { return $(e).is(a); }
        } else if($.isArray(a)) {
            func = function(i, e) {
                var $e = $(e);
                var result = false;

                $.each(a, function(ai, ae) {
                    if(
                        i === ai ||
                        e === ae ||
                        $e.is(ae)
                    ) {
                        result = true;
                        return false;
                    }
                });

                return result;
            }
        } else if(typeof a === 'object') {
            func = function(i, e) {
                var $e = $(e);
                return $e.is(a);
            };
        } else if($.isFunction(a)) {
            func = a;
        } else if(!a) {
            func = function() { return true; }
        } else return this;

        this.wrapper.find('.taggd-item').each(function(i, e) {
            if(typeof yep === 'function' && func.call(this, i, e)) {
                yep.call(this, i, e);
            }
        });

        return this;
    };

    Taggd.prototype.show = function(a) {
        return this.iterateTags(a, methods.show);
    };

    Taggd.prototype.hide = function(a) {
        return this.iterateTags(a, methods.hide);
    };

    Taggd.prototype.toggle = function(a) {
        return this.iterateTags(a, methods.toggle);
    };

    /****************************************************************
     * CLEANING UP
     ****************************************************************/

    Taggd.prototype.dispose = function() {
        this.clear();
        this.element.unwrap(this.wrapper);
    };


    /****************************************************************
     * SEMI-PRIVATE
     ****************************************************************/

    Taggd.prototype.addDOM = function() {
        var _this = this;

        this.clear();
        this.element.css({ height: 'auto', width: 'auto' });

        var height = this.element.height();
        var width = this.element.width();

        $.each(this.data, function(i, v) {
            var $item = $('<span />');
            var $hover;

            if(
                v.x > 1 && v.x % 1 === 0 &&
                v.y > 1 && v.y % 1 === 0
            ) {
                v.x = v.x / width;
                v.y = v.y / height;
            }

            if(typeof v.attributes === 'object') {
                $item.attr(v.attributes);
            }

            $item.attr({
                'data-x': v.x,
                'data-y': v.y,
                'data-x1': v.x1,
                'data-y1': v.y1,
                'd_count':i
            });

            $item.css('position', 'absolute');
            $item.addClass('taggd-item');

            _this.wrapper.append($item);

            if(typeof v.text === 'string' && (v.text.length > 0 || _this.options.edit)) {
                $hover = $('<span class="taggd-item-hover" style="position: absolute;" />').html(v.text);

                $hover.attr({
                    'data-x': v.x,
                    'data-y': v.y,
                    'data-x1': v.x1,
                    'data-y1': v.y1,
                    'd_count':i
                });

                _this.wrapper.append($hover);
            }

            if($(".image_tag[data-no*='"+i+"']").length==0){
                var dataI = _this.options.array.length;
                var offset = $(this).offset();
                var position = {
                    left: v.x*_this.element.width(),
                    top: v.y*_this.element.height()
                };

                //console.log(v.x+' '+ v.y+' '+ v.x1+' '+ v.y1);
                //console.log(width+' '+height);
                //console.log((v.x1*width-v.x*width)+' '+(v.y1*height-v.y*height));

                _this.options.array.push({
                    size: {
                        width: v.x1*width-v.x*width,
                        height: v.y1*height-v.y*height
                    },
                    position: {
                        left: v.x*width,
                        top: v.y*height
                    }
                });
                var append = $('<div class="image_tag" data-no="' + dataI + '"></div>').draggable({
                    containment: "parent",
                    stop: function (event, ui) {
                        var position = {
                            left: ui.position.left,
                            top: ui.position.top
                        }
                        var size = {
                            width: $(this).width(),
                            height: $(this).height()
                        }
                        v.x= ui.position.left/_this.element.width();
                        v.y= ui.position.top/_this.element.height();
                        v.x1=  (ui.position.left+ $(this).width())/_this.element.width();
                        v.y1=  (ui.position.top+$(this).height())/_this.element.height();
                        console.log('X: '+ v.x+' '+'Y: '+ v.y+' '+'WIDTH: '+ (v.x1-v.x)+' '+'HEIGHT: '+ (v.y1-v.x));
                        $("span.taggd-item[d_count*='"+dataI+"']")
                            .attr('data-x',v.x)
                            .attr('data-y',v.y)
                            .attr('data-x1',v.x1)
                            .attr('data-y1',v.y1)
                            .next()
                            .attr('data-x',v.x)
                            .attr('data-y',v.y)
                            .attr('data-x1',v.x1)
                            .attr('data-y1',v.y1);
                        _this.options.array[$(this).attr("data-no")] = {
                            size: {
                                width: v.x1*width-v.x*width,
                                height: v.y1*height-v.y*height
                            },
                            position: {
                                left: v.x*width,
                                top: v.y*height
                            }
                        };
                        _this.element.triggerHandler('change');
                        _this.updateDOM();
                    }
                }).resizable({
                    containment: "parent",
                    stop: function (event, ui) {
                        var size = {
                            width: ui.size.width,
                            height: ui.size.height
                        }
                        var position = {
                            left: $(this).position().left,
                            top: $(this).position().top
                        }
                        v.x= $(this).position().left/_this.element.width();
                        v.y= $(this).position().top/_this.element.height();
                        v.x1=  ($(this).position().left+ $(this).width())/_this.element.width();
                        v.y1=  ($(this).position().top+$(this).height())/_this.element.height();
                        console.log('X: '+ v.x+' '+'Y: '+ v.y+' '+'WIDTH: '+ (v.x1-v.x)+' '+'HEIGHT: '+ (v.y1-v.x));
                        $("span.taggd-item[d_count*='"+dataI+"']")
                            .attr('data-x',v.x)
                            .attr('data-y',v.y)
                            .attr('data-x1',v.x1)
                            .attr('data-y1',v.y1)
                            .next()
                            .attr('data-x',v.x)
                            .attr('data-y',v.y)
                            .attr('data-x1',v.x1)
                            .attr('data-y1',v.y1);
                        _this.options.array[$(this).attr("data-no")] = {
                            size: {
                                width: v.x1*width-v.x*width,
                                height: v.y1*height-v.y*height
                            },
                            position: {
                                left: v.x*width,
                                top: v.y*height
                            }
                        };
                        setTimeout(function(){
                            _this.element.triggerHandler('change');
                            _this.updateDOM();
                        },100);
                    }
                }).css({
                    "position": "absolute",
                    "top": position.top,
                    "left": position.left,
                    "width": v.x1*width-v.x*width,
                    "height": v.y1*height-v.y*height
                });
                // .dblclick(function () {
                //    $(this).remove();
                //    _this.options.array[$(this).attr("data-no")] = "";
                //});
                _this.wrapper.append(append);
            }

            if(typeof _this.options.handlers === 'object') {
                $.each(_this.options.handlers, function(event, func) {
                    var handler;

                    if(typeof func === 'string' && methods[func]) {
                        handler = methods[func];
                    } else if(typeof func === 'function') {
                        handler = func;
                    }

                    $item.on(event, function(e) {
                        if(!handler) return;
                        handler.call($item, e, _this.data[i]);
                    });
                });
            }
        });

        this.element.removeAttr('style');

        if(this.options.edit) {
            this.alterDOM();
        }

        this.updateDOM();
    };

    Taggd.prototype.updateDOM = function() {
        var _this = this;

        this.wrapper.removeAttr('style').css({
            height: this.element.height(),
            width: this.element.width()
        });

        this.wrapper.find('span').each(function(i, e) {
            var $el = $(e);

            var left = $el.attr('data-x') * _this.element.width();
            var top = $el.attr('data-y') * _this.element.height();

            if($el.hasClass('taggd-item')) {
                $el.css({
                    left: left - $el.outerWidth(true) / 2,
                    top: top - $el.outerHeight(true) / 2
                });
            } else if($el.hasClass('taggd-item-hover')) {
                if(_this.options.align.x === 'center') {
                    left -= $el.outerWidth(true) / 2;
                } else if(_this.options.align.x === 'right') {
                    left -= $el.outerWidth(true);
                }

                if(_this.options.align.y === 'center') {
                    top -= $el.outerHeight(true) / 2;
                } else if(_this.options.align.y === 'bottom') {
                    top -= $el.outerHeight(true);
                }

                $el.attr('data-align', $el.outerWidth(true));

                $el.css({
                    left: left + _this.options.offset.left,
                    top: top + _this.options.offset.top
                });
            }
        });

        this.wrapper.find('span.taggd-item').each(function(i, e) {
            var $el=$(e);
            var no = $el.attr('d_count');
            var left = $el.attr('data-x') * _this.element.width();
            var top = $el.attr('data-y') * _this.element.height();
            var width = $el.attr('data-x1') * _this.element.width()-left;
            var height = $el.attr('data-y1') * _this.element.height()-top;
            //_this.options.array[$el.attr("data-no")] = {
            //    size: {
            //        width: width,
            //        height: height
            //    },
            //    position: {
            //        left: left,
            //        top: top
            //    }
            //};
            $(".image_tag[data-no*='"+no+"']").css({
                //"position": "absolute",
                "top": top,
                "left": left,
                "width": width,
                "height": height
            });
        });

    };


    /****************************************************************
     * JQUERY LINK
     ****************************************************************/

    $.fn.taggd = function(options, data) {
        return new Taggd(this, options, data);
    };
})(jQuery);