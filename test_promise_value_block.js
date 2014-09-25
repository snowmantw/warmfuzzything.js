'use strict';
(function() {

  var Value = function() {};
  Value.prototype.set = function(v) {
    this.v = v;
  };

  var keepValue = (new Value).set(0);
  var outerResolve;
  var outerPromise = new Promise((resolve) => {
    outerResolve = resolve;
  });
  var keep = function(step) {
    // To chain the new step as a step of the process.
    // Must replace the existing Promise with a chained one,
    // or the step would not keep sequently.
    outerPromise = outerPromise.then(() => {
      var innerResolve;
      // To make this keeping step as a Promise generator.
      var newPromise = new Promise((resolve) => {
        innerResolve = resolve;
      });
      var returns = (returnv) => {
        keepValue = returnv;
        innerResolve(returnv);
      };
      // To let the step decide when we can continue the process,
      // by resolving the returned Promise this keeping function does.
      step({'returns': returns}, keepValue);
      // Must return a Promise to make a Promise generator,
      // in order to block the outer Promise' process.
      return newPromise;
    });
  };
  keep(function(self, value) {
    console.log('>> ', value.v);
    var newValue = (new Value).set(1);
    self.returns(newValue);
  });
  keep(function(self, value) {
    console.log('>> ', value.v);
    var newValue = (new Value).set(2);
    self.returns(newValue);
  });
  keep(function(self, value) {
    setTimeout(function() {
      console.log('>> ', value.v);
      var newValue = (new Value).set(3);
      self.returns(newValue);
    }, 3000);
  });
  keep(function(self, value) {
    console.log('>> ', value.v);
    var newValue = (new Value).set(4);
    self.returns(newValue);
  });
  window.start = function() {
    // Resolve the outer resolve to start.
    outerResolve();
  };
})();
