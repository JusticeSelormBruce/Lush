/**
 * Base file for handling all incoming http and https request
 */

//Dependencies

let handler = {};

//

handler.index = function (data, callback) {
   
  callback(200, { 'info': "index page" }, "json");
};

//ping handler
handler.ping = function (data, callback) {
  callback(200, { info: "server is up and  running  " }, "json");
};

// not found handler
handler.notFound = function (data, callback) {
  callback(404, { Error: "oops!!, specified route does not exist" }, "json");
};

//export handler
module.exports = handler;
