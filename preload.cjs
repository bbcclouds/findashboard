const { contextBridge, ipcRenderer } = require('electron');

const baseAPI = {
  // Get a single item by key. Returns { ok: true, value } or { ok: false, error }
  getItem: async (key) => {
    try {
      const res = await ipcRenderer.invoke('db:get-item', key);
      return res;
    } catch (err) {
      return { ok: false, error: 'get_failed' };
    }
  },

  // Set a single item by key. Returns { ok: true } or { ok: false, error }
  setItem: async (key, value) => {
    try {
      const res = await ipcRenderer.invoke('db:set-item', key, value);
      return res;
    } catch (err) {
      return { ok: false, error: 'set_failed' };
    }
  },

  // List keys available in the DB: { ok: true, keys: string[] }
  listKeys: async () => {
    try {
      return await ipcRenderer.invoke('db:list-keys');
    } catch (err) {
      return { ok: false, error: 'list_failed' };
    }
  },
};

// In development expose clearAll for testing; in production do not expose it.
if (process.env.NODE_ENV !== 'production') {
  baseAPI.clearAll = async () => {
    try {
      return await ipcRenderer.invoke('db:clear-all');
    } catch (err) {
      return { ok: false, error: 'clear_failed' };
    }
  };
}

contextBridge.exposeInMainWorld('electronAPI', baseAPI);