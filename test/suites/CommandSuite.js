var spy = require("sinon").spy;
var expect = require("expect.js");
var y = require("ytility");
var Command = require("../../source/Command");

describe("Command", function() {
	describe("constructor", function() {
		it("should only accept strings for name", function() {
			expect(function() {
				new Command(NaN);
			}).to.throwError();
		});
	});

	describe("#execute", function() {
		it("should raise an error if not implemented", function() {
			var command = new Command("???");

			var observers = {
				"error": spy(function(error) {
					console.error(error);
				}),
				"executed": spy()
			};

			command.on("error", observers["error"]);
			command.on("executed", observers["executed"]);

			var callback = spy();

			expect(function() {
				command.execute(callback);
			}).to.throwError(/^Not implemented/, function(error) {
					console.error(error.stack);
				});

			expect(callback.callCount).to.be(0);
			expect(observers["executed"].callCount).to.be(0);
			expect(observers["error"].callCount).to.be(0);
		});

		it("should emit the \"executed\" and call the provided callback", function(proceed) {
			var command = new Command("welcome");
			command.implementation = function(parameters, callback) {
				callback(null, "Hello!");
			};

			var observers = {
				"error": spy(function(error) {
					console.error(error);
				}),
				"executed": spy()
			};

			command.on("error", observers["error"]);
			command.on("executed", observers["executed"]);

			var callback = spy(function(error) {
				error && console.error(error);
				process.nextTick(finalize);
			});

			command.execute(callback);

			function finalize() {
				expect(observers["error"].callCount).to.be(0);
				expect(observers["executed"].callCount).to.be(1);
				expect(observers["executed"].args[0][0]).to.be("Hello!");

				expect(callback.callCount).to.be(1);
				expect(callback.args[0][0]).to.be(null);
				expect(callback.args[0][1]).to.be("Hello!");

				proceed();
			}

			this.timeout(100);
		});

		it("should support parameters", function(proceed) {
			var command = new Command("welcome");
			command.implementation = function(parameters, callback) {
				callback.call(this, null, parameters);
			};

			var observers = {
				"error": spy(function(error) {
					console.error(error);
				}),
				"executed": spy()
			};

			command.on("error", observers["error"]);
			command.on("executed", observers["executed"]);

			var callback = spy(function(error) {
				process.nextTick(finalize);
			});

			var parameters = ["P", 4, "R", 4, "M", 3, "T", 3, "R", "S"];

			command.execute(parameters, callback);

			function finalize() {
				expect(observers["error"].callCount).to.be(0);
				expect(observers["executed"].callCount).to.be(1);
				expect(observers["executed"].args[0][0]).to.be(parameters);

				expect(callback.callCount).to.be(1);
				expect(callback.args[0][0]).to.be(null);
				expect(callback.args[0][1]).to.be(parameters);

				proceed();
			}

			this.timeout(100);
		});

		it("should provide the execution context to the implementation", function(proceed) {
			var command = new Command("welcome");
			command.implementation = spy(function(parameters, callback) {
				callback.call(this, null, parameters);
			});

			var observers = {
				"error": spy(function(error) {
					console.error(error);
				})
			};

			command.on("error", observers["error"]);

			var callback = spy(y.debounce(function() {
				process.nextTick(finalize);
			}, 100));

			var sample = ["P", 4, "R", 4, "M", 3, "T", 3, "R", "S"];

			var parameters = sample;
			var executionCount = 5;
			for(var index = 0; index < executionCount; index++) {
				parameters = parameters.slice();
				index && parameters.unshift(parameters.pop());
				command.execute(parameters, callback);
			}

			var finalizing;

			function finalize() {
				expect(finalizing).not.to.be(true);
				finalizing = true;
				expect(command.own.implementation.callCount).to.be(executionCount);

				var parameters = sample.slice();
				for(var index = 0; index < executionCount; index++) {
					index && parameters.unshift(parameters.pop());
					expect(command.own.implementation.getCall(index).thisValue).to.eql({
						command: command,
						occurrence: index + 1,
						parameters: parameters
					});
				}

				proceed();
			}

			this.timeout(500);
		});
	});
});