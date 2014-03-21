# FileSystem.js
FileSystem.js is a Promise-based wrapper library for the HTML5 FileSystem API. It smooths over the rough edges of the existing API and makes it simple to reason about its inherent asynchronicity. It uses native Promises since these have finally arrived in the stable version of Chrome.

## Supported Browsers
- Chrome

The FileSystem API is only available in Chrome at this time.

## Usage
First, create the FileSystem object.
`var fs = new FileSystem(minimum_size, type);`
By default, the minimum size (in bytes) will be 5Mb and the type will be persistent storage.

If you want to catch errors on the new filesystem object, it can be done as follows:
`fs.catch(onerrorfunction)`

## Examples
### Getting the root directory
	fs.getRoot().then(function(root) {
		// do something with the root directory
	})
### Loading a url
	fs.getURL('[path]').then(function(entry) {
		// do something with the directory or file
	})
### Creating a directory
	fs.getRoot().then(function(root) {
		root.makeDirectory('somedir');
	}).then(function(directory) {
		// do something with the created directory
	})
### Creating a file entry and writing to it in a directory
	fs.getURL('/somedir').then(function(directory) {
		return directory.makeFileEntry('somefile.txt');
	}).then(function(fileEntry) {
		fileEntry.write(new Blob(['who are you?'],{ type: 'text/plaintext' }));
	})
### Read all the files in a directory
	fs.getRoot().then(function(root) {
		return root.readEntries();
	}).then(function(entries) {
		// do something with the entries which have just been read
	})
### Read all of the ArrayBuffers for entries in a directory 
	fs.getRoot().then(function(root) {
		return root.readEntries();
	}).then(function(entries) {
		var promises = [].map.call(entries, function(entry) {
			return entry.getFile().then(function(file) {
				return file.readAsArrayBuffer();
			});
		});

		return Promise.all(promises);
	}).then(function(buffers) {
		// do something with the array buffers
	})