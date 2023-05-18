const vscode = require('vscode');

class Registers {

    constructor() {
        this.registers = {}
    }

    updateRegister(id, text) {
        this.registers[id] = text;
    }

    getRegister(id) {
        return this.registers[id];
    }

    listRegisters() {
        let r = [];
        for (let k of Object.keys(this.registers) ){
            if(this.registers[k]) {
                r.push({id: k, text: this.registers[k]})
            }
        }

        return r;
    }
}

module.exports = {
    Registers
}