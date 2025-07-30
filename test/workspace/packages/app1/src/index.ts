// This file should be checked with strict: true
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

// This should cause an error in strict mode
let value: string;
console.log(value); // Error: Variable 'value' is used before being assigned

// Add more obvious errors
function testStrict() {
  // Error: Object is possibly 'undefined'
  const obj: { a?: string } = {};
  console.log(obj.a.length);
  
  // Error: Argument of type 'string | null' is not assignable to parameter of type 'string'
  const maybeNull: string | null = null;
  greet(maybeNull);
}
