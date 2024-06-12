import { CapacitorHttp } from "@capacitor/core";

type HttpClientConfig = {
  baseUrl?: string;
  headers?: { [key: string]: string };
};

type HttpClient = {
  get<T>(
    url: string,
    params?: Record<string, any>,
    config?: HttpClientConfig
  ): Promise<T>;
  post<T>(url: string, body: any, config?: HttpClientConfig): Promise<T>;
  put<T>(url: string, body: any, config?: HttpClientConfig): Promise<T>;
  delete<T>(url: string, config?: HttpClientConfig): Promise<T>;
};

const HttpClientService: HttpClient = {
  async get<T>(
    url: string,
    params: Record<string, any> = {},
    config: HttpClientConfig = {}
  ) {
    try {
      const fullUrl = buildUrl(url, config.baseUrl, params);
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
      const fullUrl = buildUrl(url, config.baseUrl);
      const response = await CapacitorHttp.request({
        url: fullUrl,
        method: "POST",
        data: body,
        headers: config.headers,
      });

      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  async put<T>(url: string, body: any, config: HttpClientConfig = {}) {
    try {
      const fullUrl = buildUrl(url, config.baseUrl);
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
      const fullUrl = buildUrl(url, config.baseUrl);
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
