function getParams() {
	var ret = {}

	for(var i = 2; i < process.argv.length;  i++) {
		var arg = process.argv[i]
		var tokens = arg.split('=')
		//console.log('tokens', tokens)
		if (tokens.length == 2) {
			ret[tokens[0]] = tokens[1]
		}

	}	
	return ret
}

var engine = {
    toSourceString: function(obj, recursion) {
        var strout = "";
        
        recursion = recursion || 0;
        for(var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                strout += recursion ? "    " + prop + ": " : "var " + prop + " = ";
                switch (typeof obj[prop]) {
                    case "string":
                    case "number":
                    case "boolean":
                    case "undefined":
                        strout += JSON.stringify(obj[prop]);
                        break;
                        
                    case "function":
                        // won't work in older browsers
                        strout += obj[prop].toString();
                        break;
                        
                    case "object":
                        if (!obj[prop])
                            strout += JSON.stringify(obj[prop]);
                        else if (obj[prop] instanceof RegExp)
                            strout += obj[prop].toString();
                        else if (obj[prop] instanceof Date)
                            strout += "new Date(" + JSON.stringify(obj[prop]) + ")";
                        else if (obj[prop] instanceof Array)
                            strout += "Array.prototype.slice.call({\n "
                                + this.toSourceString(obj[prop], recursion + 1)
                                + "    length: " + obj[prop].length
                            + "\n })";
                        else
                            strout += "{\n "
                                + this.toSourceString(obj[prop], recursion + 1).replace(/\,\s*$/, '')
                            + "\n }";
                        break;
                }
                
                strout += recursion ? ",\n " : ";\n ";
            }
        }
        return strout;
    },
    evaluate: function(strInput, obj) {
        var str = this.toSourceString(obj);
        return (new Function(str + 'return ' + strInput))();
    }
}

function safeEval(strInput, obj) {
	return engine.evaluate(strInput, obj)
}

module.exports = {
	getParams,
	safeEval
}