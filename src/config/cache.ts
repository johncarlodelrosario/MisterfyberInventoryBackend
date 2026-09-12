import NodeCache from "node-cache";

export const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 120,
  useClones: false,
});

export const CACHE_KEYS = {
  SITES: "sites",
  INVENTORY: "inventory",
  INSTALLATIONS: "installations",
  BUDGET: "budget",
  DASHBOARD: "dashboard",
};
