interface HttpClientResponse<T>{
  data: T;
  status: number;
  ok: boolean;
}

type JsonPayload = Record<string, unknown> | null;

class HttpClient {
  private apiUrl: string;
  private csrfToken: string | null;
  private csrfTokenPromise: Promise<string> | null;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
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
      const response = await fetch(`${this.apiUrl}/auth/csrf-token`, {
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
    let response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...buildInit(headers),
      credentials: "include",
    });
    let data = await this.parseJson<T | JsonPayload>(response);

    if (this.isCsrfError(response.status, data)) {
      this.clearCsrfToken();

      const retryHeaders = await this.getMutatingHeaders();
      response = await fetch(`${this.apiUrl}${endpoint}`, {
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
    return this.requestWithCsrf<T>(endpoint, (headers) => ({
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }));
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
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
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
