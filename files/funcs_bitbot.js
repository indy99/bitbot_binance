const bitbot = require('../bitbot');
const bnc=bitbot.binance;
//const bnc = require('node-binance-api');

module.exports = {
    html_parse: function (x) {
        var ret = [];
        var i = x.indexOf('/*');
        ret[0] = x.substring(0, i);
        ret[1] = x.substring(i + 4);
        return ret;
    },
    b_options: function (k, s, t, flog) {
        bnc.options({
            APIKEY: k,
            APISECRET: s,
            useServerTime: true,
            test: t,
            log: log => {
                flog(log);
            }
            
        });
    },
    getCurrNames: function(CURR){
        var cr= [];  
        var first, last;
        if (CURR.substr(CURR.length-4) == "USDT") last=4; else last=3;
        first=CURR.length-last;
        cr[0]= CURR.substr(0, first);
        cr[1] = CURR.substr(first);
        cr[2] = "BNB";
        return cr;
    },
    getBalance: function (CURR, x, callback) {
        let str=this.getCurrNames(CURR)[x];
        var bal = -1;

        bnc.balance((error, balances) => {
            if (error) {
                callback(1, str + " get balance error !: "+error.body);
                return;
            }
            for (var key in balances) {
                if (JSON.stringify(key) == JSON.stringify(str)) {
                    bal = balances[key].available;
                    break;
                }
            }
            if (bal == -1) callback(1, str + " currency is not available !");
            else callback(0, bal);
        });
    },
    b_candlesticks: function (CURR, callback) {
        // Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        bnc.candlesticks(CURR, "5m", (error, ticks, symbol) => {
            if (error) {
                callback(1, "candlesticks error!");
                return;
            }
            //console.log("candlesticks()", ticks);
            let last_tick = ticks[ticks.length - 1];
            let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
            //console.log(symbol + " last close: " + close);
            callback(0);
        });
    }

};
