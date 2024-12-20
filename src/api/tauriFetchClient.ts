import { fetch } from "@tauri-apps/plugin-http";

const baseURL = "http://localhost:2900";

interface FetchRequestConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  parseAs?: "json" | "text" | "binary";
}

interface FetchResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

const timeoutPromise = (ms: number) => {
  return new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out after ${ms} ms`)), ms)
  );
};

export const tauriFetch = async <T = any>({
  url,
  method = "GET",
  headers = {},
  body,
  timeout = 30,
  parseAs = "json",
}: FetchRequestConfig): Promise<FetchResponse<T>> => {
  try {
    url = baseURL + url;
    if (method !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    const fetchPromise = fetch(url, {
      method,
      headers,
      body,
    });

    const response = await Promise.race([
      fetchPromise,
      timeoutPromise(timeout * 1000),
    ]);

    const statusText = response.ok ? "OK" : "Error";

    let data: any;
    if (parseAs === "json") {
      data = await response.json();
    } else if (parseAs === "text") {
      data = await response.text();
    } else {
      data = await response.arrayBuffer();
    }

    return {
      data,
      status: response.status,
      statusText,
      headers: response.headers,
    };
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
};
