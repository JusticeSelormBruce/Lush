/**
 * base entry file for workers
 */

//Dependencies
const http = require("http");
const https = require("https");
const _url = require("url");
const path = require("path");
const _data = require("./data");
const helper = require("./helper");
const _logs = require("./logs");
const util = require("util");
const debug = util.debuglog("workers");

//  workers container

let workers = {};

workers.loop = function () {
  setInterval(function () {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

//gather all checks
workers.gatherAllChecks = function () {
  _data.list("checks", function (err, list) {
    if (!err && list && list.length > 0) {
      //read in data
      list.forEach(function (fileName) {
        _data.read("checks", fileName, function (err, data) {
          if (!err && data) {
            var parsedData = helper.parseObject(data);

            workers.processAllChecks(parsedData, fileName);
          } else {
            debug(err);
          }
        });
      });
    } else {
      debug("could not read files or files does not exist");
    }
  });
};

workers.processAllChecks = function (file, fileName) {
  var protocol =
    typeof file.protocol == "string" &&
    ["http", "https"].indexOf(file.protocol.trim()) > -1
      ? file.protocol.trim()
      : false;
  var successCodes =
    typeof file.successCodes == "object" &&
    file.successCodes instanceof Array &&
    file.successCodes.length > 0
      ? file.successCodes
      : false;
  var url =
    typeof file.url == "string" && file.url.trim().length > 1
      ? file.url.trim()
      : false;
  var timeoutSeconds =
    typeof file.timeoutSeconds == "number" && file.timeoutSeconds % 1 == 0
      ? file.timeoutSeconds
      : false;
  var method =
    typeof file.method == "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(file.method.trim()) > -1
      ? file.method.trim()
      : false;
  if (protocol && successCodes && url && timeoutSeconds && method) {
    //set initial status of ping result
    var pingOutcome = {
      error: false,
      responseCode: false,
    };

    //  check  sent  status
    var checkOutcome = false;

    // determine which protocol to use
    var protocolToUse = protocol == "http" ? http : https;

    //parse hostname
    var parsedUrl = _url.parse(protocol + "://" + url, true);
    var hostname = parsedUrl.hostname;
    var path = parsedUrl.path;

    //form request object
    var requestObject = {
      protocol: protocol + ":",
      method: method.toUpperCase(),
      path: path,
      hostname: hostname,
      timeoutSeconds: timeoutSeconds * 1000,
    };
    //create a request and sent it off
    var req = protocolToUse.request(requestObject, function (res) {
      //get  status code
      var status = res.statusCode;

      pingOutcome.responseCode = status;
      if (!checkOutcome) {
        workers.performCheckOutcome(file, pingOutcome, fileName);
        checkOutcome = true;
      }
    });

    req.on("error", function (err) {
      pingOutcome.error = { error: true, value: err };
      workers.performCheckOutcome(file, pingOutcome, fileName);
      checkOutcome = true;
    });

    req.on("timeout", function (timeout) {
      pingOutcome.error = { error: true, value: timeout };
      workers.performCheckOutcome(file, pingOutcome, fileName);
      checkOutcome = true;
    });

    //send of the request
    req.end();
  } else {
    debug("one or ore fields are not valid");
  }
};

workers.performCheckOutcome = function (file, outcomes, fileName) {
  //check  if  site is down or up
  var state =
    !outcomes.error &&
    outcomes.responseCode &&
    file.successCodes.indexOf(outcomes.responseCode) > -1
      ? "up"
      : "down";
  //update check
  file.state = state;
  file.checkOutcome = outcomes;
  file.lastCheck = Date.now();
  //persist data to file
  _data.update("checks", fileName, file, function (err) {
    if (!err) {
      console.log("updarte completed");
      // log to file
      workers.log(file, fileName);
    } else {
      console.log("error updating checks and loging to file");
      debug(err);
    }
  });
};
workers.log = function (file, fileName) {
  _logs.append(file, fileName, function (err) {
    if (!err) {
      debug("file logging successful");
    } else {
      debug(err);
    }
  });
};

// rotate  logs
 workers.rotateLogs  = function(){
  _logs.list(false, function (err, files) {
    if (!err && files && files.length > 0) {
      files.forEach(function (file) {
        var logId = file.replace(".log", "");
       
  
        var newFile = file + "-" + Date.now();
        
        //compress file
        _logs.compress(logId, newFile, function (err) {
          if (!err) {
            //truncate file
            _logs.truncate(logId, function (err) {
              if (!err) {
                debug("file truncated")
              } else {
                debug(err);
              }
            });
          } else {
            debug(err);
          }
        });
      });
    } else {
      debug(err);
    }
  });
 }

//log rotation
workers.logRotation = function () {
  setInterval(function () {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

workers.init = function () {
  workers.gatherAllChecks();
  workers.loop();
  workers.rotateLogs();
  workers.logRotation();
};

module.exports = workers;
