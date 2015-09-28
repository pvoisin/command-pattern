var inherit = require("util").inherits;
var Observable = require("./Observable");


function Command(name) {
	var self = this, own = self;

	Observable.call(self);

	if(typeof name !== "string") {
		throw new Error("Invalid name!");
	}

	own.name = name;
	own.executionCount = 0;
}

inherit(Command, Observable);

// If callback isn't specified, the command is supposed to be synchronous.
Command.prototype.execute = function execute(/*parameters, ..., callback*/) {
	var self = this, own = self;

	var synchronously = false;
	var lastParameter = arguments[arguments.length - 1];
	if(typeof lastParameter === "function") {
		var callback = lastParameter;
		var parameters = Array.prototype.slice.call(arguments, 0, -1);
	}
	else {
		synchronously = true;
		parameters = Array.prototype.slice.call(arguments);
	}

	own.executionCount++;

	var execution = {
		command: self,
		occurrence: own.executionCount,
		parameters: parameters
	};

	var implementation = own.implementation || self.constructor.prototype.implementation;

	if(!implementation) {
		throw new Error("Not implemented!");
	}

	if(synchronously) {
		try {
			var results = implementation.apply(execution, parameters);
			setImmediate(function() {
				succeed(results);
			});
			return results;
		}
		catch(error) {
			setImmediate(function() {
				fail(error);
			});
			throw error;
		}
	}
	else {
		var callbackWrapper = function(error/*, results*/) {
			var parameters = Array.prototype.slice.call(arguments);

			if(error) {
				fail.apply(self, parameters);
			}
			else {
				succeed.apply(self, parameters.slice(1));
			}
		};

		callbackWrapper.wrappedCallback = callback;

		implementation.apply(execution, parameters.concat(callbackWrapper));
	}

	function succeed(/*results...*/) {
		self.emitAndCall.apply(self, ["executed", callback].concat(Array.prototype.slice.call(arguments)));
	}

	function fail(error/*, results...*/) {
		self.emitAndCall.apply(self, ["error", callback].concat(Array.prototype.slice.call(arguments)));
	}
};


module.exports = Command;