import BaseError from "./BaseError";

interface UnhandledError extends BaseError {
  message: string;
}

class UnhandledError extends BaseError implements UnhandledError {
  constructor(message: string = "Unhandled error") {
    super(message);
  }
}

export default UnhandledError;
export type { UnhandledError };
