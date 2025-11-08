// Demo script showing usage of synoClient wrapper
// Adjust paths and NAS settings before running.

const client = require('./synoClient');

(async () => {
  try {
    await client.init({
      protocol: process.env.protocol || 'HTTP',
      address: process.env.address ,
      port: process.env.port,
      username: process.env.username,
      password: process.env.password,
      debug: process.env.debug === 'true'
    });

    // Upload example (adjust local path!)
    const uploadRes = await client.upload('C:/Videos/abc.mp4', '/video', true);
    console.log('Upload result:', uploadRes);

    // Rename example (path must be full path to the uploaded file)
    // On Synology the path may need volume prefix: e.g. /volume1/video/abc.mp4
    // For simplicity we assume /video is valid.
    const renameRes = await client.rename('/video/abc.mp4', 'abc_renamed.mp4');
    console.log('Rename result:', renameRes);

  } catch (err) {
    console.error('Demo error:', err.Message || err);
  } finally {
    await client.logout();
    console.log('Logged out');
  }
})();
