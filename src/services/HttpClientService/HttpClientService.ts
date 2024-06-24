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

interface IHttpClient {
  get<T>(
    url: string,
    params?: Record<string, any>,
    config?: HttpClientConfig
  ): Promise<[T] | [void, Error]>;
  post<T>(
    url: string,
    body: any,
    config?: HttpClientConfig
  ): Promise<[T] | [void, Error]>;
  ping<T>(url: string, config?: HttpClientConfig): Promise<[T] | [void, Error]>;
  put<T>(
    url: string,
    body: any,
    config?: HttpClientConfig
  ): Promise<[T] | [void, Error]>;
  delete<T>(
    url: string,
    config?: HttpClientConfig
  ): Promise<[T] | [void, Error]>;
  setBaseUrl(url: string): void;
  getBaseUrl(): string | undefined;
}

class HttpClientService implements IHttpClient {
  private baseUrl: string | undefined;

  public async get<T>(
    url: string,
    params: Record<string, any> = {},
    config: HttpClientConfig = {}
  ): Promise<[T] | [void, Error]> {
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

      return this.handleResponse(response);
    } catch (error) {
      return [, this.handleError(error)];
    }
  }

  public async post<T>(
    url: string,
    body: any,
    config: HttpClientConfig = {}
  ): Promise<[T] | [void, Error]> {
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

  public async put<T>(
    url: string,
    body: any,
    config: HttpClientConfig = {}
  ): Promise<[T] | [void, Error]> {
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

  public async delete<T>(
    url: string,
    config: HttpClientConfig = {}
  ): Promise<[T] | [void, Error]> {
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

  public async ping<T>(
    url: string | undefined = "",
    config: HttpClientConfig = {}
  ): Promise<[T] | [void, Error]> {
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

      return this.handleResponse(response);
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

  private handleResponse(response: any): [any] | [any, Error] {
    if (response.status >= 200 && response.status < 300) {
      return [response.data];
    }

    return [, new BasicError(response.data, response.status)];
  }

  private handleError(error: unknown): Error {
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

export default new HttpClientService();
export { BasicError, NetworkConnectionError, UnhandledError };
export type {
  IHttpClient,
  HttpClientConfig,
  Error,
  BasicErrorType,
  NetworkConnectionErrorType,
  UnhandledErrorType,
};
