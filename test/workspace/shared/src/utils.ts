// This file should be checked with strict: true and declaration: true
export interface Config {
  apiKey: string;
  timeout?: number;
}

export function validateConfig(config: Config): boolean {
  if (!config.apiKey) {
    return false;
  }
  return true;
}

// This should cause an error in strict mode
let uninitializedValue: number;
export const buggyFunction = () => uninitializedValue + 1;
