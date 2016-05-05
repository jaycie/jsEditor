function getUrl(param){
	 var reg = new RegExp("(^|&)"+ param +"=([^&]*)(&|$)");
     var r = window.location.search.substr(1).match(reg);
     if(r!=null)return  unescape(r[2]); return null;
}

$(function(){
	var $editor = $('#JEditor').JEditor(),
		$dragBox = $("#JDragBox"),

		aId= getUrl('aId'),  //act id
		lId= getUrl('lId'),  //loupan id
		tId= getUrl('tId');  //template id;

	(function getId(){
		var edit= getUrl('edit');
		if(!aId || !lId || !tId){
			return;
		}else{
			$('#createPage').prop('action',siteConfig.url.base+siteConfig.url.poster+'?lId='+lId+'&aId='+aId+'&tId='+tId);
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
			url:　$dragBox.css('backgroundImage').replace('url(\"','').replace('\")',''),
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
				'<style>body{margin: 0;padding: 0;max-width: 100%;overflow: hidden;}body img{max-width:100%}.drag-bg{position:absolute;z-index:-1;left:0;top:'+_img.top+';width:'+cPConfig.width+';height:'+cPConfig.height+';}'+
				$('#exportCss').text()+'</style>' +
				'<body><img src="'+cPConfig.url+'" class="drag-bg">' +
			   	// $('#enabledTextArea').html() +   //id can be repeat,to do fixed,the follow test class
			   	$('.textarea').html() + 
			   	'<script>var editConfig={url:"'+cPConfig.url+'",top:"'+cPConfig.top+'",left:"'+cPConfig.left+'",width:"'+cPConfig.width+'",height:"'+cPConfig.height+'",pInfo:{lId:'+lId+',aId:'+aId+',tId:'+tId+'},packetSetting:'+JSON.stringify(window.packetSetting)+'};</script>' +
			  	'</body></html>';
		
		$('#pageContent').val(encodeURIComponent(_html));
	});


	// $.getJSON('http://10.0.0.10:8080/member/newActForm?pInfo={"lId":"6","aId":"89","tId":"1"}&fInfo={"tId": 1,"totalMoney":10000,"totalPoint":10,"totalOnly":3}&callback=?',
	// 	function(data){
	// 		console.log(data);
	// 	}
	// );
});