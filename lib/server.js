/**
 * Base file for server
 */

//Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const config = require("./config");
const path = require("path");
const fs = require("fs");
// server container
let server = {};

//create http server
server.httpServer = http.createServer(function (req, res) {
  server.serverLogic(res, req);
});

//certificate base path
var certBasePath = path.join(__dirname + "/../http/");
//https server options

server.serverOptions = {
  key: fs.readFileSync(certBasePath + "key.pem"),
  cert: fs.readFileSync(certBasePath + "cert.pem"),
};
//create https server
server.httpsServer = https.createServer(
  server.serverOptions,
  function (req, res) {
    server.serverLogic(res, req);
  }
);

// start http server
server.httpServer.listen(config.httpPort, function () {
  console.log(
    "http server is live and listening on port " +
      config.httpPort +
      " in " +
      config.envName +
      " mode"
  );
});

// start http server
server.httpsServer.listen(config.httpsPort, function () {
  console.log(
    "https server is live and listening on port " +
      config.httpsPort +
      " in " +
      config.envName +
      " mode"
  );
});

server.serverLogic = function (res, req) {
  //get request path
  var parsedUrl = url.parse(req.url, true);

  //get path
  var path = parsedUrl.pathname;

  // get trimmed path
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  //get method
  var method = req.method;
  //get headers
  var headers = req.headers;

  // query String Object
  var queryStringObject = parsedUrl.query;

  //get incoming payload
  var buffer = "";
  var decoder = new StringDecoder("utf-8");

  req.on("data", function (data) {
    buffer += decoder.write(data);
  });

  req.on("end", function () {
    buffer += decoder.end();

    //payload object
    var data = {
      path: trimmedPath,
      method: method,
      headers: headers,
      query: queryStringObject,
      payload: buffer,
    };

    console.log(JSON.stringify(data));
    res.end("hello world from server logic");
  });
};

server.unifiedServer = function () {};
//server init  script
server.init = function () {};

module.exports = server;
