![Entrust Computer Technology Center]

# EquihashNompPool

Warning - Grafana Dashboards, prometheus scrapers, and influxdb is not included in this repository yet.

Warning - And dont forget this pool is pretty dedicated to Pirate-chain (ARRR), however it runs all equihash coins without many of the coin specific features, like pricing, "TradOgre Private Wallet" balances, etc...

Warning - Its a hacked-up piece of nodejs. LOL...  Just a nice warning.

Warning - ALL POOL OPERATERS - Keep an eye on your Redis databases. Look for new databases created with 5 ways to download "b.sh" from the bot network. Firewall the shit out of this port. And update Redis.

I'll get all the relevant items gathered up into another repository to help others get it all setup. Its a lot of work. I have about 60-80 man hours in it all so far.

It should be usable on any nomp based pool server with api available. there will be new stats api's added specificly for grafana in next few weeks. JSON scrapers dont like the available api much.

[Update 7-19-2021]
New updates to dashboard, grafna, infludb, prometheus, and numerous prometheus exporters added 

We've been under constant bot attack for last 3 weeks. This was all developed to monitor and ban offending ip bots.

"fail2ban" has been outragously awesome for our site. Every pool should have it running. 

Forked from Raven coin Updated to use Equihash

This is a badly hacked version that no one should use without modifications and bug/security checking.

[Grafana}

Grafana, infludb, prometheus. fail2ban (all servers) should be setup on their own server. We use tiny Lenovo ThinkCentre i5's for the data & grafana server. (16GB ram, 500GB SSD drive, Ubuntu 18 server)

You do not want this on the pool server. The load will be too heavy and cause problems. These i5's can be bought on eBay for $69 stripped, $80 SSD drive, $60 Ram.

Default fail2ban rules will be OK, but i found another fail2ban config specifically for the miner ports.
Thanks to: Oink70/s-nomp-fail2ban https://github.com/Oink70/s-nomp-fail2ban

To start get Ubuntu setup with all desktop functions disabled. You'll have to learn to use vscode & Putty. 


Next, setup Wallet (Pirate, Komodo, zcash) daemons installed and working.


Then, setup fail2ban with "sudo apt install fail2ban"


Next, install latest versions of all these packages (do not use apt for them)

[Grafana install]

```
sudo apt-get install -y adduser libfontconfig1
wget https://dl.grafana.com/oss/release/grafana_8.0.6_amd64.deb
sudo dpkg -i grafana_8.0.6_amd64.deb
```

 
### Screenshots
#### Grafana Stats<br />
![Block Explorer](https://github.com/49handyman/equihashnomppool/blob/main/docs/screenshots/dashbrd1.PNG)<br /><br$

##### Pool Stats<br />
![Block Explorer](https://github.com/49handyman/equihashnomppool/blob/main/docs/screenshots/stats.PNG)<br /><br />




[Update 5-24-2021]

added: coinbase pro reference btc prices, 

added: new charts for network hash & network difficulty 

WIP: to get coin switching working again, all the current modules for prices are defuct or not working.



[Update 4-27-2021]
I should change my fork to EquiHash Nomp Dashboard. Added about 10 more stats and live balances from exchange. So far using TradeOrgre, but im trying to keep it generic so it works with many exchanges api. 

added: node wallet balances
added: tradeOgre wallet balances
added: tradeOgre BTC converted balances & values


Automated exchange conversion to BTC is next.

[Update 4-21-2021]

Testing Z to Z payments, working for Pirate coin so far. Need to test all parts of payment system now to confirm I didnt break anything on KMD payments.

Im tying to keep this compatible with other nomp forks, new stats and data are appended and previous order not changed, so it should work

but no warranty... 



[Update 4-14-2021]

Thanks to the Knomp code i got z_addresses working in authorization, and payments -- I hope.

Added POSIX module and testing usage with root. How can we run as root with PM2 without manually sudo - like at reboot. It must be 
100% automatically loaded at reboot --cron - ?? 

I was having problems with rejected blocks and found my system lagging, and not responding as fast as it should. After disabling all the unused services and background processes I resolved the issue.

Testing the system with only Pirate chain full node wallet running to decrease RPC  response times

New items added to dashboard, testing z_transactions, z_ only working for solo mining. Most work focused on stats, dashboard, and bug fixes

This fork is for solo miners that want a full Dashboard to monitor their mining. I'm using the best parts of many forks to get what i personally want for a large screen/format Dashboard for our 65" display at Entrust's office.



Im still hacking away and adding features and stats. the code is a mess for now, but works great on Komodo as my own pool. no z_ transactions yet so use it for solo mining only on those coins. Just got zen full node wallet synced today and seems to work fine for Horizen.

Changing UI to dark theme. More to come in next few days as i work on mor important items.

I use webworker's stratum-pool package/

The raven repository wasn't setup for sheilded coins, so it might take lots to get working, help would be appreciated. paymentProcessor.js needs to be reworked.


-------
### Screenshots

#### Pool Charts<br />
![Block Explorer](https://github.com/49handyman/equihashnomppool/blob/main/docs/screenshots/charts.PNG)<br /><br />


#### Worker Stats<br />
![Block Explorer](https://github.com/49handyman/equihashnomppool/blob/main/docs/screenshots/workers.PNG)<br /><br />

#### Miner Wallets<br />
![Miner's Wallets](https://github.com/49handyman/equihashnomppool/blob/main/docs/screenshots/wallets.PNG)<br /><br />

#### Miners<br />
![Miner's Wallets](https://github.com/49handyman/equihashnomppool/blob/main/docs/screenshots/EquihashNomp2.PNG)<br /><br />


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
