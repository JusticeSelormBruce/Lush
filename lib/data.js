/**
 * Base file for  data file
 */

//Dependencies
const path = require("path");
const fs = require("fs");
const helper = require("./helper");

//base url

const baseUrl = path.join(__dirname +"../../.data/");

//base data container
let _data = {};

//data.create
_data.create = function (dir, file, data, callback) {
  //string object
  var stringObject = JSON.stringify(data);
  console.log( baseUrl + dir + "/" + file + ".json")
  //open file for writing
  fs.open(
    baseUrl + dir + "/" + file + ".json",
    "wx",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        fs.writeFile(fileDescriptor, stringObject, function (err) {
          if (!err) {
            //close file after writing
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback({ Error: " Could not close file" });
              }
            });
          } else {
            callback({ Error: "Could not write  to file" });
          }
        });
      } else {
        callback({ Error: " could not open file " + err });
      }
    }
  );
};

//read file
_data.read = function (dir, file, callback) {
  //open file for reading
  fs.readFile(
    baseUrl + dir + "/" + file + ".json",
    "utf-8",
    function (err, data) {
      if (!err && data) {
        callback(false, data);
      } else {
        callback({ Error: " error opening specified file " + err });
      }
    }
  );
};

//update file

_data.update = function (dir, file, data, callback) {
  //open file for reading
  
  fs.open(
    baseUrl + dir + "/" + file + ".json",
    "r+",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        //truncate file
        fs.ftruncate(fileDescriptor, function (err) {
          if (!err) {
            //write to file
            var stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, function (err) {
              if (!err) {
                //close file
                fs.close(fileDescriptor, function (err) {
                  if (!err) {
                    callback(false);
                  } else {
                    callback({
                      Error: "could not close file after writing to it",
                    });
                  }
                });
              } else {
                callback({
                  Error:
                    "'could not write to file while trying to update record ",
                  err,
                });
              }
            });
          } else {
            callback({ Error: " could not truncate file ", err });
          }
        });
      } else {
        callback({ Error: "could not open file " + err });
      }
    }
  );
};

//delete file

_data.delete = function (dir, file, callback) {
  fs.unlink(baseUrl + dir + "/" + file + ".json", function (err) {
    if (!err) {
      callback(false);
    } else {
      callback({
        Error:
          "Could not delete file, file may not exist or may have been moved",
      });
    }
  });
};


module.exports = _data;