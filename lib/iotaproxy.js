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
const ccurlProvider = require('./ccurlprovider.js');

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
    this.host = (opts.host ? opts.host : 'iota.bitfinex.com').replace('http://', '');
    this.port = (opts.port ? opts.port : 80);
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

                let proxyRequest = http.request(
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
    console.log('Relaying requests to ' + this.host + ':' + this.port);

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
