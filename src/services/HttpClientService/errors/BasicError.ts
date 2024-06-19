import BaseError from "./BaseError";

interface BasicError extends BaseError {
  message: string;
  code?: number;
}

class BasicError extends BaseError implements BasicError {
  constructor(message: string, code?: number) {
    super(message, code);
  }
}

export default BasicError;
export type { BasicError };
