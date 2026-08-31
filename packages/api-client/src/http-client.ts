export interface ApiClientConfig {
  baseUrl?: string;
  getAuthToken?: () => string | null;
  onError?: (error: Error, response?: Response) => void;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class HttpClient {
  private baseUrl: string;
  private token: string | null = null;
  private getAuthTokenFn?: () => string | null;
  private onErrorFn?: (error: Error, response?: Response) => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || "";
    this.getAuthTokenFn = config.getAuthToken;
    this.onErrorFn = config.onError;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers = {}, ...customConfig } = options;

    let url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;

    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          query.append(key, String(val));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    const currentToken = this.token || (this.getAuthTokenFn ? this.getAuthTokenFn() : null);

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    };

    if (currentToken) {
      reqHeaders["Authorization"] = `Bearer ${currentToken}`;
    }

    try {
      const response = await fetch(url, {
        headers: reqHeaders,
        ...customConfig,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown HTTP error");
        const error = new Error(`[ApiClient] ${response.status} ${response.statusText}: ${errorText}`);
        if (this.onErrorFn) {
          this.onErrorFn(error, response);
        }
        throw error;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return response.text() as unknown as T;
    } catch (err: any) {
      if (this.onErrorFn) {
        this.onErrorFn(err);
      }
      throw err;
    }
  }

  public get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}
