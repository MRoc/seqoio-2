const json1 = require("ot-json1");

json1.type.composeSimilar = (op1, op2) => {
  return null;
};

function insertOp(path, value) {
  return json1.insertOp(path, value);
}

function removeOp(path) {
  return json1.removeOp(path);
}

function replaceOp(path, value) {
  return json1.replaceOp(path, true, value);
}

function replaceOpWithOld(path, oldValue, newValue) {
  return json1.replaceOp(path, oldValue, newValue);
}

const type = json1.type;

module.exports = { type, insertOp, removeOp, replaceOp, replaceOpWithOld };

