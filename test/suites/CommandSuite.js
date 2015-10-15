var spy = require("sinon").spy;
var expect = require("expect.js");
var y = require("ytility");
var Command = require("../../source/Command");
var inherit = require("util").inherits;

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

		describe("synchronously", function() {
			it("when successful, should return the execution results and emit the \"executed\" event right after", function(proceed) {
				function WelcomeCommand() {
					Command.call(this, "welcome");
				}

				inherit(WelcomeCommand, Command);

				WelcomeCommand.prototype.implementation = function(/*parameters...*/) {
					return "Hello!";
				};

				var command = new WelcomeCommand();

				var observers = {
					"error": spy(function(error) {
						console.error(error);
					}),
					"executed": spy()
				};

				command.on("error", observers["error"]);
				command.on("executed", observers["executed"]);

				var results = command.execute();

				expect(results).to.be("Hello!");
				expect(observers["error"].callCount).to.be(0);
				expect(observers["executed"].callCount).to.be(0);

				setImmediate(function finalize() {
					expect(observers["error"].callCount).to.be(0);
					expect(observers["executed"].callCount).to.be(1);
					expect(observers["executed"].args[0][0]).to.be("Hello!");

					proceed();
				});
			});

			it("when failing, should throw an error and emit the \"executed\" & \"error\" events right after", function(proceed) {
				function FailingCommand() {
					Command.call(this, "welcome");
				}

				inherit(FailingCommand, Command);

				FailingCommand.prototype.implementation = function(/*parameters...*/) {
					throw problem;
				};

				var command = new FailingCommand();

				var observers = {
					"error": spy(),
					"executed": spy()
				};

				command.on("error", observers["error"]);
				command.on("executed", observers["executed"]);

				var results = undefined;
				var problem = new Error("Boom!");
				expect(function() {
					results = command.execute();
				}).to.throwError(problem);

				expect(results).to.be(undefined);
				expect(observers["error"].callCount).to.be(0);
				expect(observers["executed"].callCount).to.be(0);

				setImmediate(function finalize() {
					expect(observers["error"].callCount).to.be(1);
					expect(observers["error"].args[0][0]).to.be(problem);
					expect(observers["executed"].callCount).to.be(0);

					proceed();
				});
			});
		});

		describe("asynchronously", function() {
			it("when successful, should emit the \"executed\" event and call the provided callback", function(proceed) {
				var command = new Command("welcome");
				command.implementation = function(callback) {
					// ~Asynchronously...
					setImmediate(function() {
						callback(null, "Hello!");
					});
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
				expect(observers["error"].callCount).to.be(0);
				expect(observers["executed"].callCount).to.be(0);
				expect(callback.callCount).to.be(0);

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

			it("when failing, should emit the \"error\" event and call the provided callback", function(proceed) {
				function WelcomeCommand() {
					Command.call(this, "welcome");
				}

				inherit(WelcomeCommand, Command);

				WelcomeCommand.prototype.implementation = function(/*parameters...*/callback) {
					// ~Asynchronously...
					setImmediate(function() {
						callback(problem, "Hello, eh... What's your name again?");
					});
				};

				var command = new WelcomeCommand();

				var observers = {
					"error": spy(),
					"executed": spy()
				};

				command.on("error", observers["error"]);
				command.on("executed", observers["executed"]);

				var callback = spy(function(error) {
					setImmediate(finalize);
				});

				var problem = new Error("Boom!");
				command.execute(callback);
				expect(observers["error"].callCount).to.be(0);
				expect(observers["executed"].callCount).to.be(0);
				expect(callback.callCount).to.be(0);

				function finalize() {
					expect(observers["error"].callCount).to.be(1);
					expect(observers["error"].args[0][0]).to.be(problem);
					expect(observers["executed"].callCount).to.be(0);

					expect(callback.callCount).to.be(1);
					expect(callback.args[0][0]).to.be(problem);
					expect(callback.args[0][1]).to.be("Hello, eh... What's your name again?");

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

				var contexts = [];

				var callback = spy(function() {
					contexts.push(command.implementation.context);
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

			it("should support any number of parameters given the last argument is the callback", function() {
				var command = new Command("welcome");
				command.implementation = spy(function(/*p1, p2, p3, ..., callback*/) {
					var callback = arguments[arguments.length - 1];
					callback.call(this, null, Array.prototype.slice.call(arguments, 0, -1));
				});

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
				});

				(function testExecutionWithNoParameter() {
					command.execute(callback);

					expect(command.implementation.callCount).to.be(1);
					expect(command.implementation.args[0].length).to.be(1);
					expect(command.implementation.args[0][0].wrappedCallback).to.be(callback);
					expect(callback.callCount).to.be(1);
				})();

				(function testExecutionWithVariableCountOfParameters() {
					var parameters = ["P", 4, "R", 4, "M", 3, "T", 3, "R", "S"];
					parameters.forEach(function(parameter, index) {
						command.implementation.reset();
						callback.reset();

						var stuff = parameters.slice(0, index + 1);

						command.execute.apply(command, stuff.concat(callback));

						expect(command.implementation.callCount).to.be(1);
						expect(command.implementation.args[0].slice(0, index + 1)).to.eql(stuff);
						expect(callback.callCount).to.be(1);
					});
				})();
			});

			it("should provide the execution context to the implementation", function(proceed) {
				var command = new Command("welcome");
				command.implementation = spy(function(/*p1, p2, p3, ..., callback*/) {
					var callback = arguments[arguments.length - 1];
					callback.call(this, null, Array.prototype.slice.call(arguments, 0, -1));
				});

				var observers = {
					"error": spy(function(error) {
						console.error(error);
					})
				};

				command.on("error", observers["error"]);

				var contexts = [];

				var callback = spy(function() {
					contexts.push(command.implementation.context);
					process.nextTick(finalize);
				});

				var sample = ["P", 4, "R", 4, "M", 3, "T", 3, "R", "S"];

				var parameters = sample;
				var executionCount = 5;
				for(var index = 0; index < executionCount; index++) {
					parameters = parameters.slice();
					index && parameters.unshift(parameters.pop());
					command.execute.apply(command, parameters.concat(callback));
				}

				var finalizing;

				function finalize() {
					expect(finalizing).not.to.be(true);
					finalizing = true;
					expect(command.implementation.callCount).to.be(executionCount);

					var parameters = sample.slice();
					for(var index = 0; index < executionCount; index++) {
						index && parameters.unshift(parameters.pop());
						expect(command.implementation.getCall(index).thisValue).to.eql(command);
						expect(contexts[index]).to.eql({
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
});