[![NPM Version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url]

# Command

## Usage
 
```javascript
var Command = require("command-pattern");

// What commands will do is up to you! But, first, they'll need a name...
var command = new Command("welcome");

command.implementation = function execute(parameters, callback) {
	// Here, `this` is the execution context, and provides:
	//	- current command,
	//	- execution occurrence,
	//	- parameters

	callback(null, "Hello!");
};
```


[npm-image]: https://img.shields.io/npm/v/command-pattern.svg?style=flat
[npm-url]: https://www.npmjs.com/package/command-pattern
[travis-image]: https://img.shields.io/travis/pvoisin/command-pattern.svg?branch=master
[travis-url]: https://travis-ci.org/pvoisin/command-pattern/
[coveralls-image]: https://coveralls.io/repos/pvoisin/command-pattern/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/r/pvoisin/command-pattern?branch=master