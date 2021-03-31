# equihashnomppool
Forked from Raven coin Updated to use Equihash

-------
### Screenshots
#### Pool Stats<br />
![Home](https://github.com/49handyman/equihashnomppool/blob/main/docs/screenshots/EasyEquihashNomp-1.PNG)
#### Block Explorer<br />
![Block Explorer](https://github.com/49handyman/equihashnomppool/blob/main/docs/screenshots/EasyEquihashNomp-3.PNG)<br /><br />

-------
### Node Open Mining Portal consists of 3 main modules:
| Project | Link |
| ------------- | ------------- |
| [EasyNOMP](https://github.com/EasyX-Community/EasyNOMP) | https://github.com/EasyX-Community/EasyNOMP |
| [Stratum Pool] |  https://github.com/webworker01/node-stratum-pool.git |


-------
### Requirements
***NOTE:*** _These requirements will be installed in the install section!_<br />
* Ubuntu Server 18.04.* LTS
* Coin daemon
* Node Version Manager
* Node 10
* Process Manager 2 / pm2
* Redis Server
* ntp

-------

### Install Pool

    sudo apt install git -y
    cd ~
    git clone https://github.com/49handyman/equihashnomppool.git
    cd EasyEquihashNomp/
    npm install
    npm start

-------
### Configure Pool

Change "stratumHost": "192.168.0.200", to your IP or DNS in file config.json:

    cd ~/equihashnomppool
    nano config.json

```javascript
{
    
    "poolname": "Entrust Private Pool",
    
    "devmode": false,
    "devmodePayMinimim": 0.25,
    "devmodePayInterval": 120,
    
    "logips": true,       
    "anonymizeips": true,
    "ipv4bits": 16,
    "ipv6bits": 16,
    
     "defaultCoin": "komodo",
    
    "poollogo": "/static/icons/entrustcircle.png",
    
    "discordtwitterfacebook": "",
    
    "pagetitle": "Entrust Private Coin Pool - 0% Fees",
    "pageauthor": "My Name Is...",
    "pagedesc": "A reliable, low fee, easy to use mining pool for cryptocurrency! No matter your experience with mining cryptocurrency, we make it easy! Get started mining today!",
    "pagekeywds": "equihash,komodo,pirate,zec,zen,GPU,CPU,Hash,Hashrate,Cryptocurrency,Crypto,Mining,Pool,Bitcoin,,Easy,Simple,How,To",

    "btcdonations": "",
    "ltcdonations": "",
    "ethdonations": "",
    "etcdonations": "",

    "logger" : {
        "level" : "debug",
        "file" : "logs/nomp_debug.log"
    },

    "cliHost": "127.0.0.1",
    "cliPort": 17117,

    "clustering": {
        "enabled": false,
        "forks": "auto"
    },

    "defaultPoolConfigs": {
        "blockRefreshInterval": 0,
        "jobRebroadcastTimeout": 55,
        "connectionTimeout": 600,
        "emitInvalidBlockHashes": false,
        "validateWorkerUsername": true,
        "tcpProxyProtocol": false,
        "banning": {
            "enabled": true,
            "time": 600,
            "invalidPercent": 50,
            "checkThreshold": 500,
            "purgeInterval": 300
        },
        "redis": {
            "host": "127.0.0.1",
            "port": 6379
        }
    },

    "website": {
        "enabled": true,
        "sslenabled": false,
        "sslforced": false,
        "host": "0.0.0.0",
        "port": 8081,
        "sslport": 8443,
        "sslkey": "certs/privkey.pem",
        "sslcert": "certs/fullchain.pem",
        "stratumHost": "192.168.0.200",
        "stats": {
            "updateInterval": 5,
            "historicalRetention": 43200,
            "hashrateWindow": 600
        },
        "adminCenter": {
            "enabled": false,
            "password": "NOT_WORKING_YET_:P_LESHACAT_CAN_DO_ADMIN_PANEL_FUNCTIONALITY_TOO"
        }
    },

    "redis": {
        "host": "127.0.0.1",
        "port": 6379
    },

    "switching": {
        "switch1": {
            "enabled": false,
            "algorithm": "sha256",
            "ports": {
                "3333": {
                    "diff": 10,
                    "varDiff": {
                        "minDiff": 16,
                        "maxDiff": 512,
                        "targetTime": 15,
                        "retargetTime": 90,
                        "variancePercent": 30
                    }
                }
            }
        },
        "switch2": {
            "enabled": false,
            "algorithm": "scrypt",
            "ports": {
                "4444": {
                    "diff": 10,
                    "varDiff": {
                        "minDiff": 16,
                        "maxDiff": 512,
                        "targetTime": 15,
                        "retargetTime": 90,
                        "variancePercent": 30
                    }
                }
            }
        },
        "switch3": {
            "enabled": false,
            "algorithm": "x11",
            "ports": {
                "5555": {
                    "diff": 0.001,
                    "varDiff": {
                        "minDiff": 0.001,
                        "maxDiff": 1, 
                        "targetTime": 15, 
                        "retargetTime": 60, 
                        "variancePercent": 30 
                    }
                }
            }
        }
    },

    "profitSwitch": {
        "enabled": false,
        "updateInterval": 600,
        "depth": 0.90,
        "usePoloniex": true,
        "useCryptsy": true,
        "useMintpal": true,
        "useBittrex": true
    }

}

```

Change "address": "RKopFydExeQXSZZiSTtg66sRAWvMzFReUj", to your pool created wallet address in file KMD.json:

    cd ~/equihashnomppool/pool_configs/KMD.json

```javascript
{
    "enabled": true,
    "coin": "KMD.json",

    "address": "RKopFydExeQXSZZiSTtg66sRAWvMzFReUj",
    
    "donateaddress": "",

    "rewardRecipients": {
        
    },

    "paymentProcessing": {
        "enabled": true,
        "schema": "PROP",
        "paymentInterval": 300,
        "minimumPayment": 0.25,
        "maxBlocksPerPayment": 10,
        "minConf": 30,
        "coinPrecision": 8,
        "daemon": {
            "host": "127.0.0.1",
            "port": 17117,
            "user": "user1",
            "password": "pass1"
        }
    },

    "ports": {
	"3338": {
            "diff": 70,
    	    "varDiff": {
    	        "minDiff": 60,
    	        "maxDiff": 9999,
    	        "targetTime": 10,
    	        "retargetTime": 60,
    	        "variancePercent": 30,
    		    "maxJump": 25
    	    }
        }
       
    },

    "daemons": [
        {
            "host": "127.0.0.1",
            "port": 8766,
            "user": "user1",
            "password": "pass1"
        }
    ],

    "p2p": {
        "enabled": true,
        "host": "127.0.0.1",
        "port": 7771,
        "disableTransactions": true
    },

    "mposMode": {
        "enabled": false,
        "host": "127.0.0.1",
        "port": 3306,
        "user": "me",
        "password": "mypass",
        "database": "ltc",
        "checkPassword": true,
        "autoCreateWorker": false
    },

    "mongoMode": {
        "enabled": false,
        "host": "127.0.0.1",
        "user": "",
        "pass": "",
        "database": "ltc",
        "authMechanism": "DEFAULT"
    }

}

```

### Run Pool
    
    cd ~/equihashnomppool
    npm start

### Donates for developers easyNOMP


BTC: 18TmiWzbMLyf7MvQMcNWh3hUBVrxBgzrWi

LTC: LX1fUwLVcAaRXvP67ZcqUvjjteaKx1nAvL

ETH/ERC20: 0x52fD0B6847E1D3cEc5600359f24d671FdE2Bc65B
    
-------
# equihashnomppool
