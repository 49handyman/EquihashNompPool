bittrex-exchange-api
------------

This is a very simple api client that helps interact with the [Bittrex](https://bittrex.com/) cryptocurrency exchange api.  

Installation
------------
```bash
npm install bittrex-exchange-api --save
```

Usage
------------

```javascript

var options = {
  "key": "",
  "secret": ""
}

var Bittrex = require('bittrex-exchange-api');
var bittrex = new Bittrex(options)

bittrex.getMarkets(function(err, data) {
  console.log(data);  
})

```




Contributing
------------

If you'd like to contribute a feature or bugfix: Thanks! To make sure your fix/feature has a high chance of being included, please read the following guidelines:

1. Post a [pull request](https://github.com/ballantyne/bittrex-exchange-api/compare/).
2. Make sure there are tests! We will not accept any patch that is not tested.
   It's a rare time when explicit tests aren't needed. If you have questions
   about writing tests for paperclip, please open a
   [GitHub issue](https://github.com/ballantyne/bittrex-exchange-api/issues/new).


And once there are some contributors, then I would like to thank all of [the contributors](https://github.com/ballantyne/bittrex-exchange-api/graphs/contributors)!


License
-------

It is free software, and may be redistributed under the terms specified in the MIT-LICENSE file.

Copyright
-------
© 2018 Scott Ballantyne. See LICENSE for details.
