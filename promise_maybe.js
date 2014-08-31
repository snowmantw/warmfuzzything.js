(function(exports) {
'use strict';
  var PromiseMaybe = function() {
    this.ready = null;
    this.MaybeValue = null;
    this.promise = new Promise((resolve) => {
      this.ready = resolve;
    });
  };

  // Since PromiseMaybe is only an interface integrated with the Promise and
  // the Maybe monad, these methods would do nothing but generate new Maybe value,
  // and let the following steps can receive Maybe values.

  PromiseMaybe.prototype.Nothing = function() {
    this.MaybeValue = (new Maybe).Nothing();
    this.Nothing = this.MaybeValue.Nothing;
    return this;
  };

  PromiseMaybe.prototype.Just = function(value) {
    this.MaybeValue = (new Maybe).Just(value);
    this.Just = this.MaybeValue.Just;
    return this;
  };

  // Map the Maybe value's value as this context's value.
  Object.defineProperty(PromiseMaybe.prototype, 'value', {
    get: function() {
      return this.MaybeValue.value;
    }
  });

  // Requirements:
  //
  // 1. Every PromiseMaybe then step would be executed only after the
  //    previous one get executed.
  // 2. The then is chainable, and would apply the effect on the inner value.
  //
  // The Promise would block the next step if:
  //
  // 1. The current step return a Promise generator
  // 2. The Promise of the generator not get resolved after it's returning
  //
  // So the 'then' method, should do these things:
  //
  // 1. Make a function, which return a Promise.
  // 2. The Promise would be resolved only when the step resolve it, so
  // 3. The step would receive the resolve function, as the sugared 'returns' method, and
  // 4. It would transform the value, from a 'a -> b' process.
  // 5. Since we need to care about the type like 'Just a' or 'Nothing',
  //    it would need to wrap the value to resolve the Promise.
  // 6. The next step, after the resolving, should receive the 'Maybe b'.
  // 7. The new 'Maybe b' should be 'then'. But since the outer 'then' is a continous
  //    concating process, it would concate with new step before we get resolved.
  //
  // In order to resolve this, the 'outer' then, must save all steps in an array,
  // and split the real Promise 'then' and the outer 'then'. So, at the semantics level,
  // the outer 'then' is not the 'then' like we think, but a 'next' method to keep the
  // next step of the Promise instance in our buffer queue.
  //
  // And for the resolved result of the steps, although the type of 'Maybe b' is still
  // necessary, but we don't use its 'keep' method to concat the chain. We only use it
  // to update our inner value.
  PromiseMaybe.prototype.keep = function(step) {
    this.promise = this.promise.then(() => {
      var MaybeValue = this.MaybeValue;
      var innerResolve;
      var mSelf = {
        returns: (newPromiseMaybeValue) => {
          // Get Promise Maybe value since user would only use
          // this type as the interface, not the original Maybe.
          // So we need to unwrap it to get thr real Maybe value.
          var newMaybeValue = newPromiseMaybeValue.MaybeValue;
          // go to the next step.
          this.MaybeValue = newMaybeValue;
          innerResolve(newMaybeValue);
        },
        lift: this.lift
      };
      var newPromise = new Promise((resolve) => {
        innerResolve = resolve;
      });

      if (true === MaybeValue.Nothing) {
        // Resolve with Nothing. Do no 'a -> b'.
        mSelf.returns(MaybeValue);
      } else if (true === MaybeValue.Just) {
        step(mSelf, MaybeValue.value);
      } else {
        throw new Error('Not match Maybe type');
      }
      return newPromise;  // to block the next 'keep'.
    });
    return this;    // to keep more steps.
  };

  // To name it as 'keep' is to prevent confusing.
  // To alias it as 'then' is to keep the interface integrated.
  PromiseMaybe.prototype.then = PromiseMaybe.prototype.keep;

  // We have too much 'return', so don't name it as in Haskell.
  PromiseMaybe.prototype.lift = function(value) {
    var wrapped = (new Promise2Maybe).Just(value);
    // XXX: No way to use instantiated MaybeValue from the 'Just' method:
    // it would block the next steps.
    wrapped.MaybeValue = {
      Just: true,
      value: value
    };
    return wrapped;
  };

  PromiseMaybe.prototype.done = function() {
    // Kick-off the promise. To let it be resolved.
    this.ready();
    return this;
  };

  exports.PromiseMaybe = PromiseMaybe;
})(window);


/*
g = (new PromiseMaybe()).Just(3)
  .then((mSelf, v) => {
    console.log('>> 1');
    mSelf.returns((new PromiseMaybe).Just(v+99));
  })
  .then((mSelf, v) => {
    setTimeout(function() {
      console.log('>> 2, in an async timeout step');
      mSelf.returns((new PromiseMaybe).Just(v-12));
    }, 3000);
  })
  .then((mSelf, v) => {
    console.log('>> 3, should no 4 because we return Nothing');
    mSelf.returns((new PromiseMaybe).Nothing());
  })
  .then((mSelf, v) => {
    console.log('>> 4');
    mSelf.returns((new PromiseMaybe).Just(v+12));
  });
*/
