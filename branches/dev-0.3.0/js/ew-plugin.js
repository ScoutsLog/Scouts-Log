
function ScoutsLogPlatform() {
    var P = new Object();

    var slUser = "";
    var slLanguage = "en";
    var slLocalizedStrings = {};
    var slUserPrefs = {};





    /**
     * Receive Routed Message
     *
     * this function receives a routed message from the main
     * content script and calls the appropriate function at
     * the plugin level.
     */
    P.receiveMessage = function(e) {
        // Extract message parameters
        var dst = e.detail.destination;
        var data = e.detail.data;
        var cb = e.detail.callback;

        if (dst != "") {
            if (typeof P[dst] == "function" && dst != "receiveMessage") {
                P[dst](data, cb);
            } else {
                // Error: Unknown callback
                console.log("Unknown callback function: " + dst.toString() );
            }
        }
    }

    document.addEventListener('RoutedMessagePS', P.receiveMessage);


    /**
     * Send Routed Message
     * 
     * This function routes a message from the main content
     * script to the main page script.
     */
    P.sendMessage = function(dst, data) {
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
    P.getJSON = function(msg, callback) {
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
    P.getRequest = function(msg, callback) {
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
    P.postRequest = function(msg, callback) {
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


    P.getContent = function(msg, callback) {
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

                    if (slLocalizedStrings[k]) {
                        var t = slLocalizedStrings[k];
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
    P.getLocalizationStrings = function(callback) {
        // Load default locale
        var dlc = chrome.runtime.getManifest().default_locale;
        var url = chrome.extension.getURL("_locales/" + dlc + "/messages.json");
        
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var obj = JSON.parse(this.responseText);
                
                for (var k in obj) {
                    slLocalizedStrings[k] = obj[k].message;
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
    P.getLocalizationStrings2 = function(callback) {
        // Get current locale
        var url = "";

        switch (slLanguage) {
            case "ko":
                url = chrome.extension.getURL("_locales/" + slLanguage + "/messages.json");

                break;
        }

        if (url != "") {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var obj = JSON.parse(this.responseText);
                
                    for (var k in obj) {
                        slLocalizedStrings[k] = obj[k].message;
                    }
                    
                    P.sendMessage(callback, slLocalizedStrings);
                }
            }

            xhr.send();
        } else {
            P.sendMessage(callback, slLocalizedStrings);
        }
    }





    P.getLocalizedStrings = function(data, callback) {
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

                    slUser = res.username;
                }
                
                switch (lang) {
                    case "ko":
                        slLanguage = lang;
                        
                        break;
                    default:
                        slLanguage = "en";
                }
                
                P.getLocalizationStrings(callback);
            }
        }
        
        xhr.send();
    }

    

    P.getPosition = function(data, callback) {
        chrome.storage.local.get('position', function(d) {
            P.sendMessage(callback, { position: d.position });
        });
    }

    P.setPosition = function(msg) {
        var pos = msg.position;
        pos.vertical = msg.vertical;
        
        // Update position setting
        chrome.storage.local.set({'position': pos});
    }

    P.getUserPrefs = function(data, callback) {
        chrome.storage.local.get('prefs', function(d) {
            P.sendMessage(callback, d.prefs);
        });
    }

    P.setUserPrefs = function(msg) {
        // Update prefs setting
        chrome.storage.local.set({'prefs': msg});
    }
    
    P.register = function() {
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
                                locale: slLanguage,
                                user: slUser,
                                userPrefs: slUserPrefs,
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
                    slUserPrefs = d.prefs;
                } else {
                    slUserPrefs = {confirmjump: true};

                    chrome.storage.local.set({'prefs': slUserPrefs});
                }
            } else {
                slUserPrefs = {confirmjump: true};

                chrome.storage.local.set({'prefs': slUserPrefs});
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

