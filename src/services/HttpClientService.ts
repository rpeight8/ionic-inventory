import { CapacitorHttp } from "@capacitor/core";

type HttpClientConfig = {
  useBaseUrl?: boolean;
  headers?: { [key: string]: string };
};

type HttpClient = {
  get<T>(
    url: string,
    params?: Record<string, any>,
    config?: HttpClientConfig
  ): Promise<T>;
  post<T>(url: string, body: any, config?: HttpClientConfig): Promise<T>;
  ping<T>(url: string, config?: HttpClientConfig): Promise<T>;
  put<T>(url: string, body: any, config?: HttpClientConfig): Promise<T>;
  delete<T>(url: string, config?: HttpClientConfig): Promise<T>;
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
      });

      return handleResponse(response);
    } catch (error) {
      handleError(error);
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
      });

      return handleResponse(response);
    } catch (error) {
      handleError(error);
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
      });

      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  async delete<T>(url: string, config: HttpClientConfig = {}) {
    try {
      const fullUrl = buildUrl(url, config.useBaseUrl === false ? "" : baseUrl);
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "DELETE",
        headers: config.headers,
      });

      return handleResponse(response);
    } catch (error) {
      handleError(error);
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
      });

      return handleResponse(response);
    } catch (error) {
      handleError(error);
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

function handleResponse(response: any) {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  } else {
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${response.data}`
    );
  }
}

function handleError(error: any) {
  console.error("HTTP request failed:", error);
  throw error;
}

export default HttpClientService;
export type { HttpClient, HttpClientConfig };
