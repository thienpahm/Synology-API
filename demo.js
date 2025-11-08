// Demo script showing usage of synoClient wrapper
// Adjust paths and NAS settings before running.

// Load environment variables from .env
require('dotenv').config();
const client = require('./synoClient');

function env(name) {
  // accept lowercase or uppercase keys
  let v = process.env[name] || process.env[name.toUpperCase()];
  if (typeof v !== 'string') return v;
  v = v.trim();
  // strip surrounding single or double quotes
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.substring(1, v.length - 1);
  }
  return v;
}

(async () => {
  try {
    await client.init({
      protocol: process.env.protocol || 'HTTP', // or 'HTTPS'
      address: process.env.address,
      port: process.env.port ,
      username: process.env.username ,
      password: process.env.password,
      debug: process.env.debug === 'true',
      // baseRemotePath: default remote folder to upload into
      baseRemotePath: process.env.baseRemotePath
    });

    // Upload example (adjust local path!)
    // You can omit remotePath to use baseRemotePath, or pass a relative path under it
    const uploadRes = await client.upload('C:/Videos/abc.mp4', '', true);
    console.log('Upload result:', uploadRes);

    // Rename example (path must be full path to the uploaded file)
    // On Synology the path may need volume prefix: e.g. /volume1/video/abc.mp4
    // For simplicity we assume /video is valid.
    const renameRes = await client.rename('/video/abc.mp4', 'abc_renamed.mp4');
    console.log('Rename result:', renameRes);

  } catch (err) {
    // Print full error object so we can see TriedURL / Response details
    try {
      console.error('Demo error:', JSON.stringify(err, null, 2));
    } catch (e) {
      console.error('Demo error (raw):', err);
    }
  } finally {
    await client.logout();
    console.log('Logged out');
  }
})();
