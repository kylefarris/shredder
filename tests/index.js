// const fs = require('fs');
const { statSync, appendFileSync, openSync, existsSync, mkdirSync, rmdirSync } = require('fs');
const { dirname } = require('path');
const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const cliProgress = require('cli-progress');
const testConfig = require('./test_config');

const should = chai.should();
const { expect } = chai;
const testFile1 = './tests/testFile.txt';
const testFile2 = './tests/testFile2.txt';
const testFile3 = './tests/sub/testFile3.txt';

chai.use(chaiAsPromised);

const createTestFile = (fileSize, testFile) => {
    // Make sure the file path exists
    const dir = dirname(testFile);
    mkdirSync(dir, { recursive: true });

    // Make a file to shred...
    const ws = openSync(testFile, 'a');

    const maxLoops = 1000000;
    let i = 0;
    let size = 0;

    console.log('Creating 10 MB test file to shred...');

    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(fileSize, size);

    // 10 MB
    while (size <= fileSize && i <= maxLoops) {
        const str =
            'This is a test of the emergency broadcast system. Beep Boop. Beep Boop. BEEEEEEEEEEEEEEEEEEEEEEEEEEEEEP!!!!!\n';
        appendFileSync(ws, str, 'utf8');
        i += 1;
        const stat = statSync(testFile);
        size = stat.size;
        bar.update(size);
    }

    bar.stop();
};

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

describe('buildShredFlags()', () => {
    let shredder;
    beforeEach(async () => {
        shredder = new ShredFile();
    });

    it('should have a property called "shredFlags"', () => {
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

describe('shred()', () => {
    let shredder;
    beforeEach(async () => {
        shredder = new ShredFile(testConfig);
    });

    it('should have a method called "shred"', () => {
        should.exist(shredder.shred);
    });

    it('should shred a file successfully...', async () => {
        // Create 10 MB test file...
        createTestFile(1024 ** 2 * 10, testFile1);
        let fileExists = existsSync(testFile1);
        expect(fileExists).to.be.true;

        // Shred that file...
        const file = await shredder.shred(testFile1);
        fileExists = existsSync(testFile1);
        expect(fileExists).to.be.false;
        expect(file).to.be.eql(testFile1);
    });

    it('should shred a set of files in the same directory successfully...', async () => {
        // Create 10 MB test file...
        createTestFile(1024 ** 2 * 10, testFile1);

        // Create 15 MB test file...
        createTestFile(1024 ** 2 * 15, testFile2);

        // See if files exist...
        let file1Exists = existsSync(testFile1);
        let file2Exists = existsSync(testFile2);
        expect(file1Exists).to.be.true;
        expect(file2Exists).to.be.true;

        // Shred those files file...
        const files = await shredder.shred([testFile1, testFile2]);
        file1Exists = existsSync(testFile1);
        file2Exists = existsSync(testFile2);

        // Make sure all is bueno...
        expect(file1Exists).to.be.false;
        expect(file2Exists).to.be.false;
        expect(files).to.be.eql([testFile1, testFile2]);
    });

    it('should shred a set of files in different directories successfully...', async () => {
        // Create 10 MB test file...
        createTestFile(1024 ** 2 * 10, testFile1);

        // Create 15 MB test file...
        createTestFile(1024 ** 2 * 15, testFile3);

        // See if files exist...
        let file1Exists = existsSync(testFile1);
        let file3exists = existsSync(testFile3);
        expect(file1Exists).to.be.true;
        expect(file3exists).to.be.true;

        // Shred those files file...
        const files = await shredder.shred([testFile1, testFile3]);
        file1Exists = existsSync(testFile1);
        file3exists = existsSync(testFile3);

        // Make sure all is bueno...
        expect(file1Exists).to.be.false;
        expect(file3exists).to.be.false;
        expect(files).to.be.eql([testFile1, testFile3]);

        rmdirSync('./tests/sub');
    });

    it('should shred a file and send status of the shred while doing it...', async () => {
        // Create 10 MB test file...
        createTestFile(1024 ** 2 * 10, testFile1);
        let fileExists = existsSync(testFile1);
        expect(fileExists).to.be.true;

        // Store Status Messages...
        const statusMsgs = [];

        // Shred that file...
        const shreddedFile = await shredder.shred(testFile1, (action, progress, file, path) => {
            progress = Math.round(progress * 10000) / 100;
            statusMsgs.push(`${action} ${path}/${file}: ${progress}%`);
        });

        fileExists = existsSync(testFile1);
        expect(fileExists).to.be.false;
        expect(shreddedFile).to.be.eql(testFile1);
        expect(statusMsgs).to.be.eql([
            'overwriting ./tests/testFile.txt: 25%',
            'overwriting ./tests/testFile.txt: 50%',
            'overwriting ./tests/testFile.txt: 75%',
            'overwriting ./tests/testFile.txt: 100%',
        ]);
    });
});
