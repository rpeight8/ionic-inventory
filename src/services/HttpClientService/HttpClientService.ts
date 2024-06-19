import { CapacitorHttp } from "@capacitor/core";
import BasicError from "./errors/BasicError";
import NetworkConnectionError from "./errors/NetworkConnectionError";
import UnhandledError from "./errors/UnhandledError";
import type { BasicError as BasicErrorType } from "./errors/BasicError";
import type { NetworkConnectionError as NetworkConnectionErrorType } from "./errors/NetworkConnectionError";
import type { UnhandledError as UnhandledErrorType } from "./errors/UnhandledError";

type HttpClientConfig = {
  useBaseUrl?: boolean;
  headers?: { [key: string]: string };
};

type Error = BasicErrorType | NetworkConnectionErrorType | UnhandledErrorType;

type HttpClient = {
  get<T>(
    url: string,
    params?: Record<string, any>,
    config?: HttpClientConfig
  ): Promise<[T] | [T, Error]>;
  post<T>(
    url: string,
    body: any,
    config?: HttpClientConfig
  ): Promise<[T] | [T, Error]>;
  ping<T>(url: string, config?: HttpClientConfig): Promise<[T] | [T, Error]>;
  put<T>(
    url: string,
    body: any,
    config?: HttpClientConfig
  ): Promise<[T] | [T, Error]>;
  delete<T>(url: string, config?: HttpClientConfig): Promise<[T] | [T, Error]>;
  setBaseUrl(url: string): void;
  getBaseUrl(): string | undefined;
};

let baseUrl: string | undefined;

const HttpClientService: HttpClient = {
  async get<T>(
    url: string,
    params: Record<string, any> = {},
    config: HttpClientConfig = {}
  ) {
    try {
      const fullUrl = buildUrl(
        url,
        config.useBaseUrl === false ? "" : baseUrl,
        params
      );
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "GET",
        headers: config.headers,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      return handleResponse(response);
    } catch (error) {
      return [, handleError(error)];
    }
  },

  async post<T>(url: string, body: any, config: HttpClientConfig = {}) {
    try {
      config.headers = {
        "Content-Type": "application/json",
        ...config.headers,
      };
      const fullUrl = buildUrl(url, config.useBaseUrl === false ? "" : baseUrl);
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "POST",
        headers: config.headers,
        data: body,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      return handleResponse(response);
    } catch (error) {
      return [, handleError(error)];
    }
  },

  async put<T>(url: string, body: any, config: HttpClientConfig = {}) {
    try {
      const fullUrl = buildUrl(url, config.useBaseUrl === false ? "" : baseUrl);
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "PUT",
        data: body,
        headers: config.headers,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      return handleResponse(response);
    } catch (error) {
      return [, handleError(error)];
    }
  },

  async delete<T>(url: string, config: HttpClientConfig = {}) {
    try {
      const fullUrl = buildUrl(url, config.useBaseUrl === false ? "" : baseUrl);
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "DELETE",
        headers: config.headers,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      return handleResponse(response);
    } catch (error) {
      return [, handleError(error)];
    }
  },

  async ping<T>(url: string | undefined = "", config: HttpClientConfig = {}) {
    try {
      const fullUrl = buildUrl(
        url || "/utils/ping",
        config.useBaseUrl === false ? "" : baseUrl
      );
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "POST",
        headers: config.headers,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      return handleResponse(response);
    } catch (error) {
      return [, handleError(error)];
    }
  },

  setBaseUrl(url: string) {
    baseUrl = url;
  },

  getBaseUrl() {
    return baseUrl;
  },
};

function buildUrl(
  url: string,
  baseUrl?: string,
  params?: Record<string, any>
): string {
  let fullUrl = baseUrl ? `${baseUrl}${url}` : url;
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    fullUrl += `?${queryString}`;
  }
  return fullUrl;
}

function handleResponse(response: any): [any] | [any, Error] {
  if (response.status >= 200 && response.status < 300) {
    return [response.data];
  }

  return [, new BasicError(response.data, response.status)];
}

function handleError(error: unknown): Error {
  if (
    error instanceof NetworkConnectionError ||
    error instanceof BasicError ||
    error instanceof UnhandledError
  ) {
    return error;
  }

  let message = "Unhandled error";
  if (error instanceof Error) {
    message = error.message;
  }

  return new UnhandledError(message);
}

export default HttpClientService;
export { BasicError, NetworkConnectionError, UnhandledError };
export type {
  HttpClient,
  HttpClientConfig,
  Error,
  BasicErrorType,
  NetworkConnectionErrorType,
  UnhandledErrorType,
};
