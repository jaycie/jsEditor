/**
 * author jaycie
 * Email: xiezhanggen@gmail.com
 */
 var jDrag = function(dragDiv, scaleDiv) {
 	$(document).mousemove(function(e) {
		if (!!this.move && $(e.target).attr('class') !=='content') {  // &&不在点击保存按钮上
			var posix = !document.move_target ? {'x': 0, 'y': 0} : document.move_target.posix,
				callback = document.call_down || function() {
					$(this.move_target).css({
						'top': e.pageY - posix.y,
						'left': e.pageX - posix.x
					});
				};

			callback.call(this, e, posix);
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
	        $box.css({
	            'width': Math.max(30, e.pageX - posix.x + posix.w),
	            'height': Math.max(30, e.pageY - posix.y + posix.h)
	        });
	    }});
	    return false;
	});
 }

$(function(){
	jDrag('#JDragBox', '#JScaleBox');

	$.extend({
		drag: function(bool){
			if(bool){
				$('#enabledTextArea').removeClass('editorEnble');
				$("#JEditor .btn-redo").addClass('hide');
				$('#JScaleBox').removeClass('hide');
			}else{
				$('#enabledTextArea').addClass('editorEnble');  //内容成可编辑

				$("#JEditor .btn-redo").removeClass('hide');  //上传完成，第一版不做可编辑
				// $('#JDragBox .btn-save').addClass('hide');
				$('#JScaleBox').addClass('hide');
			}
		}
	})
})