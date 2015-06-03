//Concat function
var concat = function(){
	var args = Array.prototype.slice.call(arguments);
	return args.join("");
};

exports.concat= concat;
