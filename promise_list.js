(function(exports) {
'use strict';
  var PromiseList = function() {
    this.ready = null;
    // Note: the ListValue is wrapped one: [a]
    // This is because the Promise-* series is not the data type,
    // but the wrapper to make it can do what Monad can do.
    this.ListValue = null;
    this.promise = new Promise((resolve) => {
      this.ready = resolve;
    });
  };

  // Can give multiple arguments to construct this new List.
  //
  // ex: List(1, 2, 3). It's like to construct [1, 2, 3] in JS.
  PromiseList.prototype.tupleToList = function(...args) {
    this.ListValue = args;
    this.List = true;
    return this;
  };

  PromiseList.prototype.List = function(value) {
    this.ListValue = [value];
    this.List = true;
    return this;
  };

  // Can give an array to construct this new List.
  //
  // A special case: since we can't really provide a constructor for
  // multiple values at the same time to emulate the [ ] syntax,
  // we need to 'unwrap' xs (already is a list in JS) and then treat
  // it as we construct from it. This is mainly for convenience.
  PromiseList.prototype.toList = function(xs) {
    this.ListValue = xs;
    this.List = true;
    return this;
  };

  // Although we store an array in our inner value, we still need
  // to provide a way to manipulate the sinle value.
  Object.defineProperty(PromiseList.prototype, 'value', {
    get: function() {
        return this.ListValue[0];
     }
  });

  // TODO: this keep need to accomplish the nature of List Monad,
  // and to do the map thing.
  PromiseList.prototype.keep = function(step) {
    this.promise = this.promise.then(() => {
      var ListValue = this.ListValue;
      var innerResolve;
      // XXX: to control only after we handle every element we resolve
      // the inner resolve.
      var unresolve = ListValue.length;
      var mSelf = {
        returns: (newPromiseListValue) => {
          // XXX: No way to use instantiated value from the constructor:
          // it would block the next steps.
          var newListValue = {
            List: true,
            // The new value is one single element.
            value: newPromiseListValue.ListValue[0]
          };
          // XXX: The way we maintain the inner xs.
          // is to replace the old one and to extend it to
          // receive the result of the map.
          if (unresolve === ListValue.length) {
            this.ListValue = [newListValue.value];
          } else {
            this.ListValue.push(newListValue.value);
          }
          unresolve -= 1;
          if (0 === unresolve) {
            // XXX: can't send value via resolve anymore.
            // The same bug.
            innerResolve();
          }
        },
        lift: this.lift
      };
      var newPromise = new Promise((resolve) => {
        innerResolve = resolve;
      });

      ListValue.forEach((x) => {
        step(mSelf, x);
      });
      return newPromise;
    });
    return this;
  };

  PromiseList.prototype.then = PromiseList.prototype.keep;

  // Don't know treat '()' as tuple and function calls
  // is a good idea or not.
  PromiseList.prototype.lift = function(value) {
    var newPromiseList = new PromiseList;
    var wrapped = newPromiseList.List(value);
    return wrapped;
  };

  PromiseList.prototype.done = function() {
    // Kick-off the promise. To let it be resolved.
    this.ready();
    return this;
  };

  exports.PromiseList = PromiseList;
})(window);

g = (new PromiseList()).tupleToList(3, 4, 5)
  .then((mSelf, v) => {
    console.log('>> 1', v);
    mSelf.returns((new PromiseList).List(v+99));
  })
  .then((mSelf, v) => {
    setTimeout(function() {
      console.log('>> 2, in an async timeout step', v);
      mSelf.returns((new PromiseList).List(v-12));
    }, 3000);
  })
  .then((mSelf, v) => {
    console.log('>> 3', v);
    mSelf.returns((new PromiseList).List(v+12));
  });
