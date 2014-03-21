window.FileSystem = (function(navigator, Promise) {
	'use strict';

	function FileSystem(minimum_size, type) {
		this.fs = null;
		this.minimum_size = minimum_size || 1024 * 1024 * 5;
		this.type = type || window.PERSISTENT;

		this.promise = new Promise(this.__init__.bind(this));
		this.then = this.promise.then.bind(this.promise);
		this.catch = this.promise.catch.bind(this.promise);
	}

	FileSystem.prototype.__init__ = function(resolve, reject) {
		var self = this;
		return self.getStatistics().then(function(stats) {
			if (stats.quota < self.minimum_size) {
				return self.requestQuota(self.minimum_size).then(function(quota) {
					return self.__getBrowserFileSystem__(self.type, quota);
				});
			}
			return self.__getBrowserFileSystem__(self.type, stats.quota);
		})
		.then(function(fs) {
			self.fs = fs;
			resolve(fs);
		})
		.catch(reject);
	};

	FileSystem.prototype.getRoot = function() {
		var self = this;
		return this.then(function(fs) {
			return self.__modifyEntryInterface__(fs.root);
		});
	};

	var resolveURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
	FileSystem.prototype.getURL = function(url) {
		var self = this;
		return this.then(function(fs) {
			var rootURL = fs.root.toURL();
			var revised = rootURL.substr(0, rootURL.length - 1) + url;
			return new Promise(function(resolve, reject) {
				resolveURL(revised, self.makeEntryCallback(resolve), reject);
			});
		});
	};


	FileSystem.prototype.makeEntryCallback = function(resolve) {
		var self = this;
		return function(entry) {
			self.__modifyEntryInterface__(entry);
			resolve(entry);
		};
	};


	FileSystem.prototype.__modifyEntryInterface__ = function(entry) {
		var self = this;
		entry.__getMetadata__ = entry.getMetadata;
		entry.getMetadata = function() {
			return new Promise(function(resolve, reject) { entry.__getMetadata__(resolve, reject) });
		};

		entry.__moveTo__ = entry.moveTo;
		entry.moveTo = function(parent, newName) {
			return new Promise(function(resolve, reject) {
				entry.__moveTo__(parent, newName, self.makeEntryCallback(resolve), reject);
			});
		};

		entry.__copyTo__ = entry.copyTo;
		entry.copyTo = function(parent, newName) {
			return new Promise(function(resolve, reject) {
				entry.__copyTo__(parent, newName, self.makeEntryCallback(resolve), reject);
			});
		};

		entry.__getParent__ = entry.getParent;
		entry.getParent = function() {
			return new Promise(function(resolve, reject) {
				entry.__getParent__(self.makeEntryCallback(resolve), reject);
			});
		};

		entry.__remove__ = entry.remove;
		entry.remove = function() {
			return new Promise(function(resolve, reject) { entry.__remove__(resolve, reject); });
		};

		if (entry.isDirectory) {
			this.__modifyDirectoryInterface__(entry);
		} else if (entry.isFile) {
			this.__modifyFileInterface__(entry);
		}

		return entry;
	};

	FileSystem.prototype.__modifyFileInterface__ = function(entry) {
		var self = this;

		entry.getFile = function() {
			return new Promise(function(resolve, reject) { entry.file(self.makeEntryCallback(resolve), reject); });
		};

		entry.__createWriter__ = entry.createWriter;
		entry.createWriter = function() {
			return new Promise(function(resolve, reject) { entry.__createWriter__(resolve, reject); });
		};

		entry.write = function(blob) {
			return entry.createWriter().then(function(writer) {
				writer.write(blob);
				return entry;
			});
		};

	};


	FileSystem.prototype.__modifyDirectoryInterface__ = function(entry) {
		var self = this;

		entry.getFileEntry = function(path, options) {
			return new Promise(function(resolve, reject) {
				entry.getFile(path, options, self.makeEntryCallback(resolve), reject);
			});
		};

		entry.makeFileEntry = function(path, exclusive) {
			return entry.getFileEntry(path, {
				create: true,
				exclusive: exclusive ? true : false
			});
		};

		entry.__getDirectory__ = entry.getDirectory;
		entry.getDirectory = function(path, options) {
			return new Promise(function(resolve, reject) {
				entry.__getDirectory__(path, options, self.makeEntryCallback(resolve), reject);
			});
		};

		entry.makeDirectory = function(path, exclusive) {
			return entry.getDirectory(path, {
				create: true,
				exclusive: exclusive ? true : false
			});
		};

		entry.__removeRecursively__ = entry.removeRecursively;
		entry.removeRecursively = function() {
			return new Promise(function(resolve, reject) { entry.__removeRecursively__(resolve, reject); });
		};

		entry.readEntries = function() {
			var reader = entry.createReader();
			return new Promise(function(resolve, reject) {
				var results = [];
				reader.readEntries(function getEntries(entries) {
					if (entries.length === 0) {
						return resolve(results);
					}

					results = results.concat(Array.prototype.map.call(entries, self.__modifyEntryInterface__.bind(self)));
					reader.readEntries(getEntries, reject);
				}, reject);
			});
		};
	};


	var persistentStorage = navigator.persistentStorage || navigator.webkitPersistentStorage;
	FileSystem.prototype.getStatistics = function() {
		return new Promise(function(resolve, reject) {
			persistentStorage.queryUsageAndQuota(function(usage, quota) {
				resolve({
					usage: usage,
					quota: quota
				});
			}, reject);
		});
	};

	FileSystem.prototype.requestQuota = function(quota) {
		return new Promise(function(resolve, reject) {
			persistentStorage.requestQuota(quota, resolve, reject);
		});
	};

	var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	FileSystem.prototype.__getBrowserFileSystem__ = function(type, fs_size) {
		return new Promise(function(resolve, reject) {
			requestFileSystem(type, fs_size, resolve, reject);
		});
	};

	File.prototype.__read__ = function(cache, func) {
		var self = this;
		return new Promise(function(resolve, reject) {
			if (typeof self[cache] !== 'undefined') {
				return resolve(self[cache]);
			}

			var reader = new FileReader();

			reader.onload = function(data) {
				self[cache] = data;
				resolve(data);
			};
			reader.onerror = reject;

			func.call(self, reader);
		}).then(function(event) {
			return event.target.result;
		});
	};

	File.prototype.readAsDataURL = function() {
		return this.__read__('__dataURL__', function(reader) {
			reader.readAsDataURL(this);
		});
	};


	File.prototype.readAsArrayBuffer = function() {
		return this.__read__('__buffer__', function(reader) {
			reader.readAsArrayBuffer(this);
		});
	};


	File.prototype.readAsText = function(label) {
		return this.__read__('__text__', function(reader) {
			reader.readAsText(this, label);
		});
	};


	return FileSystem;
})(window.navigator, window.Promise);