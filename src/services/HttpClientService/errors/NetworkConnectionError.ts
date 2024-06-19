import BaseError from "./BaseError";

interface NetworkConnectionError extends BaseError {
  message: string;
  code?: number;
}

class NetworkConnectionError
  extends BaseError
  implements NetworkConnectionError
{
  constructor(message: string, code?: number) {
    super(message, code);
  }
}

export default NetworkConnectionError;
export type { NetworkConnectionError };
