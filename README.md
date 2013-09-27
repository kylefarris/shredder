## NodeJS Secure File Removal Utility

Use Node JS to securely delete files on your server with Unix's `shred` command.

## How to Install

    npm install shredder

## Licence info

Licensed under the MIT License:

* http://www.opensource.org/licenses/mit-license.php

## Getting Started

All of the values listed in the example below represent the default values for their respective configuration item.

You can simply do this:

```javascript
var shredder = require('shredder');
```

And, you'll be good to go. 

__BUT__: If you want more control, you can specify all sorts of options.

```javascript
var shredder = require('shredder')({
    shred_path: '/usr/bin/shred', // Path to shred binary on your server
    force: false, // If true, changes permissions of file to allow writing if necessary
    iterations: 3, // How many time to overwrite the file
    bytes: null, // If specified, it will shred to specified bytes and then stop
    remove: true, // If true, removes (unlinks) file after shredding
    zero: true, // If true, adds final overwrite with zeros to hide shredding
    debug_mode: false // Whether or not to log info/debug/error msgs to the console
});
```

Here is a _non-default values example_ (to help you get an idea of what the proper-looking values should be):

```javascript
var clam = require('shredder')({
    shred_path: '/usr/local/bin/shred', // Maybe yours is located here
    force: true, // You do want to change permissions to force writing
    iterations: 25, // You're paranoid. Writing over the file 25 times.
    bytes: '70M', // You're shredding the first 70 MB of the file only
    remove: false, // You want to shred the file but keep it there.
    zero: false, // You don't care about hiding the fact that you shredde the file.
    debug_mode: true // You want to know everything that happened.
});
```

## API 
 
### .shred(files, cb)

This method allows you to shred a one or many files.

#### Parameters: 

* `files` (string or array) A path (string) or list paths (array) to file(s) you want to be shredded.
* `cb` (function) Will be called when the shred is complete. It takes 2 parameters:
 * `err` (string or null) A standard error message string (null if no error)
 * `file` (string) The original `files` parameter passed into this `shred` method.


#### Examples:

##### Single File:
```javascript
shredder.shred('/a/picture/for_example.jpg', function(err, file) {
    if(err) {
        console.log(err);
		return;
    }
	console.log("File has been shredded!");
});
```

##### Multiple Files:
```javascript
shredder.shred(['/a/picture/for_example.jpg','/a/different/file.dat'], function(err, file) {
    if(err) {
        console.log(err);
		return;
    }
	console.log("Files have been shredded!");
});
```