

	// Inject scouts.js into page
	var s = document.createElement('script');
	
	s.src = chrome.extension.getURL('scouts.js');
	
	s.onload = function() {
	    this.parentNode.removeChild(this);
	};
	
	(document.head||document.documentElement).appendChild(s);


	// Inject scouts.css into page 
	var c = document.createElement('link');
	
	c.rel = 'stylesheet';
	c.type = 'text/css';
	c.href = chrome.extension.getURL('scouts.css');

	(document.head||document.documentElement).appendChild(c);

///////////////////////////////////////////////////////////////////////////////

(function(exports){
  /**
   * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
   *
   * This function was born in http://stackoverflow.com/a/6832721.
   *
   * @param {string} v1 The first version to be compared.
   * @param {string} v2 The second version to be compared.
   * @param {object} [options] Optional flags that affect comparison behavior:
   * <ul>
   *     <li>
   *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
   *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
   *         "1.2".
   *     </li>
   *     <li>
   *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
   *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
   *     </li>
   * </ul>
   * @returns {number|NaN}
   * <ul>
   *    <li>0 if the versions are equal</li>
   *    <li>a negative integer iff v1 < v2</li>
   *    <li>a positive integer iff v1 > v2</li>
   *    <li>NaN if either version string is in the wrong format</li>
   * </ul>
   *
   * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
   * @license This function is in the public domain. Do what you want with it, no strings attached.
   */
  function compare(v1, v2, options) {
      var lexicographical = options && options.lexicographical,
          zeroExtend = options && options.zeroExtend,
          v1parts = v1.split('.'),
          v2parts = v2.split('.');

      function isValidPart(x) {
          return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
      }

      if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
          return NaN;
      }

      if (zeroExtend) {
          while (v1parts.length < v2parts.length) v1parts.push("0");
          while (v2parts.length < v1parts.length) v2parts.push("0");
      }

      if (!lexicographical) {
          v1parts = v1parts.map(Number);
          v2parts = v2parts.map(Number);
      }

      for (var i = 0; i < v1parts.length; ++i) {
          if (v2parts.length == i) {
              return 1;
          }

          if (v1parts[i] == v2parts[i]) {
              continue;
          }
          else if (v1parts[i] > v2parts[i]) {
              return 1;
          }
          else {
              return -1;
          }
      }

      if (v1parts.length != v2parts.length) {
          return -1;
      }

      return 0;
  }

  function matches(v1, v2, options){
    return compare(v1, v2, options) === 0;
  }

  function gt(v1, v2, options){
    return compare(v1, v2, options) > 0;
  }
  function gte(v1, v2, options){
    return compare(v1, v2, options) >= 0;
  }
  function lt(v1, v2, options){
    return compare(v1, v2, options) < 0;
  }
  function lte(v1, v2, options){
    return compare(v1, v2, options) <= 0;
  }

  exports.compare = compare;
  exports.matches = matches;
  exports.gt = gt;
  exports.gte = gte;
  exports.lt = lt;
  exports.lte = lte;

})(typeof exports === 'undefined'? this.VersionCompare = {}: exports);

///////////////////////////////////////////////////////////////////////////////

	
function ScoutsLogEyeWire() {

	
	this.getJSON = function(url, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var obj = JSON.parse(xhr.responseText);
				
				setTimeout(function() {
				    document.dispatchEvent(new CustomEvent('SLEW_getJSON', {
				        detail: {"callback": callback, "response": obj}
				    }));
				}, 0);
			}
		}
		xhr.send();
	}
	
	this.postRequest = function(url, data, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var obj = JSON.parse(xhr.responseText);
				
				setTimeout(function() {
				    document.dispatchEvent(new CustomEvent('SLEW_postRequest', {
				        detail: {"callback": callback, "response": obj}
				    }));
				}, 0);
			}
		}
		xhr.send(data);
	}
	
	
	this.getResource = function(url) {
		return chrome.extension.getURL(url);
	}

	this.getVersion = function() {
		var manifest = chrome.runtime.getManifest();

		return manifest.version;
	}
	
	
	this.register = function() {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "http://scoutslog.org/1.1/internal/status", true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				// Get response
				var res = JSON.parse(xhr.responseText);
				
				// Check response
				if (res.error == 'invalid authentication-token') {
					// Invalid user session, init auth sequence
					
					setTimeout(function() {
					    document.dispatchEvent(new CustomEvent('SLEW_AUTH'));
					}, 0);
				} else if (res.status == 'ok') {
					// User session is OK

					// Check plugin version
					var version = SLEW.getVersion();

					if (VersionCompare.lt(version, res.version) == true) {
						// Plugin out of date

						setTimeout(function() {
						    document.dispatchEvent(new CustomEvent('SLEW_UPDATE'));
						}, 0);
					} else {
						// Trigger init event

						setTimeout(function() {
						    document.dispatchEvent(new CustomEvent('SLEW_INIT'));
						}, 0);
					}
				}
			}
		}
		xhr.send();
	}
	
	
	
	// Event to listen for register requests
	document.addEventListener('SLEW_REGISTER', function(e) {
		// Perform request
		SLEW.register();
	});
	
	// Event to listen for getJSON requests
	document.addEventListener('SLEW_requestGetJSON', function(e) {
	    // Extract data
		var url = e.detail.url;			// URL to request
		var cb = e.detail.callback;		// Callback function
		
		// Perform request
		SLEW.getJSON(url, cb);
	});
	
	// Event to listen for postRequest requests
	document.addEventListener('SLEW_requestPostRequest', function(e) {
	    // Extract data
		var url = e.detail.url;			// URL to request
		var d = e.detail.data;			// Data to send
		var cb = e.detail.callback;		// Callback function
		
		// Perform request
		SLEW.postRequest(url, d, cb);
	});
	
	// Event to listen for getResource requests
	document.addEventListener('SLEW_requestGetResource', function(e) {
		// Extract data
		var n = e.detail.name;			// Resource name
		var url = e.detail.url;			// URL for resource
		var cb = e.detail.callback;		// Callback function
		
		// Perform request
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_getResource', {
		        detail: {
		        	"callback": cb,
		        	"response": {
		        		"name": n,
		        		"data": SLEW.getResource(url)
		        	}
		        }
		    }));
		}, 0);
	});

	// Event to listen for setPanelPosition requests
	document.addEventListener('SLEW_requestSetPanelPosition', function(e) {
		// Extract data
		var pos = e.detail.position;
		
		// Update position setting
		chrome.storage.local.set({'position': pos});
	});

	// Event to listen for getpanelPosition requests
	document.addEventListener('SLEW_requestGetPanelPosition', function(e) {
		// Extract data
		var cb = e.detail.callback;		// Callback function
		
		// Get position setting
		chrome.storage.local.get('position', function(d) {
			setTimeout(function() {
				document.dispatchEvent(new CustomEvent('SLEW_getPanelPosition', {
					detail: {"callback": cb, "position": d.position}
				}));
			}, 0);
		});
	});

	
}

///////////////////////////////////////////////////////////////////////////////

var SLEW = new ScoutsLogEyeWire();

