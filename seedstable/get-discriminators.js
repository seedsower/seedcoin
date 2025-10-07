const crypto = require('crypto');

function getDiscriminator(instructionName) {
    const hash = crypto.createHash('sha256');
    hash.update(`global:${instructionName}`);
    return hash.digest().slice(0, 8);
}

console.log('Instruction Discriminators:');
console.log('initialize:', Array.from(getDiscriminator('initialize')));
console.log('emergency_pause:', Array.from(getDiscriminator('emergency_pause')));
