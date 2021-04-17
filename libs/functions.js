const anonymize = require('ip-anonymize');

const loggerFactory = require('./logger.js');

const logger = loggerFactory.getLogger('PoolWorker', 'system');
var readableSeconds;
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

/*      function readableSeconds(t) {           var seconds = Math.round(t);
           var minutes = Math.floor(seconds / 60);
           var hours = Math.floor(minutes / 60);
           var days = Math.floor(hours / 24);
           hours = hours - (days * 24);
           minutes = minutes - (days * 24 * 60) - (hours * 60);
           seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
           if (days > 0) {
               return (days + "d " + hours + "h " + minutes + "m " + seconds + "s");
           }
          if (hours > 0) {
               return (hours + "h " + minutes + "m " + seconds + "s");
           }
           if (minutes > 0) {
              return (minutes + "m " + seconds + "s");
          }
          return (seconds + "s");
      }
*/

};

     function readableSeconds(t) {
          var seconds = Math.round(t);
          var minutes = Math.floor(seconds / 60);
          var hours = Math.floor(minutes / 60);
          var days = Math.floor(hours / 24);
          hours = hours - (days * 24);
          minutes = minutes - (days * 24 * 60) - (hours * 60);
          seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
          if (days > 0) {
              return (days + "d " + hours + "h " + minutes + "m " + seconds + "s");
          }
         if (hours > 0) {
              return (hours + "h " + minutes + "m " + seconds + "s");
          }
          if (minutes > 0) {
             return (minutes + "m " + seconds + "s");
         }
         return (seconds + "s");
     }


