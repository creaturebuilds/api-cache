import ms from 'ms';
import { Store, MethodConfig, MethodConfigParams} from '../types/core';

class ApiCache {
  /**
   * store/cache used to get and set data
   */
  private store: Store;
  /**
   * function to covert a method's context to a unique string
   */
  private getContextKey: Function;

  constructor(store: Store, getContextKey: Function) {
    this.store = store;
    this.getContextKey = getContextKey;

    // TODO - Add support for cache manager
  }

  /**
   * Checks if data received from the cache is expired
   * @param cachedData
   */
  private checkExpired(cachedData: any) {
    if (cachedData.expiresAt) {
      return Date.now() > cachedData.expiresAt;
    }

    // if data has no expiresAt timestamp, assume it's expired
    return true;
  }

  /**
   * Writes new data to the cache
   * @param config
   * @param data
   */
  private saveData(config: MethodConfig, data: any) {
    const { cacheKey, expiresAt } = config;
    this.store.setJSON(cacheKey, { data, expiresAt });
  }

  /**
   * Runs the original method and caches its response
   * @param config
   */
  private async runMethod(config: MethodConfig) {
    // call the original method
    const { method } = config;
    const data = await method();

    process.nextTick(() => {
      this.saveData(config, data);
    });

    return data;
  }

  /**
   * Attempts to return cached data, if valid, otherwise runs the method
   * @param methodConfig
   */
  private async getCachedOrRunMethod(methodConfig: MethodConfig) {
    const cachedData = await this.store.getJSON(methodConfig.cacheKey);

    if (!cachedData || !methodConfig.expiresAt) {
      return this.runMethod(methodConfig);
    }

    if (this.checkExpired(cachedData)) {
      process.nextTick(() => {
        this.runMethod(methodConfig);
      });
    }

    return cachedData.data;
  }

  /**
   * Creates a cached version of a method by wrapping it
   * @param methodKey prefix key + method name
   * @param method the original method
   * @param ttl time to live in milliseconds
   * @param useContext cache key should use extra context in addition to args
   */
  private wrapMethod(
    methodKey: string,
    method: Function,
    ttl: number,
    useContext: boolean
  ) {
    return async (args: any, context: any) => {
      const methodConfig = {
        cacheKey: `${methodKey}-${JSON.stringify(args)}`,
        expiresAt: ttl ? ttl + Date.now() : null,
        method: () => method(args, context),
      };

      if (useContext) {
        methodConfig.cacheKey += this.getContextKey(context);
      }

      return this.getCachedOrRunMethod(methodConfig);
    }
  }

  /**
   * Creates a namespaced key for the method
   * @param key the prefix key
   * @param methodName the method's name
   */
  private getMethodKey(key: string, methodName: string) {
    return `${key}-${methodName}`;
  }

  /**
   * Wraps an Api Class/Object's methods with cached versions
   * @param Api the api to cachify
   * @param key a prefix key to prepend to all cache keys in the store (namespacing)
   * @param config configuration object describing which methods to cache
   */
  public cachify(Api: any, key: string, config: { [key: string]: MethodConfigParams }) {
    const methods = Object.keys(config);

    // loop over methods in the config and wrap them
    methods.forEach((methodName: string) => {
      const method = Api[methodName];
      const methodKey = this.getMethodKey(key, methodName);
      const methodConfig = config[methodName];

      if (!method) {
        throw new Error(`No method "${methodName}" on ${key}.`);
      }

      Api[methodName] = this.wrapMethod(
        methodKey,
        method,
        ms(methodConfig.ttl),
        methodConfig.useContext,
      );
    });

    return Api;
  }
}

export default ApiCache;
