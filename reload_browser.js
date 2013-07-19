//command: node reload_browser.js -b firefox -d C:/dev/projects/demo/web-app -a http://localhost:8080/demo

/***************************************
 * Requires
 ***************************************/
var checkOS = require('./checkOS.js');
var util = require('./util.js');
var exec = require('child_process').exec;
var fs = require('fs');
var watch = require('watch');

var browser, dir, appURL, cmd;

/****************************************
 *	Process command line arguments
 ****************************************/
var cmd_args = process.argv.slice(2);
if(cmd_args.length > 0){
	var b_switch = cmd_args.indexOf('-b');
	var a_switch = cmd_args.indexOf('-a');
	var d_switch = cmd_args.indexOf('-d');
}
else{
	console.log("**********************************************************************");
	console.log("Arguments:");
	console.log("-b <browser> The browser to reload. Defaults to 'firefox'");
	console.log("-a <application URL> The url of the application to reload the browser.");
	console.log("-d <directory> The directory to watch for changes.");
	console.log("**********************************************************************");
	process.exit(0);
}

if(b_switch >= 0){
	browser = cmd_args[++b_switch];
    console.log("Browser:", browser);
}
else{
	browser = "firefox";
	console.log("Browser:", browser);
}

if(a_switch >= 0){
	appURL = cmd_args[++a_switch];
    console.log("App URL:", appURL);
}
else{
	console.log("No App URL found.");
	process.exit(1);
}

if(d_switch >= 0){
	dir = cmd_args[++d_switch];
	console.log("Directory to watch: ", dir);
}
else{
	console.log("No directory found.");
	process.exit(1);
}

/***********************************
 * Create Browser object
 ***********************************/
var Browser = (function(type){
	var reloadFn;
	
	if(checkOS.isWin){
		cmd = 'tasklist /fi "IMAGENAME eq {browser}" 2>NUL | find /i /n "{browser}"';
		extension = '.exe';
	}
	else if(checkOS.isLinux){
		console.log('running cmd for Linux');
		extension = '';
	}
	else{
		console.log('unknown OS');
	}
	
	var executable = util.concat(type,extension);
	var runningBrowser = cmd.replace(/\{browser\}/g, executable);
	
	switch(type){
		case 'firefox':
			reloadFn = function(){
				exec(util.concat(executable,' -remote "openURL(',appURL,')"'));
			};
			break;
		default: 
			console.log('No browser found to reload.');
			process.exit(1);
	}

	return {
		type: type,
		reload: reloadFn,
		start: function(cb){
			console.log('starting', this.type);
			exec(util.concat(executable,' ',appURL));
			this.checkIfBrowserRunning(function(isRunning){
				if(isRunning){
					cb();
				}
				else{
					console.log('unable to start', this.type);
					process.exit(0);
				}
			});
		},
		checkIfBrowserRunning: function(cb){
			exec(runningBrowser, function(err, stdout, stderr){
				if(stdout.length > 0){
					//browser running, call callback
					cb(true);
				}
				else{
					cb(false);
				}
			});
		}
	};
})(browser);

var task = function(){
	console.log('start watching','[',dir,']');
	var watcher = watch.createMonitor(dir, { ignoreDotFiles: true }, function(monitor){
		monitor.on('changed', function(f){
			console.log(f, 'changed');
			//if browser running, reload, otherwise exit
			console.log('reloading', Browser.type);
			Browser.reload();
		});
	});
	
	//continuously check browser. if not running, exit
	var interval = setInterval(function(){
		Browser.checkIfBrowserRunning(function(isRunning){
			if(!isRunning){
				console.log('browser closed. stop watching.');
				clearInterval(interval);
				process.exit(0);
			}
		});
	}, (30000/**5*/));
}

Browser.checkIfBrowserRunning(function(isRunning){
	if(isRunning){
		task();
	}
	else{
		//start browser
		console.log(Browser.type,'is not running. Launching.');
		Browser.start(task);
	}
});
