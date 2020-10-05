const fs = require('fs');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const should = chai.should();
const expect = chai.expect;

chai.use(chaiAsPromised);

const ShredFile = require('../index.js');

// Help to find unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
    if (reason && typeof reason === 'object' && 'actual' in reason) {
        console.log('Reason: ', reason.message, reason.actual);
    }
    if (reason === null) {
        console.log('No reason... here\'s the promise: ', p);
    }
    console.log('Unhandled Rejection reason:', reason);
});

describe('NodeClam Module', () => {
    it('should return an object', () => {
        ShredFile.should.be.a('function');
    });
});

describe('Initialized NodeClam module', () => {
    it('should have certain config properties defined', async () => {
        const shredder = new ShredFile();

        expect(shredder.settings.shredPath, 'remove_infected').to.not.be.undefined;
        expect(shredder.settings.force, 'quarantine_infected').to.not.be.undefined;
        expect(shredder.settings.iterations, 'scan_log').to.not.be.undefined;
        expect(shredder.settings.bytes, 'debug_mode').to.not.be.undefined;
        expect(shredder.settings.remove, 'file_list').to.not.be.undefined;
        expect(shredder.settings.zero, 'scan_recursively').to.not.be.undefined;
        expect(shredder.settings.debugMode, 'clamscan').to.not.be.undefined;
    });
});