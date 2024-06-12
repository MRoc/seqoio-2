export const validate = (obj, expectedType) => {
  if (obj === undefined) {
    throw new Error(`Argument is undefined!`);
  }
  if (expectedType === "array") {
    if (!Array.isArray(obj)) {
      throw new Error(
        `Argument is ${typeof obj} but expected ${expectedType}!`
      );
    }
  } else if (expectedType === "string") {
    if (typeof obj !== "string") {
      throw new Error(
        `Argument is ${typeof obj} but expected ${expectedType}!`
      );
    }
  } else if (expectedType === "primitive") {
    if (typeof obj !== "string" && typeof obj !== "number") {
      throw new Error(
        `Argument is ${typeof obj} but expected ${expectedType}!`
      );
    }
  } else if (expectedType === "object") {
    if (typeof obj !== "object") {
      throw new Error(
        `Argument is ${typeof obj} but expected ${expectedType}!`
      );
    }
  } else if (expectedType === "function") {
    if (typeof obj !== "function") {
      throw new Error(
        `Argument is ${typeof obj} but expected ${expectedType}!`
      );
    }
  } else {
    throw new Error(`Unknown type to check for: '${expectedType}'!`);
  }
};
