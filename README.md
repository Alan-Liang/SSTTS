# SSTTS
Simple and Slow Table Testing Service

A testing service by Alan?Liang using node.js

## Usage
```
var sstts=require("sstts");
sstts.port=8080;
sstts.ipaddress="127.0.0.1";
sstts.startsvc();
//wait a moment
//open localhost:8080 in browser
sscs.stopsvc();
console.log(sscs.tobjs);
```

## Advanced
You can change the updating time by editing `table.html`'s first part of `var heart=1000;`(in miliseconds and 1000 by default).


# Lisence
This project uses the GPLv3 license. For more information, click [here](https://github.com/Alan-Liang/SSTTS/blob/master/LICENSE).
