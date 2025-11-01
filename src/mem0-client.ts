const DEFAULT_HOST = 'https://api.mem0.ai';

export type Role = 'user' | 'assistant';

export type Message = {
  role: Role;
  content: string;
};

export type AddOptions = {
  user_id?: string;
  async_mode?: boolean;
  version?: string;
  api_version?: string;
  [key: string]: unknown;
};

export type SearchOptions = {
  api_version?: string;
  version?: string;
  [key: string]: unknown;
};

export type MemorySearchResult = {
  memory?: string;
  score?: number;
  [key: string]: unknown;
};

type ClientOptions = {
  apiKey: string;
  host?: string;
};

function normalizeObject<T extends Record<string, unknown>>(input: T): T {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.toLowerCase().includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

export class MemoryClient {
  private readonly apiKey: string;

  private readonly host: string;

  constructor(options: ClientOptions) {
    if (!options.apiKey || options.apiKey.trim() === '') {
      throw new Error('Mem0 API key is required');
    }

    this.apiKey = options.apiKey;
    this.host = options.host ?? DEFAULT_HOST;
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const response = await fetch(new URL(path, this.host), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${this.apiKey}`,
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Mem0 request failed (${response.status}): ${body}`);
    }

    return parseJsonSafe(response);
  }

  async add(messages: Message[], options: AddOptions = {}): Promise<unknown> {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('At least one message is required to add memory');
    }

    const payload = normalizeObject({
      messages,
      ...options,
    });

    return this.request('/v1/memories/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<MemorySearchResult[]> {
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }

    const { api_version, version, ...rest } = options;
    const requestedVersion = (api_version ?? version)?.toLowerCase();
    const endpoint = requestedVersion === 'v2'
      ? '/v2/memories/search/'
      : '/v1/memories/search/';

    const payload = normalizeObject({
      query,
      ...rest,
    });

    const result = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (Array.isArray(result)) {
      return result as MemorySearchResult[];
    }

    if (
      result &&
      typeof result === 'object' &&
      'results' in (result as Record<string, unknown>) &&
      Array.isArray((result as { results?: unknown[] }).results)
    ) {
      return ((result as { results?: unknown[] }).results ?? []) as MemorySearchResult[];
    }

    if (
      result &&
      typeof result === 'object' &&
      'data' in (result as Record<string, unknown>) &&
      Array.isArray((result as { data?: unknown[] }).data)
    ) {
      return ((result as { data?: unknown[] }).data ?? []) as MemorySearchResult[];
    }

    return [];
  }
}

export default MemoryClient;
