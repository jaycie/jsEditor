function getUrl(param){
	 var reg = new RegExp("(^|&)"+ param +"=([^&]*)(&|$)");
     var r = window.location.search.substr(1).match(reg);
     if(r!=null)return  unescape(r[2]); return null;
}

$(function(){
	var $editor = $('#JEditor').JEditor(),
		$dragBox = $("#JDragBox"),

		diy= !!getUrl('diy'),
		_diy='',
		aId= getUrl('aId'),  //act id
		lId= getUrl('lId'),  //loupan id
		tId= getUrl('tId');  //template id;

	(function getId(){
		if(!diy || diy==='false'){ //非自定义编辑，即普通可视化编辑，不需要表单／红包，无需后端接口交互
			$('.diy-attr').addClass('hide');
		}

		var edit= getUrl('edit');
		if(!aId || !lId || !tId){
			return;
		}else{
			if(diy){
				_diy='&diy='+diy;
			}
			var _action = siteConfig.url.base+siteConfig.url.poster+'?lId='+lId+'&aId='+aId+'&tId='+tId+_diy;
			$('#createPage').prop('action',_action);
			$.post(_action,{pageContent:''},function(){ //生成空白页面，防止404
			    console.log('create new blank page success');
		  	});
			if(edit){
				$('#JDragBox').before('<iframe src="poster/'+lId+'/'+aId+'/'+tId+'.html" style="display:none" name="poster" id="poster"></iframe>');
				$('#poster').load(function(){
					var _config = window.frames["poster"].editConfig;
					$dragBox.css({
						'left' : _config.left,
						'top' : _config.top,
						'width' : _config.width,
						'height' : _config.height,
						'backgroundImage': 'url('+_config.url+')'
					});
					$(window.parent.document).find('.insertImageBox').hide();
					$(window.parent.document).find('.mask').hide();
					$.drag(false);
				})
			}else{
				_drag();
			}


		}
	}());

	function _drag(){  //拖拽相关
		var url=getUrl('imgUrl');
		if($dragBox.css('backgroundImage')==='none' && !url){
			alert('请先上传背景图');
			$('.insertImage').trigger('click');
		}else{
			var imgUrl = siteConfig.url.base+siteConfig.url.show+'?imgUrl='+getUrl('imgUrl');
			//ctrl iframe parent dom
			$(window.parent.document).find('.insertImageBox').hide();
			$(window.parent.document).find('.mask').hide();
			$(window.parent.document).find('#JDragBox').css('backgroundImage','url('+imgUrl+')');
		}
		$.drag(true);
	};

	$dragBox.on("click",'.toolTip',function(e){
		$.drag(false);
	});

	$("#JEditor").on("click",'.btn-redo',function(){
		$.drag(true);
	});

	$('#createPageNow').on('click',function(){
		var cPConfig={
			// url:　$dragBox.css('backgroundImage').replace('url(\"','').replace('\")',''),
			url:　$dragBox.css('backgroundImage').replace('url(','').replace(')','').replace(/\'/g,'').replace(/\"/g,''),  //debug 360 browser
			top: $dragBox.css('top'),
			left: $dragBox.css('left'),
			width: $dragBox.css('width'),  //待计算转化
			height: $dragBox.css('height')
		},
			_img={
				top:parseFloat(cPConfig.top) -200 + 'px',
			},
			_html= '<!DOCTYPE html><html><head><meta charset="utf-8">' +
				'<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>' +
				'<title>海报内容</title></head>' +
				'<style>body{margin: 0;padding: 0;max-width: 100%;}body img{max-width:100%;max-height:100%}.drag-bg{position:absolute;z-index:-1;left:0;top:'+_img.top+';width:'+cPConfig.width+';height:'+cPConfig.height+';background-image:url('+cPConfig.url+');background-position:center top;max-width:100%;}'+
				$('#exportCss').text()+'</style>' +
				'<body><div class="drag-bg"></div>' +
			   	// $('#enabledTextArea').html() +   //id can be repeat,to do fixed,the follow test class
			   	$('.textarea').html();
			_js = '<script>var editConfig={url:"'+cPConfig.url+'",top:"'+cPConfig.top+'",left:"'+cPConfig.left+'",width:"'+cPConfig.width+'",height:"'+cPConfig.height+'",pInfo:{lId:'+lId+',aId:'+aId+',tId:'+tId+'},packetSetting:'+JSON.stringify(window.packetSetting)+'};</script>';
		
		var ajaxUrl = $('#postActUrl').val(); //有表单数据
		if(ajaxUrl){
			_js +='<script src="'+siteConfig.url.editor+'/static/js/jquery-1.10.2.min.js"></script>' +
				  '<script>$(function(){$("#submitSave").on("click",function(){var _len=$("#newActForm input").length-1,_info="";for(var i=0;i<_len;i++){_info += $($("#newActForm input")[i]).prop("name")+":"+$($("#newActForm input")[i]).val()+",";}_info =_info.substr(0,_info.length-1);$.getJSON($("#postActUrl").val()+"?pInfo={lId:"+editConfig.pInfo.lId+",aId:"+editConfig.pInfo.aId+",tId:"+editConfig.pInfo.tId+"}&fInfo={"+_info+"}&callback=?",function(data){if(data.status===1){alert("提交成功")}});})})</script>';
			$.getJSON($('#newActUrl').val()+'?pInfo={"lId":'+lId+',"aId":'+aId+',"tId":'+tId+'}&fInfo='+$('#newActValue').val()+'&callback=?',
				function(data){
					console.log(data);
				}
			);
		}
		if(packetSetting && packetSetting.totalMoney>0){ //红包数据
			_js +='<script src="'+siteConfig.url.editor+'/static/js/jquery-1.10.2.min.js"></script>' +
				  '<script>$(function(){if(location.href.indexOf("grabBonus.html")>0){function getUrl(param){var reg = new RegExp("(^|&)"+ param +"=([^&]*)(&|$)");var r = window.location.search.substr(1).match(reg);if(r!=null)return  unescape(r[2]); return null;}$.getJSON(editConfig.packetSetting.openUrl+"?token="+getUrl("token")+"&hongbaoId="+getUrl("hongbaoId")+"&hongbaoKey="+getUrl("hongbaoKey")+"&callback=?",function(data){$(".locationGrabBonus .data-get").html(data.hongBao.hongbao/100);$(".locationGrabBonus .data-share").html(data.hongBao.leftHongbaoPoint/100);});}else{$.getJSON(editConfig.packetSetting.getUrl+"?token=FCB0CA1C5FDF4DBF9D92582C9ACDE559&activeId="+editConfig.pInfo.aId+"&callback=?",function(data){if(data.status==="success"){$(".locationGrabBonus").prop("href","grabBonus.html?token="+data.token+"&hongbaoId="+data.hongbaoInfo.hongbaoId+"&hongbaoKey="+data.hongbaoInfo.hongbaoKey);}else if(data.code==="2102"){alert("红包已领过");}else if(data.code==="2010"){alert("红包已领完");}});}})</script>';
			$.getJSON($('#newActPacket').val()+'?pInfo={"lId":'+lId+',"aId":'+aId+',"tId":'+tId+'}&fInfo={"tId": '+packetSetting.tplId+', "totalMoney":'+packetSetting.totalMoney+', "totalPoint":'+packetSetting.totalPoint+',"totalOnly":'+packetSetting.totalOnly+'}&callback=?',
				function(data){
					console.log(data);
				}
			);
		}
		_html += _js+'</body></html>';
		$('#pageContent').val(encodeURIComponent(_html));
	});
});