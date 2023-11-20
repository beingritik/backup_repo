const fs = require('fs');
const isPROD = require('/v1_config/admin_env_config').PROD;

/**
 * JS Library for managing Admin logs logging.
 * The library provides four functions for logging: "logError", "logWarn", "logInfo", and "logDebug",
 * and a function for changing logging level: "setLogLevel".
 **/
const LOG = {setLogLevel, logError, logWarn, logInfo, logDebug}

//set deafult logging level for Production and Development envs.
var logLevel;
isPROD ? logLevel = 'warn': logLevel = 'debug';

//logging levels with corresponding priority. Lower the value higher priority
const LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

//path where logs will be saved.
var logfilepath = '/tmp/Adminlogs';

//logMessage function to take log level and msg as para. Provides modularity and eliminates redundant code.
function logMessage(level, msg){
    //setting standard JSON to format each log msg.
    var log = {"level":"","message":"","time": new Date()};

    log.level = level;
    log.message = msg;

    if(LEVELS[`${logLevel}`] >= LEVELS[level]){
        //parsing log object to string to append it to log-file.
        log = JSON.stringify(log);
            
        fs.appendFile(logfilepath, log+'\n', function(err) {
            if(err) {
                return console.log(err);
            }
        });
        if(!isPROD) console.log(JSON.parse(log));
    }else{
        console.log(`Logging level set to '${logLevel}'. For logging ${level}s, update setLogsLevel to '${level}'.`);
    }
}

//function to log error
function logError(msg){
    logMessage('error', msg);
}

//function to log warnings
function logWarn(msg){
    logMessage('warn', msg);
}

//function to log info msgs
function logInfo(msg){
    logMessage('info', msg);
}

//function to log debug msgs
function logDebug(msg){
    logMessage('debug', msg);
}

//function to allow logging level to be changed at runtime.
function setLogLevel(level) {
    logLevel = level;
    isPROD? logInfo(`Logging level changed to: '${level}'.`) : console.log(`Logging level changed to: '${level}'.`);
}

module.exports = LOG
