[![NPM Version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url]

# Command

## Usage
 
```javascript
var Command = require("command-pattern");

// What commands will do is up to you! But, first, they'll need a name...
var command = new Command("welcome");

command.implementation = function execute(/*parameters..., */callback) {
	// Here, `this` is the execution context, and exposes:
	//	- current command,
	//	- execution occurrence,
	//	- parameters

	callback(null, "Hello!");
};
```

### Inheritance
Surely, you can inherit from `Command` to craft your own commands:

```javascript
function WelcomeCommand() {
	Command.call(this, "welcome");
}

inherit(WelcomeCommand, Command);

WelcomeCommand.prototype.implementation = function(/*parameters...*/) {
	return "Hello!";
};
```

### Asynchronous Mode

When executed with a callback as the last parameter the command is considered to be asynchronous.
If it fails, it should invoke the callback with an error as the first parameter while while if it succeeds, the first parameter should be `null`.
In any case, execution results should be passed in subsequent parameters.

### Synchronous Mode

When executed without any callback the command is considered to be synchronous and should return the results immediately.
If it fails it should throw an error.
 


[npm-image]: https://img.shields.io/npm/v/command-pattern.svg?style=flat
[npm-url]: https://www.npmjs.com/package/command-pattern
[travis-image]: https://img.shields.io/travis/pvoisin/command-pattern.svg?branch=master
[travis-url]: https://travis-ci.org/pvoisin/command-pattern/
[coveralls-image]: https://coveralls.io/repos/pvoisin/command-pattern/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/r/pvoisin/command-pattern?branch=master