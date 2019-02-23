export interface Store {
  getJSON: Function;
  setJSON: Function;
};

export interface MethodConfig {
  method: Function,
  cacheKey: string,
  expiresAt: number|null,
};

export interface MethodConfigParams {
  ttl: string;
  useContext: boolean;
};

export interface RedisClient {
  get: Function;
  set: Function;
};