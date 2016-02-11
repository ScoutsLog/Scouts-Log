var SLEW = new ThePlatform();

(function(S) {

    S.getLocalizedStrings = function(data, callback) {
        var P = S;

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

    

    S.getPosition = function(data, callback) {
        chrome.storage.local.get('position', function(d) {
            S.sendMessage(callback, { position: d.position });
        });
    }

    S.setPosition = function(msg) {
        var pos = msg.position;
        pos.vertical = msg.vertical;
        
        // Update position setting
        chrome.storage.local.set({'position': pos});
    }
    
    S.register = function() {
        var P = S;

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
                                user: P.user
                            }
                        );
                    }
                }
            }
        }

        xhr.send();
    }
    

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


    // Inject platform-cotnent.js into page
        var s2 = document.createElement('script');
    
        s2.src = chrome.extension.getURL('js/platform-content.js');
    
        s2.onload = function() {
            this.parentNode.removeChild(this);
        };
    
        (document.head||document.documentElement).appendChild(s2);


    // Inject ew-scouts.js into page
        var s3 = document.createElement('script');
    
        s3.src = chrome.extension.getURL('js/ew-scouts.js');
    
        s3.onload = function() {
            this.parentNode.removeChild(this);
        };
    
        (document.head||document.documentElement).appendChild(s3);

})(SLEW);