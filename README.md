# FileSystem.js
FileSystem.js is a Promise-based wrapper library for the HTML5 FileSystem API. It smooths over the rough edges of the existing (FileSystem)[http://dev.w3.org/2009/dap/file-system/pub/FileSystem/] and (File)[http://dev.w3.org/2006/webapi/FileAPI/] APIs and makes it simple to reason about its inherent asynchronicity. It uses native Promises since these have finally arrived in the stable version of Chrome.

## Supported Browsers
- Chrome

The FileSystem API is only available in Chrome at this time.

## Usage
First, create the FileSystem object.
`var fs = new FileSystem(minimum_size, type);`
By default, the minimum size (in bytes) will be 5Mb and the type will be persistent storage.

If you want to catch errors on the new filesystem object, it can be done as follows:
`fs.catch(onerrorfunction)`

### Examples
#### Getting the root directory
```javascript
	fs.getRoot().then(function(root) {
		// do something with the root directory
	})
```
#### Loading a filesystem url
```javascript
	fs.getURL('[path]').then(function(entry) {
		// do something with the directory or file
	})
```
#### Creating a directory
```javascript
	fs.getRoot().then(function(root) {
		root.makeDirectory('somedir');
	}).then(function(directory) {
		// do something with the created directory
	})
```
#### Creating a file entry and writing to it in a directory
```javascript
	fs.getURL('/somedir').then(function(directory) {
		return directory.makeFileEntry('somefile.txt');
	}).then(function(fileEntry) {
		fileEntry.write(new Blob(['who are you?'],{ type: 'text/plaintext' }));
	})
```
#### Read all the files in a directory
```javascript
	fs.getRoot().then(function(root) {
		return root.readEntries();
	}).then(function(entries) {
		// do something with the entries which have just been read
	})
```
#### Read all of the ArrayBuffers for entries in a directory 
```javascript
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
```

## API
### FileSystem
- new FileSystem(minimumSize, type)
	- A promise-like object that wraps the local file system. 
	- **Parameters**:
		- **minimumSize** - size in bytes for the browser file system
		- **type** - either persistent(window.PERSISTENT == 1) or temporary(window.TEMPORARY == 0)

## License MIT
Copyright (c) 2014 Kirill Klimuk

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.