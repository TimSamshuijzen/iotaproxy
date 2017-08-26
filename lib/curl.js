
/**
 * Cryptographic related functions to IOTA's Curl (sponge function)
 *
 * File copied from:
 *   https://github.com/iotaledger/wallet
 *   Licence: GNU General Public License v3.0
 *
**/

function Curl() {

    // truth table
    this.truthTable = [1, 0, -1, 1, -1, 0, -1, 1, 0];
}

/**
*   Initializes the state with 729 trits
*
*   @method initialize
**/
Curl.prototype.initialize = function(state) {

    if (state) {

        this.state = state;

    } else {

        this.state = [];

        for (var i = 0; i < 729; i++) {

            this.state[i] = 0;

        }
    }
}

/**
*   Sponge absorb function
*
*   @method absorb
**/
Curl.prototype.absorb = function(trits, offset, length) {

    do {
        var i = 0;
        var limit = (length < 243 ? length : 243);

        while (i < limit) {

            this.state[i++] = trits[offset++];
        }

        this.transform();

    } while (( length -= 243 ) > 0)
}

/**
*   Sponge squeeze function
*
*   @method squeeze
**/
Curl.prototype.squeeze = function(trits, offset, length) {

    do {

        var i = 0;
        var limit = (length < 243 ? length : 243);

        while (i < limit) {

            trits[offset++] = this.state[i++];
        }

        this.transform();

    } while (( length -= 243 ) > 0)

}

/**
*   Sponge transform function
*
*   @method transform
**/
Curl.prototype.transform = function() {

    var stateCopy = [], index = 0;

    for (var round = 0; round < 27; round++) {

        stateCopy = this.state.slice();

        for (var i = 0; i < 729; i++) {

            this.state[i] = this.truthTable[stateCopy[index] + stateCopy[index += (index < 365 ? 364 : -365)] * 3 + 4];
        }
    }
}

Curl.HASH_LENGTH = 243;

module.exports = Curl
