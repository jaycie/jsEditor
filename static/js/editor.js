(function (window, undefined) {
    if (!window.$) { //must load jquery
        alert('must load jquery first');
        return;
    }
    var document = window.document,
		$ = window.$,
		supportRange = typeof document.createRange === 'function',
	    defaultHeight = 100,
	    menus,  //存储菜单配置
		currentRange,      //记录当前选中范围
        $txt = $('<div contenteditable="true" class="textarea" id="enabledTextArea"></div>'),  //编辑区
        $btnContainer = $('<div class="btn-container"></div>'), //菜单容器
        $form = {
            action : {
                base : 'http://10.0.0.120/',  //表单&&红包 公用处理服务器
                newActForm : 'member/newActForm',  //提交表单所需自断
                postActForm : 'member/postActForm', //发送表单数据
                newActPacket : 'member/newActPacket' //保存红包配置信息
            },
            field : [     //插入表单的字段及类型 type name -> form_{index}
                {
                    value:'姓名',
                    type:'text'
                },
                {
                    value:'性别',
                    type:'radio', //默认选中第一个
                    sub:[
                        {
                            key: 1,    
                            value: '男'
                        },
                        {
                            key: 2,
                            value: '女'
                        }
                    ]
                },
                {
                    value:'电话',
                    type:'tel'
                },
                {
                    value:'地址',
                    type:'text'
                },
                {
                    value:'微信',
                    type:'text'
                },
                {
                    value:'推荐人账号',
                    type:'text'
                }
            ] //表单字段  
        },
        $packet = {  //红包提交地址
            get : 'yjsWebService/hongbao/qiangHongbaoByActiveId',
            open : 'yjsWebService/hongbao/useHongbaoKey'
        },  
        $maskDiv = $('<div class="mask"></div>'),  //遮罩层
        $modalContainer = $('<div></div>'),  //modal容器
        $modalTopDefault = '100px',
        $allMenusWithCommandName,
        commandHooks, 
        idPrefix = 'jsEditor' + Math.random().toString().replace('.', '') + '_',
        id = 1,

        //基本配置
        basicConfig = {
            fontFamilyOptions: ['宋体', '黑体', '楷体', '隶书', '幼圆', '微软雅黑', 'Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Trebuchet MS', 'Courier New', 'Impact', 'Comic Sans MS'],
            colorOptions: {
                '#880000': '暗红色',
                '#800080': '紫色',
                '#ff0000': '红色',
                '#ff00ff': '鲜粉色',
                '#000080': '深蓝色',
                '#0000ff': '蓝色',
                '#00ffff': '湖蓝色',
                '#008080': '蓝绿色',
                '#008000': '绿色',
                '#808000': '橄榄色',
                '#00ff00': '浅绿色',
                '#ffcc00': '橙黄色',
                '#808080': '灰色',
                '#c0c0c0': '银色',
                '#000000': '黑色'
            },
            fontsizeOptions: {
                1: '10px',
                2: '13px',
                3: '16px',
                4: '19px',
                5: '22px',
                6: '25px',
                7: '28px'
            }
        };

    //获取唯一ID
    function getUniqeId () {
        return idPrefix + '_' + (id++);
    }

	//selection range 相关事件
    function getCurrentRange() {
        var selection,
            range,
            parentElem,
            txt = $txt[0];
        //获取选中区域
        if(supportRange){
            //w3c
            selection = document.getSelection();
            if (selection.getRangeAt && selection.rangeCount) {
                range = document.getSelection().getRangeAt(0);
                parentElem = range.commonAncestorContainer;
            }
        }else{
            //IE8-
            range = document.selection.createRange();
            parentElem = range.parentElement();
        }
        //确定选中区域在$txt之内
        if( parentElem && (parentElem.id = txt.id || $.contains(txt, parentElem)) ){
            return range;
        }
    }
    function saveSelection() {
        currentRange = getCurrentRange();
    }
    function restoreSelection() {
        if(!currentRange){
            return;
        }
        var selection,
            range;
        if(supportRange){
            //w3c
            selection = document.getSelection();
            selection.removeAllRanges();
            selection.addRange(currentRange);
        }else{
            //IE8-
            range = document.selection.createRange();
            range.setEndPoint('EndToEnd', currentRange);
            if(currentRange.text.length === 0){
                range.collapse(false);
            }else{
                range.setEndPoint('StartToStart', currentRange);
            }
            range.select();
        }
    }

    //获取可以插入表格的元素，用于 commandHooks['insertHTML']
    function getElemForInsertTable($elem){
        if ($elem.parent().is('div[contenteditable="true"]')) {
            return $elem;
        }
        if ($elem[0].nodeName.toLowerCase() === 'body') {
            return $txt.children().last();
        }
        if ($elem.is('div[contenteditable="true"]')) {
            return $elem.children().last();
        } else {
            return getElemForInsertTable($elem.parent());
        }
    }
    //命令 hook
    commandHooks = {
        'insertHTML': function(commandName, commandValue){
            var parentElem,
                $elem;
            if(currentRange){
                if(supportRange){
                    parentElem = currentRange.commonAncestorContainer;
                }else{
                    parentElem = currentRange.parentElement();
                }
            }else{
                return;
            }
            $elem = getElemForInsertTable($(parentElem));
            if($elem.next().length === 0){
                commandValue += '<p>&nbsp;</p>';
            }
            $elem.after($(commandValue));
        },
        'insertForm' : function(commandName, commandValue){
            // console.log(commandName+'_________________'+commandValue);
        }
    };
    //检验 command Enable
    function commandEnabled(commandName){
        var enabled;
        try{
            enabled = document.queryCommandEnabled(commandName);
        }catch(ex){
            enabled = false;
        }
        return enabled;
    }
    /* 函数名: commonCommand
    *  功 能 ：执行命令
    *  参数            e:   事件源
    *       commandName :   document.execCommand可接受的第一个参数值，对于不可接受的值，交付自定义方法commandHooks处理
    *       commandValue:   document.execCommand可接受的第二个参数值
    *       callback    ：  执行完对原事件处理的回调
    */
    function commonCommand (e, commandName, commandValue, callback) {
        var commandHook;
        if(!currentRange){
            e.preventDefault();
            return;
        }

        //执行
        if(commandEnabled(commandName) === true){
            document.execCommand(commandName, false, commandValue);
        }else{
            //恢复选中区+
            restoreSelection();
            commandHook = commandHooks[commandName];
            if(commandHook){
                commandHook(commandName, commandValue);
            }
        }
        //更新菜单样式
        updateMenuStyle();

        //关闭modal
        $modalContainer.find('.modal').hide();
        $maskDiv.hide();
        //执行回调函数
        if(callback){
            callback.call($txt);
        }

        e.preventDefault();
    }

    //更新菜单样式
    function updateMenuStyle() {
        if(!$allMenusWithCommandName){
            $allMenusWithCommandName = $btnContainer.find('a[commandName]');
        }
        $allMenusWithCommandName.each(function(){
            var $btn = $(this),
                commandName = $.trim($btn.attr('commandName')).toLowerCase();
            if(commandName === 'insertunorderedlist' || commandName === 'insertorderedlist'){
                return;  //ff中，如果是刚刷新的页面，无选中文本的情况下，执行这两个的 queryCommandState 报 bug
            }
            if(document.queryCommandState(commandName)){
                $btn.addClass('btn-selected');
            }else{
                $btn.removeClass('btn-selected');
            }
        });
    }
    //菜单配置集
    menus = [
        {
            'title': '字号',
            'type': 'dropMenu',
            'txt': 'fa fa-text-height',
            'command': 'fontSize',
            'dropMenu': (function () {
                var arr = [],
                    //注意，此处commandValue必填项，否则程序不会跟踪
                    temp = '<li><a href="#" commandValue="${value}" style="font-size:${fontsize};">${txt}</a></li>',
                    $ul;

                $.each(basicConfig.fontsizeOptions, function(key, value){
                    arr.push(
                        temp.replace('${value}', key)
                            .replace('${fontsize}', value)
                            .replace('${txt}', value)
                    );
                });
                $ul = $('<ul>' + arr.join('') + '</ul>');
                return $ul; 
            })()
        },
        {
            'title': '字体',
            'type': 'dropMenu',
            'txt': 'fa fa-file-word-o',
            'command': 'fontName ',
            'dropMenu': (function(){
                var arr = [],
                    temp = '<li><a href="#" commandValue="${value}" style="font-family:${family};">${txt}</a></li>',
                    $ul;

                $.each(basicConfig.fontFamilyOptions, function(key, value){
                    arr.push(
                        temp.replace('${value}', value)
                            .replace('${family}', value)
                            .replace('${txt}', value)
                    );
                });
                $ul = $('<ul>' + arr.join('') + '</ul>');
                return $ul; 
            })()
        },
        'split',
    	{
            'title': '加粗',
    		'type': 'btn',
    		'txt':'fa fa-bold',
    		'command': 'bold',
            'callback': function(){
                //alert('自定义callback函数');
            }
    	},
        {
            'title': '下划线',
            'type': 'btn',
            'txt':'fa fa-underline',
            'command': 'underline '
        },
        {
            'title': '斜体',
            'type': 'btn',
            'txt':'fa fa-italic',
            'command': 'italic '
        },
        'split',
        {
            'title': '前景色',
            'type': 'dropMenu',
            'txt': 'fa fa-pencil|color:#4a7db1',
            'command': 'foreColor ',
            'dropMenu': (function(){
                var arr = [],
                    //注意，此处commandValue必填项，否则程序不会跟踪
                    temp = '<li><a href="#" commandValue="${value}" style="color:${color};">${txt}</a></li>',
                    $ul;

                $.each(basicConfig.colorOptions, function(key, value){
                    arr.push(
                        temp.replace('${value}', key)
                            .replace('${color}', key)
                            .replace('${txt}', value)
                    );
                });
                $ul = $('<ul>' + arr.join('') + '</ul>');
                return $ul; 
            })()
        },
        {
            'title': '背景色',
            'type': 'dropMenu',
            'txt': 'fa fa-paint-brush|color:Red',
            'command': 'backColor ',
            'dropMenu': (function(){
                var arr = [],
                    //注意，此处commandValue必填项，否则程序不会跟踪
                    temp = '<li><a href="#" commandValue="${value}" style="background-color:${color};color:#ffffff;">${txt}</a></li>',
                    $ul;

                $.each(basicConfig.colorOptions, function(key, value){
                    arr.push(
                        temp.replace('${value}', key)
                            .replace('${color}', key)
                            .replace('${txt}', value)
                    );
                });
                $ul = $('<ul>' + arr.join('') + '</ul>');
                return $ul; 
            })()
        },
        'split',
        {
            'title': '无序列表',
            'type': 'btn',
            'txt':'fa fa-list-ul',
            'command': 'InsertUnorderedList '
        },
        {
            'title': '有序列表',
            'type': 'btn',
            'txt':'fa fa-list-ol',
            'command': 'InsertOrderedList '
        },
        'split',
        {
            'title': '左对齐',
            'type': 'btn',
            'txt':'fa fa-align-left',
            'command': 'JustifyLeft '   
        },
        {
            'title': '居中',
            'type': 'btn',
            'txt':'fa fa-align-center',
            'command': 'JustifyCenter'  
        },
        {
            'title': '右对齐',
            'type': 'btn',
            'txt':'fa fa-align-right',
            'command': 'JustifyRight ' 
        },
        'split',
        {
            'title': '插入表格',
            'type': 'modal',
            'txt': 'fa fa-table',
            'appendClass': 'modal-small',
            'modal': (function(){
                var rowNumTxtId = getUniqeId(),
                    colNumTxtId = getUniqeId(),
                    titleCheckId = getUniqeId(),
                    btnId = getUniqeId(),
                    $modal = $(
                        '<div>' + 
                        '   行数：<input id="' + rowNumTxtId + '" type="text" style="width:30px;"/>' + 
                        '   列数：<input id="' + colNumTxtId + '" type="text"  style="width:30px;"/>' +
                        '   显示标题行：<input id="' + titleCheckId + '" type="checkbox">' + 
                        '   <button id="' + btnId + '">插入表格</button>',
                        '</div>'
                    ),
                    callback = function(){
                        $modal.find('input').val('');
                    };
                $modal.find('#' + btnId).click(function(e){
                    var rowNum = $modal.find('#' + rowNumTxtId).val(),
                        rowNum = rowNum === '' || isNaN(+rowNum) ? 3 : rowNum,
                        colNum = $modal.find('#' + colNumTxtId).val(),
                        colNum = colNum === '' || isNaN(+colNum) ? 5 : colNum,
                        firstRowBold = $modal.find('#' + titleCheckId).is(':checked'),

                        i, j,
                        //表格模板
                        table = '',
                        tableTemp = '<table border="0" cellpadding="0" cellspacing="0" style="${style}" > ${content} </table>',
                        trArray = [],
                        firstTrTemp = '<tr style="font-weight:bold;background-color:#f1f1f1;">${content}</tr>',
                        trTemp = '<tr>${content}</tr>',
                        tdArray = [],
                        tdTemp = '<td style="width:100px; ${style}">&nbsp;</td>',
                        borderStyle = '1px solid #cccccc';
                    //完善模板
                    tableTemp = tableTemp.replace('${style}', 'border-left:' + borderStyle + ';border-top:' + borderStyle + ';');
                    tdTemp = tdTemp.replace('${style}', 'border-bottom:' + borderStyle + ';border-right:' + borderStyle + ';');
                    
                    //生成table代码
                    for (i = 0; i < rowNum; i++) {
                        tdArray = [];
                        for (j = 0; j < colNum; j++) {
                            tdArray.push(tdTemp);
                        }
                        if (i === 0 && firstRowBold) {
                            trArray.push(firstTrTemp.replace('${content}', tdArray.join('')));
                        } else {
                            trArray.push(trTemp.replace('${content}', tdArray.join('')));
                        }
                    }
                    table = tableTemp.replace('${content}', trArray.join(''));

                    //执行插入
                    commonCommand(e, 'insertHTML', table, callback);
                });
                return $modal;
            })()
        },
        'split',
        {
            'title': '撤销',
            'type': 'btn',
            'txt': 'fa fa-undo',
            'command': function(e){
                document.execCommand("undo");
                e.preventDefault();
            },
            'callback': function(){
                //alert('撤销操作');
            }
        },
        {
            'title': '重复',
            'type': 'btn',
            'txt': 'fa fa-repeat',
            'command': function(e){
                document.execCommand("redo");
                e.preventDefault();
            }
        },
        'split',
        {
            'title': '插入链接',
            'description': '超链接',
            'type': 'modal',
            'txt': 'fa fa-link',
            'class': 'btn-lg',  //大按钮
            'appendClass': 'modal-small',
            'modal': (function () {
                var urlTxtId = getUniqeId(),
                    btnId = getUniqeId();
                    $modal = $(
                        '<div>' +
                        '   <input id="' + urlTxtId + '" type="text" style="width:300px;"/>' + 
                        '   <button id="' + btnId + '" type="button">插入链接</button>' + 
                        '</div>'
                    ),
                    callback = function(){
                        $modal.find('#' + urlTxtId).val('');
                    };
                $modal.find('#' + btnId).click(function(e){
                    var url = $.trim($modal.find('#' + urlTxtId).val());
                    if(!url){
                        url = document.getElementById(urlTxtId).value;  //for IE6
                    }
                    if(url !== ''){
                        commonCommand(e, 'createLink', url, callback);
                    }
                });

                return $modal;
            })()
        },
        {
            'title': '取消链接',
            'description': '删链接',
            'type': 'btn',
            'txt':'fa fa-unlink',
            'class': 'btn-lg',
            'command': 'unLink ' 
        },
        {
            'title': '插入图片',
            'description': '图片',
            'type': 'modal',
            'txt': 'fa fa-image',
            'class': 'btn-lg insertImage',
            'appendClass': 'modal-small insertImageBox',
            'modal': (function () {
                var urlTxtIdNative = getUniqeId(),
                    btnIdNative = getUniqeId(),
                    urlTxtId = getUniqeId(),
                    btnId = getUniqeId(),
            
                    $modal = $(
                        '<div><form action="'+siteConfig.url.base+siteConfig.url.upload+'" method="POST" enctype="multipart/form-data" target="upload">' +
                        '   <table><tr><td>本地:</td><td><input type="file" name="upload" multiple="multiple" id="' + urlTxtIdNative + '"><input type="text" name="tmpurl" value="'+siteConfig.url.editor+'tmp.html" style="display:none" /></td>' +
                        '   <td><input type="submit" value="上传" id="' + btnIdNative + '" /></td></tr> ' +
                        '   <tr><td>网络:</td><td> <input id="' + urlTxtId + '" type="text" style="width:230px;" placeholder="请输入图片链接"/></td>' + 
                        '   <td><button id="' + btnId + '" type="button">插入</button></td></tr></table>' + 
                        '<iframe name="upload" style="display:none"></iframe></div>'
                    ),
                    callback = function(){
                        $modal.find('#' + urlTxtId).val('');
                    };
                $modal.find('#' + btnId).click(function(e){
                    var url = $.trim($modal.find('#' + urlTxtId).val());
                    if(!url){
                        url = document.getElementById(urlTxtId).value;
                    }
                    if(url !== ''){
                        commonCommand(e, 'insertImage', url, callback);
                    }
                });

                //异步上传图片
                $modal.find('#' + btnIdNative).click(function(e){
                    var _img = $('#'+urlTxtIdNative);
                    if(_img.val()===''){
                        alert('请选择图片');
                        return;
                    }  
                });

                return $modal;
            })()
        },
        {
            'title': '可拖动文本框',
            'description': '文本',
            'type': 'btn',
            'txt': 'fa fa-font',
            'command': '2D-Position',
            'class': 'btn-lg',
            'callback': function(){
                var dragId= getUniqeId(),
                    scaleId= getUniqeId();

                $txt.append('<div id="'+dragId+'" class="appendDragBox" title="外边框生成页面后自动删除" '
                        + 'style="width: 200px;height: 100px;">'
                        + '<div id="'+scaleId+'" class="JScaleBox"></div><p>&nbsp;</p></div>');
                jDrag('#'+dragId, '#'+scaleId, true);
            }
        },
        {
            'title': '插入表单',
            'description': '表单',
            'type': 'modal',
            'txt': 'fa fa-list',
            'class': 'btn-lg  diy-attr',  //大按钮
            'appendClass': 'modal-small',
            'modal': (function () {
                var urlTxtId = getUniqeId(),
                    btnId = getUniqeId(),
                    tableId = 'newActForm',
                    _html = '<ul class="form insertFormTmp">',
                    $formField= $form.field;
                $.each($formField,function(i){
                    _html += '<li>'+$formField[i].value+':<input type="checkbox" name="' + urlTxtId + '" value="'+i+'" /></li>';
                })
                _html +='</ul><p><input type="hidden" name="newActUrl" id="newActUrl" value="'+$form.action.base+$form.action.newActForm+'" />'+
                        '<input type="hidden" name="newActValue" id="newActValue" value="" />'+
                        '<button id="' + btnId + '" type="button" class="btn btn-important right">插入字段</button></p>';
                var $modal = $(
                        '<div>'+_html+'</div>'
                    ),
                    callback = function(){
                        $modal.find("input[name="+urlTxtId+"]").prop("checked",false);
                        $('#'+tableId).prop('contenteditable',false);
                    };
                $modal.find('#' + btnId).click(function(e){
                    var _val =$modal.find("input[name="+urlTxtId+"]:checked"),
                        _key=[],
                        _form='<table id="'+tableId+'" contenteditable="false">',
                        _submitVal='[';
                    for(var i=0,len=$formField.length;i<len;i++){
                        $.each(_val,function(){
                            if($(this).val()==i){
                                if($formField[i].type==='radio'){
                                    var sub=$formField[i].sub,
                                        _radio='<tr><th>'+$formField[i].value+':</th> <td align="left">';
                                    for(var j=0,sublen=sub.length;j<sublen;j++){
                                        _radio +='<input type="radio" name="form_'+i+'" value="'+sub[j].key+'"  />'+sub[j].value+'  ';
                                    }
                                    _form +=_radio+'</td></tr>';
                                }else{
                                    _form += '<tr><th>'+$formField[i].value+':</th> <td><input type="'+$formField[i].type+'" name="form_'+i+'" placeholder="请输入'+$formField[i].value+'" /></td></tr>';
                                }

                                _submitVal +='{"colum":"'+$formField[i].value+'","index":'+i+'},';
                            }
                        }); 
                    }
                    _form +='<tr contenteditable="true"><th><input type="hidden" name="postActUrl" id="postActUrl" value="'+$form.action.base+$form.action.postActForm+'" /></th> <td class="right"><button id="submitSave" type="button" class="btn btn-important">保存</button></td></</table>';
                    _submitVal = _submitVal.substr(0,_submitVal.length-1);
                    $('#newActValue').val(_submitVal+']');
                    commonCommand(e, 'insertHTML', _form, callback);
                });

                return $modal;
            })()
        },
        {
            'title': '添加红包',
            'description': '红包',
            'type': 'modal',
            'txt': 'fa fa-suitcase',
            'command': 'fontName ',
            'class': 'btn-lg diy-attr',   //diy-attr 自定义属性，if{param@diy=true show}else{hide} 
            'appendClass': 'modal-big',
            'modal': (function () {
                window.packetSetting = {  //红包配置信息，生成静态页面用到
                    tplId: 0,
                    totalMoney: 0,
                    totalPoint: 0,
                    totalOnly: 0,
                    getUrl: $form.action.base + $packet.get,
                    openUrl: $form.action.base + $packet.open
                };

                var urlTxtId = getUniqeId(),
                    btnId = getUniqeId(),
                    dragId = getUniqeId(),
                    scaleId = getUniqeId(),
                    tmpId='',
                    $modal = $(
                        '<div>' +
                        '   <div class="red-packet" id="' + urlTxtId + '"><a href="#nolink" class="item-1" data-index="1"><img src="static/images/packet_1.png" /></a><a href="#nolink" class="item-2" data-index="2"><img src="static/images/packet_2.png" /></a><a href="#nolink" class="item-3" data-index="3"><img src="static/images/packet_3.png" /></a><a href="#nolink" class="item-4" data-index="4"><img src="static/images/packet_4.png" /></a><a href="#nolink" class="item-5" data-index="5"><img src="static/images/packet_5.png" /></a></div>' + 
                        '   <p><input type="hidden" name="newActPacket" id="newActPacket" value="'+$form.action.base+$form.action.newActPacket+'" /><button id="' + btnId + '" type="button" class="btn btn-important right">确认</button></p>' + 
                        '</div>'
                    ),
                    callback = function(){
                        $('#' + urlTxtId).find('a').removeClass('current');

                        //展示第二个层
                        $maskDiv.show();
                        if($('#packetSetting').length>0){
                            $('#packetSetting').show();
                        }else{
                            var _left = 200 + parseFloat($modal.css('left')) + 'px',
                                html = '<div class="modal modal-small" id="packetSetting" style="display:block;left:'+_left+';top:'+$modalTopDefault+'">' +
                                        '<div class="header"><a href="#" class="close"><i class="fa fa-close"></i></a><b>配置红包</b><div class="cf"></div><div class="line"></div></div>'+
                                        '<table><tr><td>单个红包金额：</td><td><input type="number" name="totalMoney" id="totalMoney" min="1" max="100000000" oninput="if(value.length>9)value=value.slice(0,9)"  style="width:170px;"/></td></tr>' +
                                        '<tr><td>总份数：</td><td><input type="number" name="totalPoint" id="totalPoint" min="1" max="100000" style="width:170px;" oninput="if(value.length>6)value=value.slice(0,6)" /></td></tr>' +
                                        '<tr><td>单红包分享个数：</td><td><input type="number" name="totalOnly" id="totalOnly" min="1" max="100000" style="width:170px;" oninput="if(value.length>6)value=value.slice(0,6)" /></td></tr></table>' +
                                        '<div class="packet-setting"><button class="btn btn-important close" id="packetSave">保存</button> <button class="btn btn-important close">取消</button></div>' +
                                        '</div>';
                            $modal.parent().append(html);
                        }
                        
                        $('#packetSave').off('click').on('click',function(e){
                            var _loc = 'http://'+location.host+location.pathname;
                            $txt.append('<div id="'+dragId+'" class="appendDragBox locationGrabBonus" title="外边框生成页面后自动删除" style="width:414px;max-width:100%"><a href="grabBonus.html"><img src="'+_loc+'static/images/packet_big_'+tmpId+'_1.png"></a><div id="'+scaleId+'" class="JScaleBox"></div></div>'); //a内的结构不能变
                            jDrag('#'+dragId, '#'+scaleId, true);
                            packetSetting.totalMoney= $('#totalMoney').val();
                            packetSetting.totalPoint= $('#totalPoint').val();
                            packetSetting.totalOnly= $('#totalOnly').val();  
                        });

                        $('#packetSetting .close').on('click',function(){
                            $maskDiv.hide();
                            $('#packetSetting').hide();
                        });
                    };
                $modal.find('#' + urlTxtId).click(function(e){
                    $('#' + urlTxtId).find('a').removeClass('current');
                    $(e.target).parent().addClass('current');
                });
                $modal.find('#' + btnId).click(function(e){
                    var _current = $('#' + urlTxtId).children('.current');
                    if(_current.length>0){
                        tmpId = _current.attr('data-index');
                        commonCommand(e, 'addPacket', tmpId, callback);
                        packetSetting.tplId = tmpId;
                    }else{
                        alert('请选择红包模板');
                    }
                });
                return $modal;
            })()
        }
    ];

    /*绑定jquery插件
	* customMenus: 自定义菜单
    */
    $.fn.JEditor = function(customMenus){
    	var height = this.height(),
    		initContent = this.html(),
            $dropMenuContainer = $('<div></div>'),
            $toolTipContainer = $('<div></div>'),
            $window = $(window);

    	//加入自定义菜单
        if(customMenus){
            menus = $.extend(menus, customMenus);
        }

    	//渲染菜单（包括下拉菜单和弹出框）
        function createMenuElem(menu){
            if(menu.toString() === 'split'){
                //分割符
                return $('<div class="split"></div>');
            }
            var type = menu.type,
                txt = menu.txt,
                txtArr,
                title = menu.title,
                command = menu.command,  //函数或者字符串
                $dropMenu = menu.dropMenu,
                $modal = menu.modal,
                callback = menu.callback,
                cls = menu.class,
                appendCls = menu.appendClass,
                description = menu.description,
                $btn = $('<a class="btn btn-default" href="#"></a>');  //一定要有 herf='#'，否则无法监听blur事件
            if(typeof command === 'string'){
                command = $.trim(command);
            }

            //btn txt
            if(txt.indexOf('|') !== -1){
                txtArr = txt.split('|');
                txt = '<i class="' + txtArr[0] + '" style="' + txtArr[1] + '"></i>';
            }else{
                txt = '<i class="' + txt + '"></i>';
            }
            $btn.html(txt);

            //btn title
            if(title){
                $btn.attr('title', title);
            }
            if(cls){
                $btn.addClass(cls);
            }
            //普通按钮
            if(type === 'btn'){
                //记录commandName
                if(typeof command === 'string'){
                    $btn.attr('commandName', command);
                }

                //基本命令（command是字符串）
                if(typeof command === 'string'){
                    $btn.click(function(e){
                        commonCommand(e, command, undefined, callback);
                    });
                }
                //自定义命令（command是函数）
                if(typeof command === 'function'){
                    $btn.click(function(e){
                        command(e);  //如果command是函数，则直接执行command
                    });
                }
            }
            //下拉菜单
            else if(type === 'dropMenu'){
                $btn.addClass('btn-drop');
                $btn.append($('<i class="fa fa-angle-down"></i>'));

                //渲染下拉菜单
                $dropMenu.attr('class', 'drop-menu');
                $dropMenuContainer.append($dropMenu);
                function hideDropMenu(){
                    $dropMenu.hide();
                }
                $btn.click(function(e){
                    var btnTop = $btn.offset().top,
                        btnLeft = $btn.offset().left,
                        btnHeight = $btn.height();
                    $dropMenu.css({
                        'top': (btnTop + btnHeight + 5) + 'px',
                        'left': btnLeft + 'px'
                    });
                    $dropMenu.show();
                    e.preventDefault();
                }).blur(function(e){
                    setTimeout(hideDropMenu, 100);  //先执行完，再隐藏
                });

                //命令（使用事件代理）
                $dropMenu.on('click', 'a[commandValue]', function(e){
                    var $this = $(this),
                        value = $this.attr('commandValue');
                    commonCommand(e, command, value);
                });
            }
            //弹出框
            else if(type === 'modal'){
                //渲染modal
                $modal.attr('class', 'modal');
                if(appendCls){
                   $modal.addClass(appendCls); 
                }
                $modal.prepend($(
                    '<div class="header">' + 
                        '<a href="#" class="close"><i class="fa fa-close"></i></a>' + 
                        '<b>' + title + '</b>' + 
                        '<div class="cf"></div>' + 
                        '<div class="line"></div>' + 
                    '</div>'
                ));
                $modalContainer.append($modal);
                $btn.click(function(e){
                    var windowWidth = $window.width(),
                        windowHeight = $window.height(),
                        modalWidth = $modal.width(),
                        modalHeight = $modal.height();
                    $maskDiv.width(windowWidth);
                    $maskDiv.height(windowHeight);
                    $modal.css({
                        'top': $modalTopDefault,
                        'left': (windowWidth - modalWidth)/2 + 'px'
                    });

                    $maskDiv.show();
                    $modal.show();
                    e.preventDefault();
                });
                $modal.find('.close').click(function(e){
                    $maskDiv.hide();
                    $modal.hide();
                    e.preventDefault();
                });
            }

            //添加tooltips效果
            if(title){
                $btn.attr('title', '');
                var btnTop,
                    btnLeft,
                    btnWidth,
                    $toolTip = $('<div class="toolTip"></div>'),
                    $toolTipContent = $('<div class="content">' + title + '</div>'),
                    $toolTipFooter = $('<div class="footer"><i class="fa fa-caret-down"></i></div>'),
                    toolTipHeight,
                    toolTipWidth,
                    toolTipTop,
                    toolTipLeft,
                    timer;
                $toolTip.append($toolTipContent)
                        .append($toolTipFooter);
                $toolTipContainer.append($toolTip);

                function showToolTip(){
                    $toolTip.show();
                }
                $btn.mouseenter(function(){
                    btnTop = $btn.offset().top;
                    btnLeft = $btn.offset().left;
                    btnWidth = $btn.width();
                    toolTipHeight = $toolTip.height();
                    toolTipWidth = $toolTip.width();
                    toolTipTop = btnTop - toolTipHeight + 5;
                    toolTipLeft = btnLeft - (toolTipWidth-btnWidth)/2 + 3;
                    $toolTip.css({
                        'top': toolTipTop + 'px',
                        'left': toolTipLeft + 'px'
                    });
                    timer = setTimeout(showToolTip, 200);  //0.2s之后才显示tooltip，防止鼠标快速经过时会闪烁
                }).mouseleave(function(){
                    clearTimeout(timer);
                    $toolTip.hide();
                });
            }
            if(description){
                $btn.append('<p>'+description+'</p>');
            }

            return $btn;
        }
        $.each(menus, function(){
            var $menu = createMenuElem(this);
            $btnContainer.append($menu);
        });
        $btnContainer.append($('<div class="cf"></div>'))
                     .append($('<div class="line"></div>'));

    	//$txt光标发生变化时，保存selection，更新menu style
        $txt.on('focus click keyup', function(e){
            var keyForMoveCursor = false,
                kCodes = ' 33, 34, 35, 36, 37, 38, 39, 40, 8, 46 ';
            keyForMoveCursor = ( e.type === 'click' || e.type === 'focus' || (e.type === 'keyup' && kCodes.indexOf(e.keyCode) !== -1) );
            if (!keyForMoveCursor) {
                return;
            }
            saveSelection();
            updateMenuStyle();
        });

    	this.html('')
            .append($toolTipContainer)
            .append($maskDiv)
            .append($dropMenuContainer)
            .append($modalContainer)
            .append($btnContainer)
    		.append('<div class="toolTip btn-redo hide" data-next="edit"><div class="content">编辑背景</div><div class="footer"><i class="fa fa-caret-down"></i></div></div>')
    		.append($txt);

    	$txt.html(initContent);

    	return $txt;
    };

})(window);