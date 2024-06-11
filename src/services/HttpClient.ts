import { CapacitorHttp } from "@capacitor/core";

type HttpClient = {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: any): Promise<T>;
  put<T>(url: string, body: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
};

const HttpClient: HttpClient = {
  async get<T>(url: string) {
    const response = await CapacitorHttp.request({
      url,
      method: "GET",
    });

    return response.data;
  },

  async post<T>(url: string, body: any) {
    const response = await CapacitorHttp.request({
      url,
      method: "POST",
      data: body,
    });

    return response.data;
  },

  async put<T>(url: string, body: any) {
    const response = await CapacitorHttp.request({
      url,
      method: "PUT",
      data: body,
    });

    return response.data;
  },

  async delete<T>(url: string) {
    const response = await CapacitorHttp.request({
      url,
      method: "DELETE",
    });

    return response.data;
  },
};

export default HttpClient;
export type { HttpClient };
