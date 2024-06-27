import { CapacitorHttp, HttpResponse } from "@capacitor/core";
import BasicError from "./errors/BasicError";
import NetworkConnectionError from "./errors/NetworkConnectionError";
import UnhandledError from "./errors/UnhandledError";
import type { BasicError as BasicErrorType } from "./errors/BasicError";
import type { NetworkConnectionError as NetworkConnectionErrorType } from "./errors/NetworkConnectionError";
import type { UnhandledError as UnhandledErrorType } from "./errors/UnhandledError";
import { AsyncReturnTypeWithError } from "../../types";

type HttpClientConfig = {
  useBaseUrl?: boolean;
  headers?: { [key: string]: string };
};

type HttpClientError =
  | BasicErrorType
  | NetworkConnectionErrorType
  | UnhandledErrorType;

type HttpClientType = {
  get(
    url: string,
    params?: Record<string, any>,
    config?: HttpClientConfig
  ): Promise<[unknown] | [void, HttpClientError]>;
  post(
    url: string,
    body: any,
    config?: HttpClientConfig
  ): Promise<[unknown] | [void, HttpClientError]>;
  ping(
    url: string,
    config?: HttpClientConfig
  ): Promise<[unknown] | [void, HttpClientError]>;
  put(
    url: string,
    body: any,
    config?: HttpClientConfig
  ): Promise<[unknown] | [void, HttpClientError]>;
  delete(
    url: string,
    config?: HttpClientConfig
  ): Promise<[unknown] | [void, HttpClientError]>;
  setBaseUrl(url: string): void;
  getBaseUrl(): string | undefined;
  initialize(): Promise<void>;
};

class HttpClientService implements HttpClientType {
  private baseUrl: string | undefined;
  private initialized = false;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    this.initialized = true;
  }

  public async get(
    url: string,
    params: Record<string, any> = {},
    config: HttpClientConfig = {}
  ): Promise<[unknown] | [void, HttpClientError]> {
    try {
      const fullUrl = this.buildUrl(
        url,
        config.useBaseUrl === false ? "" : this.baseUrl,
        params
      );
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "GET",
        headers: config.headers,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      const handledResponse = this.handleResponse(response);

      if (handledResponse.length === 2) {
        return [, handledResponse[1]];
      }

      return handledResponse;
    } catch (error) {
      return [, this.handleError(error)];
    }
  }

  public async post(
    url: string,
    body: any,
    config: HttpClientConfig = {}
  ): Promise<[unknown] | [void, HttpClientError]> {
    try {
      config.headers = {
        "Content-Type": "application/json",
        ...config.headers,
      };
      const fullUrl = this.buildUrl(
        url,
        config.useBaseUrl === false ? "" : this.baseUrl
      );
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "POST",
        headers: config.headers,
        data: body,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      return this.handleResponse(response);
    } catch (error) {
      return [, this.handleError(error)];
    }
  }

  public async put(
    url: string,
    body: any,
    config: HttpClientConfig = {}
  ): Promise<[unknown] | [void, HttpClientError]> {
    try {
      const fullUrl = this.buildUrl(
        url,
        config.useBaseUrl === false ? "" : this.baseUrl
      );
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "PUT",
        data: body,
        headers: config.headers,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      return this.handleResponse(response);
    } catch (error) {
      return [, this.handleError(error)];
    }
  }

  public async delete(
    url: string,
    config: HttpClientConfig = {}
  ): Promise<[unknown] | [void, HttpClientError]> {
    try {
      const fullUrl = this.buildUrl(
        url,
        config.useBaseUrl === false ? "" : this.baseUrl
      );
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "DELETE",
        headers: config.headers,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      return this.handleResponse(response);
    } catch (error) {
      return [, this.handleError(error)];
    }
  }

  public async ping(
    url: string | undefined = "",
    config: HttpClientConfig = {}
  ): Promise<[unknown] | [void, HttpClientError]> {
    try {
      const fullUrl = this.buildUrl(
        url || "/utils/ping",
        config.useBaseUrl === false ? "" : this.baseUrl
      );
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "POST",
        headers: config.headers,
      }).catch((error) => {
        throw new NetworkConnectionError(error.message);
      });

      return this.handleResponse<unknown>(response);
    } catch (error) {
      return [, this.handleError(error)];
    }
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  public getBaseUrl(): string | undefined {
    return this.baseUrl;
  }

  private buildUrl(
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

  private handleResponse<R = unknown>(
    response: HttpResponse
  ): [R] | [void, HttpClientError] {
    if (response.status >= 200 && response.status < 300) {
      return [response.data];
    }

    return [, new BasicError(response.data, response.status)];
  }

  private handleError(error: unknown): HttpClientError {
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
}

export default HttpClientService;
export { BasicError, NetworkConnectionError, UnhandledError };
export type {
  HttpClientType,
  HttpClientConfig,
  HttpClientError,
  BasicErrorType,
  NetworkConnectionErrorType,
  UnhandledErrorType,
};
