"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var ms_1 = __importDefault(require("ms"));
var api_cache_1 = __importDefault(require("../api-cache"));
var store_1 = __importDefault(require("../../store/store"));
jest.mock('ms');
jest.mock('../../store/store');
describe('ApiCache', function () {
    var apiCache;
    var store;
    var contextCallback;
    var testMethodConfig;
    beforeEach(function () {
        jest.resetAllMocks();
        store = new store_1.default();
        contextCallback = jest.fn();
        apiCache = new api_cache_1.default(store, contextCallback);
        testMethodConfig = {
            method: jest.fn(),
            cacheKey: 'TestAPI-getData',
            expiresAt: Date.now() + 20000
        };
    });
    describe('checkExpired', function () {
        it('Should return true with no expiresAt timestamp', function () {
            expect(apiCache['checkExpired']({})).toBe(true);
        });
        it('Should return true for expired data', function () {
            var dataWrapper = {
                expiresAt: Date.now() - 10000,
            };
            expect(apiCache['checkExpired'](dataWrapper)).toBe(true);
        });
        it('Should return false for unexpired data', function () {
            var dataWrapper = {
                expiresAt: Date.now() + 20000,
            };
            expect(apiCache['checkExpired'](dataWrapper)).toBe(false);
        });
    });
    describe('saveData', function () {
        it('Set data to the store using the correct key', function () {
            apiCache['saveData'](testMethodConfig, { foo: 'bar' });
            expect(store.setJSONMock).toHaveBeenCalledTimes(1);
            expect(store.setJSONMock.mock.calls[0][0]).toBe('TestAPI-getData');
            expect(store.setJSONMock.mock.calls[0][1]).toMatchObject({
                expiresAt: testMethodConfig.expiresAt,
                data: {
                    foo: 'bar',
                },
            });
        });
    });
    describe('runMethod', function () {
        var saveDataSpy;
        beforeEach(function () {
            testMethodConfig.method.mockResolvedValue({
                foo: 'bar',
            });
            saveDataSpy = jest.spyOn(apiCache, 'saveData');
        });
        it('Should call the method, saving and returning its response', function (done) {
            apiCache['runMethod'](testMethodConfig);
            expect(testMethodConfig.method).toHaveBeenCalledTimes(1);
            setTimeout(function () {
                expect(saveDataSpy).toHaveBeenCalledTimes(1);
                done();
            }, 200);
        });
    });
    describe('getCachedOrRunMethod', function () { return __awaiter(_this, void 0, void 0, function () {
        var runMethodSpy, cacheData;
        var _this = this;
        return __generator(this, function (_a) {
            beforeEach(function () {
                runMethodSpy = jest.spyOn(apiCache, 'runMethod');
                testMethodConfig.method.mockResolvedValue({
                    foo: 'bar',
                    we: 'are something else',
                });
                cacheData = {
                    someData: 'from the cache',
                };
            });
            it('Should call the method directly with no cached data available', function (done) { return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store.getJSONMock.mockResolvedValue(null);
                            return [4, apiCache['getCachedOrRunMethod'](testMethodConfig)];
                        case 1:
                            data = _a.sent();
                            expect(data).toMatchObject({
                                foo: 'bar',
                                we: 'are something else',
                            });
                            done();
                            return [2];
                    }
                });
            }); });
            it('Should call the method directly with no expiresAt timestamp', function (done) { return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            delete testMethodConfig.expiresAt;
                            return [4, apiCache['getCachedOrRunMethod'](testMethodConfig)];
                        case 1:
                            data = _a.sent();
                            expect(data).toMatchObject({
                                foo: 'bar',
                                we: 'are something else',
                            });
                            done();
                            return [2];
                    }
                });
            }); });
            it('Should return the cached data and not call the method', function (done) { return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store.getJSONMock.mockResolvedValue({
                                data: cacheData,
                                expiresAt: Date.now() + 20000,
                            });
                            return [4, apiCache['getCachedOrRunMethod'](testMethodConfig)];
                        case 1:
                            data = _a.sent();
                            expect(data).toMatchObject({
                                someData: 'from the cache',
                            });
                            setTimeout(function () {
                                expect(runMethodSpy).not.toHaveBeenCalled();
                                done();
                            }, 200);
                            return [2];
                    }
                });
            }); });
            it('Should return the cached data and call the method again', function (done) { return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store.getJSONMock.mockResolvedValue({
                                data: cacheData,
                                expiresAt: Date.now() - 20000,
                            });
                            return [4, apiCache['getCachedOrRunMethod'](testMethodConfig)];
                        case 1:
                            data = _a.sent();
                            expect(data).toMatchObject({
                                someData: 'from the cache',
                            });
                            setTimeout(function () {
                                expect(runMethodSpy).toHaveBeenCalledTimes(1);
                                expect(runMethodSpy.mock.calls[0][0]).toMatchObject(testMethodConfig);
                                expect(runMethodSpy.mock.calls[0][0]).toBe(testMethodConfig);
                                done();
                            }, 200);
                            return [2];
                    }
                });
            }); });
            return [2];
        });
    }); });
    describe('wrapMethod', function () {
        var getCachedOrRunMethodMock;
        var testArgs;
        var testContext;
        var method;
        beforeEach(function () {
            method = jest.fn();
            method.mockResolvedValue({ foo: 'bar' });
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
        it('Should correctly wrap a method without context', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var wrappedMethod, methodResponse, generatedMethodConfig;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wrappedMethod = apiCache['wrapMethod']('TestAPI-getData', method, 10000, false);
                        expect(typeof wrappedMethod).toBe('function');
                        return [4, wrappedMethod(testArgs, testContext)];
                    case 1:
                        methodResponse = _a.sent();
                        expect(contextCallback).not.toHaveBeenCalled();
                        expect(getCachedOrRunMethodMock).toHaveBeenCalledTimes(1);
                        generatedMethodConfig = getCachedOrRunMethodMock.mock.calls[0][0];
                        expect(generatedMethodConfig.cacheKey).toBe("TestAPI-getData-" + JSON.stringify(testArgs));
                        expect(typeof generatedMethodConfig.expiresAt).toBe('number');
                        expect(typeof generatedMethodConfig.method).toBe('function');
                        expect(method).toHaveBeenCalledTimes(1);
                        expect(method.mock.calls[0][0]).toBe(testArgs);
                        expect(method.mock.calls[0][1]).toBe(testContext);
                        expect(methodResponse).toMatchObject({
                            foo: 'bar',
                        });
                        done();
                        return [2];
                }
            });
        }); });
        it('Should correctly wrap a method with context', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var wrappedMethod;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contextCallback.mockReturnValue('1234-56789-1011');
                        return [4, apiCache['wrapMethod']('TestAPI-getData', method, 10000, true)];
                    case 1:
                        wrappedMethod = _a.sent();
                        wrappedMethod(testArgs, testContext);
                        expect(contextCallback).toHaveBeenCalledTimes(1);
                        expect(contextCallback.mock.calls[0][0]).toBe(testContext);
                        expect(getCachedOrRunMethodMock.mock.calls[0][0].cacheKey).toBe("TestAPI-getData-" + JSON.stringify(testArgs) + "-1234-56789-1011");
                        done();
                        return [2];
                }
            });
        }); });
    });
    describe('cachify', function () {
        var testApi;
        var wrapMethodSpy;
        beforeEach(function () {
            testApi = {
                getSomeData: function () { },
                getSomeStuff: function () { },
                dontCacheThis: 'intact',
            };
            wrapMethodSpy = jest.spyOn(apiCache, 'wrapMethod');
        });
        it('Should wrap methods for an API', function () {
            ms_1.default.mockReturnValueOnce(30000);
            ms_1.default.mockReturnValueOnce(60000);
            var cachedTestApi = apiCache.cachify(testApi, 'TestAPI', {
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
            var firstWrapArgs = wrapMethodSpy.mock.calls[0];
            var secondWrapArgs = wrapMethodSpy.mock.calls[1];
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
        it('Should throw an error if a method does not exist', function (done) {
            try {
                apiCache.cachify(testApi, 'TestAPI', {
                    methodThatsNotReal: {
                        ttl: '365d',
                        useContext: false,
                    },
                });
            }
            catch (e) {
                expect(e.message).toBe('No method "methodThatsNotReal" on TestAPI.');
                done();
            }
        });
    });
});
//# sourceMappingURL=api-cache.test.js.map