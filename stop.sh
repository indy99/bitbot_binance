#!/bin/bash

touch /tmp/bitbotstop
ret=$(pgrep -f 'node bitbot.js')
kill -9 $ret
