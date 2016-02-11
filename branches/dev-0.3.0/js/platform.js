
/**
 * ThePlatform Object Constructor
 *
 * This function initializes the object and sets the message 
 * listener function.
 */
function ThePlatform() {
    var P = this;

    document.addEventListener('RoutedMessagePS', function(e) {
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
    });
}

    ThePlatform.prototype.user = "";
    ThePlatform.prototype.language = "en";
    ThePlatform.prototype.localizedStrings = {};


    /**
     * Send Routed Message
     * 
     * This function routes a message from the main content
     * script to the main page script.
     */
    ThePlatform.prototype.sendMessage = function(dst, data) {
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
    ThePlatform.prototype.getJSON = function(msg, callback) {
        // Get parameters
        var url = msg.url;

        var P = this;
        
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var obj = JSON.parse(this.responseText);
                
                P.sendMessage(callback, obj);
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
    ThePlatform.prototype.getRequest = function(msg, callback) {
        // Get parameters
        var url = msg.url;

        var P = this;
        
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                P.sendMessage(callback, this.responseText);
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
    ThePlatform.prototype.postRequest = function(msg, callback) {
        // Get parameters
        var url = msg.url;
        var data = msg.data;

        var P = this;
    
        // Send POST request
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var obj = JSON.parse(this.responseText);
                
                P.sendMessage(callback, obj);
            }
        }

        xhr.send(data);
    }


    ThePlatform.prototype.getContent = function(msg, callback) {
        // Get parameters
        var name = msg.name;
        var url = chrome.extension.getURL("content/" + name);

        // Load content file
        var P = this;

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
        }

        xhr.send();
    }


    /**
     * Load Localization Strings for Default Locale
     *
     * Retrieves and saves localization strings from the messages.json file
     * for the extension.  The default locale from the manifest is used.
     */
    ThePlatform.prototype.getLocalizationStrings = function(callback) {
        // Load default locale
        var dlc = chrome.runtime.getManifest().default_locale;
        var url = chrome.extension.getURL("_locales/" + dlc + "/messages.json");

        var P = this;
        
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
    ThePlatform.prototype.getLocalizationStrings2 = function(callback) {
        // Get current locale
        var url = "";

        switch (this.language) {
            case "ko":
                url = chrome.extension.getURL("_locales/" + this.language + "/messages.json");

                break;
        }

        var P = this;

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

