/**
 * base file for  logs
 */

//Dependencies

const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

//container
let logs = {};

//base url

const baseUrl = path.join(__dirname + "../../.data/logs/");

// append data to log  to logs
logs.append = function (file, fileName, callback) {
  fs.open(
    baseUrl + "/" + fileName + ".log",
    "a",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        var stringFile = JSON.stringify(file);
        fs.appendFile(
          fileDescriptor,
          stringFile + "\n",
          "utf-8",
          function (err) {
            if (!err) {
              fs.close(fileDescriptor, function (err) {
                if (!err) {
                  callback(false);
                } else {
                  callback({
                    Error: "could not close file after appending to file",
                  });
                }
              });
            } else {
              callback({ Error: "could not append file" });
            }
          }
        );
      } else {
        callback({ Error: "could not open file for appending" });
      }
    }
  );
};

logs.list = function (includeZipFiles, callback) {
  var _list = [];
  //list all files in the logs dir for zipping
  fs.readdir(baseUrl, "utf-8", function (err, logList) {
    if (!err && logList && logList.length > 0) {
      //get each .log file  and  .gz.b64 if provided
      logList.forEach(function (log_file) {
        if (log_file.indexOf(".log") > -1) {
          _list.push(log_file.replace(".log", ""));
        }

        if (log_file.indexOf(".gz.b64") && includeZipFiles) {
          _list.push(log_file.replace(".gz.b64", ""));
        }
      });
      callback(false, _list);
    } else {
      callback({ Error: "could not read logs" });
    }
  });
};

//compress file
logs.compress = function (logId, newFileId, callback) {
  var sourceFile = logId + ".log";
  var destFile = newFileId + ".gz.b64";
  console.log(logs.baseUrl + sourceFile)

  //read source file
  fs.readFile(baseUrl + sourceFile, "utf-8", function (err, sourceData) {
    if (!err && sourceData) {
      //zip file using  .gz.b64
      zlib.gzip(sourceData, function (err, buffer) {
        if (!err && buffer) {
          //write compress file to destination file
          fs.open(baseUrl + destFile, "wx", function (err, fileDescriptor) {
            if (!err && fileDescriptor) {
              //write compress data to destination file
              fs.writeFile(
                fileDescriptor,
                buffer.toString("base64"),
                function (err) {
                  if (!err) {
                    //close file after writing
                    fs.close(fileDescriptor, function (err) {
                      if (!err) {
                        callback(false);
                      } else {
                        callback({
                          Error: "could not close file after writing",
                        });
                      }
                    });
                  } else {
                    callback({ Error: "could  write data to file" });
                  }
                }
              );
            } else {
              callback({ Error: "could not open file  writing" });
            }
          });
        } else {
          callback({ Error: "could not zip  file" });
        }
      });
    } else {
      callback({ Error: "could not read file 1" + err });
    }
  });
};

//decompress log file

logs.decompress = function (fileName, callback) {
  var file_name = fileName + ".gz.b64";

  fs.readFile(baseUrl + file_name, "utf-8", function (err, str) {
    if (!err && str) {
      // convert buffer to regular string   / aka inflate the data
      var inputString = Buffer.from(str, "base64");

      //decompress data
      zlib.unzip(inputString, function (err, data) {
        if (!err && data) {
          var unzippedStr = data.toString();

          callback(false, unzippedStr);
        } else {
          callback({ Error: "could not unzip file" });
        }
      });
    } else {
      callback({ Error: "could not read file" });
    }
  });
};

logs.truncate = function (file, callback) {
  var fileName = file + ".log";
  fs.truncate(baseUrl + fileName, 0, function (err) {
    if (!err) {
      callback(false);
    } else {
      callback({ Error: "could no truncate file" });
    }
  });
};
module.exports = logs;
