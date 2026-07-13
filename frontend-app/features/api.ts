interface HttpClientResponse<T>{
  data: T;
  status: number;
  ok: boolean;
}

type JsonPayload = Record<string, unknown> | null;

const DEFAULT_API_URL = "http://localhost:8000/api";

function isLocalApiHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getApiUrl(): string {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

  if (typeof window === "undefined") {
    return configuredApiUrl.replace(/\/$/, "");
  }

  try {
    const url = new URL(configuredApiUrl, window.location.origin);

    if (window.location.protocol === "https:" && url.protocol === "http:" && !isLocalApiHost(url.hostname)) {
      url.protocol = "https:";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return configuredApiUrl.replace(/\/$/, "");
  }
}

class HttpClient {
  private csrfToken: string | null;
  private csrfTokenPromise: Promise<string> | null;

  constructor() {
    this.csrfToken = null;
    this.csrfTokenPromise = null;
  }

  private async ensureCsrfToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    if (this.csrfTokenPromise) {
      return this.csrfTokenPromise;
    }

    this.csrfTokenPromise = (async () => {
      const response = await fetch(`${getApiUrl()}/auth/csrf-token`, {
        headers: {
          "Accept": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Impossible de récupérer le token CSRF.");
      }

      const data = await response.json() as { csrfToken?: string };

      if (!data.csrfToken) {
        throw new Error("Réponse CSRF invalide.");
      }

      this.csrfToken = data.csrfToken;

      return data.csrfToken;
    })();

    try {
      return await this.csrfTokenPromise;
    } finally {
      this.csrfTokenPromise = null;
    }
  }

  private async getMutatingHeaders(): Promise<Record<string, string>> {
    const csrfToken = await this.ensureCsrfToken();

    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-CSRF-TOKEN": csrfToken,
    };
  }

  private clearCsrfToken(): void {
    this.csrfToken = null;
    this.csrfTokenPromise = null;
  }

  private async parseJson<T>(response: Response): Promise<T> {
    const text = await response.text();

    if (!text) {
      return null as T;
    }

    return JSON.parse(text) as T;
  }

  private isCsrfError(status: number, data: unknown): boolean {
    return (
      status === 403 &&
      typeof data === "object" &&
      data !== null &&
      "errorMessage" in data &&
      (data as { errorMessage?: unknown }).errorMessage === "Token CSRF invalide."
    );
  }

  private async requestWithCsrf<T>(
    endpoint: string,
    buildInit: (headers: Record<string, string>) => RequestInit,
  ): Promise<HttpClientResponse<T>> {
    const headers = await this.getMutatingHeaders();
    let response = await fetch(`${getApiUrl()}${endpoint}`, {
      ...buildInit(headers),
      credentials: "include",
    });
    let data = await this.parseJson<T | JsonPayload>(response);

    if (this.isCsrfError(response.status, data)) {
      this.clearCsrfToken();

      const retryHeaders = await this.getMutatingHeaders();
      response = await fetch(`${getApiUrl()}${endpoint}`, {
        ...buildInit(retryHeaders),
        credentials: "include",
      });
      data = await this.parseJson<T | JsonPayload>(response);
    }

    return {
      data: data as T,
      status: response.status,
      ok: response.ok,
    };
  }

  async post<T, U = unknown>(endpoint: string, data: U): Promise<HttpClientResponse<T>> {
    const result = await this.requestWithCsrf<T>(endpoint, (headers) => ({
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }));

    if (result.ok && (endpoint === "/auth/register" || endpoint === "/auth/login")) {
      this.clearCsrfToken();
    }

    return result;
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<HttpClientResponse<T>> {
    return this.requestWithCsrf<T>(endpoint, (headers) => ({
      method: "POST",
      headers: {
        "Accept": "application/json",
        "X-CSRF-TOKEN": headers["X-CSRF-TOKEN"],
      },
      body: formData,
    }));
  }

  async get<T>(endpoint: string): Promise<HttpClientResponse<T>> {
    const response = await fetch(`${getApiUrl()}${endpoint}`, {
      headers: {
        "Accept": "application/json",
      },
      credentials: "include", 
    });
    return {
      data: await response.json(),
      status: response.status,
      ok: response.ok,
    };
  }

  async put<T, U = unknown>(endpoint: string, data: U): Promise<HttpClientResponse<T>> {
    return this.requestWithCsrf<T>(endpoint, (headers) => ({
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    }));
  }

  async patch<T, U = unknown>(endpoint: string, data: U): Promise<HttpClientResponse<T>> {
    return this.requestWithCsrf<T>(endpoint, (headers) => ({
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    }));
  }

  async remove<T, U = undefined>(endpoint: string, data?: U): Promise<HttpClientResponse<T>> {
    const result = await this.requestWithCsrf<T>(endpoint, (headers) => ({
      method: "DELETE",
      headers: {
        "Accept": "application/json",
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        "X-CSRF-TOKEN": headers["X-CSRF-TOKEN"],
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }));

    if (endpoint === "/auth/logout") {
      this.clearCsrfToken();
    }

    return result;
  }
}

const httpClient = new HttpClient();

export default httpClient;
