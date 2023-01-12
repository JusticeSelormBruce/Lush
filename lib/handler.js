/**
 * Base file for handling all incoming http and https request
 */

//Dependencies
const helper = require("./helper");
const _data = require("./data");

let handler = {};

/**
 * users handler
 * accepted methods get,post,put,delete
 */

handler.users = function (data, callback) {
  var acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(data.method) > -1) {
    handler.users._method[data.method](data, callback);
  } else {
    callback(400, { Error: "Method not acceptable for this route" }, "json");
  }
};

//users container
handler.users._method = {};

//post/ create user
handler.users._method.post = function (data, callback) {
  /**
   * required fields  - phone, password, tosAgreement
   *  optional fields - none
   */
  console.log(typeof data.payload);
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length >= 8
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;
  if (phone && password && tosAgreement) {
    //harsh user password
    if (helper.hashPassword(password)) {
      //form user object to save
      var userObject = {
        phone: phone,
        password: helper.hashPassword(password),
        tosAgreement: tosAgreement,
      };

      //persist user data to file
      _data.create("users", phone, userObject, function (err) {
        if (!err) {
          callback(302, { success: "user created " }, "json");
        } else {
          callback(
            500,
            { Error: " something happened , try again later " },
            "json"
          );
        }
      });
    } else {
      callback(
        500,
        { Error: "Could not harsh password, please try again later" },
        "json"
      );
    }
  } else {
    callback(
      400,
      { Error: "one or more fields did not match requirement" },
      "json"
    );
  }
};

//get a user
/**
 * @todo only authenticated users can  get user data
 */
handler.users._method.get = function (data, callback) {
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  if (phone) {
    //get user data
    _data.read("users", phone, function (err, userData) {
      if (!err && userData) {
        //parse string to json
        var parsedData = helper.parseObject(userData);
        if (parsedData) {
          delete parsedData.password;
          callback(200, parsedData, "json");
        } else {
          callback(500, { Error: "could not parse data" }, "json");
        }
      } else {
        callback(404, { Error: "No matching  record found" }, "json");
      }
    });
  } else {
    callback(400, { Error: "Invalid details" }, "json");
  }
};

//user put
/**
 * @todo only authenticated users can  update user data
 */
handler.users._method.put = function (data, callback) {
  var phone =
  typeof data.query.phone == "string" && data.query.phone.trim().length == 10
    ? data.query.phone.trim()
    : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length >= 8
      ? data.payload.password.trim()
      : false;
     

  if (password && phone) {
    //get user to update
    _data.read("users", phone, function (err, data) {
      if (!err && data && data !== null) {
        //parse data
        var parsedData = helper.parseObject(data);
        if (parsedData) {
          parsedData.password = helper.hashPassword(password) ;
          //update record
          _data.update("users", phone, parsedData, function (err) {
            if (!err) {
              callback(302, { success: "User updated" }, "json");
            } else {
              callback(400, { Error: "Could not update user" }, "json");
            }
          });
        } else {
          callback(500, { Error: "Error parsing data" }, "json");
        }
      } else {
        callback(404, { Error: "User not found" }, "json");
      }
    });
  } else {
    callback(400, { Error: " invalid details" }, "json");
  }
};



//users - delete
/**
 * @todo only authenticated users can  delete user data
 */
handler.users._method.delete  = function(data,callback){
  var phone =
  typeof data.query.phone == "string" && data.query.phone.trim().length == 10
    ? data.query.phone.trim()
    : false;

    if(phone){
      _data.delete('users',phone, function(err){
        if(!err){
          callback(200,{"success":"user deleted"},'json')

        }else{
          callback(400,{"Error":"Could not delete user"}, 'json')
        }
      })

    }else{
      callback(400,{"Error":"Missing filed"},'json')
    }
}

handler.index = function (data, callback) {
  callback(200, "<html><body><h1>Hello World</h1></body></html>", "html");
};

//

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
