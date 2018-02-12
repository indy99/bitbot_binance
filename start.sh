#!/bin/bash
app="bitbot"
prg="node bitbot.js 0"
log="/tmp/bitbot_crash.log"
stopfile="/tmp/bitbotstop"

if pgrep -f 'node bitbot.js' > /dev/null; then echo "Program is already running"; exit 0; fi 
(	
	rm -f $stopfile	
	while [ 1 ]
	do	
        d=$(date +"%d%m%y:%H%M%S")
        echo "$d > $app starting ... " >> $log
		$prg
		ret=$?
		d=$(date +"%d%m%y:%H%M%S")
        if [ $ret -eq 11 ]; then 
			echo "$d > $app config orr api key fail " >> $log
			break 
		fi
		if [ -f $stopfile ]; then 
			echo "$d > $app stopped manually " >> $log
			break
		fi
	        echo "$d > $app exit code $ret.  Respawning... " >> $log
        	sleep 10
	done
) &
 
