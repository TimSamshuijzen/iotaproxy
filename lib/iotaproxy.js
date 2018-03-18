'use strict';

/**
 * Simple proxy server for IOTA.
 * Intercepts attachToTangle commands and performs PoW locally.
 *
 * Author: Tim Samshuijzen
 *
 * References code copied from:
 *   https://github.com/iotaledger/wallet
 *   Licence: GNU General Public License v3.0
 */

const http = require('http');
const https = require('https');
const ccurlProvider = require('./ccurlprovider.js');
const { URL } = require('url');

let iotaProxy =
{
  host: '',
  port: 0,
  localPort: 0,
  overrideAttachToTangle: false,
  timeout: 0,
  running: false,
  server: null,

  start: function(options)
  {
    let opts = options || {};

    // create url from the supplied options
    // if one can be set from the supplied options use that instead
    // opts.provider is the most descriptive and portable, try for that first
    if( opts.provider ){
      console.log('Using provider: ' + opts.provider);
      try {
        let url = new URL(opts.provider);
        this.host = url.host;
        this.port = url.port;
        this.protocol = url.protocol;
      } catch(e) {
        console.log('The supplied url \'' + opts.provider + '\' is malformed. Trying other variables and default options');
      }
      // if the opts.host is set use it
    }else if( opts.host.length !== 0){
      console.log('Using host option: '+ opts.host);
      this.host = opts.host;

      // if the opts.host is set try and use opts.port
      if(  opts.port.length !== 0 ){
        console.log('Using port option: '+ opts.port);
        this.port = opts.port;
      }else{
        this.port = 80;
        console.log('Using default port: 80');
      }

      // if the opts.host is set try and use opts.protocol
      if(  opts.protocol.length !== 0 ){
        console.log('Using protocol option: '+ opts.protocol);
        this.protocol = opts.protocol;
      }else{
        this.protocol = 'http:';
        console.log('Using default protocol: http');
      }
      // if no variables are set run with the default
    }else{
      // supply a default url
      let url = new URL('http://iota.bitfinex.com');
      console.log('no variables supplied, using default url ' + url.host);
      this.host = url.host;
      this.port = url.port;
      this.protocol = url.protocol;
    }

    this.localPort = (opts.localPort ? opts.localPort : 14265);
    this.overrideAttachToTangle = (opts.overrideAttachToTangle ? true : false);
    this.timeout = (opts.timeout ? opts.timeout : 15);

    if (this.running)
    {
      this.stop();
    }
    this.running = true;
    let that = this;

    if (this.overrideAttachToTangle)
    {
      ccurlProvider.init();
    }

    this.server = http.createServer(
      function (request, response)
      {
        let requestbody = '';
        request.on(
          'data',
          function (data)
          {
            requestbody += data;
            if (requestbody.length > 1e6)
            {
              request.connection.destroy();
            }
          }
        );
        request.on(
          'end',
          function ()
          {
            let requestbodyOb = null;
            try
            {
              requestbodyOb = JSON.parse(requestbody);
            }
            catch (e)
            {
              requestbodyOb = null;
            }
            if (requestbodyOb !== null)
            {
              if ((that.overrideAttachToTangle) && (ccurlProvider.isOpen()) && (requestbodyOb.command === 'attachToTangle'))
              {
                console.log('Processing command ' + requestbodyOb.command);
                ccurlProvider.attachToTangle(
                  requestbodyOb.trunkTransaction, requestbodyOb.branchTransaction, requestbodyOb.minWeightMagnitude, requestbodyOb.trytes,
                  function(error, trytesArray)
                  {
                    if (error)
                    {
                      response.writeHead(500, 'Internal Server Error', {'Content-Type': 'text/plain'});
                      response.write('Error executing attachToTangle.\n');
                      response.end();
                    }
                    else
                    {
                      response.writeHead(200, {'Content-Type': 'application/json'});
                      response.write(JSON.stringify({trytes: trytesArray}, null, 2));
                      response.end();
                    }
                  }
                );
              }
              else
              {
                console.log('Relaying command ' + requestbodyOb.command);
                let proxyRequestOptions =
                {
                  hostname: that.host,
                  port: that.port,
                  protocol: that.protocol,
                  path: request.url,
                  method: request.method
                };
                if (requestbody.length > 0)
                {
                  proxyRequestOptions.headers =
                  {
                    'Content-Type': request.headers['content-type'],
                    'Content-Length': requestbody.length
                  };
                  // Make sure the x-iota-api-version header is also passed along,
                  // no matter the casing used for this header.
                  Object.keys(request.headers).forEach(function(key)
                  {
                    if (key.toLowerCase() === 'x-iota-api-version')
                    {
                      proxyRequestOptions.headers[key] = request.headers[key];
                    }
                  });
                }

                // switch here to turn on https
                switch (that.protocol) {
                  case 'https:':
                    var transport = https;
                    break;
                  default:
                    var transport = http;
                }

                let proxyRequest = transport.request(
                  proxyRequestOptions,
                  function (proxyResponse)
                  {
                    let proxyResult = '';
                    proxyResponse.on(
                      'data',
                      function (data)
                      {
                        proxyResult += data;
                      }
                    );
                    proxyResponse.on(
                      'end',
                      function()
                      {
                        response.writeHead(proxyResponse.statusCode, proxyResponse.statusMessage, {'Content-Type': proxyResponse.headers['content-type']});
                        response.write(proxyResult);
                        response.end();
                      }
                    );
                  }
                );
                proxyRequest.on(
                  'error',
                  function (err)
                  {
                    response.writeHead(404, 'Not Found', {'Content-Type': 'text/plain'});
                    response.write('Not Found');
                    response.end();
                  }
                );
                proxyRequest.write(requestbody);
                proxyRequest.end();
              }
            }
            else
            {
              response.writeHead(400, 'Bad Request', {'Content-Type': 'text/plain'});
              response.write('error: invalid JSON\n');
              response.end();
            }
          }
        );
      }
    );
    this.server.setTimeout(this.timeout * 60 * 1000); // Default is 15 minutes timeout -> allow enough time for PoW.
    this.server.on(
      'clientError',
      function(err, socket)
      {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    );
    this.server.listen(this.localPort);
    console.log('IOTA proxy server started');
    console.log('POW timeout is set to ' + this.timeout + ' min');
    console.log('Listening on port ' + this.localPort);
    console.log('Relaying requests to '+ this.protocol + '//' + this.host + ':' + this.port);

  },

  stop: function()
  {
    if (this.running)
    {
      this.running = false;
      ccurlProvider.close();
      if (this.server !== null)
      {
        this.server.close(
          function()
          {
          }
        );
        this.server = null;
      }
    }
  }
};

module.exports = iotaProxy;
