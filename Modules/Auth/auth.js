const axios = require("axios");
const Utils = require("./../../Modules/Utils/GenericUtils.js");
var Promise = require('promise');


function Auth(server) {

    this.utils = new Utils();
    this.server = server;
    this.URI = this.utils.CreateURI(server);
    this.lol = "lol";
    this.Errors = ["DownloadStation", ];
    // Track required services we auto-detect via query.cgi
    this.needs = {
        "SYNO.API.Auth": false,
        "SYNO.DownloadStation2": false,
        // Add FileStation upload capability detection (generic match on key substring)
        "SYNO.FileStation.Upload": false
    };

}

Auth.prototype.getServices = function() {
    return this.needs;
}

Auth.prototype.getServerSettings = function() {
    return this.server;
}


Auth.prototype.Logout = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        axios.get(self.URI + "/webapi/auth.cgi", { params: { api: 'SYNO.API.Auth', version: 1, method: 'logout', session: 'DownloadStation' }})
            .then(function(response) {
                var content = response.data;
                if (content && content.success) {
                    resolve({ "Success": true });
                } else {
                    reject({ "Success": false, "Message": content && content.error && content.error.code });
                }
            })
            .catch(function() {
                reject({ "Succes": false });
            });
    });
};

Auth.prototype.Connect = function() {
    var NAS = this;
    return new Promise(function(resolve, reject) {
        axios.get(NAS.URI + "/webapi/query.cgi", { params: { api: 'SYNO.API.Info', version: 1, method: 'query', query: 'all' }})
            .then(function(resp) {
                var content = resp.data;
                // Service detection (replicating original logic)
                if (content && content.data) {
                    for (var service in NAS.needs) {
                        for (var element in content.data) {
                            if (new RegExp(service, 'g').test(element) && NAS.needs[service] !== true) {
                                if (NAS.server.debug) {
                                    console.log(' "' + service + '" service is found');
                                }
                                NAS.needs[service] = true;
                            }
                        }
                    }
                }

                if (NAS.needs["SYNO.API.Auth"]) {
                    if (NAS.server.debug) { console.log("Authentifcation API is avaiable") }
                    var Error = {
                        "400": "No such account or incorrect password",
                        "401": "Account disabled",
                        "402": "Permission denied",
                        "403": "2-step verification code required",
                        "404": "Failed to authentificate 2-step verification code",
                        "100": "Unknown error",
                        "101": "Invalid paramter",
                        "102": "The requested API does not exist",
                        "103": "The requested method does not exist",
                        "104": "The requested version does not support the functionality",
                        "105": "The logged in session does not have permission",
                        "106": "Session timeout",
                        "107": "Session interrupted by duplicate login"
                    };
                    axios.get(NAS.URI + "/webapi/auth.cgi", {
                        params: {
                            api: 'SYNO.API.Auth',
                            version: 2,
                            method: 'login',
                            account: NAS.server.username,
                            passwd: NAS.server.password,
                            session: 'DownloadStation',
                            format: 'cookie'
                        }
                    }).then(function(loginResp) {
                        var loginContent = loginResp.data;
                        if (loginContent && loginContent.success) {
                            NAS.server.token = loginContent.data.sid;
                            resolve({ "Success": true, "Message": "Connected" });
                        } else {
                            reject({ "Success": false, "Message": Error[loginContent && loginContent.error && loginContent.error.code] });
                        }
                    }).catch(function() {
                        reject({ "Succes": false });
                    });
                } else {
                    if (NAS.server.debug) { console.log("Authentifcation API is not avaiable") }
                    reject({ "Succes": false, "Message": "Authentifcation API is not avaiable" });
                }
            })
            .catch(function() {
                reject({ "Succes": false, "Message": "Authentifcation API is not avaiable" });
            });
    });
};



module.exports = Auth;