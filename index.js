var Syno = require("./SynologyAPI");

var syno = new Syno(
    protocol = "HTTP",
    address = "0.0.0.0", //IP Address or loginto.me address
    port = "5000",
    username = "admin",
    password = "password",
    debug = true);

syno.Auth.Connect().then(function(value) {
    console.log("[Auth] Connected to Synology NAS");
    // Connectivity log confirmation
    if (syno.server.debug) {
        console.log('[Health] Token acquired: ' + syno.server.token);
    }

    // Example: Retrieve Download Station info
    syno.DS.getInfo().then(function(info){
        console.log('[DownloadStation] Info received');
        if (syno.server.debug) {console.log(info);}    
    }, function(reason){
        console.log('[DownloadStation] Error: ' + reason.Message);
    });

    // OPTIONAL: Example upload usage (commented out). Provide local path & remote directory.
    // syno.FS.upload('C:/path/to/local/file.txt', '/home', true).then(function(r){
    //     console.log('[FileStation] Upload Success');
    // }, function(err){
    //     console.log('[FileStation] Upload Failed: ' + err.Message);
    // });

}, function(reason) {
    console.log("[Auth] Connection failed: " + reason.Message);
});




