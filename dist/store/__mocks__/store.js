"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MockStore = (function () {
    function MockStore() {
        this.getJSONMock = jest.fn();
        this.setJSONMock = jest.fn();
    }
    MockStore.prototype.getJSON = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.getJSONMock.apply(this, args);
    };
    MockStore.prototype.setJSON = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.setJSONMock.apply(this, args);
    };
    return MockStore;
}());
exports.default = MockStore;
