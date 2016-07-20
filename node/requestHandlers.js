var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable"),
    url = require('url'),
    util = require('util'),
    fileName='';

function start(response,request) {
    var body = '<html>'+
        '<head>'+
        '<meta charset="UTF-8" />'+
        '</head>'+
        '<body>'+
        '<form action="/node/upload" enctype="multipart/form-data" '+
        'method="post">'+
        '<input type="file" name="upload" multiple="multiple">'+
        '<input type="submit" value="Upload file" />'+
        '</form>'+
        '</body>'+
        '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function upload(response, request) {
    console.log("Request handler 'upload' was called.");
    var form = new formidable.IncomingForm();
    form.uploadDir = "./upload";  
    console.log("about to parse1");
    form.parse(request, function(error, fields, files) {
        var types= files.upload.name.split('.'),
            suffix= String(types[types.length-1]),
            _fileName = new Date().getTime() +"_"+ parseInt(Math.random()*1000),
            _refer = request.headers.referer.replace('&edit=true', ''),  
            refer = _refer.substring(0,_refer.indexOf('?')); 

        fileName=_fileName+'.'+suffix;
        console.log("parsing done");
        fs.renameSync(files.upload.path, './upload/'+fileName); 
   
        response.writeHead(302, {
          'Location': _refer+'&imgUrl=' + fileName + '&picUserd='+ fields.picUserd + '&insertPicId=' +fields.insertPicId
        });
        // console.log(util.inspect({fields: fields, files: files}));

        response.end();
    });
}

function show(response) {
    console.log("Request handler 'show' was called.");
    fs.readFile("./upload/"+fileName, "binary", function(error, file) {
        if(error) {
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(error + "\n");
            response.end();
        } else {
            response.writeHead(200, {"Content-Type": "image/png"});
            response.write(file, "binary");
            response.end();
        }
    });
}

function uploadImg(response,request) {
    var arg=url.parse(request.url, true).query;
    fs.readFile("./upload/"+arg.imgUrl, "binary", function(error, file) {
        if(error) {
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(error + "\n");
            response.end();
        } else {
            response.writeHead(200, {"Content-Type": "image/png"});
            response.write(file, "binary");
            response.end();
        }
    });
}

function poster(response, request){
    console.log("now poster");
    // response.writeHead(200, {"X-XSS-Protection": 0});
    var arg=url.parse(request.url, true).query,
        __path= arg.diy ? 'poster/diy/'+arg.lId +'/'+arg.aId : 'poster/'+arg.lId +'/'+arg.aId,
        _path = '../'+__path,
        pageName=_path+'/'+arg.tId+'.html',
        __pageName=__path+'/'+arg.tId+'.html',
        bonusName=_path+'/'+'grabBonus.html',
        _refer = request.headers.referer,  
        refer = _refer.substring(0,_refer.indexOf('?')),
        d='';

    if(request.url!=="/favicon.ico"){
        request.on('data',function(_data){
            // var data = decodeURIComponent(data).replace(/\+/g,' ').replace('pageContent=','');
            d +=_data;  //debug 丢包
            try{
                var data = querystring.parse(decodeURIComponent(d))['pageContent'];
            }catch(e){
                console.log(e.name + ": " + e.message);
            }
            mkdirs(_path,'0777',function(){ 
                writeFile(pageName, data, function(){
                    if(data){
                       var _subStart = data.indexOf('packetSetting:{"tplId":"')
                        if(_subStart>0){  //写入抢红包第二个页面
                            var packetTplId = data.substring(_subStart+24,_subStart+25); //获取模板 id
                            if(parseInt(packetTplId)>0){
                                console.log("packet:create grapbonus page now");
                                var newData= data.replace(/<a href="#nolink" class="grabBonus".{0,15}>/,'<div class="show-ajax-data"><span class="data-get"></span><span class="data-share"></span><a href="#nolink" class="show-detail"></a>')
                                                 .replace('images/packet_big_'+packetTplId+'_1.png" ondragstart="return false"></a>','images/packet_big_'+packetTplId+'_2.png" ondragstart="return false"></div>')
                                                 .replace('<body>','<link type="text/css" href="../../../../static/css/grabBonus.css" rel="stylesheet"><body class="tpl_'+packetTplId+'">')
                                                 .replace('</body>','<script type="text/javascript" src="../../../../static/js/jquery-1.10.2.min.js"></script><script>$(function(){console.log("start ajax get hongbao");})</script>');
                                writeFile(bonusName, newData);
                            }
                        } 
                    }      
                })
            });
            
        });

        request.on("end",function(){
            console.log('form receive data success');
            response.writeHead(302, {
                'Location': refer+__pageName
            });
            response.end();
        });
    }

    function mkdirs(dirname, mode, callback){ //判断目录是否存在,不存在递归创建
        var path = require("path");
        fs.exists(dirname, function (exists){
            if(exists){
                // if(arg.newBlank){  //新生成页面
                //     console.log('file: '+pageName+' has already existed');
                //     return;
                // }
                callback();
            }else{
                console.log(path.dirname(dirname));
                mkdirs(path.dirname(dirname), mode, function (){
                    fs.mkdir(dirname, mode, callback);
                });
            }
        });
    }

    function writeFile(file, datas, callback){
        fs.open(file, 'w+', function opened(err, fd) { //文件覆盖 如果是追加用 a
            if (err) { throw err; }
            var writeBuffer = new Buffer('' + datas,'utf8'),
            // var writeBuffer = util.isBuffer(datas) ? datas : new Buffer('' + datas,'utf8'), //0.10以下node版本isBuffer报错
            bufferPosition = 0,
            bufferLength = writeBuffer.length, filePosition = null;
            // console.log(writeBuffer);
            fs.write(fd,writeBuffer,bufferPosition,bufferLength,filePosition,function wrote(err, written) {
                if (err) { throw err; }
                console.log('wrote ' + written + ' bytes');
               
                response.writeHead(200, {"Content-Type": "text/html"});
                fs.readFile(file,function (err,bufferData){
                    response.end(bufferData);
                    callback && callback();
                });
            });
        });
    }
}

exports.start = start;
exports.upload = upload;
exports.show = show;
exports.poster = poster;
exports.uploadImg = uploadImg;