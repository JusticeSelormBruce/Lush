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
const handler = require("./handler");
const helper = require("./helper");
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

  //get chosen handler
  let chosenHandler =
    typeof router[trimmedPath] !== "undefined"
      ? router[trimmedPath]
      : handler.notFound;
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
      method: method.toLowerCase(),
      headers: headers,
      query: queryStringObject,
      payload: helper.parseObject(buffer),
    };

    //pass payload to chosen handler  and get statusCode, response object and content-type
    chosenHandler(data, function (statusCode, payload, content_type) {
      //default status to 200 if not provided
      var statusCode =
        typeof statusCode == "number" && statusCode % 1 == 0 ? statusCode : 200;

      //default content type to json unless otherwise
      var content_type =
        typeof content_type == "string" ? content_type : "json";

      var payloadString = "";
      if (content_type == "json") {
        res.setHeader("Content-Type", "application/json");
        //payload should be type of object, default t o empty object if not provided
        var payload = typeof payload == "object" ? payload : {};
        payloadString = JSON.stringify(payload);
      }
      if (content_type == "html") {
        res.setHeader("Content-Type", "text/html");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (content_type == "css") {
        res.setHeader("Content-Type", "text/css");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (content_type == "png") {
        res.setHeader("Content-Type", "image/png");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (content_type == "favicon") {
        res.setHeader("Content-Type", "image/x-icon");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (content_type == "plain") {
        res.setHeader("Content-Type", "text/plain");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (content_type == "js") {
        res.setHeader("Content-Type", "text/javascript");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (content_type == "jpg") {
        res.setHeader("Content-Type", "image/jpeg");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
};

//server init  script
server.init = function () {
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
};

// router
var router = {
  "": handler.index,
  ping: handler.ping,
  'api/users':handler.users
};

module.exports = server;
