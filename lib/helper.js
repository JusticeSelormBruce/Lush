/**
 * base file for helper
 */



//Dependencies
const  crypto  = require('crypto')
var config  = require('./config')

//helper container
let helper = {};

//harsh password

helper.hashPassword = function (password) {
  try {
   var hmac  = crypto.createHmac('sha256',config.secret).update(password).digest('hex');
   return hmac;
  } catch (e) {
    return false;
  }
};


//object parser
helper.parseObject  = function(obj){
    try {
        return JSON.parse(obj);
    } catch (e) {
        return false;
        
    }
}
//export helper
module.exports = helper;
