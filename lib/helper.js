/**
 * base file for helper
 */

//Dependencies
const crypto = require("crypto");
var config = require("./config");

//helper container
let helper = {};

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
    var str = characters.charAt(
      Math.floor(Math.random() * characters.length)
     
    );
   randomString += str
  }

  return randomString
};
//export helper
module.exports = helper;
