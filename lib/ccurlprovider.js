'use strict';

/**
 * Curl library provider.
 * 
 * Contains code copied from:
 *   https://github.com/iotaledger/wallet
 *   Licence: GNU General Public License v3.0
 */

const ffi = require('ffi');
const iotaTools = require('./iotatools.js');
const path = require("path");

const MAX_TIMESTAMP_VALUE = (Math.pow(3,27) - 1) / 2;

let ccurlProvider =
{
  libccurl: null,

  init: function()
  {
    this.close();
    let libccurlPath = path.join(__dirname, 'libccurl');
    let is64BitOS = false;
    if (process.platform === 'win32')
    {
      is64BitOS = ((process.arch === 'x64') || (process.env.PROCESSOR_ARCHITECTURE === 'AMD64') || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432'));
    }
    else
    {
      is64BitOS = (process.arch === 'x64');
    }
    if (process.platform === 'win32')
    {
      libccurlPath = path.join(libccurlPath, ('win' + (is64BitOS ? '64' : '32')));
    }
    else if (process.platform == 'darwin')
    {
      libccurlPath = path.join(libccurlPath, 'mac');
    }
    else 
    {
      libccurlPath = path.join(libccurlPath, ('lin' + (is64BitOS ? '64' : '32')));
    }
    libccurlPath = path.join(libccurlPath, 'libccurl');

    try 
    {
      this.libccurl = ffi.Library(
        libccurlPath, 
        {
          ccurl_pow : ['string', ['string', 'int']],
          ccurl_pow_finalize : ['void', []],
          ccurl_pow_interrupt: ['void', []]
        }
      );
      if ((!this.libccurl.hasOwnProperty("ccurl_pow")) || (!this.libccurl.hasOwnProperty("ccurl_pow_finalize")) || (!this.libccurl.hasOwnProperty("ccurl_pow_interrupt")))
      {
        throw new Error("Could not load hashing library.");
      }
    } 
    catch (err) 
    {
      console.log(err.message ? err.message : err);
      this.libccurl = null;
    }
    return (this.libccurl !== null);
  },

  isOpen: function()
  {
    return (this.libccurl !== null);
  },
  
  close: function()
  {
    if (this.libccurl !== null)
    {
      /*
      try 
      {
        if (this.libccurl && this.libccurl.hasOwnProperty("ccurl_pow_interrupt"))
        {
          this.libccurl.ccurl_pow_interrupt();
        }
        if (this.libccurl && this.libccurl.hasOwnProperty("ccurl_pow_finalize"))
        {
          this.libccurl.ccurl_pow_finalize();
        }
      }
      catch (err)
      {
        console.log(err.message ? err.message : err);
      }
      */
      this.libccurl = null;
    }
  },

  attachToTangle: function(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, callback)
  {
    let that = this;
    if (this.libccurl !== null)
    {
      if (!this.libccurl.hasOwnProperty("ccurl_pow")) 
      {
        return callback(new Error("Hashing not available"));
      }

      // inputValidator: Check if correct hash
      if (!iotaTools.valid.isHash(trunkTransaction)) 
      {
        return callback(new Error("Invalid trunkTransaction"));
      }

      // inputValidator: Check if correct hash
      if (!iotaTools.valid.isHash(branchTransaction)) 
      {
        return callback(new Error("Invalid branchTransaction"));
      }

      // inputValidator: Check if int
      if (!iotaTools.valid.isValue(minWeightMagnitude)) 
      {
        return callback(new Error("Invalid minWeightMagnitude"));
      }

      let finalBundleTrytes = [];
      let previousTxHash = null;
      let trytesIndex = 0;

      let loopTrytes = function () 
      {
        getBundleTrytes(
          trytes[trytesIndex], 
          function(error) 
          {
            if (error)
            {
              return callback(error);
            }
            else
            {
              trytesIndex++;
              if (trytesIndex < trytes.length) 
              {
                loopTrytes();
              } 
              else 
              {
                // reverse the order so that it's ascending from currentIndex
                return callback(null, finalBundleTrytes.reverse());
              }
            }
          }
        );
      };

      let getBundleTrytes = function (thisTrytes, callback)
      {
        // PROCESS LOGIC:
        // Start with last index transaction
        // Assign it the trunk / branch which the user has supplied
        // IF there is a bundle, chain  the bundle transactions via
        // trunkTransaction together

        var txObject = iotaTools.utils.transactionObject(thisTrytes);
        txObject.tag = txObject.obsoleteTag;
        txObject.attachmentTimestamp = Date.now();
        txObject.attachmentTimestampLowerBound = 0;
        txObject.attachmentTimestampUpperBound = MAX_TIMESTAMP_VALUE;

        // If this is the first transaction, to be processed
        // Make sure that it's the last in the bundle and then
        // assign it the supplied trunk and branch transactions
        if (!previousTxHash)
        {
          // Check if last transaction in the bundle
          if (txObject.lastIndex !== txObject.currentIndex) 
          {
            return callback(new Error("Wrong bundle order. The bundle should be ordered in descending order from currentIndex"));
          }
          txObject.trunkTransaction = trunkTransaction;
          txObject.branchTransaction = branchTransaction;
        }
        else 
        {
          // Chain the bundle together via the trunkTransaction (previous tx in the bundle)
          // Assign the supplied trunkTransaciton as branchTransaction
          txObject.trunkTransaction = previousTxHash;
          txObject.branchTransaction = trunkTransaction;
        }

        var newTrytes = iotaTools.utils.transactionTrytes(txObject);
        
        // cCurl updates the nonce as well as the transaction hash
        that.libccurl.ccurl_pow.async(
          newTrytes, 
          minWeightMagnitude, 
          function(error, returnedTrytes) 
          {
            if (error) 
            {
              return callback(error);
            } 
            else if (returnedTrytes == null) 
            {
              return callback("Interrupted");
            }

            let newTxObject= iotaTools.utils.transactionObject(returnedTrytes);

            // Assign the previousTxHash to this tx
            let txHash = newTxObject.hash;
            previousTxHash = txHash;

            finalBundleTrytes.push(returnedTrytes);

            return callback(null);
          }
        );
        
      };

      loopTrytes();
    }
  }

};


module.exports = ccurlProvider;
