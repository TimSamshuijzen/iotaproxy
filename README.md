
# IOTA Proxy

A simple proxy server for the [IOTA](https://iota.org) tangle network, supporting the attachToTangle command (PoW).
This light weight server will proxy/relay all incoming requests to public nodes in the tangle network, but intercepts the attachToTangle commands and performs the PoW locally.  
  
Many developers getting to know [iota.lib.js](https://github.com/iotaledger/iota.lib.js) in Node, will have experienced the
"_COMMAND attachToTangle is not available on this node_" response after calling iota.api.sendTransfer().
Some others may have experienced the same error message when calling the REST API [attachToTangle](https://iota.readme.io/docs/attachtotangle) command.
The attachToTangle command performs the PoW that is necessary when doing a transaction.
  
Most public full nodes in the IOTA network do not support the [attachToTangle](https://iota.readme.io/docs/attachtotangle) command.
It is expected that you do the PoW locally on your device, the network is not required to do this for you.
The most common solution is to install and run your own full IOTA node, configured to grant you access to the attachToTangle command.
Alternatively, the IOTA foundation have provided several other solutions for doing PoW locally in their [repository](https://github.com/iotaledger).
For example, there is a solution to do PoW in [WebGL2-enabled browsers](https://github.com/iotaledger/curl.lib.js).
There is also a solution to do it in Node.js, but requires you to combines solutions from [ccurl.interface.js](https://github.com/iotaledger/ccurl.interface.js)
and [ccurl](https://github.com/iotaledger/ccurl.git), and requires you to override the iota.api.attachToTangle method in
[iota.lib.js](https://github.com/iotaledger/iota.lib.js).
  
The purpose of this proxy server is to help you get a quick start with performing transactions using [iota.lib.js](https://github.com/iotaledger/iota.lib.js) in Node.js,
without having to install a full node or having to figure out how to do the PoW in your project.
Another use for this proxy server is when you want to offload PoW from low power devices or machines that need to send transactions to the IOTA tangle.

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

  ```
  node --harmony index.js
  ```

6. Proxy server is now ready to use. It will start off displaying this in the console:

  ```
  IOTA proxy server started
  Listing on port 14265
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

Donate  
FGKKWEDSCIVCU9PZJXYBIWKCEFWLMRXSFKYMTBXFDCTUDV9SVKTNKUFNYCZUQEVDMBL9PPFRYUPFDNGY9DIIAIHKKA
