/* 
* @Author: mustafa
* @Date:   2015-08-01 06:45:50
* @Last Modified by:   mustafa
* @Last Modified time: 2015-08-01 06:46:37
*/

'use strict';
var trim = function (string) {
	return string.toString().replace(/^\s+/, '').replace(/\s+$/, '');
};

exports.new = function(control) {
	var splitted = control.split("\n"),
		res = {};

	for(var i = 0; i < splitted.length; i++){
		var typeval = splitted[i].split(":"),
			type = trim(String(typeval[0])),
			value = trim(String(typeval[1]));

		res[type] = value;
	}

	return res;
}

exports.toControl = function(control) {
	if (typeof control != 'object') return "error";
	var res = "";

	for (var key in control) {
		if (control.hasOwnProperty(key)) {
			if (key != "") {
				res += key + ": " + control[key] + "\n";
			}
		}
	}

	return res;
}