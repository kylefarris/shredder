// const fs = require('fs');
const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const testConfig = require('./test_config');

const should = chai.should();
const { expect } = chai;

chai.use(chaiAsPromised);

const ShredFile = require('../index.js');

// Help to find unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
    if (reason && typeof reason === 'object' && 'actual' in reason) {
        console.log('Reason: ', reason.message, reason.actual);
    }
    if (reason === null) {
        console.log("No reason... here's the promise: ", p);
    }
    console.log('Unhandled Rejection reason:', reason);
});

describe('ShredFile Module', () => {
    it('should return an object', () => {
        ShredFile.should.be.a('function');
    });
});

describe('Initialized ShredFile module', () => {
    it('should have certain config properties defined', async () => {
        const shredder = new ShredFile();

        expect(shredder.settings.shredPath, 'remove_infected').to.not.be.undefined;
        expect(shredder.settings.force, 'quarantine_infected').to.not.be.undefined;
        expect(shredder.settings.iterations, 'scan_log').to.not.be.undefined;
        expect(shredder.settings.bytes, 'debug_mode').to.not.be.undefined;
        expect(shredder.settings.remove, 'file_list').to.not.be.undefined;
        expect(shredder.settings.zero, 'scan_recursively').to.not.be.undefined;
        expect(shredder.settings.debugMode, 'shredder').to.not.be.undefined;
    });

    it('should have the proper default settings values set', async () => {
        const shredder = new ShredFile();

        expect(shredder.settings.shredPath).to.eql('/usr/bin/shred');
        expect(shredder.settings.force).to.be.false;
        expect(shredder.settings.iterations).to.eql(3);
        expect(shredder.settings.bytes).to.be.null;
        expect(shredder.settings.remove).to.be.true;
        expect(shredder.settings.zero).to.be.true;
        expect(shredder.settings.debugMode).to.be.false;
    });

    it('should accept an options array and merge them with the object defaults', async () => {
        const shredder = new ShredFile({
            shredPath: testConfig.shredPath,
            force: true,
            iterations: 25,
            bytes: 65535,
            remove: false,
            zero: false,
            debugMode: true,
        });

        expect(shredder.settings.shredPath).to.eql(testConfig.shredPath);
        expect(shredder.settings.force).to.be.true;
        expect(shredder.settings.iterations).to.eql(25);
        expect(shredder.settings.bytes).to.be.eql(65535);
        expect(shredder.settings.remove).to.be.false;
        expect(shredder.settings.zero).to.be.false;
        expect(shredder.settings.debugMode).to.be.true;
    });

    it('must indicate when a valid shred binary is found', () => {
        const shredder = new ShredFile({
            shredPath: testConfig.shredPath,
        });
        expect(shredder.shredPathExists).to.be.true;
    });

    it('must indicate when a valid shred binary is NOT found', () => {
        const shredder = new ShredFile({ shredPath: '/not/finding/this' });
        expect(shredder.shredPathExists).to.be.false;
    });
});

describe('buildClamFlags', () => {
    let shredder;
    beforeEach(async () => {
        shredder = new ShredFile();
    });

    it('shredFlags should exist', () => {
        should.exist(shredder.shredFlags);
    });

    it('should build an array', () => {
        const flags = shredder.shredFlags;
        expect(flags).to.not.be.undefined;
        expect(flags).to.be.an('array');
        expect(flags).to.have.length.greaterThan(0);
    });

    it('should build a series of flags', () => {
        const standardFlags = ['-v', '--iterations=3', '-u', '-z'];
        const flags = shredder.shredFlags;

        flags.should.be.eql(standardFlags);
    });
});
