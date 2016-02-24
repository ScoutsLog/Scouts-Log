
function ScoutsLogPlatform() {
    var P = this;

    this.user = "";
    this.language = "en";
    this.localizedStrings = {};
    this.userPrefs = {};





    /**
     * Receive Routed Message
     *
     * this function receives a routed message from the main
     * content script and calls the appropriate function at
     * the plugin level.
     */
    this.receiveMessage = function(e) {
        // Extract message parameters
        var dst = e.detail.destination;
        var data = e.detail.data;
        var cb = e.detail.callback;

        if (dst != "") {
            if (typeof P[dst] == "function") {
                P[dst](data, cb);
            } else {
                // Error: Unknown callback
                console.log("Unknown callback function: " + dst.toString() );
            }
        }
    }

    document.addEventListener('RoutedMessagePS', this.receiveMessage);


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
     * Send JSON GET Request
     *
     * Sends a GET request and creates a JSON object from the
     * response.  The callback is then fired with the response
     * object.
     */
    this.getJSON = function(msg, callback) {
        // Get parameters
        var url = msg.url;
        
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var obj = JSON.parse(this.responseText);
                
                if (obj.error) {
                    P.sendMessage("platformError", {source: 'getJSON', url: url, status: obj.error});
                } else {
                    P.sendMessage(callback, obj);
                }
            }
            if (this.readyState == 4 && this.status != 200) {
                P.sendMessage("platformError", {source: 'getJSON', url: url, status: this.status});
            }
        }

        xhr.send();
    }


    /**
     * Send GET Request
     *
     * Sends a GET request and retrieves the response as text.
     * The callback is then fired with the response text.
     */
    this.getRequest = function(msg, callback) {
        // Get parameters
        var url = msg.url;
        
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                P.sendMessage(callback, this.responseText);
            }
            if (this.readyState == 4 && this.status != 200) {
                P.sendMessage("platformError", {source: 'getRequest', url: url, status: this.status});
            }
        }

        xhr.send();
    }

    
    /**
     * Send JSON POST Request
     *
     * Sends a POST request and creates a JSON object from the
     * response.  The callback is then fired with the response
     * object.
     */
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
                
                if (obj.error) {
                    P.sendMessage("platformError", {source: 'postJSON', url: url, status: obj.error});
                } else {
                    P.sendMessage(callback, obj);
                }
            }
            if (this.readyState == 4 && this.status != 200) {
                P.sendMessage("platformError", {source: 'postRequest', url: url, status: this.status});
            }
        }

        xhr.send(data);
    }


    this.getContent = function(msg, callback) {
        // Get parameters
        var name = msg.name;
        var url = chrome.extension.getURL("content/" + name);

        // Load content file
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // Get document text
                var txt = this.responseText;
                
                // Process localized string replacements
                var r = new RegExp("\{%LS_[a-zA-Z0-9]+\}", "gi");
                var rs = txt.match(r);

                for (var n in rs) {
                    var m = rs[n];
                    var k = m.substring(5, m.length - 1);

                    if (P.localizedStrings[k]) {
                        var t = P.localizedStrings[k];
                    } else {
                        var t= '__' + k + '__';
                    }

                    var rt = new RegExp(m, "gi");

                    txt = txt.replace(rt, t);
                }

		// Process image string replacements
                r = new RegExp("\{%IMG_[a-zA-Z0-9\-\.]+\}", "gi");
                rs = txt.match(r);

                for (var n in rs) {
                    var m = rs[n];
                    var k = m.substring(6, m.length - 1);
                    var t = chrome.extension.getURL("images/" + k);
                    var rt = new RegExp(m, "gi");

                    txt = txt.replace(rt, t);
                }

                // Send processed template back using callback
                P.sendMessage(callback, txt);
            }
            if (this.readyState == 4 && this.status != 200) {
                P.sendMessage("platformError", {source: 'getContent', url: url, status: this.status});
            }

        }

        xhr.send();
    }


    /**
     * Load Localization Strings for Default Locale
     *
     * Retrieves and saves localization strings from the messages.json file
     * for the extension.  The default locale from the manifest is used.
     */
    this.getLocalizationStrings = function(callback) {
        // Load default locale
        var dlc = chrome.runtime.getManifest().default_locale;
        var url = chrome.extension.getURL("_locales/" + dlc + "/messages.json");
        
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var obj = JSON.parse(this.responseText);
                
                for (var k in obj) {
                    P.localizedStrings[k] = obj[k].message;
                }

                P.getLocalizationStrings2(callback);
            }
        }

        xhr.send();
    }


    /**
     * Load Localization Strings for Specified Locale
     *
     * Retrieves and saves localization strings from the messages.json file
     * in the specified locale for the extension.  The callback is executed
     * with the combined strings of the default and specified locales.
     *
     * This should be called after calling getLocalizationStrings().
     */
    this.getLocalizationStrings2 = function(callback) {
        // Get current locale
        var url = "";

        switch (this.language) {
            case "ko":
                url = chrome.extension.getURL("_locales/" + this.language + "/messages.json");

                break;
        }

        if (url != "") {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var obj = JSON.parse(this.responseText);
                
                    for (var k in obj) {
                        P.localizedStrings[k] = obj[k].message;
                    }
                    
                    P.sendMessage(callback, P.localizedStrings);
                }
            }

            xhr.send();
        } else {
            P.sendMessage(callback, P.localizedStrings);
        }
    }





    this.getLocalizedStrings = function(data, callback) {
        // See if user is logged in and has a language preference
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://eyewire.org/1.0/player/describe", true);
        xhr.onreadystatechange = function() {            
            if (xhr.readyState == 4) {
                var lang = chrome.i18n.getUILanguage();

                if (xhr.status == 200) {
                    // Get response
                    var res = JSON.parse(xhr.responseText);
                
                    // Check for language preference
                    if (res.language && res.language != "") {
                        lang = res.language;
                    }

                    P.user = res.username;
                }
                
                switch (lang) {
                    case "ko":
                        P.language = lang;
                        
                        break;
                    default:
                        P.language = "en";
                }
                
                P.getLocalizationStrings(callback);
            }
        }
        
        xhr.send();
    }

    

    this.getPosition = function(data, callback) {
        chrome.storage.local.get('position', function(d) {
            P.sendMessage(callback, { position: d.position });
        });
    }

    this.setPosition = function(msg) {
        var pos = msg.position;
        pos.vertical = msg.vertical;
        
        // Update position setting
        chrome.storage.local.set({'position': pos});
    }

    this.getUserPrefs = function(data, callback) {
        chrome.storage.local.get('prefs', function(d) {
            P.sendMessage(callback, d.prefs);
        });
    }

    this.setUserPrefs = function(msg) {
        // Update prefs setting
        chrome.storage.local.set({'prefs': msg});
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
                    
                    P.sendMessage("slew_auth", {});
                } else if (res.status == 'ok') {
                    // User session is OK

                    // Check plugin version
                    var version = chrome.runtime.getManifest().version;

                    if (VersionCompare.lt(version, res.version) == true) {
                        // Plugin out of date

                        P.sendMessage("slew_update", { url: res.plugin });
                    } else {
                        // Trigger init event

                        P.sendMessage(
                            "slew_init",
                            {
                                baseDataURL: chrome.extension.getURL(""),
                                locale: P.language,
                                user: P.user,
                                userPrefs: P.userPrefs,
                                userRoles: res.roles
                            }
                        );
                    }
                }
            }
        }

        xhr.send();
    }


    // Load user preferences
        chrome.storage.local.get('prefs', function(d) {
            if (typeof d != "undefined") {
                if (typeof d.prefs != "undefined") {
                    P.userPrefs = d.prefs;
                } else {
                    P.userPrefs = {confirmjump: true};

                    chrome.storage.local.set({'prefs': P.userPrefs});
                }
            } else {
                P.userPrefs = {confirmjump: true};

                chrome.storage.local.set({'prefs': P.userPrefs});
            }
        });


    // Inject scouts.css into page 
        var c = document.createElement('link');
    
        c.rel = 'stylesheet';
        c.type = 'text/css';
        c.href = chrome.extension.getURL('css/scouts.css');

        (document.head||document.documentElement).appendChild(c);


    // Inject nice-number.js into page
        var s = document.createElement('script');
    
        s.src = chrome.extension.getURL('js/nice-number.js');
    
        s.onload = function() {
            this.parentNode.removeChild(this);
        };
    
        (document.head||document.documentElement).appendChild(s);


    // Inject ew-scouts.js into page
        var s3 = document.createElement('script');
    
        s3.src = chrome.extension.getURL('js/ew-scouts.js');
    
        s3.onload = function() {
            this.parentNode.removeChild(this);
        };
    
        (document.head||document.documentElement).appendChild(s3);


}

var SLEW = new ScoutsLogPlatform();

