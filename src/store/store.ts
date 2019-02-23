import ms from 'ms';
import { RedisClient } from '../types/core';

class Store {
  /**
   * Instance of Redis to use
   */
  private client: RedisClient;

  constructor(client: RedisClient) {
    this.client = client;
  }

  /**
   * Promisfied Redis get
   * @param key
   */
  public get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err: Error|null, data: any) => {
        err ? reject(err) : resolve(data);
      });
    });
  }

  /**
   * Fetches data from the client, then parses it to JSON
   * @param key
   */
  public async getJSON(key: string): Promise<any> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : data;
  }

  /**
   * Promisfied Redis set
   * @param key
   * @param data
   * @param exp
   */
  public set(key: string, data: string, exp?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const done = (err: Error|null) => {
        err ? reject(err) : resolve();
      };

      if (exp) {
        this.client.set(key, data, 'PX', ms(exp), done);
      } else {
        this.client.set(key, data, done);
      }
    });
  }

  /**
   * Serializes JSON data to a string before setting
   * @param key
   * @param data
   * @param exp
   */
  public setJSON(key: string, data: any, exp?:string): Promise<any> {
    const dataString = JSON.stringify(data);
    return this.set(key, dataString, exp);
  }
}

export default Store;
