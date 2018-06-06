'use strict';

BigNumber.config({ ERRORS: false });
var Contract = function () {
    LocalContractStorage.defineProperty(this, "creator", null);
    LocalContractStorage.defineMapProperty(this, "arrayMap");
    LocalContractStorage.defineMapProperty(this, "dataMap");
    LocalContractStorage.defineProperty(this, "size");
    LocalContractStorage.defineProperty(this, "config");
    LocalContractStorage.defineProperty(this, "oneNAS");
}





Contract.prototype = {
    init: function (config) {
        this.size = 0;
        this.creator = Blockchain.transaction.from;
        this.config = JSON.parse(config);
        this.oneNAS = new BigNumber(Math.pow(10, 18));
    },
    _auth() {
        if (Blockchain.transaction.from != this.creator())
            throw new Error("Insufficient permissions.");
    },
    _transfer(address, value) {
        var result = Blockchain.transfer(address, value);
        Event.Trigger("transfer", {
            Transfer: {
                from: Blockchain.transaction.to,
                to: address,
                value: value
            }
        });
        return result;
    },
    _set: function (key, value) {
        var index = this.size;
        this.arrayMap.set(index, key);
        this.dataMap.set(key, value);
        this.size += 1;
    },
    set: function (key, value) {
        this._auth();
        this._set();
    },
    get: function (key) {
        return this.dataMap.get(key);
    },
    getKeys: function () {
        var keys = [];
        for (let index = 0; index < size; index++) {
            var key = this.arrayMap.get(i);
            keys.push(key);
        }
        return keys;
    },
    getDict: function (limit, offset) {
        limit = parseInt(limit);
        offset = parseInt(offset);
        if (offset > this.size) {
            throw new Error("offset is not valid");
        }
        var number = offset + limit;
        if (number > this.size) {
            number = this.size;
        }
        var result = {};
        for (var i = offset; i < number; i++) {
            var key = this.arrayMap.get(i);
            var object = this.dataMap.get(key);
            result[key] = object;
        }
        return result;
    },
    len: function () {
        return this.size;
    },
    setConfig: function (config) {
        this._auth();
        this.config = JSON.parse(config);
    },
    application: function (height, desc) {
        let value = new BigNumber(Blockchain.transaction.value);
        let c = {};
        c.txhash = Blockchain.transaction.hash;
        c.creator = Blockchain.transaction.from;
        c.duration = height;
        c.acceptor = "";
        c.deposit = value;
        c.marginRequirements = value.times(this.config.marginRate);
        c.desc = desc;
        c.acceptor_complete = false;
        c.creator_complete = false;
        c.status = "open";
        c.creatorArbitrationVote = 0;
        c.acceptorArbitrationVote = 0;
        this._set(c.txhash, c);
    },
    cancel: function (txhash) {
        let c = this.get(txhash);
        if (c.creator != Blockchain.transaction.from)
            throw new Error("transfer failed.");
        if (c.status == "open") {
            c.status = "cancel";
            this._set(c.txhash, c);
        }
        return c;
    },
    accept: function (txhash) {
        let value = new BigNumber(Blockchain.transaction.value);
        let c = this.get(txhash);
        if (c.status != "open")
            throw new Error("accept failed.");
        if (value.gte(c.marginRequirements)) {
            c.acceptor = Blockchain.transaction.from;
            c.expiryHeight = new BigNumber(Blockchain.block.height).plus(c.duration);
            c.margin = value;
            c.status = "process";
            this._set(c.txhash, c);
        } else {
            throw new Error("Does not meet margin requirements.");
        }

    },
    complete: function (txhash) {
        let c = this.get(txhash);
        if (c.status != "process")
            throw new Error("Error status code! " + c.status);
        let from = Blockchain.transaction.from;
        if (c.creator == from) {
            c.creator_complete = true;
        } else if (c.acceptor == from) {
            c.acceptor_complete = true;
        } else {
            throw new Error("Insufficient permissions.");
        }
        if (c.acceptor_complete && c.acceptor_complete) {
            c.status = "complete";
            this._transfer(c.creator, c.deposit);
            this._transfer(c.acceptor, c.margin);
        }
        this._set(txhash, c);
    },
    arbitration: function (txhash, desc) {
        let from = Blockchain.transaction.from;
        let c = this.get(txhash);
        if (c.status != "process")
            throw new Error("Error status code! " + c.status);
        if (new BigNumber(c.expiryHeight).gte(Blockchain.block.height))
            throw new Error("Contract not expired.");
        if (c.creator == from) {
            c.creatorArbitrationDesc = desc;
        } else if (c.acceptor == from) {
            c.acceptorArbitrationDesc = desc;
        } else {
            throw new Error("Insufficient permissions.");
        }
        c.status = "arbitration";
        this._set(c.txhash, c);
    },
    arbitrationVote(txhash, bl) {
        let c = this.get(txhash);
        let value = Blockchain.transaction.value;
        //TODO 记录仲裁投票的人以及投票金额，当投票结果发生改变时重置仲裁结束时间。
    },
    performArbitration(txhash){
        //TODO 当满足结束时间时，可以申请执行仲裁。
    },
    //prevent irreversible lock-up of digital assets, only test versions.
    takeout: function (amount) {
        this._auth();
        var from = Blockchain.transaction.from;
        let value = new BigNumber(amount);
        if (from == this.creator) {
            var result = this._transfer(from, value);
            if (!result) {
                throw new Error("transfer failed.");
            }
        }
    }


}

module.exports = Contract;