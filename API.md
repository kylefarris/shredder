<a name="ShredFile"></a>

## ShredFile
**Kind**: global class  

* [ShredFile](#ShredFile)
    * [new ShredFile(settings)](#new_ShredFile_new)
    * _instance_
        * [.shred(files, [statusCb], [endCb])](#ShredFile+shred) ⇒ <code>Promise.&lt;object&gt;</code>
    * _inner_
        * [~endCallback](#ShredFile..endCallback) : <code>function</code>
        * [~statusCallback](#ShredFile..statusCallback) : <code>function</code>

<a name="new_ShredFile_new"></a>

### new ShredFile(settings)
ShredFile Class constructor.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| settings | <code>object</code> |  | Settings to override the defaults. |
| [settings.shredPath] | <code>string</code> | <code>&quot;&#x27;/usr/bin/shred&#x27;&quot;</code> | The path to the `shred` binary. |
| [settings.force] | <code>boolean</code> | <code>false</code> | If true, change permissions to allow writing if necessary |
| [settings.iterations] | <code>number</code> | <code>3</code> | Set the number of times to overwrite the file |
| [settings.bytes] | <code>number</code> | <code></code> | The number of bytes to shred |
| [settings.remove] | <code>boolean</code> | <code>true</code> | If true, trucates and removes the file after overwriting |
| [settings.zero] | <code>boolean</code> | <code>true</code> | If true, add a final overwrite with zeros to hide shredding |
| [settings.debugMode] | <code>boolean</code> | <code>fakse</code> | If true, turns on debugging (logs to console) |

**Example**  
```js
// Instantiat with all defaults
const shred = new ShredFile();

// Instantiate with some settings overrides
const shredder = new ShredFile({ iteractions: 5, debugMode: true });
```
<a name="ShredFile+shred"></a>

### shredFile.shred(files, [statusCb], [endCb]) ⇒ <code>Promise.&lt;object&gt;</code>
Allows one to securely shred a file or a set of files.

**Kind**: instance method of [<code>ShredFile</code>](#ShredFile)  
**Returns**: <code>Promise.&lt;object&gt;</code> - If no `endCb` is provided, a Promise will be returned.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| files | <code>string</code> \| <code>Array</code> | A path to a file or an array of paths to files |
| [statusCb] | [<code>statusCallback</code>](#ShredFile..statusCallback) | (optional) This will be called on each status change (renaming and each overwrite iteration) |
| [endCb] | [<code>endCallback</code>](#ShredFile..endCallback) | (optional) This will be called when done. |

**Example**  
```js
const shredder = new ShredFile();

// Do some shredding (Promise-style)
async function doSomeShredding() {
    // Shred a single file
    const result = await shredder.shred('/path/to/some/file');

    // Shred multiple files
    const result = await shredder.shred(['/path/to/first/file', '/path/to/second/file']);

    // Shred a file with notifications on progress
    const result = await shredder.shred('/another/file/to/shred', (action, progress, file, activeFilePath) => {
        console.log(`Currently ${action} ${activeFilePath} (${(progress * 100).floor()}%));
    });
}

// Do some shredding (callback-style)
function moreShredding(cb) {
    shredder.shred('/path/to/file/file', null, (err, file) => {
        if (err) {
            console.error(err);
            cb(err, null);
        }
        else {
            console.log('All Done!');
            cb(null, true);
        }
    });
}
```
<a name="ShredFile..endCallback"></a>

### ShredFile~endCallback : <code>function</code>
This callback belongs to the `shred` method and will be called (if supplied)
when the shred command has completed or if there is an error.

**Kind**: inner typedef of [<code>ShredFile</code>](#ShredFile)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | A standard error message (null if no error) |
| file | <code>string</code> \| <code>Array</code> | The original files parameter passed into this shred method. |

<a name="ShredFile..statusCallback"></a>

### ShredFile~statusCallback : <code>function</code>
This callback belongs to the `shred` command and will be called (if supplied) whenever
the shred command sends a STDOUT. Used to show progress of a shred.

**Kind**: inner typedef of [<code>ShredFile</code>](#ShredFile)  

| Param | Type | Description |
| --- | --- | --- |
| action | <code>string</code> | This will be either 'overwriting' or 'renaming' |
| progress | <code>number</code> | The percentage of the specific action that is complete (ex. 0.66) |
| file | <code>string</code> \| <code>Array</code> | File name of the file that is currently being acted upon |
| activeFilePath | <code>string</code> | Full path to the file that is currently being acted upon (does not include file name) |

