import * as json1 from "ot-json1";

json1.type.composeSimilar = (op1, op2) => {
  function path(op) {
    return op.filter((o) => typeof o === "string" || typeof o === "number");
  }

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  const p1 = path(op1);
  const p2 = path(op2);
  if (!arraysEqual(p1, p2)) {
    return null;
  }

  // TODO This only works for undo and can't be synced
  //   if (
  //     op1[op1.length - 1].i !== undefined &&
  //     op2[op2.length - 1].r !== undefined
  //   ) {
  //     return json1.insertOp(p1, op2[op2.length - 1].r);
  //   }

  if (
    op1[op1.length - 1].r !== undefined &&
    op2[op2.length - 1].r !== undefined
  ) {
    return op2;
  }

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

export { type, insertOp, removeOp, replaceOp, replaceOpWithOld };

// import { OpType } from "@mroc/patcher";
// const type = new OpType();
// const insertOp = type.insertOp;
// const removeOp = type.removeOp;
// const replaceOp = type.replaceOp;
// function replaceOpWithOld(path, _, newValue) {
//   return type.replaceOp(path, newValue);
// }
