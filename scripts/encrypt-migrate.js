const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

async function run() {
  const DB_PATH = path.join(process.cwd(), 'db.json');
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    let parsed = null;
    try { parsed = JSON.parse(data); } catch (e) { console.error('db.json is not valid JSON', e); return; }

    // Ask the user to confirm (we can't prompt in this script easily without extra deps).
    console.log('This script will back up db.json to db.json.bak and write an encrypted db.json using keytar-based key.');
    console.log('Make sure you have run `npm install` and `npx electron-rebuild -w keytar` before running this script.');

    // Create backup
    await fs.writeFile(DB_PATH + '.bak', data, 'utf-8');
    console.log('Backup written to db.json.bak');

    // Try to require keytar
    let keytar = null;
    try { keytar = require('keytar'); } catch (e) { console.error('keytar not available; install & rebuild native modules first', e); return; }

    // Generate or retrieve key
    const service = 'findash';
    const account = 'db-encryption-key-v1';
    let keyB64 = await keytar.getPassword(service, account);
    let keyBuf;
    if (!keyB64) {
      keyBuf = crypto.randomBytes(32);
      await keytar.setPassword(service, account, keyBuf.toString('base64'));
      console.log('New encryption key stored in OS keystore');
    } else {
      keyBuf = Buffer.from(keyB64, 'base64');
      console.log('Using existing encryption key from OS keystore');
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
    const encrypted = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(parsed), 'utf8')), cipher.final()]);
    const tag = cipher.getAuthTag();

    const envelope = { v: 1, iv: iv.toString('base64'), tag: tag.toString('base64'), data: encrypted.toString('base64') };
    await fs.writeFile(DB_PATH, JSON.stringify(envelope, null, 2), 'utf-8');
    console.log('Wrote encrypted db.json');
  } catch (e) {
    console.error('Migration failed', e);
  }
}

run();
