'use strict'

const assert = require('./util/assert')
const binet  = require('../lib/binet')

describe('Binet', function(){
    it('should convert binary addresses to string addresses', () => {
        const validOnionAddress = Buffer.from('fd87d87eeb43ffffffffffffffffffff', 'hex');
        const invalidOnionAddress = Buffer.from('fd87d87eeb43fffffffffffffffffff', 'hex');

        assert(binet.toString(validOnionAddress), 'Invalid onion address');
        try {
            assert(binet.toString(invalidOnionAddress), 'Invalid onion address mistakenly interpreted as valid');
        } catch(e) {
            if(e.message !== 'Invalid IP address.'){
                throw e
            }
        }
    });
})
