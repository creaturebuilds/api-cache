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
Object.defineProperty(exports, "__esModule", { value: true });
var ms_1 = __importDefault(require("ms"));
var ApiCache = (function () {
    function ApiCache(store, getContextKey) {
        this.store = store;
        this.getContextKey = getContextKey;
    }
    ApiCache.prototype.checkExpired = function (cachedData) {
        if (cachedData.expiresAt) {
            return Date.now() > cachedData.expiresAt;
        }
        return true;
    };
    ApiCache.prototype.saveData = function (config, data) {
        var cacheKey = config.cacheKey, expiresAt = config.expiresAt;
        this.store.setJSON(cacheKey, { data: data, expiresAt: expiresAt });
    };
    ApiCache.prototype.runMethod = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var method, data;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        method = config.method;
                        return [4, method()];
                    case 1:
                        data = _a.sent();
                        process.nextTick(function () {
                            _this.saveData(config, data);
                        });
                        return [2, data];
                }
            });
        });
    };
    ApiCache.prototype.getCachedOrRunMethod = function (methodConfig) {
        return __awaiter(this, void 0, void 0, function () {
            var cachedData;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.store.getJSON(methodConfig.cacheKey)];
                    case 1:
                        cachedData = _a.sent();
                        if (!cachedData || !methodConfig.expiresAt) {
                            return [2, this.runMethod(methodConfig)];
                        }
                        if (this.checkExpired(cachedData)) {
                            process.nextTick(function () {
                                _this.runMethod(methodConfig);
                            });
                        }
                        return [2, cachedData.data];
                }
            });
        });
    };
    ApiCache.prototype.wrapMethod = function (methodKey, method, ttl, useContext) {
        var _this = this;
        return function (args, context) { return __awaiter(_this, void 0, void 0, function () {
            var methodConfig;
            return __generator(this, function (_a) {
                methodConfig = {
                    cacheKey: methodKey + "-" + JSON.stringify(args),
                    expiresAt: ttl ? ttl + Date.now() : null,
                    method: function () { return method(args, context); },
                };
                if (useContext) {
                    methodConfig.cacheKey += "-" + this.getContextKey(context);
                }
                return [2, this.getCachedOrRunMethod(methodConfig)];
            });
        }); };
    };
    ApiCache.prototype.getMethodKey = function (key, methodName) {
        return key + "-" + methodName;
    };
    ApiCache.prototype.cachify = function (Api, key, config) {
        var _this = this;
        var methods = Object.keys(config);
        methods.forEach(function (methodName) {
            var method = Api[methodName];
            var methodKey = _this.getMethodKey(key, methodName);
            var methodConfig = config[methodName];
            if (!method) {
                throw new Error("No method \"" + methodName + "\" on " + key + ".");
            }
            Api[methodName] = _this.wrapMethod(methodKey, method, ms_1.default(methodConfig.ttl), methodConfig.useContext);
        });
        return Api;
    };
    return ApiCache;
}());
exports.default = ApiCache;
