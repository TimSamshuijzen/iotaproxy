
# IOTA Proxy

A simple proxy server for the [IOTA](https://iota.org) tangle network, supporting the attachToTangle command (PoW).
This light weight server will proxy/relay all incoming requests to a public node in the tangle network, but intercepts the attachToTangle command and performs the PoW locally.

Developers getting to know [iota.lib.js](https://github.com/iotaledger/iota.lib.js) in Node.js may have experienced the
"_COMMAND attachToTangle is not available on this node_" response after calling iota.api.sendTransfer().
Some others may have experienced the same error message when calling the REST API [attachToTangle](https://iota.readme.io/docs/attachtotangle) command.
The attachToTangle command is a request to perform the PoW that is necessary when doing a transaction.  

Most public full nodes in the IOTA network do not support the [attachToTangle](https://iota.readme.io/docs/attachtotangle) command.  
By design it is expected that you do the PoW locally on your device, the network is not required to do this for you.  

If you're looking an easy way to do PoW, then this proxy server might help.  
Use this proxy server when you want to offload PoW.  

Feel free to edit or fork!  

If this does proxy server is not what you are looking for, then you can look at some of the methods provided by the IOTA foundation in their [repository](https://github.com/iotaledger).  
Some examples of solutions provided by the IOTA foundation:  

* Do PoW in [WebGL2-enabled browsers](https://github.com/iotaledger/curl.lib.js).
* To do PoW in Node.js, combine solutions from [ccurl.interface.js](https://github.com/iotaledger/ccurl.interface.js)
and [ccurl](https://github.com/iotaledger/ccurl.git), and override the iota.api.attachToTangle method in
[iota.lib.js](https://github.com/iotaledger/iota.lib.js).
* Install and run your own full IOTA node, configured to grant you access to the attachToTangle command.  

---

> This repository contains code and precompiled libraries from [iotaledger/wallet](https://github.com/iotaledger/wallet).  
> Licence: GNU General Public License v3.0

---

## Prerequisites

  Download and install [Node.js](https://nodejs.org/en/download/)


## Instructions

1. Clone this repository:

  ```
  git clone https://github.com/TimSamshuijzen/iotaproxy
  ```

2. Enter the "iotaproxy" directory:

  ```
  cd iotaproxy
  ```

3. Install dependencies:

  ```
  npm install
  ```

4. Edit index.js to set preferred connection settings. For example:

  ```
  var iotaProxy = require('./lib/iotaproxy.js');
  iotaProxy.start(
    {
      host: 'http://iota.bitfinex.com',
      port: 80,
      localPort: 14265,
      overrideAttachToTangle: true
    }
  );
  ```

5. Run the proxy server:

  manually

  ```
  node --harmony index.js
  ```
  or use yarn or npm
  ```
  yarn start
  ```

6. Proxy server is now ready to use. It will start off displaying this in the console:

  ```
  IOTA proxy server started
  POW timeout is set to 15 min
  Listening on port 14265
  Relaying requests to iota.bitfinex.com:80  
  ```

7. Now, in your [iota.lib.js](https://github.com/iotaledger/iota.lib.js) project you can simply connect to this local proxy server, which in turn connects with the tangle:

  ```
  var IOTA = require('iota.lib.js');

  var iota = new IOTA({
    'host': 'http://localhost',
    'port': 14265
  });
  ```



---
