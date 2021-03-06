module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    "apps": [{
        "name"                  : "PoolServer.old",
        "exec_interpreter"      : "node",
        "exec_interpreter"      :  "/home/doug/.nvm/versions/node/v14.19.2/bin/node",
        "exec_mode"             : "fork",
        "stop_exit_codes"       : "\[0\]",
        "autorestart"           : true,
        "max_memory_restart"    : "7G",
        "script"                : "./init.js",
        "node_args"             : " --huge-max-old-generation-size --max_old_space_size=8192 ",
        "args"                  : "",
        "cron_restart"          : "40 1/8 * * *",
        "watch"                 : false,
        "ignore_watch"          : [".git/*", "logs/*"],
        "watch_options" : {
                "followSymlinks": false
                },
                "env": {
                        "NODE_ENV" : "development",
                        "PORT"     : "8085"
                },
                "env_production": {
                        "NODE_ENV" : "production",
                        "PORT"     : "8085"
                }
    }],

  "deploy" : {
    "production" : {
       "user" : "doug",
       "host" : ["192.168.2.226"],
       "ref"  : "origin/main",
       "repo" : "https://github.com/49handyman/EquihashNompPool.git",
       "path" : "/home/doug/testserver",
       "post-deploy" : "nvm install 16",
       "post-deploy" : "nvm use 16",
       "post-deploy" : "/home/doug/.nvm/versions/node/v16.15.0/bin/npm install"
    }
  }

};
