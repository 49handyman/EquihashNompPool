const {createLogger, format, transports} = require('winston');
const {splat, combine, colorize, timestamp, label, printf} = format;

const timezoned = () => {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago'
  });
};


const config = require('../config.json');
if(!config)  {
    throw  new Error("Config file config.json does not exist")
}

const logLevel = config.logger ? config.logger.level || 'debug' : config.logLevel || 'debug';
require('winston-daily-rotate-file');

module.exports = {
    getLogger: function (loggerName, coin) {

        let transportz = [new transports.Console()];

        if (config.logger && config.logger.file) {
            transportz.push(
                new transports.DailyRotateFile({
                    filename: config.logger.file,
                    datePattern: 'YYYY-MM-DD',
                    prepend: false,
                    localTime: true,
                    level: logLevel,
		            colorize: true
                })
            );
        }
        return createLogger({
            format: combine(
                splat(),
                colorize(),
                label({label: {loggerName: loggerName, coin: coin}}),
                timestamp({format: timezoned}),
                printf(info => {
                    return `[${info.timestamp}] [${info.level}] [${info.label.coin}] [${info.label.loggerName}] : ${info.message}`;
                })
            ),
            level: logLevel,
	        localTime: true,
	        colorize: true,
            transports: transportz,
        });
    }
};
