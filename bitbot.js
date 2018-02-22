try {const check = require('syntax-error');} catch (ex){}
const binance = require('node-binance-api');
const minimums = require('./files/minimums.json');
const package = require('./package.json');
var fs = require("fs");
var configfile="./config/exchange.json";
var keyfile="./config/config.json";

module.exports = {
    binance
}
const fbb = require('./files/funcs_bitbot.js');

const is_order = 1; //test
var is_printon = 1; //test
//const api_order_test=true;    //test
const api_order_test=false;

const buy = 1;
const sell = 2;

//*********************
//const CURR = "BNBBTC";
var CURR;

//var exchange_fee = 0.05 + 0.05;   //no bnb
var exchange_fee = 0; //enable bnb

var virgul = 3; //amount after point
var virgul_price = 3; 

var proggress = 0;
var alimvalue = 0;
var satimvalue = 0;

/*
var proggress = sell;
var alimvalue = 0.00050700;
var satimvalue = 0;
*/

const LIMIT_SAY_MAX = 3;
const LIMITALT_SAY_MAX = 3;
var NOISE = 0.1; //noise yuzde
var KAR = 0 //kar yuzde configten
//*********************

var balance1, balance2, balance_bnb;
var limit_say = 0;
var limitalt_say = 0;
var limit_ust = 0;
var value_buy, value_sell = 0;
var orderid = 0;
var count = 0;
var to_server;
var log_sonsatir;
var log_sonsatir_err = "";
var log_sonsatir_opt = "";
var wait_order = 0;
var fark_yuzde;
var config;
var config_curr;
var main_config;
var web_str = [];
var teststr="";
var is_check_order_balance=true;
const console_cl_red="\x1b[41m";
const console_cl_green="\x1b[42m";
const console_cl_res="\x1b[0m";
var order_paused=false;

function b_depthCache() {
    // Maintain Market Depth Cache Locally via WebSocket
    binance.websockets.depthCache([CURR], function (symbol, depth) {
        let max = 2; // Only show closest 10 bids/asks
        let bids = binance.sortBids(depth.bids, max);
        let asks = binance.sortAsks(depth.asks, max);

        console.log(symbol + " depth cache update");
        console.log("asks", asks);
        console.log("bids", bids);
        console.log("best ask: " + binance.first(asks));
        console.log("best bid: " + binance.first(bids));

        value_buy = binance.first(asks);
        value_sell = binance.first(bids);

        main();

    });
}

function main() {
    
    if (!(count%30)) {
        getbalances();
        if (!(is_check_order_balance=check_order_balance()) )  console.log(console_cl_red,"\n****************Your balance is not enough to ORDER!*************\n",console_cl_res);
    }
    if (!(count%3600)) {
        binance.useServerTime(()=>{
            console.log(console_cl_green,"**** Server time synchronized *****",console_cl_res);
        })
    }
    if (order_paused) console.log(console_cl_red,"**** ORDERS PAUSED *****",console_cl_res);

    if (proggress == sell) {
        
        if ((alimvalue == 0) && (satimvalue == 0)) alimvalue = value_buy;

        fark_yuzde = ((value_sell - alimvalue) / alimvalue).toFixedNR(8);
        to_server = teststr+CURR + ": SELL, peak:" + limit_ust + ", val: " + value_sell + ", val last buy: " + alimvalue + " <br> profit: " + fark_yuzde + ", bal1: " + balance1 + ", bal2: " + balance2 + " ++" + count++;
        console.log(to_server);

        if (value_sell > limit_ust) {
            limit_say++;
            if (limit_say > LIMIT_SAY_MAX) {
                limit_say = 0;
                limit_ust = value_sell;
                console.log("peak = " + limit_ust);
            }
        } else limit_say = 0;

        if (value_sell < limit_ust) {
            var yuzdenoise = limit_ust * NOISE / 100;
            var yuzdelimit = parseFloat(limit_ust) - parseFloat(yuzdenoise);

            if (value_sell > yuzdelimit) {
                console.log("Noise : " + yuzdelimit.toFixedNR(8));
                limitalt_say = 0;
                return;
            }

            limitalt_say++;
            console.log("peak_count: " + limitalt_say);
            if (limitalt_say > LIMITALT_SAY_MAX) {
                limitalt_say = 0;

                var karyuzde = alimvalue * KAR / 100;
                if (value_sell < (parseFloat(alimvalue) + parseFloat(karyuzde))) {
                    console.log("Sell profit is low : " + fark_yuzde);
                    return;
                }

                satisemri(value_sell);
            }
        }

    } else if (proggress == buy) {

        if ((alimvalue == 0) && (satimvalue == 0)) satimvalue = value_sell;

        if (limit_ust == 0) limit_ust = value_buy;
        fark_yuzde = (1 - (value_buy / satimvalue)).toFixedNR(8);
        to_server = teststr+CURR + ": BUY, peak:" + limit_ust + ", val: " + value_buy + ", val last sell: " + satimvalue + " <br> profit: " + fark_yuzde + ", bal1: " + balance1 + ", bal2: " + balance2 + " ++" + count++;
        console.log(to_server);

        if (value_buy < limit_ust) {
            limit_say++;
            if (limit_say > LIMIT_SAY_MAX) {
                limit_say = 0;
                limit_ust = value_buy;
                console.log("peak = " + limit_ust);
            }
        } else limit_say = 0;

        if (value_buy > limit_ust) {
            var yuzdenoise = limit_ust * NOISE / 100;
            var yuzdelimit = parseFloat(limit_ust) + parseFloat(yuzdenoise);

            if (value_buy < yuzdelimit) {
                console.log("Noise : " + yuzdelimit.toFixedNR(8));
                limitalt_say = 0;
                return;
            }

            limitalt_say++;
            console.log("peak_count: " + limitalt_say);
            if (limitalt_say > LIMITALT_SAY_MAX) {
                limitalt_say = 0;

                var karyuzde = satimvalue * KAR / 100;
                if (value_buy > (satimvalue - karyuzde)) {
                    console.log("Buy profit is low : " + fark_yuzde);
                    return;
                }

                alisemri(value_buy);
            }
        }

    } else {
        log_sonsatir_err = CURR + ": ORDER WAITING ++" + count++;
        console.log(log_sonsatir_err);

        if (is_order == 1) {
            if (wait_order == 1) return;

            wait_order = 1;
            //binance.orderStatus(CURR, orderid, function (orderStatus, symbol) {
            binance.orderStatus(CURR, orderid, (error, orderStatus, symbol) => {
                if (error) {logD("Order status Error:\n"+error.body,1); return; }
                
                console.log(symbol + " order status:" + JSON.stringify(orderStatus));

                if (orderStatus.status == "FILLED") {
                    logD("Order FILLED", 1);
                    if (alimvalue == 0) {
                        proggress = buy;
                        config.proggress = "buy";
                        config.sellvalue = parseFloat(satimvalue);
                        writeconfigfile();
                        getbalances();
                        
                    } else if (satimvalue == 0) {
                        proggress = sell;
                        config.proggress = "sell";
                        config.buyvalue = parseFloat(alimvalue);
                        writeconfigfile();
                        getbalances();
                    }
                }
                wait_order = 0;
            });
        } else {
            if (alimvalue == 0) {
                proggress = buy;
                config.proggress = "buy";
                config.sellvalue = parseFloat(satimvalue);
                writeconfigfile();
                getbalances();
            } else if (satimvalue == 0) {
                proggress = sell;
                config.proggress = "sell";
                config.buyvalue = parseFloat(alimvalue);
                writeconfigfile();
                getbalances();
            }
        }
    }

}

function satisemri(val) {

    if (!is_check_order_balance) {console.log(console_cl_red,"SELL ORDER:Balance not enough, cancelled!",console_cl_res); return;}
    if (order_paused) {console.log(console_cl_red,"ORDERS PAUSED!",console_cl_res); return;}

    proggress = 0;

    satimvalue = parseFloat(val).toFixedNR(virgul_price);
    var quantity = ((balance1 - (balance1 * exchange_fee / 100))).toFixedNR(virgul);

    var str = "Entering SELL order, buy_value: " + alimvalue + ", sell_value: " + val + ", order: " + satimvalue + ", quantity: " + quantity + ", profit : " + ((val - alimvalue) / alimvalue);

    console.log(str);
    logD(str, 0);

    alimvalue = 0;
    limit_ust = 0;

    if (is_order == 1) {
        wait_order = 1;
        binance.sell(CURR, parseFloat(quantity), parseFloat(satimvalue), {type:'LIMIT'}, (error, response) => {
            
            if (error) {
                logD("Sell Order error:\n" + error.body, 1,()=>{
                    exit_program(1);    
                });
                return; 
            }
            
            console.log("Limit Sell response", JSON.stringify(response));

            if (response.orderId === undefined) {
                logD("Sell Order error1:\n" + JSON.stringify(response), 1,()=>{
                    exit_program(2);
                });
            } else {
                orderid = response.orderId;
                wait_order = 0;
            }
        });
    }

}

function alisemri(val) {

    if (!is_check_order_balance) {console.log(console_cl_red,"BUY ORDER:Balance not enough, cancelled!",console_cl_res); return;}
    if (order_paused) {console.log(console_cl_red,"ORDERS PAUSED!",console_cl_res); return;}

    proggress = 0;

    alimvalue = parseFloat(val).toFixedNR(virgul_price);
    var quantity = ((balance2 - (balance2 * exchange_fee / 100)) / alimvalue).toFixedNR(virgul);

    var str = "Entering BUY order, sell_value: " + satimvalue + ", buy_value: " + val + ", order: " + alimvalue + ", quantity: " + quantity + ", profit : " + (1 - (alimvalue / satimvalue));

    console.log(str);
    logD(str, 0);

    satimvalue = 0;
    limit_ust = 0;

    if (is_order == 1) {
        wait_order = 1;
        binance.buy(CURR, parseFloat(quantity), parseFloat(alimvalue), {type:'LIMIT'}, (error, response) => {
            if (error) {
                logD("Buy Order error:\n" + error.body, 1,()=>{
                    exit_program(3);
                });
                return; 
            }
            
            console.log("Limit Buy response", JSON.stringify(response));

            if (response.orderId === undefined) {
                logD("Buy Order error1:\n" + JSON.stringify(response), 1,()=>{
                    exit_program(4);
                });
            } else {
                orderid = response.orderId;
                wait_order = 0;
            }
        });
    }

}

function check_order_balance(){
    if (proggress==sell) {
        var sv = parseFloat(value_sell).toFixedNR(virgul_price);
        var sq = ((balance1 - (balance1 * exchange_fee / 100))).toFixedNR(virgul);    
        if ((sv*sq) < minimums[CURR].minNotional) {
            console.log(console_cl_red,"sell value: "+sv*sq+" < "+minimums[CURR].minNotional,console_cl_res);
            return false;
        }
    }
    else 
    if (proggress==buy) {
        var av = parseFloat(value_buy).toFixedNR(virgul_price);
        var aq = ((balance2 - (balance2 * exchange_fee / 100)) / av).toFixedNR(virgul);
        if ((av*aq) < minimums[CURR].minNotional) {
            console.log(console_cl_red,"buy value: "+av*aq+" < "+minimums[CURR].minNotional,console_cl_res);
            return false;
        }
    }
    return true;
}

function logD(d, is_err, callback) {
    var fs = require('fs');

    var dt=new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '')
    var satir = teststr+dt + " > " + d;
    if (is_err == 1) {log_sonsatir_err = satir; console.log("logD->"+satir);}
    else log_sonsatir = satir;

    fs.appendFile('log/bot.log', '\n' + satir, function (err) {
        if (err) console.log("Log file write error!");
        if (callback) callback();
    });
};


function log_options(log){
    console.log(console_cl_red,"[optlog] "+log,console_cl_res);
    var dt=new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '')
    log_sonsatir_opt="[modlog] " + dt + " > " + log.toString().replace('\n', ' ').escapeSpecialChars();
}

function writeconfigfile(callback) {
    var fs = require('fs');
    var data = JSON.stringify(config);

    fs.writeFile(configfile, data, function (err) {
        if (err) {
            var errmsg='There has been an error saving your configuration data.';
            logD(errmsg,1);
            console.log(errmsg);
            console.log(err.message);
            if (callback) callback(1);
            return;
        } else {
            if (callback) callback(0);
        }
    });
}

function getbalances(){
    fbb.getBalance(CURR, 0, function (x, e) {
        if (x != 0) {logD(e, 1); return;}
        balance1 = e;
    });
    fbb.getBalance(CURR, 1, function (x, e) {
        if (x != 0) {logD(e, 1); return;}
        balance2 = e;
    });
    fbb.getBalance(CURR, 2, function (x, e) {
        if (x != 0) {logD(e, 1); return;}
        balance_bnb = e;
    });
}

Number.prototype.toFixedNR = function (dig) {
    var dig1 = Math.pow(10, dig);
    return (Math.trunc(this.valueOf() * dig1) / dig1);
}

String.prototype.escapeSpecialChars = function () {
    return this.replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f")
        .replace("'", " ");
};

function get_html_file() {
    fs.readFile("files/www.html", "utf8", function (err, data) {
        if (err) web_str[0] = "No html file!";
        else
            web_str = fbb.html_parse(data);
    });
}

function getPoint(x){
    if (Math.trunc(x) != 0) return 0;
    var say=0;
    while (true){
        if (Math.trunc(Math.pow(10, say)*x) != 0) break; else say++; 
        if (say>8) return 0;
    }
    return say;
}

function log_control() {
    var cli = require('readline').createInterface(process.stdin, process.stdout);
    var log = console.log;
    console.log = function () {
        if (is_printon == 0) return;
        // cli.pause();
        //cli.output.write('\x1b[2K\r');
        log.apply(console, Array.prototype.slice.call(arguments));
        // cli.resume();
        //cli._refreshLine();
    }
}

function init() {

    fbb.b_options(main_config.api_key,main_config.api_secret,api_order_test, (log)=>{
        log_options(log);
    });
    
    binance.useServerTime(function(){
        fbb.getBalance(CURR, 0, function (x, e) {
                if (x != 0) {console.log(e); /*process.exit(11);*/}
                log_control();    
                balance1 = e;
                fbb.getBalance(CURR, 1, function (x, e) {
                    if (x != 0) {logD(e, 1); return; }
                    balance2 = e;
                    fbb.b_candlesticks(CURR, function (x, e) {
                        if (x != 0) {logD(e, 1); return; }
                        b_depthCache();
                    });
                });
            });
    });
    
    
    /*
    binance.exchangeInfo(function(error, data) {
	let minimums = {};
	for ( let obj of data.symbols ) {
		let filters = {minNotional:0.001,minQty:1,maxQty:10000000,stepSize:1,minPrice:0.00000001,maxPrice:100000};
		for ( let filter of obj.filters ) {
			if ( filter.filterType == "MIN_NOTIONAL" ) {
				filters.minNotional = filter.minNotional;
			} else if ( filter.filterType == "PRICE_FILTER" ) {
				filters.minPrice = filter.minPrice;
				filters.maxPrice = filter.maxPrice;
			} else if ( filter.filterType == "LOT_SIZE" ) {
				filters.minQty = filter.minQty;
				filters.maxQty = filter.maxQty;
				filters.stepSize = filter.stepSize;
			}
		}
		minimums[obj.symbol] = filters;
	}
	console.log(minimums);
	fs.writeFile("minimums.json", JSON.stringify(minimums, null, 4), function(err){});
    });
    */
}

var exit_program = function (x) {
    setTimeout(function () {
        process.exit(x);
    }, 2000);
}




/**********************************************************************/
if (api_order_test) teststr="**Test**";
logD("Start ***********************************\n", 0);

try {
    main_config = require(keyfile);
} catch (ex) {
    console.log("Error: "+keyfile+ " not found!");
    process.exit(11);
}

try {
    config = require(configfile);
} catch (ex) {
    config={"currency":"ETHBTC","proggress":"sell","buyvalue":0,"sellvalue":0,"profit":10,"noise":1};
    console.log("Error: "+configfile+ " not found!, default loaded ...");
}

config_curr = JSON.parse(JSON.stringify(config));

if (config.proggress == "buy") proggress = buy;
else if (config.proggress == "sell") proggress = sell;

CURR = config.currency;
alimvalue = config.buyvalue;
satimvalue = config.sellvalue;
KAR = config.profit;
NOISE = config.noise;

try {
    virgul=getPoint(minimums[CURR].minQty);
    virgul_price=getPoint(minimums[CURR].minPrice);
    init();
} catch (ex){
    logD(CURR+" is not available !",1);
}


//console.log(val, satimvalue, quantity);
//exit_program(1);

let Currs=fbb.getCurrNames(CURR);
get_html_file();
var http = require('http');
var url = require('url');
http.createServer(function (req, res) {
    var val1;
    if (proggress == buy) {
        val1 = value_buy;
    } else
    if (proggress == sell) {
        val1 = value_sell;
    } else
    if (proggress == 0) {}

    var web_json = {
        "CURR": CURR,
        "c1name": Currs[0],
        "c2name": Currs[1],
        "proggress": proggress,
        "limit_top": limit_ust,
        "value_now_buy": value_buy,
        "value_now_sell": value_sell,
        "value_last_buy": alimvalue,
        "value_last_sell": satimvalue,
        "profit_now": fark_yuzde,
        "balance_1": balance1,
        "balance_2": balance2,
        "balance_bnb": balance_bnb,
        "alive": count,
        "obok": is_check_order_balance,
        "order_paused": order_paused,
        "version": package.version,
        "log_info": log_sonsatir.replace('\n', ' ').escapeSpecialChars(),
        "log_err": log_sonsatir_err.replace('\n', ' ').escapeSpecialChars(),
        "log_opt": log_sonsatir_opt
    };

    if (req.url.indexOf('/values?c=resetlogs') >= 0) {
        log_sonsatir_err=log_sonsatir_opt=web_json.log_err=web_json.log_opt="";
        res.write(`${JSON.stringify(web_json)}`);  
    } 
    else
    if (req.url.indexOf('/values?c=getval') >= 0) res.write(`${JSON.stringify(web_json)}`);
    else
    if (req.url.indexOf('/values?c=getconf') >= 0) res.write(`${JSON.stringify(config)}`);
    else
    if (req.url.indexOf('/values?c=getcurrconf') >= 0) res.write(`${JSON.stringify(config_curr)}`);
    else
    if (req.url.indexOf('/values?c=setrestart') >= 0) {
        res.write(`${JSON.stringify(config)}`);

        writeconfigfile(function (x) {
            var str = "Restarting with new values ...\n"
            console.log(str + ", is_file_err: " + x);
            logD(str, 0);
            exit_program(99);
        });

    } else
    if (req.url.indexOf('/values?c=restart') >= 0) {
        res.write(`${JSON.stringify(config)}`);

        var str = "Restarting  ...\n"
        console.log(str);
        logD(str, 0);
        exit_program(99);
    } else
    if (req.url.indexOf('/values?c=order_paused') >= 0) {
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        order_paused = (query.pause == 'true');
        web_json.order_paused=order_paused;
        res.write(`${JSON.stringify(web_json)}`);
    } else
    if (req.url.indexOf('/values?c=setconf') >= 0) {
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        //console.log(query);
        
        if (query.currency != "" && query.buyvalue != "" && query.sellvalue != "" && query.profit != "" && query.noise != "") { 
            config.currency = query.currency.escapeSpecialChars();
            config.proggress = query.proggress.escapeSpecialChars();
            config.buyvalue = parseFloat(query.buyvalue);
            config.sellvalue = parseFloat(query.sellvalue);
            config.profit = parseFloat(query.profit);
            config.noise = parseFloat(query.noise);
            console.log(config);
        }
        
        res.write(`${JSON.stringify(config)}`);
    } else
    if (req.url == '/') res.write(`${web_str[0]}'${JSON.stringify(web_json)}'${web_str[1]}`);
    else res.write("?");



    res.end(); 
}).listen(main_config.port);

var arg = process.argv.slice(2);
//if (arg[1]) host=arg[1];
if (arg[0]) {
    if (arg[0] == 0) is_printon = 0;
}

process.stdin.pause;
