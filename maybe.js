(function(exports) {
'use strict';
  var Maybe = function() {};

  Maybe.prototype.Nothing = function() {
    this.Nothing = true;
    return this;
  };

  Maybe.prototype.Just = function(value) {
    this.Just = true;
    this.value = value;
    return this;
  };

  Maybe.prototype.then = function(step) {
    var newMv;
    if (true === this.Nothing) {
      newMv = this;
    } else if (true === this.Just) {
      var a = this.value;
      newMv = step(a);   // a -> Maybe b
    }
    return newMv;
  };

  exports.Maybe = Maybe;
})(window);

s = (new Maybe()).Just(3)
  .then((v) => {
    return (new Maybe()).Just(v+99);
  })
  .then((v) => {
    return (new Maybe()).Just(v-12);
  })
  .then((v) => {
    return (new Maybe()).Nothing();
  })
  .then((v) => {
    return (new Maybe()).Just(v+12);
  })
