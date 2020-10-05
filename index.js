// Module dependencies.
const { existsSync } = require('fs');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Builds out the flags based on the configuration the user provided.
 *
 * @private
 * @param {object} settings - The settings used to build the flags
 * @returns {string} The concatenated shred flags
 */
function buildShredFlags(settings) {
    const flags = ['-v'];

    // Change permissions to allow writing if necessary?
    if (settings.force === true) flags.push('-f');

    // How many overwrite iterations?
    if (typeof settings.iterations == 'number')
        flags.push(`--iterations=${settings.iterations}`);

    // How many bytes to shred
    if (settings.bytes && settings.bytes.match(/^\d+[KMG]?$/))
        flags.push(`--size=${settings.bytes}`);

    // Should we actually remove the file?
    if (settings.remove) flags.push('-u');

    // Add a final overwrite with zeros to hide shredding?
    if (settings.zero) flags.push('-z');

    // Build the String
    return flags;

}

class ShredFile {
    /**
    * This callback is displayed as part of the ShredFile class.
    *
    * @callback ShredFile~endCallback
    * @param {Error} err - A standard error message (null if no error)
    * @param {float} file - The original files parameter passed into this shred method.
    */

    /**
    * This callback is displayed as part of the ShredFile class.
    *
    * @callback ShredFile~statusCallback
    * @param {string} action - This will be either 'overwriting' or 'renaming'
    * @param {float} progress - The percentage of the specific action that is complete (ex. 0.66)
    * @param {string} file - File name of the file that is currently being acted upon
    * @param {string} activeFilePath - Full path to the file that is currently being acted upon
    */

    /**
     * ShredFile Class constructor.
     *
     * @param {object} settings - Settings to override the defaults.
     * @param {string} [settings.shredPath='/usr/bin/shred'] - The path to the `shred` binary.
     * @param {boolean} [settings.force=false] - If true, change permissions to allow writing if necessary
     * @param {number} [settings.iterations=3] - Set the number of times to overwrite the file
     * @param {number} [settings.bytes=null] - The number of bytes to shred
     * @param {boolean} [settings.remove=true] - If true, trucates and removes the file after overwriting
     * @param {boolean} [settings.zero=true] - If true, add a final overwrite with zeros to hide shredding
     * @param {boolean} [settings.debugMode=fakse] - If true, turns on debugging (logs to console)
     * @example
     * 
     * // Instantiat with all defaults
     * const shred = new ShredFile();
     * 
     * // Instantiate with some settings overrides
     * const shredder = new ShredFile({ iteractions: 5, debugMode: true });
     */
    constructor(settings) {
        const defaults = {
            shredPath: '/usr/bin/shred',
            force: false,
            iterations: 3,
            bytes: null,
            remove: true,
            zero: true,
            debugMode: false,
        };

        this.settings = { ...defaults, ...settings };

        // Verify specified paths exists
        this.shredPath_exists = false;

        // REQUIRED: Make sure shred exists at specified location
        if (existsSync(this.settings.shredPath)) {
            this.shredPath_exists = true;
        } else {
            if (this.settings.debugMode)
                console.log(`shredfile: shred could not be found at ${this.shredPath}!`);
        }

        // Build shred flags
        this.shredFlags = buildShredFlags(this.settings);
    }

    /**
     * Allows one to securely shred a file or a set of files.
     *
     * @public
     * @async
     * @param {string | Array} files - A path to a file or an array of paths to files
     * @param {ShredFile~statusCallback} [statusCb] - (optional) This will be called on each status change (renaming and each overwrite iteration)
     * @param {ShredFile~endCallback} [endCb] - (optional) This will be called when done.
     * @returns {Promise<object>} If no `endCb` is provided, a Promise will be returned.
     * @example
     * 
     * const shredder = new ShredFile();
     * 
     * // Do some shredding (Promise-style)
     * async function doSomeShredding() {
     *     // Shred a single file
     *     const result = await shredder.shred('/path/to/some/file');
     * 
     *     // Shred multiple files
     *     const result = await shredder.shred(['/path/to/first/file', '/path/to/second/file']);
     * 
     *     // Shred a file with notifications on progress
     *     const result = await shredder.shred('/another/file/to/shred', (action, progress, file, activeFilePath) => {
     *         console.log(`Currently ${action} ${activeFilePath} (${(progress * 100).floor()}%));
     *     });
     * }
     * 
     * // Do some shredding (callback-style)
     * function moreShredding(cb) {
     *     shredder.shred('/path/to/file/file', null, (err, file) => {
     *         if (err) {
     *             console.error(err);
     *             cb(err, null);
     *         }
     *         else {
     *             console.log('All Done!');
     *             cb(null, true);
     *         }
     *     });
     * }
     */
    async shred(files, statusCb, endCb) {
        const self = this;
        let hasCb = false;
        
        // Verify second param, if supplied, is a function
        if (endCb && typeof endCb !== 'function') {
            throw new Error('Invalid endCb provided to init method. Third paramter, if provided, must be a function!');
        } else if (endCb && typeof endCb === 'function') {
            hasCb = true;
        }

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const origFiles = files;
            if (typeof files === 'string') files = [files];

            if (!Array.isArray(files) || files.length <= 0) {
                if (this.settings.debugMode) {
                    console.log('shredfile: No file(s) specified to shred!', typeof files, files);
                }
                const err = new Error('No file(s) specified to shred!');
                return (hasCb ? endCb(err, null) : reject(err));
            }

            // For storing file name being actively shredded
            let file = path.basename(files[0]);

            // For storing parent directory of file being actively shredded
            let activeFilePath = path.dirname(files[0]);

            // Spawn the shred binary
            const options = Array.from(new Set(this.shredFlags.concat(files)));
            const shred = spawn(this.settings.shredPath, options);
            if (this.settings.debugMode === true)
                console.log(`shredfile: Configured shred command: ${this.settings.shredPath} ${options.join(' ')}`);


            // What to do if there's an error...
            shred.stderr.on('data', (data) => {
                if (self.settings.debugMode) console.log(`shredfile: stderr: ${data}`);
                if (hasCb) endCb(new Error(data), null);
                else reject(new Error(data));
            });

            // What to do if when the shredding is complete...
            shred.on('close', (code) => {
                if (code === 0) {
                    if (hasCb) endCb(null, files);
                    else resolve(files);
                } else {
                    const errorMsg = `Shredding completed with issues. Exit Code: ${code}`;
                    if (hasCb) endCb(new Error(errorMsg), files);
                    else reject(errorMsg);
                }
            });

            shred.stderr.on('data', (data) => {
                if (statusCb && typeof statusCb === 'function') {
                    let progress = 0;
                    let rename = '';

                    data = data.toString().replace(/(\r\n|\n|\r)/gm, '');
                    const validInfo = new RegExp(`^${self.settings.shredPath}`);
                    if (validInfo.test(data)) {
                        let matches = data.match(/(\/[^:]+): pass (\d+)\/(\d+)/);
                        if (matches !== -1) {
                            activeFilePath = path.dirname(matches[1]);
                            file = path.basename(matches[1]);
                            const numerator = parseInt(matches[2]);
                            const denominator = parseInt(matches[3]);
                            if (denominator !== 0) progress = numerator / denominator;
                            if (statusCb && typeof statusCb === 'function')
                                return statusCb('overwriting', progress, file, activeFilePath);
                        }
                        matches = data.match(/renamed to (\/.*)$/);
                        if (Array.isArray(matches)) {
                            rename = path.basename(matches[1]).trim();
                            if (!/^[0]+$/.test(rename)) return;
                            if (file.length > 0) progress = rename.length / file.length;
                            if (statusCb && typeof statusCb === 'function')
                                return statusCb('renaming', progress, file, activeFilePath);
                        }
                    }
                }
            });
        });
    }
}

module.exports = ShredFile;
