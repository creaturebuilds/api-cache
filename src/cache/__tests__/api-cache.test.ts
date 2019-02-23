/*
 * Copyright 2019 Creature, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import ms from 'ms';
import ApiCache from "../api-cache";
import Store from "../../store/store";
import { MethodConfig } from '../../types/core';

jest.mock('ms');
jest.mock('../../store/store');

describe('ApiCache', () => {
  let apiCache: ApiCache;
  let store: Store;
  let contextCallback: jest.Mock;
  let testMethodConfig: MethodConfig;

  beforeEach(() => {
    jest.resetAllMocks();

    // @ts-ignore
    store = new Store();
    contextCallback = jest.fn();
    apiCache = new ApiCache(store, contextCallback);
    testMethodConfig = {
      method: jest.fn(),
      cacheKey: 'TestAPI-getData',
      expiresAt: Date.now() + 20000
    };
  });

  describe('checkExpired', () => {
    it('Should return true with no expiresAt timestamp', () => {
      expect(apiCache['checkExpired']({})).toBe(true);
    });

    it('Should return true for expired data', () => {
      const dataWrapper = {
        expiresAt: Date.now() - 10000,
      };

      expect(apiCache['checkExpired'](dataWrapper)).toBe(true);
    });

    it('Should return false for unexpired data', () => {
      const dataWrapper = {
        expiresAt: Date.now() + 20000,
      };

      expect(apiCache['checkExpired'](dataWrapper)).toBe(false);
    });
  });

  describe('saveData', () => {
    it('Set data to the store using the correct key', () => {
      apiCache['saveData'](testMethodConfig, { foo: 'bar' });

      // @ts-ignore
      expect(store.setJSONMock).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(store.setJSONMock.mock.calls[0][0]).toBe('TestAPI-getData');
      // @ts-ignore
      expect(store.setJSONMock.mock.calls[0][1]).toMatchObject({
        expiresAt: testMethodConfig.expiresAt,
        data: {
          foo: 'bar',
        },
      });
    });
  });

  describe('runMethod', () => {
    let saveDataSpy;

    beforeEach(() => {
      // @ts-ignore
      testMethodConfig.method.mockResolvedValue({
        foo: 'bar',
      });
      // @ts-ignore
      saveDataSpy = jest.spyOn(apiCache, 'saveData');
    });

    it('Should call the method, saving and returning its response', (done) => {
      apiCache['runMethod'](testMethodConfig);

      expect(testMethodConfig.method).toHaveBeenCalledTimes(1);

     setTimeout(() => {
        expect(saveDataSpy).toHaveBeenCalledTimes(1);
        done();
      }, 200);
    });
  });

  describe('getCachedOrRunMethod', async () => {
    let runMethodSpy;
    let cacheData;

    beforeEach(() => {
      // @ts-ignore
      runMethodSpy = jest.spyOn(apiCache, 'runMethod');
      // @ts-ignore
      testMethodConfig.method.mockResolvedValue({
        foo: 'bar',
        we: 'are something else',
      });
      cacheData = {
        someData: 'from the cache',
      };
    });

    it('Should call the method directly with no cached data available', async (done) => {
      // @ts-ignore
      store.getJSONMock.mockResolvedValue(null);
      const data = await apiCache['getCachedOrRunMethod'](testMethodConfig);

      expect(data).toMatchObject({
        foo: 'bar',
        we: 'are something else',
      });

      done();
    });

    it('Should call the method directly with no expiresAt timestamp', async (done) => {
      delete testMethodConfig.expiresAt;
      const data = await apiCache['getCachedOrRunMethod'](testMethodConfig);

      expect(data).toMatchObject({
        foo: 'bar',
        we: 'are something else',
      });

      done();
    });

    it('Should return the cached data and not call the method', async (done) => {
      // @ts-ignore
      store.getJSONMock.mockResolvedValue({
        data: cacheData,
        expiresAt: Date.now() + 20000,
      });
      const data = await apiCache['getCachedOrRunMethod'](testMethodConfig);

      expect(data).toMatchObject({
        someData: 'from the cache',
      });

      setTimeout(() => {
        expect(runMethodSpy).not.toHaveBeenCalled();
        done();
      }, 200);
    });

    it('Should return the cached data and call the method again', async (done) => {
      // @ts-ignore
      store.getJSONMock.mockResolvedValue({
        data: cacheData,
        expiresAt: Date.now() - 20000,
      });
      const data = await apiCache['getCachedOrRunMethod'](testMethodConfig);

      expect(data).toMatchObject({
        someData: 'from the cache',
      });

      setTimeout(() => {
        expect(runMethodSpy).toHaveBeenCalledTimes(1);
        expect(runMethodSpy.mock.calls[0][0]).toMatchObject(testMethodConfig);
        expect(runMethodSpy.mock.calls[0][0]).toBe(testMethodConfig);
        done();
      }, 200);
    });
  });

  describe('wrapMethod', () => {
    let getCachedOrRunMethodMock;
    let testArgs;
    let testContext;
    let method;

    beforeEach(() => {
      method = jest.fn();
      method.mockResolvedValue({ foo: 'bar' });
      // @ts-ignore
      getCachedOrRunMethodMock = jest.spyOn(apiCache, 'getCachedOrRunMethod');
      testArgs = {
        type: 'admin',
      };
      testContext = {
        user: {
          id: '1234-56789-1011',
        },
      };
    });

    it('Should correctly wrap a method without context', async (done) => {
      const wrappedMethod = apiCache['wrapMethod']('TestAPI-getData', method, 10000, false);

      expect(typeof wrappedMethod).toBe('function');
      const methodResponse = await wrappedMethod(testArgs, testContext);

      expect(contextCallback).not.toHaveBeenCalled();
      expect(getCachedOrRunMethodMock).toHaveBeenCalledTimes(1);

      const generatedMethodConfig = getCachedOrRunMethodMock.mock.calls[0][0];
      expect(generatedMethodConfig.cacheKey).toBe(`TestAPI-getData-${JSON.stringify(testArgs)}`);
      expect(typeof generatedMethodConfig.expiresAt).toBe('number');
      expect(typeof generatedMethodConfig.method).toBe('function');

      expect(method).toHaveBeenCalledTimes(1);
      expect(method.mock.calls[0][0]).toBe(testArgs);
      expect(method.mock.calls[0][1]).toBe(testContext);
      expect(methodResponse).toMatchObject({
        foo: 'bar',
      });

      done();
    });

    it('Should correctly wrap a method with context', async (done) => {
      contextCallback.mockReturnValue('1234-56789-1011');

      const wrappedMethod = await apiCache['wrapMethod']('TestAPI-getData', method, 10000, true);
      wrappedMethod(testArgs, testContext);
      expect(contextCallback).toHaveBeenCalledTimes(1);
      expect(contextCallback.mock.calls[0][0]).toBe(testContext);
      expect(getCachedOrRunMethodMock.mock.calls[0][0].cacheKey).toBe(
        `TestAPI-getData-${JSON.stringify(testArgs)}-1234-56789-1011`
      );

      done();
    });
  });

  describe('cachify', () => {
    let testApi;
    let wrapMethodSpy;

    beforeEach(() => {
      testApi = {
        getSomeData() {},
        getSomeStuff() {},
        dontCacheThis: 'intact',
      };

      // @ts-ignore
      wrapMethodSpy = jest.spyOn(apiCache, 'wrapMethod');
    });

    it('Should wrap methods for an API', () => {
      ms.mockReturnValueOnce(30000);
      ms.mockReturnValueOnce(60000);

      const cachedTestApi = apiCache.cachify(testApi, 'TestAPI', {
        getSomeData: {
          ttl: '30s',
          useContext: false,
        },
        getSomeStuff: {
          ttl: '1m',
          useContext: true,
        },
      });

      expect(wrapMethodSpy).toHaveBeenCalledTimes(2);

      const firstWrapArgs = wrapMethodSpy.mock.calls[0];
      const secondWrapArgs = wrapMethodSpy.mock.calls[1];
      expect(firstWrapArgs[0]).toBe('TestAPI-getSomeData');
      expect(typeof firstWrapArgs[1]).toBe('function');
      expect(firstWrapArgs[2]).toBe(30000);
      expect(firstWrapArgs[3]).toBe(false);
      expect(secondWrapArgs[0]).toBe('TestAPI-getSomeStuff');
      expect(typeof secondWrapArgs[1]).toBe('function');
      expect(secondWrapArgs[2]).toBe(60000);
      expect(secondWrapArgs[3]).toBe(true);

      expect(cachedTestApi.dontCacheThis).toBe('intact');
    });

    it('Should throw an error if a method does not exist', (done) => {
      try {
        apiCache.cachify(testApi, 'TestAPI', {
          methodThatsNotReal: {
            ttl: '365d',
            useContext: false,
          },
        });
      } catch(e) {
        expect(e.message).toBe('No method "methodThatsNotReal" on TestAPI.');
        done();
      }
    });
  });
});