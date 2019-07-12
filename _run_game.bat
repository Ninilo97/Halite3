cls
:start
del "C:\Halite3\replays\*.*" /q
halite.exe -s 1546691716 --replay-directory replays/ -vvv --width 48 --height 48 "node MyBot.js" "node MyBotD.js"
pause
goto start
