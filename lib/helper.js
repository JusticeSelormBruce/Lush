/**
 * base file for helper
 */

//Dependencies
const crypto = require("crypto");
var config = require("./config");
const _path = require("path");
const fs = require("fs");

//helper container
let helper = {};

helper.basePath = _path.join(__dirname + "./../templates/");

//harsh password

helper.hashPassword = function (password) {
  try {
    var hmac = crypto
      .createHmac("sha256", config.secret)
      .update(password)
      .digest("hex");
    return hmac;
  } catch (e) {
    return false;
  }
};

//object parser
helper.parseObject = function (obj) {
  try {
    return JSON.parse(obj);
  } catch (e) {
    return false;
  }
};

//generate random string

helper.generateRandomString = function (length) {
  var characters = "abcdefghijklmnopqrsuvwxyz1234567890";
  var randomString = "";
  for (var i = 0; i <= length; i++) {
    var str = characters.charAt(Math.floor(Math.random() * characters.length));
    randomString += str;
  }

  return randomString;
};

//get template
helper.getTemplate = function (templateName, data, callback) {
  //validate template name
  var templateName =
    typeof templateName == "string" && templateName.length > 0
      ? templateName
      : false;
  if (templateName) {
    //read in template

    fs.readFile(
      helper.basePath + templateName + ".html",
      "utf-8",
      function (err, str) {
        if (!err && str) {
          helper.getHeaderAndFooterTemplates(str, function (completeStr) {
            helper.stringInterpolate(data, completeStr, function (page) {
              callback(false, page);
            });
          });
        } else {
          callback("could not read template data");
        }
      }
    );
  } else {
    callback("invalid template name");
  }
};
//get header and footer
helper.getHeaderAndFooterTemplates = function (str, callback) {
  //read in header
  fs.readFile(
    helper.basePath + "_header.html",
    "utf-8",
    function (err, header) {
      if (!err && header) {
        fs.readFile(
          helper.basePath + "_footer.html",
          "utf-8",
          function (err, footer) {
            if (!err && footer) {
              //return complete str

              callback(header + str + footer);
            } else {
              callback("");
            }
          }
        );
      } else {
        callback("");
      }
    }
  );
};

//string interpolator
helper.stringInterpolate = function (data, str, callback) {
  //get all configuration values and  add it to  the data object
  // validate  parameters
  var data = typeof data == "object" ? data : {};
  var str = typeof str == "string" && str.length > 0 ? str : "";

  if (data && str) {
    {
      //get config details and add on data object
      for (var val in config.app) {
        if (config.app.hasOwnProperty(val)) {
          data["config." + val] = config.app[val];
        }
      }
    }
    

    //find and replace
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var find = "{" + key + "}";
        var replace = data[key];
       str= str.replace(find, replace);
      
       
      }
     
     
    }
    callback(str);
  } else {
   
    callback(str);
  }
};

helper.readStaticFile = function(path,  callback){
  var path  = typeof path  =='string' && path.trim().length >0 ? path.trim() :false;
  if(path){
    var baseAssertUrl  = _path.join(__dirname+"./../public/")
    console.log(baseAssertUrl+path)
    fs.readFile(baseAssertUrl+path, function(err, data){
      if(!err && data &&  data.length >0){
        callback(false,data)
      }else{
        callback(404)
      }
    })

  }else{
    callback("invalid path")
  }
}
//export helper
module.exports = helper;
