# Bitbot Binance
This program is Cryptocurrency trading bot for Binance. Written in Javascript , NodeJS.
### Installation
```
git clone https://github.com/indy99/bitbot_binance
(if you don't have "git" download and extarct)
cd bitbot_binance
npm install
```
Installation is done.
### Configure first
Signup Binance ( Referral url: https://www.binance.com/?ref=16102823 )<br>
Go to API Setting, Crete new key<br>
'config/config.json' -> enter your Binance APIKEY and APISECRET


'config/exchange.json' -> enter your exchange parameters

Note:
a- This version makes order fee with BNB to less fee. So get some BNB before you trade. And activate this option from your  Binance account:
```
Using BNB to pay for fees（50% discount）-> make ON
```
b- There is no limit amount for now, so uses all your balance when making ORDER!
***
Then to run
```
node bitbot.js
```
Web GUI -> Browse http://127.0.0.1:8088/
### Notes
for more info: https://kartimbu.com/bitbot/

### Thank You
Thanks jaggedsoft for repo: https://github.com/jaggedsoft/node-binance-api

***
If you like this bot you can send some coins <a href="https://kartimbu.com/pay-acik.php" target="_blank">here</a> to developing the project.
