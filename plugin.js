
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

	this.getJSON = function(msg, callback) {
		// Get parameters
		var url = msg.url;
		
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var obj = JSON.parse(this.responseText);
				
				SLEW.sendMessage(callback, obj);
			}
		}

		xhr.send();
	}
	
	this.postRequest = function(msg, callback) {
		// Get parameters
		var url = msg.url;
		var data = msg.data;
	
		// Send POST request
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var obj = JSON.parse(this.responseText);
				
				SLEW.sendMessage(callback, obj);
			}
		}

		xhr.send(data);
	}

	this.getPosition = function(data, callback) {
		chrome.storage.local.get('position', function(d) {
			SLEW.sendMessage(callback, { position: d.position });
		});
	}

	this.setPosition = function(msg) {
		var pos = msg.position;
		pos.vertical = msg.vertical;
		
		// Update position setting
		chrome.storage.local.set({'position': pos});
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
					
					SLEW.sendMessage("slew_auth", {});
				} else if (res.status == 'ok') {
					// User session is OK

					// Check plugin version
					var version = chrome.runtime.getManifest().version;

					if (VersionCompare.lt(version, res.version) == true) {
						// Plugin out of date

						SLEW.sendMessage("slew_update", { url: res.plugin });
					} else {
						// Trigger init event

						SLEW.sendMessage("slew_init", { baseDataURL: chrome.extension.getURL("") });
					}
				}
			}
		}

		xhr.send();
	}
	
	/**
	 * Send Routed Message
	 * 
	 * This function routes a message from the main content
	 * script to the main page script.
	 */
	this.sendMessage = function(dst, data) {
		var d = {detail: { destination: dst, data: data } };
		var ev = new CustomEvent('RoutedMessageCS', d);
		
		document.dispatchEvent(ev);
	}
	
	/**
	 * Listener: Routed Message Handler
	 * 
	 * This function routes messages from the main page script
	 * to this content script.
	 */
	document.addEventListener('RoutedMessagePS', function(e) {
		// Extract message parameters
		var dst = e.detail.destination;
		var data = e.detail.data;
		var cb = e.detail.callback;
	
		if (SLEW[dst]) {
			SLEW[dst](data, cb);
		}
	});

}

var SLEW = new ScoutsLogEyeWire();

///////////////////////////////////////////////////////////////////////////////


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

