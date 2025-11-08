const Utils = require("./../../Modules/Utils/GenericUtils.js");
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
var Promise = require('promise');

function FileStation(server, auth) {
    this.server = server;
    this.auth = auth;
    this.utils = new Utils();
    this.URI = this.utils.CreateURI(server);

    this.Error = {
        "100":"Unknown error",
        "101":"No parameter of API, method or version",
        "102":"The requested API does not exist",
        "103":"The requested method does not exist",
        "104":"The requested version does not support the functionality",
        "105":"The logged in session does not have permission",
        "106":"Session timeout",
        "107":"Session interrupted by duplicate login",
        "400":"Invalid parameter of file operation",
        "401":"Unknown error of file operation",
        "402":"System is too busy",
        "403":"Invalid user does this file operation",
        "404":"Invalid group does this file operation",
        "405":"Invalid user and group does this operation",
        "406":"Can't get user/group information from the account server",
        "407":"Operation not permitted",
        "408":"No such file or directory",
        "409":"Non-supported file system",
        "410":"Failed to connect internet-based file system (ex: CIFS)",
        "411":"Read-only file system",
        "412":"Filename too long in the non-encrypted file system",
        "413":"Filename too long in the encrypted file system",
        "414":"File already exists",
        "415":"Disk quota exceeded",
        "416":"No space left on device",
        "417":"Input/output error",
        "418":"Illegal name or path",
        "419":"Illegal file name",
        "420":"Illegal file name on FAT file system",
        "421":"Device or resource busy",
        "599":"No such task of the file operation",
        "1800":"Missing or mismatched Content-Length header",
        "1801":"Timeout waiting for data (default 3600s)",
        "1802":"Missing filename in file content",
        "1803":"Upload connection cancelled",
        "1804":"File too big for FAT file system",
        "1805":"Cannot overwrite/skip existing file without overwrite parameter",
        "1100":"Failed to create folder",
        "1101":"Too many folders under parent",
        "1000":"Failed to copy files/folders",
        "1001":"Failed to move files/folders",
        "1002":"Destination error",
        "1003":"Cannot overwrite/skip existing file w/o overwrite parameter",
        "1004":"File/folder name conflict overwrite",
        "1006":"Cannot copy/move item with special chars to FAT32",
        "1007":"Cannot copy/move >4G file to FAT32",
        "1400":"Failed to extract files",
        "1401":"Cannot open file as archive",
        "1402":"Failed to read archive data",
        "1403":"Wrong password",
        "1404":"Failed to get list in archive",
        "1405":"Failed to find item in archive",
        "1300":"Failed to compress files/folders",
        "1301":"Archive name too long"
    };
}

FileStation.prototype.isEligible = function() {
    if (this.server.token !== "") {return {"Success": true};}
    if (this.server.debug) {console.log("[FileStation] You need to login before using FileStation");}
    return {"Success": false, "Message": "You need to login"};
};

// Upload local file to NAS directory
FileStation.prototype.upload = function(localFile, remotePath, overwrite) {
    var self = this;
    overwrite = (overwrite === true);
    return new Promise(function(resolve, reject) {
        var eligible = self.isEligible();
        if (!eligible.Success) {return reject({Success:false, Message:eligible.Message});}
        if (!fs.existsSync(localFile)) {return reject({Success:false, Message:"Local file does not exist"});}
        if (!remotePath) {return reject({Success:false, Message:"Remote path is required"});}
        var form = new FormData();
        form.append('path', remotePath);
        form.append('create_parents', 'true');
        form.append('overwrite', overwrite ? 'true' : 'false');
        form.append('file', fs.createReadStream(localFile));
        var url = self.URI + '/webapi/FileStation/upload.cgi?api=SYNO.FileStation.Upload&version=2&method=upload&_sid=' + self.server.token;
        form.submit(url, function(err, res) {
            if (err) {return reject({Success:false, Message:err.message});}
            var chunks = [];
            res.on('data', function(c){chunks.push(c);});
            res.on('end', function(){
                var body = Buffer.concat(chunks).toString();
                var json;
                try {json = JSON.parse(body);} catch(parseErr){
                    return reject({Success:false, Message:'Invalid JSON response', Raw: body});
                }
                if (json.success) {
                    if (self.server.debug) {console.log('[FileStation] Upload success: ' + localFile + ' -> ' + remotePath);}    
                    resolve({Success:true, Data: json.data || {}});
                } else {
                    var code = json.error && json.error.code;
                    var msg = self.Error[code] || 'Upload failed';
                    if (self.server.debug) {console.log('[FileStation] Upload failed ('+code+'): '+msg);}    
                    reject({Success:false, Code:code, Message: msg});
                }
            });
        });
    });
};

module.exports = FileStation;

/**
 * Add rename capability using FileStation API
 */
FileStation.prototype.rename = function(path, newName) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var eligible = self.isEligible();
        if (!eligible.Success) {return reject({Success:false, Message:eligible.Message});}
        if (!path || !newName) {return reject({Success:false, Message:'Path and newName are required'});}
        var url = self.URI + '/webapi/entry.cgi';
        axios.get(url, { params: { api: 'SYNO.FileStation.Rename', version: 2, method: 'rename', path: path, name: newName, _sid: self.server.token }})
        .then(function(resp){
            var content = resp.data;
            if (content && content.success) {
                if (self.server.debug) {console.log('[FileStation] Rename success: ' + path + ' -> ' + newName);} 
                resolve({Success:true, Data: content.data || {}});
            } else {
                var code = content && content.error && content.error.code;
                var msg = self.Error[code] || 'Rename failed';
                if (self.server.debug) {console.log('[FileStation] Rename failed ('+code+'): '+msg);}    
                reject({Success:false, Code: code, Message: msg});
            }
        }).catch(function(err){
            reject({Success:false, Message: err.message});
        });
    });
};