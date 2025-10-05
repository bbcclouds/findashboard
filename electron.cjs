const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const Ajv = require('ajv');
const ajv = new Ajv();

// Simple schemas for some high-risk keys
const SCHEMAS = {
  password: { type: ['string', 'null'] },
  accounts: { type: 'array', items: { type: 'object' } },
  transactions: { type: 'array', items: { type: 'object' } },
  homes: { type: 'array', items: { type: 'object' } },
};

const validators = {};
for (const k of Object.keys(SCHEMAS)) validators[k] = ajv.compile(SCHEMAS[k]);
let keytar;
try { keytar = require('keytar'); } catch (e) { console.warn('keytar not available; DB encryption will be disabled', e); }

// --- Constants ---
const isDev = !app.isPackaged;
const DB_PATH = path.join(app.getPath('userData'), 'db.json');

// --- Data Management ---
// Use a null-prototype object to avoid prototype pollution risks when assigning keys
let dbCache = Object.create(null);

const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function isValidKey(key) {
  return typeof key === 'string' && key.length > 0 && !FORBIDDEN_KEYS.has(key) && !key.includes('\0');
}

// Allowed keys list: restrict what renderer can set to reduce blast radius
const ALLOWED_KEYS = new Set([
  'appName','password','accounts','stocks','crypto','retirementAccounts','retirementHoldings','retirementContributions','creditCards','incomeSources','incomeRecords','formalDebts','commitments','receivables','paymentRecords','allocations','transactions','categories','otherAssets','goals','recurringEvents','homes','homeImprovements'
]);

let encryptionKey = null;

async function getEncryptionKey() {
  if (!keytar) return null;
  try {
    const service = app && app.getName ? app.getName() : 'findash';
    const account = 'db-encryption-key-v1';
    let keyB64 = await keytar.getPassword(service, account);
    if (keyB64) return Buffer.from(keyB64, 'base64');
    const newKey = crypto.randomBytes(32);
    await keytar.setPassword(service, account, newKey.toString('base64'));
    return newKey;
  } catch (e) {
    console.error('Failed to access keytar for encryption key', e);
    return null;
  }
}

async function loadData() {
  try {
    const dataStr = await fs.readFile(DB_PATH, 'utf-8');
    // Try to parse an encrypted payload first
    let parsedFile = JSON.parse(dataStr || '{}');
    let plain = null;
    if (parsedFile && parsedFile.data && parsedFile.iv && parsedFile.tag) {
      // Encrypted format. Attempt to decrypt.
      if (!encryptionKey) encryptionKey = await getEncryptionKey();
      if (!encryptionKey) throw new Error('encryption_key_unavailable');
      try {
        const iv = Buffer.from(parsedFile.iv, 'base64');
        const tag = Buffer.from(parsedFile.tag, 'base64');
        const ciphertext = Buffer.from(parsedFile.data, 'base64');
        const dec = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
        dec.setAuthTag(tag);
        const decrypted = Buffer.concat([dec.update(ciphertext), dec.final()]);
        plain = JSON.parse(decrypted.toString('utf8'));
      } catch (e) {
        console.error('Failed to decrypt DB; attempting legacy parse', e);
        // Fall through to legacy attempt
      }
    }

    // Legacy plaintext JSON fallback
    if (plain === null) {
      try {
        plain = parsedFile;
      } catch (e) {
        plain = {};
      }
    }

    // Populate a null-prototype object from parsed data while skipping dangerous keys
    dbCache = Object.create(null);
    if (plain && typeof plain === 'object') {
      for (const [k, v] of Object.entries(plain)) {
        if (isValidKey(k)) dbCache[k] = v;
      }
    }
  } catch (error) {
    console.error("Database file is invalid or missing. Resetting to {}.", error);
    dbCache = Object.create(null);
    await saveData();
  }
}

async function saveData() {
  try {
    // Prepare plaintext
    const plaintext = JSON.stringify(dbCache, null, 2);

    // If possible, encrypt using keytar-stored key and AES-256-GCM
    let out = null;
    try {
      if (!encryptionKey) encryptionKey = await getEncryptionKey();
      if (encryptionKey) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
        const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
        const tag = cipher.getAuthTag();
        out = JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: tag.toString('base64'), data: encrypted.toString('base64') });
      }
    } catch (e) {
      console.error('Encryption failed, falling back to plaintext write', e);
      out = null;
    }

    const toWrite = out || plaintext;

    // Write atomically: write to a temp file and rename into place
    const tempPath = DB_PATH + '.tmp';
    await fs.writeFile(tempPath, toWrite, 'utf-8');
    await fs.rename(tempPath, DB_PATH);
  } catch (error) {
    console.error("Fatal: Failed to save data to database file:", error);
  }
}

// Debounced save logic to reduce disk churn and mitigate DoS via rapid writes
let saveTimer = null;
let saveInProgress = false;
function scheduleSave(immediate = false) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (immediate) {
    // Fire and forget, but avoid concurrent saves
    if (!saveInProgress) {
      saveInProgress = true;
      saveData().finally(() => { saveInProgress = false; });
    }
    return;
  }
  // Debounce short window
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (!saveInProgress) {
      saveInProgress = true;
      saveData().finally(() => { saveInProgress = false; });
    }
  }, 1000);
}

// --- Window Creation ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Prevent renderer from opening arbitrary windows; open external URLs in default browser instead
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      // Only allow external URLs to open in the user's browser, never in-app
      shell.openExternal(url);
    } catch (e) {
      console.error('Failed to open external URL', e);
    }
    return { action: 'deny' };
  });

  // Prevent navigation to remote sites inside the app's window
  win.webContents.on('will-navigate', (event, url) => {
    const allowedOrigin = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'dist', 'index.html')}`;
    // If URL doesn't start with the app's origin, block it and open externally
    if (!url.startsWith(allowedOrigin) && !url.startsWith('file://')) {
      event.preventDefault();
      try { shell.openExternal(url); } catch (e) { console.error('Failed to open external URL', e); }
    }
  });
}

// --- App Lifecycle & IPC Handlers ---
app.whenReady().then(async () => {
  await loadData();

  // Return a single item by key. Reject forbidden keys.
  ipcMain.handle('db:get-item', (_event, key) => {
    if (!isValidKey(key)) return { ok: false, error: 'invalid_key' };
    if (!ALLOWED_KEYS.has(key)) return { ok: false, error: 'not_allowed' };
    return { ok: true, value: dbCache.hasOwnProperty(key) ? dbCache[key] : undefined };
  });

  // List keys available in DB (non-sensitive). This allows renderer to discover stored keys without exposing values.
  ipcMain.handle('db:list-keys', () => {
    try {
      // Only return keys that are in the allowlist
      return { ok: true, keys: Object.keys(dbCache).filter(k => ALLOWED_KEYS.has(k)) };
    } catch (err) {
      return { ok: false, error: 'list_failed' };
    }
  });

  ipcMain.handle('db:set-item', async (_event, key, value) => {
    // Validate key to prevent prototype pollution and unexpected types
    const MAX_KEY_LENGTH = 128;
    const MAX_SERIALIZED_BYTES = 200 * 1024; // 200 KB
    const MAX_OBJECT_DEPTH = 8;

    if (!isValidKey(key) || key.length > MAX_KEY_LENGTH) {
      return { ok: false, error: 'invalid_key' };
    }

    if (!ALLOWED_KEYS.has(key)) {
      return { ok: false, error: 'not_allowed' };
    }

    // Schema validation for sensitive keys
    if (validators[key]) {
      try {
        const ok = validators[key](value);
        if (!ok) return { ok: false, error: 'schema_invalid', details: validators[key].errors };
      } catch (e) {
        return { ok: false, error: 'schema_validation_failed' };
      }
    }

    // Basic serialized size check
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch (err) {
      return { ok: false, error: 'value_not_serializable' };
    }

    if (Buffer.byteLength(serialized, 'utf8') > MAX_SERIALIZED_BYTES) {
      return { ok: false, error: 'value_too_large' };
    }

    // Depth check to mitigate deeply nested objects
    function maxDepth(obj, current = 0) {
      if (obj === null || typeof obj !== 'object') return current;
      if (current > MAX_OBJECT_DEPTH) return current;
      let depth = current;
      for (const k of Object.keys(obj)) {
        try {
          depth = Math.max(depth, maxDepth(obj[k], current + 1));
          if (depth > MAX_OBJECT_DEPTH) return depth;
        } catch (e) {
          // ignore
        }
      }
      return depth;
    }

    if (maxDepth(value, 0) > MAX_OBJECT_DEPTH) {
      return { ok: false, error: 'value_too_deep' };
    }

    // Assign and persist (debounced)
    dbCache[key] = value;
    scheduleSave();
    return { ok: true };
  });

  ipcMain.handle('db:clear-all', async () => {
    // Very dangerous operation - only allow in development
    if (!isDev) return { ok: false, error: 'forbidden' };
    dbCache = Object.create(null);
    scheduleSave(true);
    return { ok: true };
  });

  // Navigation safety: prevent renderer from opening new windows to arbitrary URLs and intercept navigation
  const allWindows = BrowserWindow.getAllWindows;

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});