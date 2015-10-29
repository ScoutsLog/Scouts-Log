

	var authToken = "";
	var omniSession = "";
	
	// Process current cookies
	chrome.cookies.getAll(
		{"domain": "eyewire.org"},
		function (cookies) {
			for (var i in cookies) {
				var c = cookies[i];
				
				switch (c.name) {
				case "authentication-token":
					authToken = c.value;
					
					break;
				case "omni_session":
					omniSession = c.value;
					
					break;
			}
			}
		}
	);
	
	// Create listner for messages
	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			var response = {};
			
			switch (request.action) {
				case "auth-info":
					response = {
						"auth": authToken,
						"omni": omniSession
					};
					
					break;
			}
			
			sendResponse(response);
		}
	);
	
	// Create listener to get auth cookies
	chrome.cookies.onChanged.addListener(function(C) {
		var changed = false;
		
		if (C.onChangedCause == "explicit") {
			if (C.Cookie.domain == "eyewire.org") {
				switch (C.Cookie.name) {
					case "authentication-token":
						if (authToken != c.Cookie.value) {
							authToken = c.Cookie.value;
							
							changed = true;
						}
						
						break;
					case "omni_session":
						if (omniSession != c.Cookie.value) {
							omniSession = c.Cookie.value;
							
							changed = true;
						}
						
						break;
				}
			}
		}
		
		if (changed == true) {
			// Send message to content script to
			// update session details
			
			chrome.tabs.query(
				{
					"status": "complete",
					"url": "http://eyewire.org/*"
				},
				function(arrTabs) {
					for (var i in arrTabs) {
						var t = arrTabs[i];
						
						chrome.tabs.sendMessage(t.id, {"action": "auth-update", "auth": authToken, "omni": omniSession});
					}
				}
			);
		}
		
	});
	


