/*!
 * Node - Shredder
 *
 * A basic wrapped to the Unix 'shred' command. 
 *
 * Copyright(c) 2013 Kyle Farris <kyle@chomponllc.com>
 * MIT Licensed
 */

// Module dependencies.
var __ = require('underscore');
var fs = require('fs');
var exec = require('child_process').exec;

// ****************************************************************************
// Return a new Shredder object.
// -----
// @param	Object 	options		Supplied to the Shredder object for configuration
// @return	Function / Class
// @api 	Public
// ****************************************************************************
module.exports = function(options) {

	// ****************************************************************************
	// Shredder class definition
	// -----
	// @param	Object	options		Key => Value pairs to override default settings
	// ****************************************************************************
	function Shredder(options) {
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
				console.log("shredder: shred could not be found at " + this.shred_path + "!");
		}
		
		// Build shred flags
		this.shred_flags = build_shred_flags(this.settings);
	}
	
	// ****************************************************************************
	// Securely removes a file.
	// -----
	// @param	String|Array	files	The path (string) or paths (array of string) to files that need to be shredded
	// @param	Function		cb	    What to do when file has been shredded.
	// ****************************************************************************
	Shredder.prototype.shred = function(files,cb) {
		if(this.settings.debug_mode) 
			console.log("shredder: Shredding initiated.");
			
		if(typeof files == 'array')
			files = files.join(' ');
		
		if(typeof files != 'string' || files.length <= 0)
			return cb('No file(s) specified to shred!',files);
		
		var command = this.settings.shred_path + this.shred_flags + files;
		
		if(this.settings.debug_mode === true)
			console.log('shredder: Configured shred command: ' + command);
		
		var self = this;
		
		// Execute the shred binary with the proper flags
		exec(command, function(err, stdout, stderr) { 
			if(err || stderr) {
				if(self.settings.debug_mode)
					console.log(err);
				cb(err, file);
			} else {
				console.log(stdout);
			}
		});
	}
	
	return new Shredder(options);
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
	return ' ' + flags_array.join(' ') + ' ';
	
}