/*!
 * Node - Shredfile
 *
 * A basic wrapped to the Unix 'shred' command. 
 *
 * Copyright(c) 2013 Kyle Farris <kyle@chomponllc.com>
 * MIT Licensed
 */

// Module dependencies.
var __ = require('underscore');
var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');

// ****************************************************************************
// Return a new Shredfile object.
// -----
// @param	Object 	options		Supplied to the Shredfile object for configuration
// @return	Function / Class
// @api 	Public
// ****************************************************************************
module.exports = function(options) {

	// ****************************************************************************
	// Shredfile class definition
	// -----
	// @param	Object	options		Key => Value pairs to override default settings
	// ****************************************************************************
	function Shredfile(options) {
		// Configuration Settings
		if(typeof options == 'undefined') options = {};
		this.settings = {};
		this.settings.shred_path = '/usr/bin/shred';
		this.settings.force = false;
		this.settings.iterations = 3;
		this.settings.bytes = null;
		this.settings.remove = true;
		this.settings.zero = true;
		this.settings.debug_mode = false;
		
		// Override settings by user configs
		this.settings = __.extend(this.settings,options);
		
		// Verify specified paths exists
		this.shred_path_exists = false;
		
		// REQUIRED: Make sure shred exists at specified location
		if(fs.existsSync(this.settings.shred_path)) {
			this.shred_path_exists = true;
		} else {
			if(this.settings.debug_mode)
				console.log("shredfile: shred could not be found at " + this.shred_path + "!");
		}
		
		// Build shred flags
		this.shred_flags = build_shred_flags(this.settings);
	}
	
	// ****************************************************************************
	// Securely removes a file.
	// -----
	// @param	String|Array	files		The path (string) or paths (array of string) to files that need to be shredded
	// @param	Function		status_cb	What to do as file is being shredded.
	// @param	Function		end_cb		What to do when file has been shredded.
	// ****************************************************************************
	Shredfile.prototype.shred = function(files,end_cb,status_cb) {
		if(this.settings.debug_mode) 
			console.log("shredfile: Shredding initiated.");
			
		var file = ''; // for storing file name being actively shredded
		var active_file_path = ''; // for storing parent directory of file being actively shredded
		var orig_files = files;
		if(typeof files == 'string')
			files = [files];
		
		if(!__.isArray(files) || files.length <= 0) {
			if(this.settings.debug_mode) {
				console.log("shredfile: No file(s) specified to shred!");
				console.log(typeof files);
				console.dir(files);
			}
			return end_cb('No file(s) specified to shred!',files);
		}
		
		// Spawn the shred binary
		var options = __.union(this.shred_flags,files)
		var shred = spawn(this.settings.shred_path,options);
		if(this.settings.debug_mode === true)
			console.log('shredfile: Configured shred command: ' + this.settings.shred_path + ' ' + options.join(' '));
		
		var self = this;
		
		shred.stderr.on('data', function(data) {
			if(self.settings.debug_mode) {
				console.log('shredfile: stderr: ' + data);
			}
		});
		
		shred.on('close', function(code) {
			if(code === 0) {
				if(typeof end_cb == 'function')
					end_cb(null,files);
			} else {
				if(typeof end_cb == 'function')
					end_cb('Shredding completed with issues. Exit Code: ' + code, files);
			}
		});
		
		shred.stderr.on('data', function (data) {
			if(typeof status_cb == 'function') {
				var matches;
				var progress = 0;
				var rename = '';
				
				data = data.toString().replace(/(\r\n|\n|\r)/gm,"");
				var valid_info = new RegExp("^" + self.settings.shred_path);
				if(data.match(valid_info)) {
					if(matches = data.match(/(\/[^:]+)\: pass (\d+)\/(\d+)/)) {
						active_file_path = path.dirname(matches[1]);
						file = path.basename(matches[1]);
						var numerator = parseInt(matches[2]);
						var denominator = parseInt(matches[3]);
						if(denominator !== 0)
							progress = numerator / denominator;
						if(typeof status_cb == 'function')
							return status_cb('overwriting',progress,file,active_file_path);
					}
					matches = data.match(/renamed to (\/.*)$/);
					if(__.isArray(matches)) {
						rename = path.basename(matches[1]).trim();
						if(!rename.match(/^[0]+$/)) return;
						if(file.length > 0)
							progress = rename.length / file.length;
						if(typeof status_cb == 'function')
							return status_cb('renaming',progress,file,active_file_path);
					}
				}
			}
		});
	};
	
	return new Shredfile(options);
};

// *****************************************************************************
// Builds out the flags based on the configuration the user provided
// -----
// @param	Object	settings	The settings used to build the flags
// @return	String				The concatenated shred flags
// @api		Private
// *****************************************************************************
function build_shred_flags(settings) {
	var flags_array = ['-v'];
	
	// Change permissions to allow writing if necessary?
	if(settings.force === true) 
		flags_array.push('-f');
		
	// How many overwrite iterations?
	if(typeof settings.iterations == 'number') 
		flags_array.push('--iterations=' + settings.iterations);
		
	// How many bytes to shred
	if(settings.bytes && settings.bytes.match(/^\d+[KMG]?$/))
		flags_array.push('--size=' + settings.bytes);
	
	// Should we actually remove the file?
	if(settings.remove)
		flags_array.push('-u');
	
	// Add a final overwrite with zeros to hide shredding?
	if(settings.zero)
		flags_array.push('-z');
	
	// Build the String
	return flags_array;
	
}