/**
 * author jaycie
 * Email: xiezhanggen@gmail.com
 */
 var jDrag = function(dragDiv, scaleDiv, inEditContent) {
 	var editContentDom = $('.textarea'),
 		_posix = {
 			x: inEditContent ? editContentDom.offset().left : 0,
 			y: inEditContent ? editContentDom.offset().top : 0
 		};

 	$(document).mousemove(function(e) {
		if (!!this.move && $(e.target).attr('class') !=='content') {  // &&不在点击保存按钮上
			var posix = !document.move_target ? {'x': 0, 'y': 0} : document.move_target.posix,
				callback = document.call_down || function() {
					$(this.move_target).css({
						'top': e.pageY - posix.y - _posix.y,
						'left': e.pageX - posix.x - _posix.x
					});
				};

			callback.call(this, e, posix);
		}
	}).on('click', function(e){
		// $.extend(document, {'move': false});
		var prarentDom = $(e.target).parent();
		if(prarentDom.is('.appendDragBox')){
			prarentDom.css({'cursor':'auto'});
			$(dragDiv).off('mousedown').off('mousedown', scaleDiv);
		}else{
			$(dragDiv).css({'cursor':'move'});
			domMove();
		}
	}).mouseup(function(e) {
		if (!!this.move) {
			var callback = document.call_up || function(){};
			callback.call(this, e);
			$.extend(this, {
				'move': false,
				'move_target': null,
				'call_down': false,
				'call_up': false
			});
		}
	});

	var domMove = function(){
		var $box = $(dragDiv).on('mousedown',function(e) {
		    var offset = $(this).offset();
		    
		    this.posix = {'x': e.pageX - offset.left, 'y': e.pageY - offset.top};
		    $.extend(document, {'move': true, 'move_target': this});
		}).on('mousedown', scaleDiv, function(e) {
		    var posix = {
		            'w': $box.width(), 
		            'h': $box.height(), 
		            'x': e.pageX, 
		            'y': e.pageY
		        };
		    
		    $.extend(document, {'move': true, 'call_down': function(e) {
		    	var _width = Math.max(30, e.pageX - posix.x + posix.w),
		    		_height = Math.max(30, e.pageY - posix.y + posix.h);
		    	if(_height>736){
		    		$('.textarea').css('height', _height);
		    	}else {
		    		$('.textarea').css('height','736');
		    	}
		        $box.css({
		            'width': _width>412 ? 412 : _width,
		            'height': _height
		        });
		    }});
		    return false;
		});
	};domMove();
 }

$(function(){
	jDrag('#JDragBox', '#JScaleBox');

	$.extend({
		drag: function(bool){
			if(bool){
				$('.textarea').removeClass('editorEnble');
				$("#JEditor .btn-redo").addClass('hide');
				$('#JScaleBox').removeClass('hide');
			}else{
				$('.textarea').addClass('editorEnble');  //内容成可编辑

				$("#JEditor .btn-redo").removeClass('hide');  //上传完成，第一版不做可编辑
				$('#JScaleBox').addClass('hide');
			}
		}
	})
})