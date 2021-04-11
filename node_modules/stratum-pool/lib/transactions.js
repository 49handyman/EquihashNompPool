const bitcoin = require('bitgo-utxo-lib')
var util = require('./util.js');

// public members
var txHash;

exports.txHash = function () {
	return txHash;
};

function scriptCompile(addrHash) {
	script = bitcoin.script.compile(
			[
				bitcoin.opcodes.OP_DUP,
				bitcoin.opcodes.OP_HASH160,
				addrHash,
				bitcoin.opcodes.OP_EQUALVERIFY,
				bitcoin.opcodes.OP_CHECKSIG
			]);
	return script;
}

function scriptFoundersCompile(address) {
	script = bitcoin.script.compile(
			[
				bitcoin.opcodes.OP_HASH160,
				address,
				bitcoin.opcodes.OP_EQUAL
			]);
	return script;
}

function scriptCompileP2PK(pubkey) {
	script = bitcoin.script.compile(
		[
			Buffer.from(pubkey, 'hex'),
			bitcoin.opcodes.OP_CHECKSIG
		]);
	return script;
}

exports.createGeneration = function (blockHeight, blockReward, feeReward, recipients, poolAddress, coin, pubkey) {
	let usep2pk = typeof coin.p2pk == 'undefined' || !coin.p2pk ? false : true;

	if (!usep2pk) {
		var poolAddrHash = bitcoin.address.fromBase58Check(poolAddress).hash;
	}

	let network = bitcoin.networks[coin.symbol]
    //console.log('network: ', network)
    let txb = new bitcoin.TransactionBuilder(network)
    // Set sapling or overwinter to either true OR block height to activate.
    // NOTE: if both are set, sapling will be used.
    if (coin.sapling === true || (typeof coin.sapling === 'number' && coin.sapling <= blockHeight)) {
        txb.setVersion(bitcoin.Transaction.ZCASH_SAPLING_VERSION);
    } else if (coin.overwinter === true || (typeof coin.overwinter === 'number' && coin.overwinter <= blockHeight)) {
        txb.setVersion(bitcoin.Transaction.ZCASH_OVERWINTER_VERSION);
    }

	// input for coinbase tx
	if (blockHeight.toString(16).length % 2 === 0) {
		var blockHeightSerial = blockHeight.toString(16);
	} else {
		var blockHeightSerial = '0' + blockHeight.toString(16);
	}
	var height = Math.ceil((blockHeight << 1).toString(2).length / 8);
	var lengthDiff = blockHeightSerial.length / 2 - height;
	for (var i = 0; i < lengthDiff; i++) {
		blockHeightSerial = blockHeightSerial + '00';
	}
	length = '0' + height;
	var serializedBlockHeight = new Buffer.concat([
				new Buffer(length, 'hex'),
				util.reverseBuffer(new Buffer(blockHeightSerial, 'hex')),
				new Buffer('00', 'hex') // OP_0
			]);

	txb.addInput(new Buffer('0000000000000000000000000000000000000000000000000000000000000000', 'hex'),
		4294967295,
		4294967295,
		new Buffer.concat([serializedBlockHeight]));

	// calculate total fees
	var feePercent = 0;
	for (var i = 0; i < recipients.length; i++) {
		if (typeof recipients[i].percent !== 'undefined') {
			feePercent = feePercent + recipients[i].percent;
		}
	}

	// pool t-addr
	if (typeof coin !== 'undefined' && typeof coin.burnFees !== 'undefined' && coin.burnFees) {
		feeReward = 0;
	}

	if (!usep2pk) {
		txb.addOutput(
			scriptCompile(poolAddrHash),
			Math.round(blockReward * (1 - (feePercent / 100))) + feeReward
		);
	} else {
		txb.addOutput(
			scriptCompileP2PK(pubkey),
			Math.round(blockReward * (1 - (feePercent / 100))) + feeReward
		);
	}

	if (usep2pk) {
		for (var i = 0; i < recipients.length; i++) {
			//ac_founders fee need to be vout 1 and p2pk
			if (typeof recipients[i].founders !== 'undefined') {
				let foundersReward = Math.floor(blockReward * 100000000 * recipients[i].founders) / 100000000
				txb.addOutput(
					scriptCompileP2PK(recipients[i].address),
					Math.round(foundersReward.toFixed(8))
				);
			}
		}
	}

	// pool fee recipients t-addr
	for (var i = 0; i < recipients.length; i++) {
		if (typeof recipients[i].percent !== 'undefined') {
			txb.addOutput(
				scriptCompile(bitcoin.address.fromBase58Check(recipients[i].address).hash),
				Math.round(blockReward * (recipients[i].percent / 100))
			);
		}
	}

	let tx = txb.build()

	txHex = tx.toHex();

	// assign
	txHash = tx.getHash().toString('hex');

	// console.log('txHex: ' + txHex);
	// console.log('txHash: ' + txHash);

	return txHex;
};

module.exports.getFees = function (feeArray) {
	var fee = Number();
	feeArray.forEach(function (value) {
		fee = fee + Number(value.fee);
	});
	return fee;
};
