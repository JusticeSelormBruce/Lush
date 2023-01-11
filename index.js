/**
 * Base file for  app
 */

// Dependencies
var server = require("./lib/server");

// app container
let app = {};

//app init script
app.init = function () {
  server.init();
};

//call init script

app.init();
