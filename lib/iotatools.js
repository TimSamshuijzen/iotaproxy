'use strict';

/**
 * Curl library provider.
 * 
 * Contains code copied from:
 *   https://github.com/iotaledger/wallet
 *   Licence: GNU General Public License v3.0
 */

var Converter = require('./converter.js');
var Curl = require('./curl.js');

let iotaTools =
{
  
  valid:
  {
    isTrytes: function(trytes, length)
    {
      // If no length specified, just validate the trytes
      if (!length) length = "0,"

      var regexTrytes = new RegExp("^[9A-Z]{" + length +"}$");
      return regexTrytes.test(trytes) && iotaTools.valid.isString(trytes);
    },
    
    isHash: function(hash)
    {
      // Check if valid, 81 trytes
      if (!iotaTools.valid.isTrytes(hash, 81))
      {
        return false;
      }
      return true;
    },
    
    isString: function(string) 
    {
      return typeof string === 'string';
    },

    isValue: function(value)
    {
      // check if correct number
      return Number.isInteger(value)
    }
  },
    
  utils:
  {
    transactionObject: function(trytes)
    {
      if (!trytes) return;

      // validity check
      for (var i = 2279; i < 2295; i++)
      {
        if (trytes.charAt(i) !== "9")
        {
          return null;
        }
      }

      var thisTransaction = {};
      var transactionTrits = Converter.trits(trytes);
      var hash = [];

      var curl = new Curl();

      // generate the correct transaction hash
      curl.initialize();
      curl.absorb(transactionTrits, 0, transactionTrits.length);
      curl.squeeze(hash, 0, 243);

      thisTransaction.hash = Converter.trytes(hash);
      thisTransaction.signatureMessageFragment = trytes.slice(0, 2187);
      thisTransaction.address = trytes.slice(2187, 2268);
      thisTransaction.value = Converter.value(transactionTrits.slice(6804, 6837));
      thisTransaction.tag = trytes.slice(2295, 2322);
      thisTransaction.timestamp = Converter.value(transactionTrits.slice(6966, 6993));
      thisTransaction.currentIndex = Converter.value(transactionTrits.slice(6993, 7020));
      thisTransaction.lastIndex = Converter.value(transactionTrits.slice(7020, 7047));
      thisTransaction.bundle = trytes.slice(2349, 2430);
      thisTransaction.trunkTransaction = trytes.slice(2430, 2511);
      thisTransaction.branchTransaction = trytes.slice(2511, 2592);
      thisTransaction.nonce = trytes.slice(2592, 2673);

      return thisTransaction;

    },
    
    transactionTrytes: function(transaction)
    {
      var valueTrits = Converter.trits(transaction.value);
      while (valueTrits.length < 81) {
          valueTrits[valueTrits.length] = 0;
      }

      var timestampTrits = Converter.trits(transaction.timestamp);
      while (timestampTrits.length < 27) {
          timestampTrits[timestampTrits.length] = 0;
      }

      var currentIndexTrits = Converter.trits(transaction.currentIndex);
      while (currentIndexTrits.length < 27) {
          currentIndexTrits[currentIndexTrits.length] = 0;
      }

      var lastIndexTrits = Converter.trits(transaction.lastIndex);
      while (lastIndexTrits.length < 27) {
          lastIndexTrits[lastIndexTrits.length] = 0;
      }

      return transaction.signatureMessageFragment
      + transaction.address
      + Converter.trytes(valueTrits)
      + transaction.tag
      + Converter.trytes(timestampTrits)
      + Converter.trytes(currentIndexTrits)
      + Converter.trytes(lastIndexTrits)
      + transaction.bundle
      + transaction.trunkTransaction
      + transaction.branchTransaction
      + transaction.nonce;
    }
  }
  
};

module.exports = iotaTools;

