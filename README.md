[![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Node.js Version][node-image]][node-url] [![Build Status][travis-image]][travis-url]

# NodeJS Secure File Removal Utility

Use Node JS to securely delete files on your server with Unix's `shred` command. You really don't need this module if the machine your running your project on is not using a tranditional mechanical hard drive. In other words, if the file you want to securely delete is on solid state storage, there's no need to use this module and, in fact, it could actually be unnecessarily shortening the life of that disk to use it.

NOTE: This module is not designed to work on Windows but may work on WSL. Your mileage may vary.

## How to Install

**With NPM:**

```shell
npm install shredfile
```

**With Yarn:**

```shell
yarn add shredfile
```

## License info

Licensed under the MIT License:

* <http://www.opensource.org/licenses/mit-license.php>

## Getting Started

All of the values listed in the example below represent the default values for their respective configuration item.

**You can simply do this:**

```javascript
const ShredFile = require('shredfile');
const shredder = new ShredFile();
```

And, you'll be good to go.

**BUT**: If you want more control, you can specify all sorts of options.

```javascript
const ShredFile = require('shredfile');
const shredder = new ShredFile({
    shredPath: '/usr/bin/shred', // Path to shred binary on your server
    force: false, // If true, changes permissions of the file(s) to allow writing if necessary
    iterations: 3, // How many times to overwrite the file
    bytes: null, // If specified, it will shred to specified bytes and then stop
    remove: true, // If true, removes (unlinks) file(s) after shredding
    zero: true, // If true, adds final overwrite with zeros to hide shredding
    debugMode: false // Whether or not to log info/debug/error msgs to the console
});
```

Here is a *non-default values example* (to help you get an idea of what some proper-looking alternate values could be):

```javascript
const ShredFile = require('shredfile');
const shredder = new ShredFile({
    shredPath: '/usr/local/bin/shred', // Maybe yours is located here
    force: true, // You do want to change permissions to force writing
    iterations: 25, // You wear a tinfoil hat at all times, so, naturally, write over the file 25 times.
    bytes: '70M', // You're shredding the first 70 MB of the file only.
    remove: false, // You want to shred the file but keep it there for some reason.
    zero: false, // You don't care about hiding the fact that you shredded the file.
    debugMode: true // You want to know everything that happened.
});
```

## API

### .shred(files, statusCb, endCb)

This method allows you to shred a one or many files.

#### Parameters

* `files` *required* (string or array) A path (string) or list paths (array) to file(s) you want to be shredded.
* `statusCb` (function) Will be called everytime the status of a file is changed (ex. renaming and each overwrite iteration). It takes 4 parameters:
  * `action` (string) This will be either 'overwriting' or 'renaming'
  * `progress` (float) The percentage of the specific action that is complete (ex. 0.66)
  * `file` (string) File name of the file that is currently being acted upon
  * `activeFilePath` (string) Full path to the file that is currently being acted upon (does not include file name)
* `endCb` (function) Will be called when the shred is complete. It takes 2 parameters:
  * `err` (string or null) A standard error message string (null if no error)
  * `file` (string) The original `files` parameter passed into this `shred` method.

#### Examples

##### Single File (Callback Style)

```javascript
shredder.shred('/a/picture/for_example.jpg', (err, file) => {
    if (err) return console.error(err);
    console.log("File has been shredded!");
});
```

##### Single File (Async/Await)

```javascript
async function doShred() {
    try {
        const file = await shredder.shred('/a/picture/for_example.jpg');
        console.log('Shredded File: ', file);
    } catch (err) [
        console.error(err);
    }
}

doShred();
```

##### Multiple Files (with status callback) - Callback Style

```javascript
const files = ['/a/picture/for_example.jpg','/a/different/file.dat'];
shredder.shred(files, (action, progress, file, path) => {
    progress = (Math.round((progress * 10000)) / 100);
    console.log(`${action} ${file}: ${progress}%`);
}, (err, file) => {
    if (err) return console.error(err);
    console.log("Files have been shredded!");
});
```

##### Multiple Files (with status callback) - Promise Style

```javascript
const files = ['/a/picture/for_example.jpg','/a/different/file.dat'];
shredder.shred(files, (action, progress, file, path) => {
    progress = (Math.round((progress * 10000)) / 100);
    console.log(`${action} ${path}/${file}: ${progress}%`);
}).then((files) => {
    console.log('Files have been shredded!', files);
}).catch((err) => {
    console.error(err);
});
```

[node-image]: https://img.shields.io/node/v/shredfile.svg
[node-url]: https://nodejs.org/en/download
[npm-downloads-image]: https://img.shields.io/npm/dm/shredfile.svg
[npm-url]: https://npmjs.org/package/shredfile
[npm-version-image]: https://img.shields.io/npm/v/shredfile.svg
[travis-image]: https://img.shields.io/travis/kylefarris/shredder/master.svg
[travis-url]: https://travis-ci.org/kylefarris/shredder
