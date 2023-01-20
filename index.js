/**
 * Base file for  app
 */

// Dependencies
var server = require("./lib/server");
var workers  = require('./lib/workers')

// app container
let app = {};

//app init script
app.init = function () {
  server.init();

  //call workers
  workers.init();
};

//call init script

app.init();
