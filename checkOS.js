var os = require('os');
var platform = os.platform();
var isWin = /^win/.test(platform);
var isUnix = /^linux/.test(platform);

exports.isWin = isWin;
exports.isUnix = isUnix;
