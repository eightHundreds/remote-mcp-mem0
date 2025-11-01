declare module 'mem0ai' {
  export type Message = {
    role: string;
    content: string;
  };

  export type MemoryClientOptions = {
    apiKey: string;
  };

  export type AddOptions = Record<string, unknown>;
  export type SearchOptions = Record<string, unknown>;

  export class MemoryClient {
    constructor(options: MemoryClientOptions);
    add(messages: Message[], options?: AddOptions): Promise<unknown> | unknown;
    search(
      query: string,
      options?: SearchOptions
    ): Promise<Array<{ memory?: string; score?: number }>>;
  }
}

declare module 'dotenv' {
  export function config(): void;
}
