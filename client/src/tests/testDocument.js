export function TestDocument(type, data = {}) {
  this.type = type;
  this.data = data;
  this.handlers = {};
}

TestDocument.prototype.submitOp = function (op) {
  this.emit("before op", [op, true]);
  this.data = this.type.apply(this.data, op);
  this.emit("op", [op, true]);
};

TestDocument.prototype.on = function (evt, func) {
  if (!(typeof func === "function")) {
    throw new Error("Function required!");
  }
  if (!(evt in this.handlers)) {
    this.handlers[evt] = [];
  }
  this.handlers[evt].push(func);
};

TestDocument.prototype.emit = function (evt, args) {
  if (evt in this.handlers) {
    for (const func of this.handlers[evt]) {
      if (args) {
        func(...args);
      } else {
        func();
      }
    }
  }
};
