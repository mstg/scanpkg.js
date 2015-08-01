/* 
* @Author: mustafa
* @Date:   2015-07-30 22:06:41
* @Last Modified by:   mustafa
* @Last Modified time: 2015-08-01 11:01:52
*/

var fs = require("fs"),
	path = require("path"),
	child_process = require("child_process"),
	checksum = require("checksum"),
	_control = require("./control.js");

var noDirError = "scanpkgNoDir",
	emptyDirError = "scanpkgEmptyDir";

exports.noDirError = noDirError;
exports.emptyDirError = emptyDirError;

function _rmrf(_path) {
	var filesToDelete = fs.readdirSync(_path);
	for (var i = 0; i < filesToDelete.length; i++) {
		var __path = path.join(_path, filesToDelete[i]);
		var stats = fs.lstatSync(__path);
		if (stats.isDirectory()) {
			rmrf(__path);
		} else {
			fs.unlinkSync(__path);
		}
	}
	fs.rmdirSync(_path);
}

function rmrf(_path, callback) {
	var filesToDelete = fs.readdirSync(_path);
	for (var i = 0; i < filesToDelete.length; i++) {
		var __path = path.join(_path, filesToDelete[i]);
		var stats = fs.lstatSync(__path);
		if (stats.isDirectory()) {
			_rmrf(__path);
		} else {
			fs.unlinkSync(__path);
		}
	}
	fs.rmdirSync(_path);
	callback();
}

function modifyControl(control, deb, dir) {
	var debContent = fs.readFileSync(deb),
		md5 = checksum(debContent, {"algorithm": "md5"}),
		sha1 = checksum(debContent, {"algorithm": "sha1"}),
		sha256 = checksum(debContent, {"algorithm": "sha256"}),
		filename = path.join(path.basename(dir), path.basename(deb));

	control["MD5sum"] = md5;
	control["SHA1"] = sha1;
	control["SHA256"] = sha256;
	control["Filename"] = filename;

	return _control.toControl(control);
}

exports.new = function(dir, callback) {
	var tmpDir = path.join(dir, ".scanpkg"),
		returnString = "";

	if (fs.existsSync(tmpDir)) {
		rmrf(tmpDir, function(){
			fs.mkdirSync(tmpDir);
		});
	} else {
		fs.mkdirSync(tmpDir);
	}

	if (typeof(callback) != "function") {
		console.error("You have not provided a valid callback to scanpkg.new");
		return;
	}

	fs.lstat(dir, function(err, stats) {
		if (err || !stats.isDirectory())
			return callback(noDirError);

		var filesInDir = fs.readdirSync(dir);
		if (filesInDir.length < 1)
			return callback(emptyDirError);
		
		// Iterate through files in dir
		for (var i = 0; i < filesInDir.length; i++) {
			var filePath = path.join(dir, filesInDir[i]);
			if (filesInDir[i].indexOf(".DS_Store") != -1) {
				fs.unlinkSync(filePath);
			} else if (path.extname(filePath) == ".deb") {
				var tempPackageDir = path.join(tmpDir, path.basename(filePath, ".deb")),
					tempPackageControlTar = path.join(tempPackageDir, "control.tar.gz"),
					tempPackageControl = path.join(tempPackageDir, "control");
				
				fs.mkdirSync(tempPackageDir);
				child_process.spawnSync("cp", [filePath, tempPackageDir]);
				filePath = path.join(tempPackageDir, filesInDir[i]);
				child_process.spawnSync("ar", ["-x", filePath]);
				child_process.spawnSync("rm", ["data.tar.gz", "debian-binary"]);
				child_process.spawnSync("mv", ["control.tar.gz", tempPackageDir]);
				child_process.spawnSync("tar", ["-xvzf", tempPackageControlTar, "-C", tempPackageDir]);
				var __control = _control.new(fs.readFileSync(tempPackageControl).toString("utf8")),
					modified_control = modifyControl(__control, filePath, dir);

				returnString += modified_control + "\n";
			}
		}

		rmrf(tmpDir, function(){});

		if(returnString.lastIndexOf("\n") > 0) {
			return callback(null, returnString.substring(0, returnString.lastIndexOf("\n")));
		} else {
			return callback(null, returnString);
		}
	});
}