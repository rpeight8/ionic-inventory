interface BaseError extends Error {
  message: string;
  code?: number;
}

class BaseError extends Error implements BaseError {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = new.target.name; // Ensures the correct name is set
    Object.setPrototypeOf(this, new.target.prototype); // Corrects the prototype chain
  }
}

export default BaseError;
export type { BaseError };
