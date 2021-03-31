'use strict';

module.exports = generate;

var crypto = require('crypto'),
    async = require('async');

/*--------------------------------------------------------------------------------*/

/** Generates a merkle root from an array of hash leaves
 * @param {object} array - The array of hash leaves
 * @param {object} [options]
   * @param {boolean} [options.reverse=true] - Indicates the leaves and root hashes should be reversed (endianness)
 * @param {function} callback(err, merkleObject) 
 */
function generate(array, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    /* Check if the hashes should be reversed for proper endianness */
    if (options.reverse === false) {
        recursiveMerkle(array, callback);
    } else {
        reverseHashes(array, function (err, reversedHashes) {
            if (err) {
                return callback(err);
            }

            recursiveMerkle(reversedHashes, function (err, merkle) {
                if (err) {
                    return callback(err);
                }

                merkle.root = merkle.root.match(/.{2}/g).reverse().join('');
                callback(null, merkle);
            });
        });
    }
}

/** Recursively computes the nodes and root of a merkle tree
 * @param {object} hashes - An array of hash leaves
 * @param {function} callback - Invoked when the tree is computed 
 */
function recursiveMerkle(hashes, callback) {
    var concatHashes = [], merkleTree = {};

    /* Duplicate last element if the array length is odd */
    if (hashes.length % 2 === 1) {
        hashes.push(hashes[hashes.length - 1]);
    }

    /* Concatenate hashes and push them to a new array */
    for (var i = 0, length = hashes.length; i < length; i += 2) {
        concatHashes.push(hashes[i] + hashes[i + 1]);
    }

    /* Map every element of the new array with a hash function */
    async.map(concatHashes, function (data, callback) {
        var hash = doubleHash(data);
        callback(null, hash);
    }, function (err, newHashes) {
        if (err) {
            return callback(err);
        }

        /* Check if the root has not been reached yet */
        if (newHashes.length > 1) {
            recursiveMerkle(newHashes, callback);
        } else {
            merkleTree.root = newHashes[0] || '  ';
            callback(null, merkleTree);
        }
    });
}

/*--------------------------------------------------------------------------------*/

/** Reverses the bytes of each element of an array of hashes
 * @param {object} hashes - The array of hashes whose elements must be reversed
 * @param {function} whenReversed(err, reversedHashes) - A function to invoke when the operation is completed
 */
function reverseHashes(hashes, whenReversed) {
    var reversedHashes = async.map(hashes, function (element, callback) {
        callback(null, element.match(/.{2}/g).reverse().join(''));
    }, whenReversed);
}

/** Hashes the input data twice
 * @param {string} data - The data to be double hashed
 * @param {string} [algorithm=sha256] - The hashing algorithm to be used
 * @returns {string} hash2 - The double hash of the input data
 */
function doubleHash(data, algorithm) {
    algorithm = algorithm || 'sha256';
    var hash1 = crypto.createHash(algorithm).update(new Buffer(data, 'hex')).digest();
    var hash2 = crypto.createHash(algorithm).update(hash1).digest('hex');
    return hash2;
}