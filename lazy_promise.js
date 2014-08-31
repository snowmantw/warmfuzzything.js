'use strict';

/**
 * A lazy Promise means it would not execute the steps while user
 * feed it with functions via the 'then' method.
 *
 * Lazy Promise only execute it's steps after an explicit executing.
 * In this implementation, the 'done' method would do that.
 */
(function(exports) {
  var LazyPromise = function(startWith) {
    this.startWith = startWith;
    this.steps;
  };

  LazyPromise.prototype.then = function(cb) {
    this.steps.push(cb);
    return this;
  };

  LazyPromise.prototype.done = function() {
    // Start to run the steps.
    // We would construct a Promise and continually
    // 'then' it, to execute every step in the promise.
    var currentPromise = new Promise(this.startWith);
    this.steps.forEach((step) => {
      // Concat another LazyPromise. Trigger it.
      if (step.done) {
        currentPromise = currentPromise
          .then(() => { step.done(); });
      } else {
        currentPromise = currentPromise.then(step);
      }
    });
    currentPromise.then(() => {
      this.steps.length = 0;
    });
  };
  exports.LazyPromise = LazyPromise;
})(window);
