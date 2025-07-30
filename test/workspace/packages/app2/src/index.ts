// This file should be checked with strict: false
export function calculate(a, b) {
  // No type annotations - should be fine with strict: false
  return a + b;
}

// This should NOT cause an error with strict: false
let value: string;
console.log(value); // No error in non-strict mode
