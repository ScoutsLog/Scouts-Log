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

	
function ScoutsLogEyeWire() {
	this.authToken = "";
	this.omniSession = "";
	
	
	this.getJSON = function(url, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.setRequestHeader('Auth-Token', this.authToken);
		xhr.setRequestHeader('Omni-Session', this.omniSession);
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
		xhr.setRequestHeader('Auth-Token', this.authToken);
		xhr.setRequestHeader('Omni-Session', this.omniSession);
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
	
	this.register = function() {
		// Send message to extension
		chrome.runtime.sendMessage(
			{"action": "auth-info"},
			function(response) {
				SLEW.authToken = response.auth;
				SLEW.omniSession = response.omni;
			}
		);
		
	};
	
	
	
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
	
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			switch (request.action) {
				case "auth-update":
					SLEW.authToken = request.auth;
					SLEW.omniSession = request.omni;
					
					break;
			}
		}
	);
	
}

///////////////////////////////////////////////////////////////////////////////

var SLEW = new ScoutsLogEyeWire();

SLEW.register();


