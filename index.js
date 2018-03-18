
/**
 * Simple proxy server for IOTA.
 * Relays commands to the IOTA Tangle, but intercepts attachToTangle commands and performs PoW locally.
 *
 * This proxy server useful for when you want to perform transfers with iota.lib.js in Node but do not
 * have access to a full node that grants you access to the necessary attachToTangle commands.
 */

var iotaProxy = require('./lib/iotaproxy.js');

iotaProxy.start(
  {
    // if provider is absent the host, port and protocol values will be used
    // with sensible defaults
    provider: '', // in the format "https://field.carriota.com:443"
    host: 'iota.bitfinex.com', // the remote iri hostname
    port: 80, // the port the remote iri is litening on
    protocol: 'http:',
    localPort: 14265,
    overrideAttachToTangle: true,
    timeout: 15
  }
);
