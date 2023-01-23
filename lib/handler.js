/**
 * Base file for handling all incoming http and https request
 */

//Dependencies
const helper = require("./helper");
const _data = require("./data");
const dns = require("dns");
const _url = require("url");
const config = require("./config");
const util = require("util");
const path = require("path");
const debug = util.debuglog("handlers");

//handler container

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
   *  optional fields - role
   */

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
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  if (phone && tokenId) {
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
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
        callback(403, {
          Error: "no matching details found or token has expired",
        });
      }
    });
    //get user data
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
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;

  if (password && phone && tokenId) {
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
        _data.read("users", phone, function (err, data) {
          if (!err && data && data !== null) {
            //parse data
            var parsedData = helper.parseObject(data);
            if (parsedData) {
              parsedData.password = helper.hashPassword(password);
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
        callback(403, {
          Error: "no matching details found or token has expired",
        });
      }
    });
    //get user to update
  } else {
    callback(400, { Error: " invalid details" }, "json");
  }
};

//users - delete

handler.users._method.delete = function (data, callback) {
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;

  if (phone && tokenId) {
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
        _data.delete("users", phone, function (err) {
          if (!err) {
            callback(200, { success: "user deleted" }, "json");
          } else {
            callback(400, { Error: "Could not delete user" }, "json");
          }
        });
      } else {
        callback(403, {
          Error: "no matching details found or token has expired",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing filed" }, "json");
  }
};

//Token handler
handler.tokens = function (data, callback) {
  var acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(data.method) > -1) {
    handler.tokens._method[data.method](data, callback);
  } else {
    callback(400, { Error: "Method not acceptable for this route" }, "json");
  }
};

//token handler container
handler.tokens._method = {};

handler.tokens._method.post = function (data, callback) {
  //required  fields - phone,password
  //optional fields -none
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == "10"
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length >= "8"
      ? data.payload.password.trim()
      : false;
  if (phone && password) {
    //generate token id
    var tokenId = helper.generateRandomString(25);
    //token expire
    var expire = Date.now() + 1000 * 60 * 60;

    var tokenObject = {
      tokenId: tokenId,
      phone: phone,
      expire: expire,
    };

    // persist token to disk/file

    _data.create("tokens", tokenId, tokenObject, function (err) {
      if (!err) {
        callback(200, tokenObject, "json");
      } else {
        callback(400, { Error: "something happened, could not create token" });
      }
    });
  } else {
    callback(
      400,
      { Error: "phone or password does not match required standard, retry" },
      "json"
    );
  }
};

//token get

handler.tokens._method.get = function (data, callback) {
  //required filed -  tokenId,phone
  //optional   fields - none
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;

  if (phone && tokenId) {
    //validate token to user phone

    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
        _data.read("tokens", tokenId, function (err, tokenObject) {
          if (!err && tokenObject) {
            callback(200, helper.parseObject(tokenObject), "json");
          } else {
            callback(500, { Error: "system error, please try again" }, "json");
          }
        });
      } else {
        callback(400, { Error: "one or more fields are invalid" }, "json");
      }
    });
  } else {
    callback(400, { Error: "one or more fields are invalid" }, "json");
  }
};

handler.index = function (data, callback) {
  callback(200, "<html><body><h1>Hello World</h1></body></html>", "html");
};

//token update aka extend
handler.tokens._method.put = function (data, callback) {
  //required filed -  tokenId,phone
  //optional   fields - none
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var tokenId =
    typeof data.payload.token == "string" &&
    data.payload.token.trim().length == 26
      ? data.payload.token.trim()
      : false;

  if (phone && tokenId) {
    //validate token to user phone

    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
        _data.read("tokens", tokenId, function (err, data) {
          if (!err && data) {
            //extend token life if only it does ont expire
            var tokenObject = helper.parseObject(data);
            if (tokenObject) {
              if (tokenObject.expire > Date.now()) {
                //extend token
                tokenObject.expire = Date.now() + 1000 * 60 * 15;
                //persist changes to disk
                _data.update("tokens", tokenId, tokenObject, function (err) {
                  if (!err) {
                    callback(200, { success: "token life extended" }, "json");
                  } else {
                    callback(
                      400,
                      { Error: "could not extend token life" },
                      "json"
                    );
                  }
                });
              } else {
                callback(403, { Error: "time out, please login" }, "json");
              }
            } else {
              callback(
                500,
                { Error: "Internal server error, try again later" },
                "json"
              );
            }
          } else {
            callback(
              500,
              { Error: "something happened, please try again" },
              "json"
            );
          }
        });
      } else {
        callback(400, {
          Error: "invalid details supplied for token update/ extension",
        });
      }
    });
  }
};

//token delete a.k.a. logout

handler.tokens._method.delete = function (data, callback) {
  var tokenId =
    typeof data.payload.token == "string" &&
    data.payload.token.trim().length == 26
      ? data.payload.token.trim()
      : false;
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  if (tokenId && phone) {
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
        _data.delete("tokens", tokenId, function (err) {
          if (!err) {
            callback(200, { success: "logout successful" }, "json");
          } else {
            callback(400, { Error: "could not delete token" }, "json");
          }
        });
      } else {
        callback(403, { Error: "time out, please login" }, "json");
      }
    });
  } else {
    callback(403, { Error: "could not log out, try again" }, "json");
  }
};

//checks handler
handler.checks = function (data, callback) {
  var acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(data.method) > -1) {
    handler.checks._method[data.method](data, callback);
    console.log(data.method, typeof handler.checks._method[data.method]);
  } else {
    callback(400, { Error: "Method not acceptable for this route" }, "json");
  }
};

// checks container
handler.checks._method = {};

//check-post handler
handler.checks._method.post = function (data, callback) {
  /**
   * required fields  - protocol, successCodes, url, timeoutSeconds, method
   * optional fields - none
   */
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol.trim()) > -1
      ? data.payload.protocol.trim()
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 1
      ? data.payload.url.trim()
      : false;
  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 == 0
      ? data.payload.timeoutSeconds
      : false;
  var method =
    typeof data.payload.method == "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(data.payload.method.trim()) > -1
      ? data.payload.method.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;

  if (
    protocol &&
    successCodes &&
    url &&
    timeoutSeconds &&
    method &&
    phone &&
    tokenId
  ) {
    //validate user
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
        //form complete url
        var parsedUrl = _url.parse(protocol + "://" + url, true);
        var hostName =
          typeof parsedUrl.hostname == "string" ? parsedUrl.hostname : false;

        if (hostName) {
          dns.resolve(hostName, function (err, records) {
            if (!err && records) {
              //generate check id
              var checkId = helper.generateRandomString(20);
              //persist check data to disk
              var checkDataObject = {
                checkId: checkId,
                protocol: protocol,
                successCodes: successCodes,
                url: url,
                timeoutSeconds,
                timeoutSeconds,
                method: method,
                phone: phone,
              };

              _data.create("checks", checkId, checkDataObject, function (err) {
                if (!err) {
                  callback(200, { success: "checks created" }, "json");
                } else {
                  console.log(err);
                  callback(
                    500,
                    {
                      Error:
                        "we could not create checks, please try again later ",
                    },
                    "json"
                  );
                }
              });
            } else {
              callback(
                404,
                { Error: "could not resolve url, please provide a valid url" },
                "json"
              );
            }
          });
        }
      } else {
        callback(403, { Error: " user authentication failed" });
      }
    });
  } else {
    callback(
      400,
      { Error: "one or more fields do not meet requirement" },
      "json"
    );
  }
};

//checks -get
handler.checks._method.get = function (data, callback) {
  /**
   * required fields  -  phone,token, checkId
   * optional fields - none
   */
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var checkId =
    typeof data.query.checkid == "string" &&
    data.query.checkid.trim().length == 21
      ? data.query.checkid.trim()
      : false;

  if (tokenId && phone && checkId) {
    //authenticate user
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
        //get check  object
        _data.read("checks", checkId, function (err, checkData) {
          if (!err && checkData && checkData != null) {
            //check if this check belongs to the user requesting it
            var parsedCheckData = helper.parseObject(checkData);
            if (parsedCheckData && parsedCheckData.phone == phone) {
              callback(200, parsedCheckData, "json");
            } else {
              callback(500, { Error: "un-authorized" }, "json");
            }
          } else {
            callback(404, { Error: "No records found" }, "json");
          }
        });
      } else {
        callback(403, { Error: "un-authorized" }, "json");
      }
    });
  } else {
    callback(400, { Error: "one or more fields are invalid" }, "json");
  }
};

// checks  -put
handler.checks._method.put = function (data, callback) {
  /**
   * required fields -  token, phone, checkId
   * optional - protocol, method,  url, timeoutSeconds, successCodes
   */

  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var checkId =
    typeof data.query.checkid == "string" &&
    data.query.checkid.trim().length == 21
      ? data.query.checkid.trim()
      : false;

  var protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol.trim()) > -1
      ? data.payload.protocol.trim()
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 1
      ? data.payload.url.trim()
      : false;
  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 == 0
      ? data.payload.timeoutSeconds
      : false;
  var method =
    typeof data.payload.method == "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(data.payload.method.trim()) > -1
      ? data.payload.method.trim()
      : false;
  if (tokenId && phone && checkId) {
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
        if (protocol || successCodes || url || timeoutSeconds || method) {
          _data.read("checks", checkId, function (err, checkData) {
            if (!err && checkData) {
              var parsedCheckData = helper.parseObject(checkData);
              if (parsedCheckData) {
                if (protocol) {
                  parsedCheckData.protocol = protocol;
                }
                if (successCodes) {
                  parsedCheckData.successCodes = successCodes;
                }
                if (url) {
                  parsedCheckData.url = url;
                }
                if (timeoutSeconds) {
                  parsedCheckData.timeoutSeconds = timeoutSeconds;
                }
                if (method) {
                  parsedCheckData.method = method;
                }

                //persist data to disk
                _data.update(
                  "checks",
                  checkId,
                  parsedCheckData,
                  function (err) {
                    if (!err) {
                      callback(
                        200,
                        { success: "record updated successfully" },
                        "json"
                      );
                    } else {
                      callback(
                        400,
                        { Error: "could not update record, please try again" },
                        "json"
                      );
                    }
                  }
                );
              } else {
                callback(500, { Error: "internal server error" }, "json");
              }
            } else {
              callback(404, { Error: "No matching records found" }, "json");
            }
          });

          if (protocol) {
          }
        } else {
          callback(403, { Error: "at least one field is required" }, "json");
        }
      } else {
        callback(400, { Error: "un-authorized" }, "json");
      }
    });
  } else {
    callback(
      400,
      { Error: " one or more fields do not match requirement" },
      "json"
    );
  }
};

//delete  - check
handler.checks._method.delete = function (data, callback) {
  /**
   * required fields token, phone, checkid
   * optional  - none
   */
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var checkId =
    typeof data.query.checkid == "string" &&
    data.query.checkid.trim().length == 21
      ? data.query.checkid.trim()
      : false;
  //authenticate user
  handler.authenticateUser(tokenId, phone, function (bool) {
    if (bool) {
      _data.delete("checks", checkId, function (err) {
        if (!err) {
          callback(200, { success: "check deleted successfully" }, "json");
        } else {
          callback(500, { Error: "could not delete check" }, "json");
        }
      });
    } else {
      callback(403, { Error: "un-authorized" }, "json");
    }
  });
};

//category handler
handler.categories = function (data, callback) {
  var acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(data.method) > -1) {
    handler.categories._method[data.method](data, callback);
  } else {
    callback(400, { Error: "Method not acceptable for this route" }, "json");
  }
};

handler.categories._method = {};

//Categories - post
handler.categories._method.post = function (data, callback) {
  /**
   * required fields  -   name, description, banner
   * optional - none
   */
  var name =
    typeof data.payload.name == "string" && data.payload.name.trim().length > 0
      ? data.payload.name.trim()
      : false;
  var description =
    typeof data.payload.description == "string" &&
    data.payload.description.trim().length > 0
      ? data.payload.description.trim()
      : false;
  var banner =
    typeof data.payload.banner == "string" &&
    data.payload.banner.trim().length > 0
      ? data.payload.banner.trim()
      : false;
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;

  if (name && description && banner && phone && tokenId) {
    // form  category  object

    //generate a category id
    var id = helper.generateRandomString(30);

    let catObject = {
      id: id,
      name: name,
      description: description,
      banner: banner,
    };

    //only authenticated user    with admin role can create a category
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (
        bool &&
        (config.isAdmin.phone1 === phone || config.isAdmin.phone2 == phone)
      ) {
        //prevent  duplicate entry  for a category
        _data.checkForDuplicate("categories", name, function (bool) {
          console.log(bool, "duplicate status");
          if (!bool) {
            //persist file to disk
            _data.create("categories", name, catObject, function (err) {
              if (!err) {
                callback(200, { success: "category created" }, "json");
              } else {
                callback(400, {
                  Error: "could not   persist  data to file",
                });
              }
            });
          } else {
            callback(403, { Error: "category already exist" }, "json");
          }
        });
      } else {
        callback(403, { Error: "un-authorized" }, "json");
      }
    });
  } else {
    callback(400, { Error: "one or more filed is not valid" }, "json");
  }
};

//Categories - get

handler.categories._method.get = function (data, callback) {
  var category =
    typeof data.query.name == "string" && data.query.name.trim().length > 0
      ? data.query.name.trim()
      : false;

  if (category) {
    _data.read("categories", category.toUpperCase(), function (err, record) {
      if (!err && record) {
        callback(200, helper.parseObject(record), "json");
      } else {
        callback(400, { Error: "no matching record found" }, "json");
      }
    });
  } else {
    callback(400, { Error: "one or more fields are missing" });
  }
};

// categories - put
handler.categories._method.put = function (data, callback) {
  //validate  data
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var name =
    typeof data.query.name == "string" && data.query.name.trim()
      ? data.query.name.trim()
      : false;

  var description =
    typeof data.payload.description == "string" &&
    data.payload.description.trim().length > 0
      ? data.payload.description.trim()
      : false;
  var banner =
    typeof data.payload.banner == "string" &&
    data.payload.banner.trim().length > 0
      ? data.payload.banner.trim()
      : false;
  if (tokenId && phone && name) {
    //only authenticated user    with admin role can create a category
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (
        bool &&
        (config.isAdmin.phone1 === phone || config.isAdmin.phone2 == phone)
      ) {
        //read data to update
        _data.read("categories", name, function (err, data) {
          if (!err && data) {
            var dataObject = helper.parseObject(data);
            if (description || banner) {
              if (description) {
                dataObject.description = description;
              }
              if (banner) {
                dataObject.banner = banner;
              }
              //update
              _data.update("categories", name, dataObject, function (err) {
                if (!err) {
                  callback(200, dataObject, "json");
                } else {
                  callback(400, { Error: "could no update record" }, "json");
                }
              });
            } else {
              callback(
                400,
                { Error: "at least one field is required" },
                "json"
              );
            }
          } else {
            callback(404, { Error: "no records found" }, "json");
          }
        });
      }
    });
  } else {
    callback(400, { Error: "one or more fields do not match requirement" });
  }
};
//
/**
 * @Todo delete all associated product when a category is deleted
 *
 */
handler.categories._method.delete = function (data, callback) {
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var name =
    typeof data.query.name == "string" && data.query.name.trim()
      ? data.query.name.trim()
      : false;
  if (tokenId && phone && name) {
    //only authenticated user    with admin role can delete a category
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (
        bool &&
        (config.isAdmin.phone1 === phone || config.isAdmin.phone2 == phone)
      ) {
        // delete all associated products
        console.log("hello world");
        _data.read("categories", name, function (err, data) {
          if (!err && data && data.length > 0) {
            var dataObj = helper.parseObject(data);

            if (dataObj.products.length > 0) {
              var counter = 0;
              var childLength = dataObj.products.length;
              dataObj.products.forEach(function (product) {
                counter++;
                _data.delete("products", product, function (err) {
                  if (!err) {
                    //read data to update
                    _data.delete("categories", name, function (err) {
                      if (!err) {
                        callback(200, { success: "category deleted" }, "json");
                      } else {
                        callback(404, { Error: "no records found" }, "json");
                      }
                    });
                  } else {
                    console.log("could not delete product");
                  }
                });
              });
              //read data to update
            }
          } else {
            callback(404, { Error: "no records found" }, "json");
          }
        });
      } else {
        callback(403, { Error: "un-authorized" }, "json");
      }
    });
  } else {
    callback(400, { Error: "one or more fields do not match requirement" });
  }
};

/**
 * products - handler
 * accepted methods get,post,put,delete
 */

handler.products = function (data, callback) {
  var acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(data.method) > -1) {
    handler.products._method[data.method](data, callback);
  } else {
    callback(400, { Error: "Method not acceptable for this route" }, "json");
  }
};

handler.products._method = {};

handler.products._method.post = function (data, callback) {
  //required fields
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var category =
    typeof data.query.name == "string" && data.query.name.trim()
      ? data.query.name.trim()
      : false;
  var product_name =
    typeof data.payload.product_name == "string" &&
    data.payload.product_name.trim().length > 0
      ? data.payload.product_name.trim()
      : false;
  var price =
    typeof data.payload.price == "number" && data.payload.price >= 0
      ? data.payload.price
      : false;
  var weight =
    typeof data.payload.weight == "number" && data.payload.weight >= 0
      ? data.payload.weight
      : false;
  var description =
    typeof data.payload.description == "string" &&
    data.payload.description.trim().length > 0
      ? data.payload.description.trim()
      : false;
  var image =
    typeof data.payload.image == "string" &&
    data.payload.image.trim().length > 0
      ? data.payload.image.trim()
      : false;

  if (
    tokenId &&
    phone &&
    category &&
    product_name &&
    price &&
    weight &&
    description &&
    image
  ) {
    // only authenticated and  user with admin role can create a product
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (
        bool &&
        (config.isAdmin.phone1 == phone || config.isAdmin.phone2 == phone)
      ) {
        // validate category
        _data.read("categories", category, function (err, data) {
          if (!err && data) {
            var dataObj = helper.parseObject(data);
            // form product object
            var productObj = {
              product_name: product_name,
              price: price,
              weight: weight,
              description: description,
              image: image,
              category: dataObj,
            };
            //prevent duplicate product
            _data.checkForDuplicate("products", product_name, function (bool) {
              if (!bool) {
                //persist data
                _data.create(
                  "products",
                  product_name,
                  productObj,
                  function (err) {
                    if (!err) {
                      // push product to categories array
                      var products =
                        typeof dataObj.products == "object" &&
                        dataObj.products instanceof Array
                          ? dataObj.products
                          : [];
                      if (products.length == 0) {
                        dataObj.products = [];
                        dataObj.products.push(product_name);
                      } else {
                        dataObj.products.push(product_name);
                      }
                      //update category with new product id
                      _data.update(
                        "categories",
                        category,
                        dataObj,
                        function (err) {
                          if (!err) {
                            callback(200, { success: "product saved" }, "json");
                          } else {
                            callback(
                              403,
                              {
                                Error:
                                  "could not update category with new product ID",
                              },
                              "json"
                            );
                          }
                        }
                      );
                    } else {
                      callback(
                        400,
                        { Error: "could not persist data to disk" },
                        "json"
                      );
                    }
                  }
                );
              } else {
                callback(400, { Error: "product already exists" }, "json");
              }
            });
          } else {
            callback(404, { Error: "invalid foreign key" }, "json");
          }
        });
      } else {
        callback(403, { Error: "un-authorized" }, "json");
      }
    });
  } else {
    callback(
      403,
      { Error: "one or more fields do not match requirements" },
      "json"
    );
  }
};
//products  - get

handler.products._method.get = function (data, callback) {
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var product_name =
    typeof data.query.product_name == "string" &&
    data.query.product_name.trim().length > 0
      ? data.query.product_name.trim()
      : false;

  if (tokenId && phone && product_name) {
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool) {
        _data.read("products", product_name, function (err, data) {
          if (!err && data) {
            callback(200, helper.parseObject(data), "json");
          } else {
            callback(404, { Error: "no matching record found" }, "json");
          }
        });
      } else {
        callback(403, { Error: "unn-authorized" }, "json");
      }
    });
  } else {
    callback(400, { Error: "One or more fields do not match requirements" });
  }
};

//product - put

handler.products._method.put = function (data, callback) {
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var product_name =
    typeof data.query.product_name == "string" &&
    data.query.product_name.trim().length > 0
      ? data.query.product_name.trim()
      : false;
  var price =
    typeof data.payload.price == "number" && data.payload.price >= 0
      ? data.payload.price
      : false;
  var weight =
    typeof data.payload.weight == "number" && data.payload.weight >= 0
      ? data.payload.weight
      : false;
  var description =
    typeof data.payload.description == "string" &&
    data.payload.description.trim().length > 0
      ? data.payload.description.trim()
      : false;
  var image =
    typeof data.payload.image == "string" &&
    data.payload.image.trim().length > 0
      ? data.payload.image.trim()
      : false;
  var category =
    typeof data.query.name == "string" && data.query.name.trim()
      ? data.query.name.trim()
      : false;
  if (tokenId && phone && product_name) {
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (
        bool &&
        (config.isAdmin.phone1 == phone || config.isAdmin.phone2 == phone)
      ) {
        if (price || weight || image || description || category) {
          //get  record on product to update
          _data.read("products", product_name, function (err, productData) {
            if (!err && productData && productData.length > 0) {
              var parsedProductData = helper.parseObject(productData);
              if (price) {
                parsedProductData.price = price;
              }
              if (weight) {
                parsedProductData.weight = weight;
              }
              if (image) {
                parsedProductData.image = image;
              }
              if (description) {
                parsedProductData.description = description;
              }
              if (category !== parsedProductData.category.name) {
                var previousCategory = parsedProductData.category.name;
                //get new category to update product existing category
                _data.read(
                  "categories",
                  category,
                  function (err, categoryData) {
                    if (!err && categoryData && categoryData.length) {
                      //update product wih new category
                      parsedProductData.category =
                        helper.parseObject(categoryData);
                      delete parsedProductData.category.products;
                      _data.update(
                        "products",
                        product_name,
                        parsedProductData,
                        function (err) {
                          if (!err) {
                            //remove product from its previous associated category
                            _data.read(
                              "categories",
                              previousCategory,
                              function (err, catData) {
                                if (!err && catData && catData.length > 0) {
                                  var parsedCatData =
                                    helper.parseObject(catData);
                                  if (
                                    parsedCatData.products.indexOf(
                                      product_name
                                    ) > -1
                                  ) {
                                    parsedCatData.products.splice(
                                      parsedCatData.products.indexOf(
                                        product_name
                                      ),
                                      1
                                    );
                                    _data.update(
                                      "categories",
                                      previousCategory,
                                      parsedCatData,
                                      function (err) {
                                        if (!err) {
                                          //update new category.products with new product
                                          _data.read(
                                            "categories",
                                            category,
                                            function (err, record) {
                                              var parsedRecord =
                                                helper.parseObject(record);
                                              if (
                                                !err &&
                                                record &&
                                                record.length > 0
                                              ) {
                                                var products =
                                                  typeof parsedRecord.products ==
                                                    "object" &&
                                                  parsedRecord.products instanceof
                                                    Array
                                                    ? parsedRecord.products
                                                    : false;
                                                if (products) {
                                                  parsedRecord.products.push(
                                                    product_name
                                                  );
                                                } else {
                                                  parsedRecord.products = [];
                                                  parsedRecord.products.push(
                                                    product_name
                                                  );
                                                }
                                                //update category after pushing new product to products array on the new category
                                                _data.update(
                                                  "categories",
                                                  category,
                                                  parsedRecord,
                                                  function (err) {
                                                    if (!err) {
                                                      callback(
                                                        200,
                                                        {
                                                          success:
                                                            "record updated",
                                                        },
                                                        "json"
                                                      );
                                                    } else {
                                                      callback(
                                                        400,
                                                        {
                                                          Error:
                                                            "could not update category.products with new product ",
                                                        },
                                                        "json"
                                                      );
                                                    }
                                                  }
                                                );
                                              } else {
                                                callback(400, {
                                                  Error:
                                                    "could not read category",
                                                });
                                              }
                                            }
                                          );
                                        } else {
                                          callback(400, {
                                            Error:
                                              "could not update category after removing associated product",
                                          });
                                        }
                                      }
                                    );
                                  } else {
                                    callback(404, {
                                      Error:
                                        "no matching product found on category",
                                    });
                                  }
                                } else {
                                  callback(400, {
                                    Error:
                                      "could not read category record to remove associated category",
                                  });
                                }
                              }
                            );
                          } else {
                            callback(400, {
                              Error:
                                "could not update products with new category",
                            });
                          }
                        }
                      );
                    } else {
                      callback(400, {
                        Error: "could not read category record",
                      });
                    }
                  }
                );
              }
              if (category === parsedProductData.category.name) {
                _data.update(
                  "products",
                  product_name,
                  parsedProductData,
                  function (err) {
                    if (!err) {
                      callback(200, { success: "record updated" }, "json");
                    } else {
                      callback(
                        400,
                        { Error: "could not update product" },
                        "json"
                      );
                    }
                  }
                );
              }
            } else {
              callback(404, { Error: "no matching record found" });
            }
          });
        } else {
          callback(400, { Error: "at least one field is required" }, "json");
        }
      } else {
        callback(403, { Error: "un-authorized" }, "json");
      }
    });
  } else {
    callback(400, { Error: "one or more required fields are left unfilled" });
  }
};

//product - delete
handler.products._method.delete = function (data, callback) {
  var tokenId =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 26
      ? data.headers.token.trim()
      : false;
  var phone =
    typeof data.query.phone == "string" && data.query.phone.trim().length == 10
      ? data.query.phone.trim()
      : false;
  var product_name =
    typeof data.query.product_name == "string" &&
    data.query.product_name.trim().length > 0
      ? data.query.product_name.trim()
      : false;

  if (tokenId && phone && product_name) {
    //only authenticated user  and an admin should delete a product
    handler.authenticateUser(tokenId, phone, function (bool) {
      if (bool && (config.isAdmin.phone1 == phone || config.isAdmin.phone2)) {
        _data.read("products", product_name, function (err, data) {
          if (!err && data && data.length > 0) {
            //get associated category
            var dataObj = helper.parseObject(data);
            var category =
              typeof dataObj.category == "object" &&
              dataObj.category != undefined
                ? dataObj.category
                : false;
            if (category) {
              //delete product
              _data.delete("products", product_name, function (err) {
                if (!err) {
                  // remove associated product from category
                  _data.read("categories", category.name, function (err, data) {
                    if (!err && data && data.length > 0) {
                      var dataObj = helper.parseObject(data);
                      // confirm product is existing on category
                      if (dataObj.products.indexOf(product_name) > -1) {
                        //delete product on category
                        dataObj.products.splice(
                          dataObj.products.indexOf(product_name),
                          1
                        );
                        //update category after deleting associated product
                        _data.update(
                          "categories",
                          dataObj.name,
                          dataObj,
                          function (err) {
                            if (!err) {
                              callback(
                                200,
                                { success: "record deleted" },
                                "json"
                              );
                            } else {
                              callback(400, {
                                Error:
                                  "could not update category after deleting associated product",
                              });
                            }
                          }
                        );
                      } else {
                        callback(400, {
                          Error:
                            "no associated product found on category.products",
                        });
                      }
                    } else {
                      callback(
                        400,
                        {
                          Error:
                            "could not read category to delete associated product",
                        },
                        "json"
                      );
                    }
                  });
                } else {
                  callback(400, { Error: "could not delete product" }, "json");
                }
              });
            } else {
              callback(
                500,
                { Error: "internal server error, could not delete product" },
                "json"
              );
            }
          }else{
            callback(404,{Error:"no matching record found"},'json')
          }
        });
      } else {
        callback(400, { Error: "un-authorized" }, "json");
      }
    });
  }
};
//ping handler
handler.ping = function (data, callback) {
  callback(200, { info: "server is up and  running  " }, "json");
};

// not found handler
handler.notFound = function (data, callback) {
  callback(404, { Error: "oops!!, specified route does not exist" }, "json");
};

handler.sampleError = function (data, callback) {
  var err = new Error("this is a sample error");
  throw err;
};

//match token to user
handler.authenticateUser = function (tokenId, phone, callback) {
  _data.read("tokens", tokenId, function (err, tokenObject) {
    if (!err && tokenObject) {
      var parsedObject = helper.parseObject(tokenObject);
      if (parsedObject.phone === phone) {
        if (parsedObject.expire > Date.now()) {
          callback(true);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};
//export handler
module.exports = handler;
