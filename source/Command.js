var inherit = require("util").inherits;
var Observable = require("./Observable");


function Command(name) {
	Observable.call(this);

	if(typeof name !== "string") {
		throw new Error("Invalid name!");
	}

	var self = this, own = self.own = {
		name: name,
		implementation: Command.prototype.implementation,
		executionCount: 0
	};

	Object.defineProperty(self, "implementation", {
		set: function(implementation) {
			own.implementation = implementation;
		}
	});
}

inherit(Command, Observable);


Command.prototype.execute = function execute(parameters, callback) {
	var self = this, own = self.own;

	callback = typeof parameters === "function" ? parameters : callback;
	parameters = (parameters === callback) ? {} : parameters;

	own.executionCount++;

	var execution = {
		command: self,
		occurrence: own.executionCount,
		parameters: parameters
	};

	own.implementation.call(execution, parameters, function(error/*, results*/) {
		var parameters = Array.prototype.slice.call(arguments);

		if(error) {
			return self.emitAndCall.apply(self, ["error", callback].concat(parameters));
		}

		return self.emitAndCall.apply(self, ["executed", callback].concat(parameters.slice(1)));
	});
};

Command.prototype.implementation = function(parameters, callback) {
	callback(new Error("Not implemented!"));
};


module.exports = Command;