const Syno = require('./SynologyAPI');

let syno = null;
let config = null;

// Internal helper: connect if no token
async function ensureConnected() {
  if (!syno) throw new Error('Synology client not initialized');
  if (!syno.server || !syno.server.token) {
    await syno.Auth.Connect();
  }
}

// Retry wrapper: if Code===106 (Session timeout), re-login and retry once
async function withReAuth(fn) {
  try {
    await ensureConnected();
    return await fn();
  } catch (err) {
    if (err && (err.Code === 106 || err.Message === 'You need to login')) {
      // try re-login once
      await syno.Auth.Connect();
      return await fn();
    }
    throw err;
  }
}

async function init(options) {
  // options: { protocol, address, port, username, password, debug }
  config = options || {};
  syno = new Syno(
    config.protocol || 'HTTP',
    config.address || '127.0.0.1',
    config.port || '5000',
    config.username || '',
    config.password || '',
    !!config.debug
  );
  await syno.Auth.Connect();
  if (syno.server && syno.server.debug) {
    console.log('[synoClient] Connected. Token:', syno.server.token);
  }
  return syno;
}

async function upload(localFile, remotePath, overwrite) {
  return withReAuth(() => syno.FS.upload(localFile, remotePath, overwrite === true));
}

async function rename(path, newName) {
  return withReAuth(() => syno.FS.rename(path, newName));
}

async function logout() {
  if (!syno) return;
  try {
    await syno.Auth.Logout();
  } catch (_) {}
}

module.exports = {
  init,
  upload,
  rename,
  logout,
  // expose raw syno if needed
  getSyno: () => syno
};
