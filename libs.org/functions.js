const anonymize = require('ip-anonymize');

const loggerFactory = require('./logger.js');

const logger = loggerFactory.getLogger('PoolWorker', 'system');

module.exports = {

    anonymizeIP: function(ipaddr) {

        var retval = ipaddr;

        var portalConfig = JSON.parse(process.env.portalConfig);

        if (portalConfig.logips && portalConfig.anonymizeips) {

            retval = anonymize(ipaddr, portalConfig.ipv4bits, portalConfig.ipv6bits);
            //            logger.silly("ANONIP>TRUE> before [%s] after [%s]", ipaddr, retval);

        } else if (!(portalConfig.logips)) {

            retval = "AnOnYmOuS!";
            //            logger.debug("ANONIP>FULL> ipaddr [%s]", retval);

        } else {

            //          logger.debug("ANONIP>FALSE> ipaddr [%s]", retval);            

        }

        return retval;

    }
};
