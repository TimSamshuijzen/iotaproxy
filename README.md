
# IOTA Proxy

A simple proxy server that 'mimics' a full IOTA node, supporting local attachToTangle (PoW). It proxies/relayes all incoming requests to public nodes in the tangle network, but catches the attachToTangle command and performs the PoW locally.  
The purpose of this proxy server is to help getting started with performing transactions using [iotaledger/iota.lib.js](https://github.com/iotaledger/iota.lib.js) in Node without having access to a full IOTA node that grants you access to the attachToTangle command. 
  
> Contains code from [iotaledger/wallet](https://github.com/iotaledger/wallet).  
> Licence: GNU General Public License v3.0
  
  
## Prerequisites

 Download [NodeJS](https://nodejs.org/en/download/)


## Instructions

1. Clone this repository:

  ```
  git clone https://github.com/TimSamshuijzen/iotaproxy
  ```

2. Run npm install:

  ```
  npm install
  ```

3. Edit index.js to set preferred connection settings:

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

4. Run the proxy server:

  ```
  node index.js
  ```

5. Proxy server is now ready to use. It will start off displaying this in the console:

  ```
  IOTA proxy server started
  Listing on port 14265
  Relaying requests to iota.bitfinex.com:80  
  ```

6. In your own iota.lib.js project you can now connect to your local proxy server, which in turn connects with the tangle:

  ```
  var IOTA = require('iota.lib.js');

  var iota = new IOTA({
    'host': 'http://localhost',
    'port': 14265
  });
  ```


