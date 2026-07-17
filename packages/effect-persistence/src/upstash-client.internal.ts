export interface UpstashPersistenceClient {
  readonly get: (key: string) => Promise<unknown>;
  readonly set: (key: string, value: string) => Promise<unknown>;
  readonly del: (...keys: string[]) => Promise<unknown>;
  readonly scan: (
    cursor: string,
    options: Readonly<{ match: string; count: number }>
  ) => Promise<unknown>;
  readonly eval: (
    script: string,
    keys: string[],
    args: string[]
  ) => Promise<unknown>;
}

export type UpstashPersistenceClientFactory = () => UpstashPersistenceClient;
