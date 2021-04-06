const klass       = require('klass');
const request     = require('request');
const _           = require('underscore');
const querystring = require('querystring');

var isJSON = require('is-json');

module.exports = klass(function(options) {
  _.extend(this, options);
  if (this.host == undefined) {
    this.host = 'https://bittrex.com';
  }

  if (this.api_endpoint == undefined) {
    this.api_endpoint = '/';
  }

  if (this.verbose == undefined) {
    this.verbose = false;
  }

}).methods({

  get: function(options, then) {
    request({
      method: 'GET', 
      url: options.url, 
      headers: this.headers(options.params)
    }, function (error, response, body) {
      if (isJSON(body)) {
        body = JSON.parse(body);
      }     
      then(error, body);
    }); 
  },

  authenticated: function(options, then) {
    options.method = 'GET';
    options.headers = this.headers(options.url);

    if (this.verbose) {
      console.log(options);
    }
    request(options, function (error, response, body) {
      if (isJSON(body)) {
        body = JSON.parse(body);
      }     

      if (this.verbose) {
        if (error != undefined) {
          console.log(error);
        }
        console.log(options);
      }

      then(error, body);
    }); 
  },

  headers: function(data) {
    return {"User-Agent": "ussballantyne-npm-api-client"};
  }

}) 
