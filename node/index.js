var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {}
handle["/node/"] = requestHandlers.start;
handle["/node/start"] = requestHandlers.start;
handle["/node/upload"] = requestHandlers.upload;
handle["/node/show"] = requestHandlers.show;
handle["/node/poster"] = requestHandlers.poster;
handle["/node/uploadImg"] = requestHandlers.uploadImg;

server.start(router.route, handle);
