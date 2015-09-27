var inherit = require("util").inherits;
var EventEmitter = require("events").EventEmitter;


function Observable() {
	EventEmitter.call(this);
}

inherit(Observable, EventEmitter);


Observable.prototype.notify = Observable.prototype.emit;
Observable.prototype.when = Observable.prototype.on;

Observable.prototype.emitAndCall = function emitAndCall(event, callback) {
	var self = this;

	callback && self.once(event, function() {
		callback.apply(self, (event === "error") ? arguments : [null].concat(Array.prototype.slice.call(arguments)));
	});

	// EventEmitter#[emit](https://github.com/joyent/node/blob/v0.10.39/lib/events.js#L53) returns true or false.
	return self.emit.apply(self, [event].concat(Array.prototype.slice.call(arguments, (2))));
};


module.exports = Observable;