(function(exports) {
'use strict';
  var MaybeT = function(mMaybeValue) {
    this.value = mMaybeValue;
  };

  MaybeT.prototype.then =
  function(step) {
    var mMaybeV = this.value;
    mMaybeV.keep((mSelf, value) => {
      var currentMaybeValue = value;
      var mtReturns = (mMaybeValue) => {
        this.value = mMaybeValue;                     // MaybeT m Maybe v'
        mSelf.returns(mMaybeValue);                   // Go to the next step
      };
      var mtSelf = {
        returns: mtReturns
      };

      if (true === currentMaybeValue.Nothing) {
        var result = (new PromiseMaybe).Nothing();
        this.value = mSelf.lift(result);
      } else if (true === currentMaybeValue.Just) {
        var v = currentMaybeValue.value;    // Maybe v -> v
        step(mtSelf, v);                    // v -> Maybe v'
        // Transfer to mtReturns to do the following things asynchronously.
        // Note: Asynchronous step stop we do this:
        // var result = step(v);             // v -> Maybe v
        // this.value = mSelf.wrap(result);  // Maybe v -> m Maybe v
        //
        // This is more intuitive, but would fail when the step is async.
      } else {
        throw new Error('Not match Maybe type');
      }
    });
    return this;
  };

  MaybeT.prototype.done = function() {
    var mMaybeV = this.value;
    mMaybeV.done();
    return this;
  };

  exports.MaybeT = MaybeT;
})(window);

step1 = (mtSelf, value) => {
  console.log('>> 1', value);
  mtSelf.returns(
    (new Promise2Maybe).Just(
      (new PromiseMaybe).Just(value + 99)));
};

step2 = (mtSelf, value) => {
  setTimeout(() => {
    console.log('>> 2', value);
    mtSelf.returns(
      (new Promise2Maybe).Just(
        (new PromiseMaybe).Just(value - 12)));
  }, 3000);
};

step3 = (mtSelf, value) => {
  console.log('>> 3', value);
    mtSelf.returns(
      (new Promise2Maybe).Just(
        (new PromiseMaybe).Nothing()));
};

step4 = (mtSelf, value) => {
  console.log('>> 4', value);
  mtSelf.returns(
    (new Promise2Maybe).Just(
      (new PromiseMaybe).Just(value + 12)));
};

MaybeV = (new PromiseMaybe).Just(3);
mMaybeV = (new Promise2Maybe).Just(MaybeV);

g = (new MaybeT(mMaybeV))
  .then(step1)
  .then(step2)
  .then(step3)
  .then(step4);

