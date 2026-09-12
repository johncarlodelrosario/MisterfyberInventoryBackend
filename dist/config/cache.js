"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_KEYS = exports.cache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
exports.cache = new node_cache_1.default({
    stdTTL: 300,
    checkperiod: 120,
    useClones: false,
});
exports.CACHE_KEYS = {
    SITES: "sites",
    INVENTORY: "inventory",
    INSTALLATIONS: "installations",
    BUDGET: "budget",
    DASHBOARD: "dashboard",
};
