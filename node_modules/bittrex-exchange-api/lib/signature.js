const crypto      = require('crypto');
const klass       = require('klass');
const _           = require('underscore');
const querystring = require('querystring');

module.exports = klass(function(options){
  _.extend(this, options);
}).methods({
  sign: function(url) {
    var hash = crypto.createHmac('sha512', this.secret);
    hash.update(url);
    var signature = hash.digest('hex');
    return {
      apisign: signature
    };
  }
})
