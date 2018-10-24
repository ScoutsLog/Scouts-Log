function ScoutsLogPlatformContent() {
    var S = {};

    var slInitialized = false;

    var slLocale = "en";
    var slLocalizedStrings = {};
    var slVersion = "d85abad9-37e5-4ee7-bb23-f1e2244fcd0d";

    var slImages = {};

    var slUser = "";
    var slUserPrefs = {};
    var slUserRoles = [];
    
    var slWindowState = "";
    var slWindowSubmitting = false;

    var slWindowHistory = [];
    var slWindowHistoryPosition = -1;
    var slWindowHistoryNavigating = false;
    var slWindowHistoryLimit = 100;

    var slWindowHistoryTimestamp = Date.now();
    var slWindowHistoryStale = 60;

    var slPanelVertical = false;
    var slPanelPosition = {};

    var slStatsInterval = 20000;
    var slStatsTimer = 0;
    var slTaskInterval = 15000;


    var slHistoryType = "";
    var slHistoryCell = 0;
    var slHistoryAccuracy = 1;
    var slHistoryPosition = 0;
    var slHistoryDisplay = 4;

    var slScoutsLogURIbase = "https://scoutslog.objects-us-west-1.dream.io/app/";
    var slScoutsLogAPIbase = "https://scoutslog.org/1.1/";

    var slEyeWireURIbase = "https://eyewire.org/1.0/";




///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                       PLATFORM CONTENT FUNCTIONS                          //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
    


    S.getPreference = function(key) {
        var value;

        try {
            value = slUserPrefs[key];
        } catch (noprefs) {
            value = "";
        }

        if (typeof value == "undefined") {
            value = "";
        }

        return value;
    };

    S.setPreference = function(key, value) {
        slUserPrefs[key] = value;

        S.savePreferences();
    };

    S.savePreferences = function() {
        var data = JSON.stringify(slUserPrefs);

        S.setCookie("slprefs", data, 365);
    };

    S.getCookie = function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(";");
        var i;
        var c;

        for (i = 0; i < ca.length; i += 1) {
            c = ca[i];

            while (c.charAt(0) === " ") {
                c = c.substring(1);
            }

            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }

        return "";
    };

    S.setCookie = function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    };


    /**
     * Get Localized String Text
     *
     * This function retrieve the translated text for a given
     * localized key name.
     */
    S.getLocalizedString = function(key) {
        if (slLocalizedStrings[key]) {
            return slLocalizedStrings[key];
        } else {
            return "__" + key + "__";
        }
    };


    /**
     * Get Content Template
     *
     * This function retrieves the text of a content template file
     * and sends the text to the specified callback function.
     *
     * The returned text is already processed for localized strings.
     */
    S.getContent = function(name, callback) {
        var url = slScoutsLogURIbase + "content/" + name;

        jQuery.ajax({
            dataType: "html",
            url: url,
            success: function(txt) {
                // Process localized string replacements
                var r = new RegExp("\{%LS_[a-zA-Z0-9]+\}", "gi");
                var rs = txt.match(r);
                var n, m, k, t, rt;

                for (n in rs) {
                    m = rs[n];
                    k = m.substring(5, m.length - 1);

                    if (slLocalizedStrings[k]) {
                        t = slLocalizedStrings[k];
                    } else {
                        t= "__" + k + "__";
                    }

                    rt = new RegExp(m, "gi");

                    txt = txt.replace(rt, t);
                }

                // Process image string replacements
                r = new RegExp("\{%IMG_[a-zA-Z0-9\-\.]+\}", "gi");
                rs = txt.match(r);

                for (n in rs) {
                    m = rs[n];
                    k = m.substring(6, m.length - 1);
                    t = slScoutsLogURIbase + "images/" + k;
                    rt = new RegExp(m, "gi");

                    txt = txt.replace(rt, t);
                }

                // Execute callback with data
                callback(txt);
            },
            error: function(xh, st, er) {
                // Generate platform error data
                var d = {source: "getContent()", status: st, url: url};

                // Trigger platform error
                S.platformError(d);
            }
        });
    };


    /**
     * Send JSON GET Request
     *
     * Sends a GET request and creates a JSON object from the
     * response.  The callback is then fired with the response
     * object.
     */
    S.getJSON = function(url, callback, ignoreErrors) {       
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.withCredentials = true;
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var obj = JSON.parse(this.responseText);
                
                if (obj.error && !ignoreErrors) {
                    S.platformError({source: "getJSON()", url: url, status: obj.error});
                } else {
                    callback(obj);
                }
            }
            if (this.readyState == 4 && this.status != 200) {
                S.platformError({source: "getJSON()", url: url, status: this.status});
            }
        };

        xhr.send();
    };


    /**
     * Send GET Request
     *
     * Sends a GET request and retrieves the response as text.
     * The callback is then fired with the response text.
     */
    S.getResource = function(url, callback) {
        // Send GET request
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                callback(this.responseText);
            }
            if (this.readyState == 4 && this.status != 200) {
                S.platformError({source: "getResource()", url: url, status: this.status});
            }
        };

        xhr.send();
    };

    
    /**
     * Send JSON POST Request
     *
     * Sends a POST request and creates a JSON object from the
     * response.  The callback is then fired with the response
     * object.
     */
    S.postRequest = function(url, data, callback) {
        // Send POST request
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var obj = JSON.parse(this.responseText);
                
                if (obj.error) {
                    S.platformError({source: "postRequest()", url: url, status: obj.error});
                } else {
                    if (callback) {
                        callback(obj);
                    }
                }
            }
            if (this.readyState == 4 && this.status != 200) {
                S.platformError({source: "postRequest()", url: url, status: this.status});
            }
        };

        xhr.send(data);
    };


    S.fileRequest = function(url, data, files, callback) {
        // Create FormData object
        var frm = new FormData();

        if (data) {
            for (var k in data) {
                frm.append(k, data[k]);
            }
        }

        if (files) {
            for (var i in files) {
                var b = new Blob([files[i].data], {type: files[i].type});

                frm.append(files[i].name, b, files[i].filename);
            }
        }
    
        // Send POST request
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.withCredentials = true;
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var obj = JSON.parse(this.responseText);
                
                if (obj.error) {
                    S.platformError({source: "fileRequest()", url: url, status: obj.error});
                } else {
                    callback(obj);
                }
            }
            if (this.readyState == 4 && this.status != 200) {
                S.platformError({source: "fileRequest()", url: url, status: this.status});
            }
        };

        xhr.send(frm);
    };


    /**
     * Error Handler
     *
     * This function is executed when a platform request has failed.
     */
    S.platformError = function(data) {
        console.log("Platform Error: source: " + data.source + "; status: " + data.status + "; url: " + data.url + ";");

        var ev = new CustomEvent("PlatformContentError", {detail: data});

        document.dispatchEvent(ev);
    };




///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                     MAIN INITIALIZATION FUNCTIONS                         //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


    this.init = function() {
        if (slInitialized === false) {
            // Embed Scouts' Log stylesheet
            var st = document.createElement("link");
            st.setAttribute("rel", "stylesheet");
            st.setAttribute("type", "text/css");
            st.setAttribute("href", slScoutsLogURIbase + "css/scouts.min.css");
        
            (document.head).appendChild(st);

            // Embed nice-number script
            var sc = document.createElement("script");
            sc.setAttribute("src", slScoutsLogURIbase + "js/nice-number.js");
    
            (document.head).appendChild(sc);

            // Run user preferences initialization
            setTimeout(S.init_prefs, 0);
        } else {
            console.log("Scouts' Log application already initialized");
        }
    };

    S.init_prefs = function() {
        // Get cookie data
        var data = S.getCookie("slprefs");

        if (data !== "") {
            slUserPrefs = JSON.parse(data);
        } else {
            slUserPrefs = {};
        }

        // Run user initialization
        setTimeout(S.init_user, 0);
    };

    S.init_user = function() {
        var url = slEyeWireURIbase + "player/describe";

        S.getJSON(url, function(data) {
            // Save username
            slUser = data.username;

            // Check for language preference
            var lang;

            if (data.language && data.language !== "") {
                lang = data.language;
            }

            switch (lang) {
                case "ko":
                    slLocale = lang;
                        
                    break;
                default:
                    slLocale = "en";
            }

            // Load default messages
            S.init_locale("en");
        }, true);
    };


    /**
     * Initialize Localization Strings
     *
     * This function loads locale data for the currently
     * specified language/locale.
     */
    S.init_locale = function(lang) {
        var url = slScoutsLogURIbase + "_locales/" + lang + "/messages.json";

        S.getResource(url, function(data) {
            data = JSON.parse(data);

            // Save localization messages
            for (var k in data) {
                slLocalizedStrings[k] = data[k].message;
            }

            // Continue initialization
            if (lang == "en" && slLocale !== "en") {
                // Load additional messages for user locale

                S.init_locale(slLocale);
            } else {
                // Run check user status

                setTimeout(S.init_status, 0);
            }
        }, true);
    };


    S.init_status = function() {
        slInitialized = true;

        var url = slScoutsLogAPIbase + "internal/status";

        S.getJSON(url, function(data) {
            if (data.error == "invalid authentication-token") {
                // Invalid user session, user must authorize first

                S.init_auth();
            } else if (data.status == "ok") {
                // User session okay, continue initialization

                if (data.version !== slVersion) {
                    S.init_update();
                } else {
                    // Get status data
                    slUserRoles = data.roles;

                    // Perform UI initialization
                    setTimeout(S.init_ui, 0);
                }
            }
        }, true);
    };


    /**
     * Display Authorization Message
     * 
     * This function is triggered in response to 'register'
     * when the user is not authorized for the application.
     */
    S.init_auth = function() {
        S.getContent("auth.htm", S.init_auth_content);
    };

    S.init_auth_content = function(data) {
        jQuery("#content .gameBoard").append(data);
    };


    /**
     * Display Need Update Message
     *
     * This function is triggered when the loaded script
     * signature does not match the signature indicated
     * from the server.
     *
     * Generally this arises from browser caching
     */
    S.init_update = function() {
        S.getContent("update.htm", S.init_update_content);
    };

    S.init_update_content = function(data) {
        jQuery("#content .gameBoard").append(data);

        jQuery("#scoutsLogAuthPanel .sl-close").click(function() {
            jQuery("#scoutsLogAuthPanel").fadeOut();
        });
    };


    /**
     * Shutdown Scouts' Log Application
     * 
     * This method is used to turn off the application
     */
    this.shutdown = function() {
        // Stop stats refresh
        clearInterval(slStatsTimer);

        // Remove CSS and JS elements
        jQuery("html head link").each(function() {
            try {
                var h = jQuery(this).attr("href");

                if (h.indexOf("scoutslog.org") > -1) {
                    jQuery(this).remove();
                }
            } catch (nohref) { }
        });

        jQuery("html head script").each(function() {
            try {
                var h = jQuery(this).attr("src");

                if (h.indexOf("scoutslog.org") > -1) {
                    jQuery(this).remove();
                }
            } catch (nosrc) { }
        });

        // Remove event listeners
        window.removeEventListener(InspectorPanel.Events.ModelFetched, S.modelFetchedHandler);
        window.removeEventListener("resize", S.windowResizeHandler);
        window.removeEventListener("keyup", S.windowKeyupHandler);
        document.removeEventListener("cube-submission-data", S.cubeSubmissionHandler);

        // Remove HTML elements
        jQuery("#scoutsLogFloatingControls").remove();
        jQuery("#slPanel").remove();
        jQuery("#slPanelShadow").remove();
        jQuery("#scoutsLogButton").remove();
        jQuery("#settingsMenu .sl-setting-group").remove();

        // Clear Scouts' Log object
        setTimeout(function() { window.scoutsLog = null; }, 10);
    };



///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                  USER INTERFACE GENERATION FUNCTIONS                      //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////



    /**
     * Initialialize User Interface (UI)
     * 
     * This function loads resouces from the extension,
     * adds necessary HTML elements, and hooks into the
     * various parts of the EyeWire web application.
     */
    S.init_ui = function() {
        // Hook game control modes
        jQuery(window).on(InspectorPanel.Events.ModelFetched, S.modelFetchedHandler);
        
        // Hook window resize event for main window 
        jQuery(window).resize(S.windowResizeHandler);
        
        // Hook document keypress
        jQuery(window).keyup(S.windowKeyupHandler);

        // Hook cube submission data event
        jQuery(document).on("cube-submission-data", S.cubeSubmissionHandler);

        // Hook cell change event
        jQuery(window).on("cell-info-ready", S.cellInfoHandler);

        // Load resources
        S.loadImages();

        // Load UI
        S.setMainPanel();
        S.setFloatingPanel();
        S.setGameTools();
        S.setSettingsPanel();
    };

    S.modelFetchedHandler = function(d) {
        var ea = jQuery("#gameControls #editActions").length;
        var ci = jQuery("#gameControls #cubeInspector").length;
        var ra = jQuery("#gameControls #realActions").length;
        var rv = jQuery("#gameControls #reviewModeToggle").length;
        var td = false;
        var ins = false;
        var rev = false;
        
        var tsk = window.tomni.getTarget();
        
        if (tsk) {
            var t = false;

            // Pass 1: attempt to get data from current target object
            if (Array.isArray(tsk)) {
                try {
                    t = tsk[0].id;
                } catch (notask) { }
            } else {
                try {
                    t = tsk.id;
                } catch (notask2) { }
            }
        	
            if (t) {
            	ins = window.tomni.task.inspect || false;
            	rev = window.tomni.task.review || false;
            }
        }
            
        if (ea > 0 || ci > 0 || rv > 0 || ins || rev) {
            jQuery("#sl-task-details").fadeIn();
            jQuery("#sl-task-entry").fadeIn();

            td = true;
        } else if (ra > 0) {
            jQuery("#sl-task-details").fadeIn();
            jQuery("#sl-task-entry").fadeOut();

            td = true;
        }

        if (td === true) {
            S.getCubeDetailsSummary();
        }
    };

    S.windowResizeHandler = function() {                    
        if (jQuery("#slPanel").is(":visible")) {
            var h = jQuery("#slPanel").height() - 71;

            jQuery("#slPanel div.slPanelContent").height(h);
        }

        var t = parseInt(jQuery("#scoutsLogFloatingControls").css("top"), 10);
        var l = parseInt(jQuery("#scoutsLogFloatingControls").css("left"), 10);

        if (t > (jQuery(".gameBoard").height() - jQuery("#scoutsLogFloatingControls").height())) {
            t = jQuery(".gameBoard").height() - jQuery("#scoutsLogFloatingControls").height();
        }

        if (l > (jQuery(".gameBoard").width() - jQuery("#scoutsLogFloatingControls").width())) {
            l = jQuery(".gameBoard").width() - jQuery("#scoutsLogFloatingControls").width();
        }

        if (t < -58) {
            t = -58;
        }

        if (l < 0) {
            l = 0;
        }

        slPanelPosition = {top: t, left: l};

        jQuery("#scoutsLogFloatingControls").css("top", t).css("left", l);

        S.setPreference("position", slPanelPosition);
    };

    S.windowKeyupHandler = function(k) {
        if (k.keyCode === Keycodes.codes.esc) {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").fadeOut();
                jQuery("#slPanelShadow").fadeOut();
            }
                
            if (jQuery("#sl-task-details").is(":visible")) {
                jQuery("#sl-task-details").fadeOut();
                jQuery("#sl-task-entry").fadeOut();
                jQuery("#sl-cube-badge").fadeOut();
            }
                
            S.flagEditActions = false;
            S.flagRealActions = false;
        } else if (k.keyCode === Keycodes.codes.l && (k.metaKey || k.altKey)) {
            // Toggle scouts' log panel display

            if (slWindowState !== "") {
                if (jQuery("#slPanel").is(":visible")) {
                    jQuery("#slPanel").fadeOut();
                    jQuery("#slPanelShadow").fadeOut();
                    jQuery("#scoutsLogFloatingControls").fadeOut();
                } else {
                    if (slWindowState == "history" && slHistoryPosition == slHistoryDisplay) {
                        slWindowState = "";

                        S.getHistory();
                    }

                    // Display window
                    jQuery("#slPanel").fadeIn();
                    jQuery("#slPanelShadow").fadeIn();
                    jQuery("#scoutsLogFloatingControls").fadeIn();

                    // Check if window is stale
                    if (S.isStaleWindow() === true) {
                        S.navigateWindowHistory(slWindowHistoryPosition);
                    }
                }
            } else {
                if (jQuery("#scoutsLogFloatingControls").is(":visible")) {
                    jQuery("#scoutsLogFloatingControls").fadeOut();
                } else {
                    jQuery("#scoutsLogFloatingControls").fadeIn();
                }
            }
        }
    };

    S.cubeSubmissionHandler = function(e, data) {
        // Get current cube/task
        var target = S.getTargetCube();

        // Update data object
        if (typeof target.task !== "undefined" && typeof target.cell !== "undefined") {
            data.cell = target.cell;
            data.task = target.task;

            var dt = new Date();
            data.timestamp = dt.toLocaleString();

            // Send submission data to server
            S.postRequest(
                slScoutsLogAPIbase + "task/" + encodeURIComponent(target.task) + "/submit",
                "data=" + encodeURIComponent(JSON.stringify(data))
            );
        }
    };

    S.cellInfoHandler = function() {
        // Get current cell
        var c = window.tomni.getCurrentCell();

        // Update cell actions
        S.setMysticActions(c.info.id);
    };


    /**
     * Load Image Resources
     *
     * This function creates an array of extension URLs
     * for common images.
     */
    S.loadImages = function() {
        slImages = {
            close: slScoutsLogURIbase + "images/close.png",
            delete: slScoutsLogURIbase + "images/delete.png",
            error: slScoutsLogURIbase + "images/error.png",
            exclamation: slScoutsLogURIbase + "images/exclamation.png",
            history: slScoutsLogURIbase + "images/history.png",
            historyDisabled: slScoutsLogURIbase + "images/history-disabled.png",
            lock: slScoutsLogURIbase + "images/lock.png",
            logo: slScoutsLogURIbase + "images/icon48.png",
            logoSmall: slScoutsLogURIbase + "images/icon32.png",
            magnifier: slScoutsLogURIbase + "images/magnifier.png",
            next: slScoutsLogURIbase + "images/next.png",
            nextDisabled: slScoutsLogURIbase + "images/next-disabled.png",
            pencil: slScoutsLogURIbase + "images/pencil.png",
            photo: slScoutsLogURIbase + "images/photo.png",
            previous: slScoutsLogURIbase + "images/previous.png",
            previousDisabled: slScoutsLogURIbase + "images/previous-disabled.png",
            refresh: slScoutsLogURIbase + "images/arrow_refresh.png",
            star: slScoutsLogURIbase + "images/bullet_star.png",
            tick: slScoutsLogURIbase + "images/tick.png"
        };
    };


    /**
     * UI: Create Main Window
     */
    S.setMainPanel = function() {
        S.getContent("panel-main.htm", S.setMainPanel_Content);
    };

    S.setMainPanel_Content = function(data) {
        // Add main panel shadow
        jQuery(".gameBoard").append('<div id="slPanelShadow" style="display:none;"></div>');

        // Add main panel to game board
        jQuery("body").append(data);

        // Set main panel to be draggable
        jQuery("#slPanel").draggable({
            containment: "window",
            handle: ".slPanelHeader",
            stop: function(e, ui) {
                if (ui.position.top < 0) {
                    ui.position.top = 0;

                    jQuery("#slPanel").css("top", ui.position.top);
                }
            }
        });

        // Set main panel to be resizable
        jQuery("#slPanel").resizable({
            stop: function(e, ui) {
                var h = jQuery("#slPanel").height() - 71;

                jQuery("#slPanel div.slPanelContent").height(h);
            },
            resize: function(e, ui) {
                var h = jQuery("#slPanel").height() - 71;

                jQuery("#slPanel div.slPanelContent").height(h);
            }
        });

        // Set initial height on panel content
        var h = jQuery("#slPanel").height() - 71;
        jQuery("#slPanel div.slPanelContent").height(h);

        // Set event handler for close button
        jQuery("#slPanel a.sl-close-window, #slPanelShadow").click(function() {
            if (slWindowState == "error") {
                slWindowState = "";
                jQuery("#slPanelError").fadeOut();
            } else {
                jQuery("#slPanel").fadeOut();
            }

            jQuery("#slPanelShadow").fadeOut();
        });

        // Set event handlers for window history buttons
        jQuery("#slPanel a.sl-window-previous").click(function() {
            // Check submission flag
            if (slWindowSubmitting === true) return;

            if (jQuery(this).hasClass("disabled") === false) {
                // Update window history position
                if (slWindowHistoryPosition > 0) {
                    var p = slWindowHistoryPosition;
                    p--;
                    slWindowHistoryPosition = p;

                    // Navigate to history point
                    S.navigateWindowHistory(p);
                }
            }
        });

        jQuery("#slPanel a.sl-window-next").click(function() {
            // Check submission flag
            if (slWindowSubmitting === true) return;

            if (jQuery(this).hasClass("disabled") === false) {
                // Update window history position
                if (slWindowHistoryPosition < slWindowHistory.length) {
                    var p = slWindowHistoryPosition;
                    p++;
                    slWindowHistoryPosition = p;

                    // Navigate to history point
                    S.navigateWindowHistory(p);
                }
            }
        });

        jQuery("#slPanel a.sl-window-history").click(function() {
            // Check submission flag
            if (slWindowSubmitting === true) return;

            if (jQuery(this).hasClass("disabled") === false) {
                if (slWindowState == "window-history") {
                    S.navigateWindowHistory(slWindowHistoryPosition);
                } else {
                    S.getWindowHistory();
                }
            }
        });
    };


    /**
     * UI: Create Floating Panel
     */
    S.setFloatingPanel = function() {
        var pos = S.getPreference("position"),
            vert = S.getPreference("vertical"),
            t, l;

        if (pos == "") {
            t = 0;
            l = jQuery(".gameBoard").width() / 4;
        } else {
            t = pos.top;
            l = Math.abs(pos.left);
        }

        if (t > (jQuery(".gameBoard").height() - jQuery("#scoutsLogFloatingControls").height())) {
            t = jQuery(".gameBoard").height() - jQuery("#scoutsLogFloatingControls").height();
        }

        if (l > (jQuery(".gameBoard").width() - jQuery("#scoutsLogFloatingControls").width())) {
            l = jQuery(".gameBoard").width() - jQuery("#scoutsLogFloatingControls").width();
        }

        if (t < 0) {
            t = 0;
        }

        if (l < 0) {
            l = 0;
        }

        slPanelPosition = {top: t, left: l};

        if (vert) {
            slPanelVertical = true;
        }

        if (slPanelVertical === true) {
            S.getContent("panel-floating-vertical.htm", S.setFloatingPanel_Content);
        } else {
            S.getContent("panel-floating-horizontal.htm", S.setFloatingPanel_Content);
        }
    };

    S.setFloatingPanel_Content = function(data) {
        // Generate CSS for panel position
        var style = ' style="top:' + slPanelPosition.top + 'px;left:' + slPanelPosition.left + 'px;"';
            
        if (slPanelVertical === true) {
            style += ' class="sl-vertical"';
        }

        // Perform content-specific string replacements
        data = data.replace(/\{style\}/gi, style);

        // Add panel to game board
        jQuery("body").append(data);

        // Set floating panel to be draggable
        jQuery("#scoutsLogFloatingControls").draggable({
            containment: "window",
            stop: function(e, ui) {
                jQuery("#scoutsLogFloatingControls").css("width", "");

                if (ui.position.top < 0) {
                    ui.position.top = 0;

                    jQuery("#scoutsLogFloatingControls").css("top", ui.position.top);
                }

                // Update position in settings
                slPanelPosition = ui.position;
                slPanelVertical = jQuery("#scoutsLogFloatingControls").hasClass("sl-vertical");

                S.setPreference("position", slPanelPosition);
                S.setPreference("vertical", slPanelVertical);
            }
        });

        // Check for mystic role / display
        if (slUserRoles.indexOf("mystic") == -1 && slUserRoles.indexOf("admin") == -1) {
            jQuery("#scoutsLogFloatingControls a.sl-mystic").remove();
        }

        // Event Handler:  Icon Double Click
        jQuery("#scoutsLogFloatingControls img").dblclick(function() {
            // Toggle floating panel display
            
            if (jQuery("#scoutsLogFloatingControls").hasClass("sl-vertical")) {
                jQuery("#scoutsLogFloatingControls").removeClass("sl-vertical");
        
                jQuery("#scoutsLogFloatingControls a.sl-cell-list").html( S.getLocalizedString("panelCellList") );

                if (slUserRoles.indexOf("mystic") > -1 || slUserRoles.indexOf("admin") > -1) {
                    jQuery("#scoutsLogFloatingControls a.sl-mystic").html( S.getLocalizedString("panelMystic") + ' <span id="sl-mystic-badge" class="sl-badge">0</span>');
                }

                jQuery("#scoutsLogFloatingControls a.sl-open").html( S.getLocalizedString("panelOpen") + ' <span id="sl-open-badge" class="sl-badge">0</span>');
                jQuery("#scoutsLogFloatingControls a.sl-need-admin").html( S.getLocalizedString("panelNeedAdmin") + ' <span id="sl-need-admin-badge" class="sl-badge">0</span>');
                jQuery("#scoutsLogFloatingControls a.sl-need-scythe").html( S.getLocalizedString("panelNeedScythe") + ' <span id="sl-need-scythe-badge" class="sl-badge">0</span>');
                jQuery("#scoutsLogFloatingControls a.sl-watch").html( S.getLocalizedString("panelWatch") + ' <span id="sl-watch-badge" class="sl-badge">0</span>');
                jQuery("#scoutsLogFloatingControls a.sl-history").html( S.getLocalizedString("panelHistory") );
                jQuery("#scoutsLogFloatingControls a.sl-promotions").html( S.getLocalizedString("panelPromotions") );
                jQuery("#scoutsLogFloatingControls #sl-task-details").html( S.getLocalizedString("panelTaskDetails") );
                jQuery("#scoutsLogFloatingControls #sl-task-entry").html( S.getLocalizedString("panelTaskEntry") );
            } else {
                jQuery("#scoutsLogFloatingControls").addClass("sl-vertical");

                jQuery("#scoutsLogFloatingControls a.sl-cell-list").html( S.getLocalizedString("panelCellListShort") );

                if (slUserRoles.indexOf("mystic") > -1 || slUserRoles.indexOf("admin") > -1) {
                    jQuery("#scoutsLogFloatingControls a.sl-mystic").html( S.getLocalizedString("panelMysticShort") + ' <span id="sl-mystic-badge" class="sl-badge">0</span>' );
                }

                jQuery("#scoutsLogFloatingControls a.sl-open").html( S.getLocalizedString("panelOpenShort") + ' <span id="sl-open-badge" class="sl-badge">0</span>');
                jQuery("#scoutsLogFloatingControls a.sl-need-admin").html( S.getLocalizedString("panelNeedAdminShort") + ' <span id="sl-need-admin-badge" class="sl-badge">0</span>');
                jQuery("#scoutsLogFloatingControls a.sl-need-scythe").html( S.getLocalizedString("panelNeedScytheShort") + ' <span id="sl-need-scythe-badge" class="sl-badge">0</span>');
                jQuery("#scoutsLogFloatingControls a.sl-watch").html( S.getLocalizedString("panelWatchShort") + ' <span id="sl-watch-badge" class="sl-badge">0</span>');
                jQuery("#scoutsLogFloatingControls a.sl-history").html( S.getLocalizedString("panelHistoryShort") );
                jQuery("#scoutsLogFloatingControls a.sl-promotions").html( S.getLocalizedString("panelPromotionsShort") );
                jQuery("#scoutsLogFloatingControls #sl-task-details").html( S.getLocalizedString("panelTaskDetailsShort") );
                jQuery("#scoutsLogFloatingControls #sl-task-entry").html( S.getLocalizedString("panelTaskEntryShort") );
            }

            // Update position in settings
            slPanelVertical = jQuery("#scoutsLogFloatingControls").hasClass("sl-vertical");

            S.setPreference("vertical", slPanelVertical);
            
            // Set timer to update panel stats
            S.doPanelStats();
        });
        
        // Add individual button event handlers
        jQuery("#scoutsLogFloatingControls a.sl-cell-list").click(S.showCells);
        jQuery("#scoutsLogFloatingControls a.sl-mystic").click(S.showMystic);
        jQuery("#scoutsLogFloatingControls a.sl-open").click(S.showOpen);
        jQuery("#scoutsLogFloatingControls a.sl-need-admin").click(S.showAdmin);
        jQuery("#scoutsLogFloatingControls a.sl-need-scythe").click(S.showScythe);
        jQuery("#scoutsLogFloatingControls a.sl-watch").click(S.showWatch);
        jQuery("#scoutsLogFloatingControls a.sl-history").click(S.showHistory);
        //jQuery("#scoutsLogFloatingControls a.sl-promotions").click(S.showPromotions);

        // Task details button event handler
        jQuery("#sl-task-details").click(function() {
            // Get current cube/task
            var target = S.getTargetCube();

            var test = "task-" + target.task;
            
            // Check window state
            if (slWindowState == test || slWindowState == "task") {
                // Same task window is open, close instead
                
                if (jQuery("#slPanel").is(":visible")) {
                    jQuery("#slPanel").fadeOut();
                    jQuery("#slPanelShadow").fadeOut();
                } else {
                    jQuery("#slPanel").fadeIn();
                    jQuery("#slPanelShadow").fadeIn();
                }
            } else {
                // Show log entries for currently selected cube
                S.getTaskEntriesInspect();
            }
        });
        
        // New task entry event handler
        jQuery("#sl-task-entry").click(function() {
            // Get current task
            var target = S.getTargetCube();
            
            // Prepare display window
            S.prepareTaskActionWindow(target.task);
        });

        // Set stats refresh function
        slStatsTimer = setInterval(function() {
            if (slWindowState !== "error") {
                S.doPanelStats();
            }
        }, slStatsInterval);
        
        S.doPanelStats();

        // Set initial button state
        S.doPanelButtonState();
    };


    /**
     * Update Floating Panel Buttons
     */
    S.doPanelButtonState = function() {
        // Get user preferences
        var cl = (S.getPreference("displayCellList") === false) ? false : true;
        var ot = (S.getPreference("displayOpenTasks") === false) ? false : true;
        var na = (S.getPreference("displayNeedAdmin") === false) ? false : true;
        var ns = (S.getPreference("displayNeedScythe") === false) ? false : true;
        var wt = (S.getPreference("displayWatch") === false) ? false : true;
        var hs = (S.getPreference("displayHistory") === false) ? false : true;

        // Update button states
        if (cl === true) {
            jQuery("#scoutsLogFloatingControls a.sl-cell-list").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-cell-list").addClass("hidden");
        }

        if (ot === true) {
            jQuery("#scoutsLogFloatingControls a.sl-open").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-open").addClass("hidden");
        }

        if (na === true) {
            jQuery("#scoutsLogFloatingControls a.sl-need-admin").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-need-admin").addClass("hidden");
        }

        if (ns === true) {
            jQuery("#scoutsLogFloatingControls a.sl-need-scythe").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-need-scythe").addClass("hidden");
        }

        if (wt === true) {
            jQuery("#scoutsLogFloatingControls a.sl-watch").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-watch").addClass("hidden");
        }

        if (hs === true) {
            jQuery("#scoutsLogFloatingControls a.sl-history").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-history").addClass("hidden");
        }

    };


    /**
     * Update Floating Panel Stats Values
     */
    S.doPanelStats = function() {
        // Prepare current data object
        var data = {
            cell: 0,
            task: 0,
            mode: (window.tomni.gameMode) ? 1 : 0 
        };

        // Get current cell
        var cell = window.tomni.getCurrentCell();

        if (typeof cell !== "undefined") {
            data.cell = cell.info.id;
        }

        // Get current cube/task
        var cube = S.getTargetCube();

        if (typeof cube.task !== "undefined" && typeof cube.cell !== "undefined") {
            data.task = cube.task;
        }

        // Prepare URL
        var url = slScoutsLogAPIbase + "stats";
        url += "?data=" + encodeURIComponent( JSON.stringify(data) );

        S.getJSON(
            url,
            S.doPanelStatsCallback
        );
    };
    
    /**
     * Callback: Update Floating Panel Stats Values
     */
    S.doPanelStatsCallback = function(D) {
        var a = D.task_summary["need-admin"].tasks;
        var s = D.task_summary["need-scythe"].tasks;
        s += D.task_summary["missing-nub"].tasks;
        s += D.task_summary["missing-branch"].tasks;
        s += D.task_summary.merger.tasks;
        s += D.task_summary["scythe-complete"].tasks;
        var w = D.task_summary.watch.tasks;
        var o = D.tasks;
        var c;

        if (a > 0) {
            c = parseInt(jQuery("#sl-need-admin-badge").text(), 10);

            if (c != a) {
                jQuery("#sl-need-admin-badge").fadeIn().text(a);
                jQuery("#sl-need-admin-badge").fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
            }
        } else {
            jQuery("#sl-need-admin-badge").fadeOut().text(0);
        }

        if (s > 0) {
            c = parseInt(jQuery("#sl-need-scythe-badge").text(), 10);

            if (c != s) {
                jQuery("#sl-need-scythe-badge").fadeIn().text(s);
                jQuery("#sl-need-scythe-badge").fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
            }
        } else {
            jQuery("#sl-need-scythe-badge").fadeOut().text(0);
        }

        if (w > 0) {
            c = parseInt(jQuery("#sl-watch-badge").text(), 10);

            if (c != w) {
                jQuery("#sl-watch-badge").fadeIn().text(w);
                jQuery("#sl-watch-badge").fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
            }
        } else {
            jQuery("#sl-watch-badge").fadeOut().text(0);
        }

        if (o > 0) {
            c = parseInt(jQuery("#sl-open-badge").text(), 10);

            if (c != o) {
                jQuery("#sl-open-badge").fadeIn().text(o);
                jQuery("#sl-open-badge").fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
            }
        } else {
            jQuery("#sl-open-badge").fadeOut().text(0);
        }

        if (slUserRoles.indexOf("mystic") > -1 || slUserRoles.indexOf("admin") > -1) {
            var m = D.mystic;

            if (m.header > 0) {
                c = parseInt(jQuery("#sl-mystic-badge").text(), 10);

                if (c != m.header) {
                    jQuery("#sl-mystic-badge").fadeIn().text(m.header);
                    jQuery("#sl-mystic-badge").fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
                }
            } else {
                jQuery("#sl-mystic-badge").fadeOut().text(0);
            }

            if (typeof m.cell !== "undefined") {
                // Get current cell
                var cell = window.tomni.getCurrentCell();

                if (typeof cell !== "undefined") {
                    if (m.cell.id == cell.info.id) {
                        S.setMysticActions(cell.info.id);
                    }
                }

                // See if cell is visible within the SL panel
                if (slWindowState == "mystic-entries-" + m.cell.id) {
                    S.getMysticCellEntries_Data(m.cell);
                }
            }
        }
    };


    /**
     * UI: Create Window Display Toggle Button
     */
    S.setGameTools = function() {
        var button = '<div title="' + S.getLocalizedString("actionShowWindowTooltip") + '" class="menuButton" id="scoutsLogButton"></div>';

        jQuery("#gameTools").prepend(button);

        jQuery("#scoutsLogButton").click(function() {
            if (slWindowState == "error") { return; }

            if (slWindowState !== "") {
                if (jQuery("#slPanel").is(":visible")) {
                    jQuery("#slPanel").fadeOut();
                    jQuery("#slPanelShadow").fadeOut();
                    jQuery("#scoutsLogFloatingControls").fadeOut();
                } else {
                    if (slWindowState == "history" && slHistoryPosition == slHistoryDisplay) {
                        slWindowState = "";

                        S.getHistory();
                    }

                    jQuery("#slPanel").fadeIn();
                    jQuery("#slPanelShadow").fadeIn();
                    jQuery("#scoutsLogFloatingControls").fadeIn();
                }
            } else {
                if (jQuery("#scoutsLogFloatingControls").is(":visible")) {
                    jQuery("#scoutsLogFloatingControls").fadeOut();
                } else {
                    jQuery("#scoutsLogFloatingControls").fadeIn();
                }
            }
        });
    };


    /**
     * Button: Display Cell List
     */
    S.showCells = function() {
        if (slWindowState !== "cell") {
            S.getCellList();
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").fadeOut();
                jQuery("#slPanelShadow").fadeOut();
            } else {
                // Display window
                jQuery("#slPanel").fadeIn();
                jQuery("#slPanelShadow").fadeIn();

                // Check if window is stale
                if (S.isStaleWindow() === true) {
                    S.navigateWindowHistory(slWindowHistoryPosition);
                }
            }
        }
    };


    /**
     * Button: Display Mystic Cells
     */
    S.showMystic = function() {
        if (slWindowState !== "mystic") {
            S.getMysticSummary("need-player-a");
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").fadeOut();
                jQuery("#slPanelShadow").fadeOut();
            } else {
                // Display window
                jQuery("#slPanel").fadeIn();
                jQuery("#slPanelShadow").fadeIn();

                // Check if window is stale
                if (S.isStaleWindow() === true) {
                    S.navigateWindowHistory(slWindowHistoryPosition);
                }
            }
        }
    };


    /**
     * Button: Display Open Tasks List
     */
    S.showOpen = function() {
        if (slWindowState !== "status-open") {
            S.getStatusSummary("open", false);
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").fadeOut();
                jQuery("#slPanelShadow").fadeOut();
            } else {
                // Display window
                jQuery("#slPanel").fadeIn();
                jQuery("#slPanelShadow").fadeIn();

                // Check if window is stale
                if (S.isStaleWindow() === true) {
                    S.navigateWindowHistory(slWindowHistoryPosition);
                }
            }
        }
    };
    

    /**
     * Button: Display 'Need Admin' Tasks
     */
    S.showAdmin = function() {
        if (slWindowState !== "status-need-admin-header") {
            S.getStatusSummary("need-admin", true);
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").fadeOut();
                jQuery("#slPanelShadow").fadeOut();
            } else {
                // Display window
                jQuery("#slPanel").fadeIn();
                jQuery("#slPanelShadow").fadeIn();

                // Check if window is stale
                if (S.isStaleWindow() === true) {
                    S.navigateWindowHistory(slWindowHistoryPosition);
                }
            }
        }
    };
    

    /**
     * Button: Display 'Need Scythe' Tasks
     */
    S.showScythe = function() {
        if (slWindowState !== "status-need-scythe-header") {
            S.getStatusSummary("need-scythe", true);
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").fadeOut();
                jQuery("#slPanelShadow").fadeOut();
            } else {
                // Display window
                jQuery("#slPanel").fadeIn();
                jQuery("#slPanelShadow").fadeIn();

                // Check if window is stale
                if (S.isStaleWindow() === true) {
                    S.navigateWindowHistory(slWindowHistoryPosition);
                }
            }
        }
    };
    

    /**
     * Button: Display 'Watch List' Tasks
     */
    S.showWatch = function() {
        if (slWindowState !== "status-watch-header") {
            S.getStatusSummary("watch", true);
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").fadeOut();
                jQuery("#slPanelShadow").fadeOut();
            } else {
                // Display window
                jQuery("#slPanel").fadeIn();
                jQuery("#slPanelShadow").fadeIn();

                // Check if window is stale
                if (S.isStaleWindow() === true) {
                    S.navigateWindowHistory(slWindowHistoryPosition);
                }
            }
        }
    };


    /**
     * Button: Display User Submission History
     */
    S.showHistory = function() {
        if (slWindowState !== "history") {
            S.getHistory();
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").fadeOut();
                jQuery("#slPanelShadow").fadeOut();
            } else {
                if (slHistoryPosition == slHistoryDisplay) {
                    slWindowState ="";

                    S.getHistory();

                    jQuery("#slPanel").fadeIn();
                    jQuery("#slPanelShadow").fadeIn();
                } else {
                    // Display window
                    jQuery("#slPanel").fadeIn();
                    jQuery("#slPanelShadow").fadeIn();

                    // Check if window is stale
                    if (S.isStaleWindow() === true) {
                        S.navigateWindowHistory(slWindowHistoryPosition);
                    }
                }
            }
        }
    };


    /**
     * Button: Display 'Promotions' Screen
     */
    S.showPromotions = function() {
        if (slWindowState !== "promotions") {
            S.getPromotions();
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").fadeOut();
                jQuery("#slPanelShadow").fadeOut();
            } else {
                // Display window
                jQuery("#slPanel").fadeIn();
                jQuery("#slPanelShadow").fadeIn();

                // Check if window is stale
                if (S.isStaleWindow() === true) {
                    S.navigateWindowHistory(slWindowHistoryPosition);
                }
            }
        }
    };


    /**
     * UI: Set Settings Panel Items
     *
     * This function loads settings for application within the EyeWire settings panel
     */
    S.setSettingsPanel = function() {
        // Send content request
        S.getContent("settings.htm", S.setSettingsPanel_Content);
    };

    S.setSettingsPanel_Content = function(data) {
        // Save content to settings panel
        jQuery("#settingsMenu").append(data);

        // Apply UI functionality
        jQuery("#settingsMenu .sl-setting-group [prefcheck]").checkbox().each(function() {
            var t = jQuery(this).find("[prefcheck]");
            var p = t.attr("prefcheck").split("_")[1];

            if (typeof slUserPrefs[p] !== "undefined") {
                t.prop("checked", slUserPrefs[p]);
                
                if (slUserPrefs[p] === true) {
                    jQuery(this).removeClass("off").addClass("on");
                } else {
                    jQuery(this).removeClass("on").addClass("off");
                }
            }
        });

        jQuery("#settingsMenu .sl-setting-group [prefcheck]").change(function(e) {
            e.stopPropagation();

            // Get preference element
            var t = jQuery(this);

            // Get preference name
            var p = t.attr("prefcheck").split("_")[1];

            // Set preference value
            S.setPreference(p, t.is(":checked"));

            // Update floating panel state
            S.doPanelButtonState();
        });

        jQuery("#settingsMenu .sl-setting-group .checkbox").click(function(e) {
            var t = jQuery(this).find("[prefcheck]");

            t.prop("checked", !t.is(":checked") );
            t.change();
        });

        jQuery("#settingsMenu .sl-setting-group [prefcheck]").closest("div.setting").click(function(e) {
            e.stopPropagation();

            var t = jQuery(this).find("[prefcheck]");

            t.prop("checked", !t.is(":checked") );
            t.change();
        });

    };


///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                    USER INTERFACE UTILITY FUNCTIONS                       //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


    /**
     * Utils: Disable Form and Link Elements
     */
    S.disableForm = function(frm) {
        jQuery(jQuery(frm).prop("elements")).each(function() {
            jQuery(this).prop("disabled", true);
        });
    };


    /**
     * Utils: Disable Form and Link Elements
     */
    S.enableForm = function(frm) {
        jQuery(jQuery(frm).prop("elements")).each(function() {
            jQuery(this).prop("disabled", false);
        });
    };


    /**
     * Utils: Set Links for Common Items
     */
    S.setLinks = function(o) {
        jQuery(o).find(".sl-jump-task").each(function() {
            var task = jQuery(this).attr("data-task");

            var p = jQuery(this);
            
            p.attr( "title", S.getLocalizedString("actionJumpTaskTooltip") );
            
            p.click(function() {
                var v = jQuery("#slPanel").is(":visible");

                if (v) {
                    jQuery("#slPanel").fadeOut();
                    jQuery("#slPanelShadow").fadeOut();
                }

                if (window.tomni.gameMode) {
                    var o = new Attention.Confirmation({
                        situation: "information calm",
                        title: _("Jump to Task #{0}?", task),
                        message: _("You will lose your progress on this cube."),
                        ok: {
                            label: _("Jump to Task"),
                            klass: "flat"
                        },
                        cancel: {
                            label: _("Stay Here"),
                            klass: "flat"
                        }
                    });
                    o.on("ok", function() {
                        window.tomni.jumpToTaskID(task);
                    }).on("cancel", function() {
                        if (v) {
                            jQuery("#slPanel").fadeIn();
                            jQuery("#slPanelShadow").fadeIn();
                        }
                    }).show();
                } else {
                    window.tomni.jumpToTaskID(task);
                }
            });
        });

        jQuery(o).find(".sl-jump-cell").each(function() {
            var cell = jQuery(this).attr("data-cell");

            var p = jQuery(this);

            p.attr( "title", S.getLocalizedString("actionJumpTaskTooltip") );
            
            p.click(function() {
                var v = jQuery("#slPanel").is(":visible");

                if (v) {
                    jQuery("#slPanel").fadeOut();
                    jQuery("#slPanelShadow").fadeOut();
                }

                if (window.tomni.gameMode) {
                    var o = new Attention.Confirmation({
                        situation: "information calm",
                        title: _("Jump to Cell #{0}?", cell),
                        message: _("You will lose your progress on this cube."),
                        ok: {
                            label: _("Change Cell"),
                            klass: "flat"
                        },
                        cancel: {
                            label: _("Stay Here"),
                            klass: "flat"
                        }
                    });
                    o.on("ok", function() {
                        window.tomni.leave();
                        SFX.play("change_cell");
                        window.tomni.setCell({id:cell});
                    }).on("cancel", function() {
                        if (v) {
                            jQuery("#slPanel").fadeIn();
                            jQuery("#slPanelShadow").fadeIn();
                        }
                    }).show();
                } else {
                    SFX.play("change_cell");
                    window.tomni.setCell({id:cell});
                }
            });

        });
        
        jQuery(o).find("a.sl-task").each(function() {
            var t = jQuery(this).attr("data-task");
            
            jQuery(this).attr( "title", S.getLocalizedString("actionTaskTooltip") );
            
            jQuery(this).click(function() {    
                S.getTaskEntries(t);
            });
        });
        
        jQuery(o).find("a.sl-cell").each(function() {
            var c = jQuery(this).attr("data-cell");
            
            jQuery(this).attr( "title", S.getLocalizedString("actionCellTooltip") );
            
            jQuery(this).click(function() {    
                S.getCellEntries(c, "");
            });
        });

        jQuery(o).find("a.sl-mystic-cell").each(function() {
            var c = jQuery(this).attr("data-cell");
            
            jQuery(this).attr( "title", S.getLocalizedString("actionMysticCellTooltip") );
            
            jQuery(this).click(function() {    
                S.getMysticCellEntries(c);
            });
        });

        jQuery(o).find("a.sl-history-cell").each(function() {
            var c = jQuery(this).attr("data-cell");
            
            jQuery(this).attr( "title", S.getLocalizedString("actionCellTooltip") );
            
            jQuery(this).click(function() {    
                slHistoryCell = c;
                slWindowState = "";

                S.getHistory();
            });
        });

        // Set user profile links
        jQuery(o).find(".sl-jump-user").each(function() {
            var user = jQuery(this).attr("data-user");

            jQuery(this).click(function() {
                Profile.show({username: user});
            });
        });
    };


    /**
     * Utils: Get localized status text
     */
    S.getLocalizedStatus = function(status) {
        var result = "";

        switch (status) {
            case "admin":
                result = S.getLocalizedString("statusAdmin");

                break;
            case "all":
                result = S.getLocalizedString("statusAll");

                break;
            case "branch-checking":
                result = S.getLocalizedString("statusBranchChecking");

                break;
            case "good":
                result = S.getLocalizedString("statusGood");

                break;
            case "image":
                result = S.getLocalizedString("statusImage");

                break;
            case "merger":
                result = S.getLocalizedString("statusMerger");
                
                break;
            case "missing-branch":
                result = S.getLocalizedString("statusMissingBranch");
                
                break;
            case "missing-nub":
                result = S.getLocalizedString("statusMissingNub");
                
                break;
            case "need-admin":
                result = S.getLocalizedString("statusNeedAdmin");
                
                break;
            case "need-player-a":
                result = S.getLocalizedString("statusNeedPlayerA");

                break;
            case "need-player-b":
                result = S.getLocalizedString("statusNeedPlayerB");

                break;
            case "need-scythe":
                result = S.getLocalizedString("statusNeedScythe");
                
                break;
            case "note":
                result = S.getLocalizedString("statusNote");

                break;
            case "open":
                result = S.getLocalizedString("statusOpen");

                break;
            case "player-a":
                result = S.getLocalizedString("statusPlayerA");

                break;
            case "player-b":
                result = S.getLocalizedString("statusPlayerB");

                break;
            case "scythe-complete":
                result = S.getLocalizedString("statusScytheComplete");

                break;
            case "still-growing":
                result = S.getLocalizedString("statusStillGrowing");

                break;
            case "subtree-complete":
                result = S.getLocalizedString("statusSubtreeComplete");

                break;
            case "watch":
                result = S.getLocalizedString("statusWatch");
                
                break;
            default:
                result = S.getLocalizedString("statusOpen");

                break;
        }

        return result;
    };


    /**
     * Utils: Get Issue Indicator Text
     */
    S.getLocalizedStatusIssue = function(issue) {
        var result = "";

        switch (issue) {
            case "ai-merger":
                result = S.getLocalizedString("issueAIMerger");

                break;
            case "black-spill":
                result = S.getLocalizedString("issueBlackSpill");

                break;
            case "duplicate":
                result = S.getLocalizedString("issueDuplicate");

                break;
            case "fused-merger":
                result = S.getLocalizedString("issueFusedMerger");

                break;
            case "inter-duplicate":
                result = S.getLocalizedString("issueInterHalfDuplicate");

                break;
            case "stashed":
                result = S.getLocalizedString("issueStashed");

                break;
            case "test":
                result = S.getLocalizedString("issueTestExtension");

                break;
            case "wrong-seed":
                result = S.getLocalizedString("issueWrongSeed");

                break;

        }

        return result;
    };


    /**
     * Utils: Get target cube and cell
     */
    S.getTargetCube = function() {
        var target = window.tomni.getTarget();
        var t;
        var c;

        // Pass 1: attempt to get data from current target object
        if (Array.isArray(target)) {
            try {
                t = target[0].id;
            } catch (notask) { }

            try {
                c = target[0].cell;
            } catch (nocell) { }
        } else {
            try {
                t = target.id;
            } catch (notask2) { }

            try {
                c = target.cell;
            } catch (nocell2) { }
        }

        // Pass 2a: Attempt to get current task ID from omni task object
        if (typeof t == "undefined") {
            try {
                t = window.tomni.task.id;
            } catch (notask3) { }
        }

        // Pass 2b: Attempt to get current cell ID from omni task object
        if (typeof c == "undefined") {
            try {
                c = window.tomni.task.cell;
            } catch (nocell3) { }
        }

        // Pass 3: Attempt to get current cell from omni object
        if (typeof c == "undefined") {
            try {
                c = window.tomni.cell;
            } catch (nocell4) { }
        }

        // Return results
        return {task: t, cell: c};
    };


    S.parseUserText = function(text) {
        var output = "";

        // Remove HTML tags and fix ampersands
        output = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Parse/replace cube mentions
        output = output.replace(/#([0-9]+)/g, '<a class="sl-jump-task" data-task="$1" title="' + S.getLocalizedString("actionJumpTaskTooltip") + '">#$1</a>');

        // Parse/replace user mentions
        output = output.replace(/@([^@\x00-\x20]+)/g, '<a class="sl-jump-user" data-user="$1" title="' + S.getLocalizedString("actionJumpUserTooltip") + '">@$1</a>');

        // Convert line breaks
        output = output.replace(/(\n|\r\n)/g, '<br />');

        // Return text
        return output;
    };








///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                    USER INTERFACE CONTENT FUNCTIONS                       //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


/**
 * UI: Get Cell List
 * ----------------------------------------------------------------------------
 */
    S.getCellList = function() {
        // Set window state
        slWindowState = "cell";

        // Update window history
        if (slWindowHistoryNavigating === false) {
            S.pushWindowHistory({ state: slWindowState, data: {} });
        }

        slWindowHistoryNavigating = false;

        // Send content request
        S.getContent("cell-list.htm", S.getCellList_Content);
    };

    S.getCellList_Content = function(data) {
        // Check window state
        if (slWindowState !== "cell") {
            return;
        }

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Send data request
        S.getJSON(
            slScoutsLogAPIbase + "cell/list",
            S.getCellList_Data
        );
    };

    S.getCellList_Data = function(data) {
        // Check window state
        if (slWindowState !== "cell") {
            return;
        }

        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowCellSummary") );
        jQuery("#sl-main-table table tbody").empty();

        var c, s, cn, row;

        if (data) {
            for (c in data) {
                s = data[c];

                if (slLocale == "en") {
                    cn = s.cellName;
                } else {
                    cn = s["cellName" + slLocale.toUpperCase()];
                }

                row = '<tr>';
                row += '<td><a class="sl-cell" data-cell="' + s.cell + '">' + cn + ' (' + s.cell + ')</a></td>';
                row += '<td>' + s.tasks + '</td>';
                row += '</tr>';

                jQuery("#sl-main-table table tbody").append(row);
            }
        }

        S.setLinks("#slPanel");
    };


/**
 * UI: Mystic Summary
 * ----------------------------------------------------------------------------
 */
    S.getMysticSummary = function(s) {
        // Get window subtitle
        var status = S.getLocalizedStatus(s);
        
        if (status !== "") {
            // Update window state
            slWindowState = "mystic-" + s;

            // Update window history
            if (slWindowHistoryNavigating === false) {
                S.pushWindowHistory({ state: slWindowState, data: {title: S.getLocalizedString("panelMystic") + ": " + status} });
            }

            slWindowHistoryNavigating = false;

            // Get mystic status counts
            S.getJSON(slScoutsLogAPIbase + "mystic/summary/all", function(d1) {
                var data = {};
                data.data = d1;

                // Send content request
                S.getContent("mystic.htm", function(d2) {
                    data.content = d2;

                    // Load tab content with summary data
                    S.getMysticSummary_Content(data);
                });
            });
        }
    };

    S.getMysticSummary_Content = function(mdata) {
        // Get screen data
        var summary = mdata.data.summary;
        var data = mdata.content;

        // Check window state
        var sp = slWindowState.split("-"),
            url,
            st;

        if (sp[0] !== "mystic") {
            return;
        }

        sp.shift();

        st = sp.join("-");

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Set active button
        jQuery(".slOptions ul.tabs li").removeClass("active");
        jQuery(".slOptions ul.tabs li a[data-status=" + st + "]").parent().addClass("active");

        // Set button handler
        jQuery(".slOptions ul.tabs li a").click(function() {
            var at = jQuery(this).attr("data-action");
            var st2 = jQuery(this).attr("data-status");

            switch (at) {
                case "mystic-summary":
                    S.getMysticSummary(st2);

                    break;
                case "mystic-tasks":
                    S.getMysticStatusSummary("open", "");

                    break;
            }
        });

        // Update badge values
        var npa = summary["need-player-a"];
        var npb = summary["need-player-b"];
        var na = summary["need-admin"];
        var pa = summary["player-a"];
        var pb = summary["player-b"];
        var ot = summary["open-tasks"];
        var c;

        if (npa > 0) {
            c = parseInt(jQuery("#sl-mystic-need-player-a-badge").text(), 10);

            if (c != npa) {
                jQuery("#sl-mystic-need-player-a-badge").fadeIn().text(npa);
            }
        } else {
            jQuery("#sl-mystic-need-player-a-badge").fadeOut().text(0);
        }

        if (npb > 0) {
            c = parseInt(jQuery("#sl-mystic-need-player-b-badge").text(), 10);

            if (c != npb) {
                jQuery("#sl-mystic-need-player-b-badge").fadeIn().text(npb);
            }
        } else {
            jQuery("#sl-mystic-need-player-b-badge").fadeOut().text(0);
        }

        if (na > 0) {
            c = parseInt(jQuery("#sl-mystic-need-admin-badge").fadeIn().text(), 10);

            if (c != na) {
                jQuery("#sl-mystic-need-admin-badge").fadeIn().text(na);
            }
        } else {
            jQuery("#sl-mystic-need-admin-badge").fadeOut().text(0);
        }

        if (pa > 0) {
            c = parseInt(jQuery("#sl-mystic-player-a-badge").text(), 10);

            if (c != pa) {
                jQuery("#sl-mystic-player-a-badge").fadeIn().text(pa);
            }
        } else {
            jQuery("#sl-mystic-player-a-badge").fadeOut().text(0);
        }

        if (pb > 0) {
            c = parseInt(jQuery("#sl-mystic-player-b-badge").text(), 10);

            if (c != pb) {
                jQuery("#sl-mystic-player-b-badge").fadeIn().text(pb);
            }
        } else {
            jQuery("#sl-mystic-player-b-badge").fadeOut().text(0);
        }

        if (ot > 0) {
            c = parseInt(jQuery("#sl-mystic-open-tasks-badge").text(), 10);

            if (c != ot) {
                jQuery("#sl-mystic-open-tasks-badge").fadeIn().text(ot);
            }
        } else {
            jQuery("#sl-mystic-open-tasks-badge").fadeOut().text(0);
        }

            
        // Set window title
        var status = S.getLocalizedStatus(st);
        jQuery("#slPanel h2 small").html(S.getLocalizedString("panelMystic") + ": " + status);

        // Generate data URL
        url = slScoutsLogAPIbase + "mystic/summary/";
        url += encodeURIComponent(st);

        // Send data request through plugin
        S.getJSON(
            url,
            S.getMysticSummary_Data
        );
    };

    S.getMysticSummary_Data = function(data) {
        // Check window state
        var sp = slWindowState.split("-"),
            c, cn, i,
            st, row, ent;

        if (sp[0] !== "mystic") {
            return;
        }

        jQuery("#sl-main-table table tbody").empty();

        for (i in data.cells) {
            c = data.cells[i];

            // Determine cell name
            if (slLocale == "en") {
                cn = c.cellName;
            } else {
                cn = c["cellName" + slLocale.toUpperCase()];
            }

            // Get status text
            st = S.getLocalizedStatus(c.status);
            
            // Check for need admin indicator
            ent = "";
            
            if (c.needAdmin == 1) {
            	ent = ' <img src="' + slImages.exclamation + '" height="16" width="16" border="0" alt="' + S.getLocalizedStatus('need-admin') + '" />';
            }
            
            row = '<tr>';
            row += '<td><a class="sl-mystic-cell" data-cell="' + c.cell + '">' + cn + ' (' + c.cell + ')</a> | <a class="sl-jump-cell" data-cell="' + c.cell + '">' + S.getLocalizedString("actionJumpTask") + '</a></td>';
            row += '<td class="sl-' + c.status + '">' + st + ent + '</td>';
            row += '<td>' + c.userA + '</td>';
            row += '<td>' + c.userB + '</td>';
            row += '<td>' + c.lastUpdated + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        S.setLinks("#slPanel");
    };


/**
 * UI: Set Mystic Cell Actions
 * ----------------------------------------------------------------------------
 */
    S.setMysticActions = function(c) {
        if (c) {
            // Reset UI
            jQuery("#mysticControls .mysticButton").remove();
            jQuery("#overviewCell .mystic-bar").remove();
            jQuery("#overviewCell").css("min-height", "175px");

            // Detect current cell data
            var cd = window.tomni.getCurrentCell();

            // Check if this is a mystic cell
            if (cd.info.id != c || cd.info.dataset_id != 11) {
                return;
            }

            var u = slScoutsLogAPIbase + "mystic/cell/" + encodeURIComponent(c);

            S.getJSON(u, function(d) {
                // Get status text
                var status = S.getLocalizedStatus(d.status);

                switch (d.status) {
                    case "need-player-a":
                        if (jQuery("#cellMysticClaimA").length == 0) {
                            jQuery("#mysticControls").append('<button id="cellMysticClaimA" class="flat blueButton mysticButton control onscreen" data-mystic-status="player-a">Claim (A)</button>');
                        }

                        break;
                    case "need-player-b":
                        if (jQuery("#cellMysticClaimB").length == 0) {
                            jQuery("#mysticControls").append('<button id="cellMysticClaimB" class="flat blueButton mysticButton control onscreen" data-mystic-status="player-b">Claim (B)</button>');
                        }

                        break;
                    case "need-admin":
                        if (slUserRoles.indexOf("admin") > -1) {
                            if (jQuery("#cellMysticComplete").length == 0) {
                                jQuery("#mysticControls").append('<button id="cellMysticComplete" class="flat blueButton mysticButton control onscreen" data-mystic-status="complete">Complete</button>');
                            }
                        }

                        break;
                    case "player-a":
                        if (slUser == d.userA || slUserRoles.indexOf("admin") > -1) {
                            if (jQuery("#cellMysticDoneA").length == 0) {
                                jQuery("#mysticControls").append('<button id="cellMysticDoneA" class="flat blueButton mysticButton control onscreen" data-mystic-status="need-player-b">Done / Player B</button>');
                                jQuery("#mysticControls").append('<button id="cellMysticReleaseA" class="flat blueButton mysticButton control onscreen" data-mystic-status="need-player-a">Release</button>');
                            }
                        }

                        status = d.userA + ' (A)';

                        break;
                    case "player-b":
                        if (slUser == d.userB || slUserRoles.indexOf("admin") > -1) {
                            if (jQuery("#cellMysticDoneB").length == 0) {
                                jQuery("#mysticControls").append('<button id="cellMysticDoneB" class="flat blueButton mysticButton control onscreen" data-mystic-status="need-admin">Done / Need Admin</button>');
                                jQuery("#mysticControls").append('<button id="cellMysticReleaseB" class="flat blueButton mysticButton control onscreen" data-mystic-status="need-player-b">Release</button>');
                            }
                        }

                        status = d.userB + ' (B)';

                        break;
                }

                if (jQuery("#overviewCell .mystic-bar").length == 0) {
                    jQuery('<div class="mystic-bar"><span name="status">' + status + '</span><button class="minimalButton smallButton mysticButton">' + S.getLocalizedString("actionMysticInfo") + '</button></div>').insertAfter("#overviewCell div.cellProgressBar");

                    jQuery("#mysticControls .mysticButton").click(S.updateMysticStatus);

                    jQuery("#overviewCell .mystic-bar .mysticButton").click(S.showMysticActions);

                    jQuery("#overviewCell").css("min-height", "200px");

                    jQuery("#overviewCell .mystic-bar").mouseover(function() { jQuery("#overviewCell").addClass("expanded"); });
                }
            });
        }
    };

    S.showMysticActions = function() {
        // Detect current cell data
        var cd = window.tomni.getCurrentCell();

        // Check if this is a mystic cell
        if (cd.info.dataset_id == 11) {
            S.getMysticCellEntries(cd.info.id);
        }
    }

    S.updateMysticStatus = function() {
        // Detect current cell data
        var cd = window.tomni.getCurrentCell();

        // Check if this is a mystic cell
        if (cd.info.dataset_id == 11) {
            // Get new status value
            var status = jQuery(this).attr("data-mystic-status");

            // Update window status
            slWindowState = "mystic-update-" + cd.info.id + "-" + status;

            // Display mystic status change dialog
            S.getContent("mystic-status.htm", S.updateMysticStatus_Content);
        }
    };

    S.updateMysticStatusPanel = function() {
        // Check window state
        var wsp = slWindowState.split("-");

        if (wsp[0] !== "mystic" && wsp[1] !== "entries") {
            return;
        }

        var cell = wsp[2];

        // Get new status value
        var status = jQuery(this).attr("data-mystic-status");

        // Update window status
        slWindowState = "mystic-update-" + cell + "-" + status;

        // Display mystic status change dialog
        S.getContent("mystic-status.htm", S.updateMysticStatus_Content);
    };

    S.updateMysticStatus_Content = function(data) {
        // Check window state
        var wsp = slWindowState.split("-");

        if (wsp[0] !== "mystic" && wsp[1] !== "update") {
            return;
        }

        var c = wsp[2];

        wsp.shift();
        wsp.shift();
        wsp.shift();

        var status = wsp.join("-");

        // Get localized status text
        var statusText = S.getLocalizedStatus(status);

        // Perform content specific string replacements
        data = data.replace(/\{cell\}/gi, c);
        data = data.replace(/\{status}/gi, status);
        data = data.replace(/\{statusText}/gi, statusText);

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Build data URL
        var url = slScoutsLogAPIbase + "mystic/cell/" + encodeURIComponent(c);

        // Send data request through plugin
        S.getJSON(
            url,
            S.updateMysticStatus_Data
        );
    };

    S.updateMysticStatus_Data = function(data) {
        // Check window state
        var wsp = slWindowState.split("-");

        if (wsp[0] !== "mystic" && wsp[1] !== "update") {
            return;
        }

        var c = wsp[2];

        if (data.id != c) {
            return;
        }

        var cn;

        // Set window title
        if (slLocale == "en") {
            cn = data.cellName;
        } else {
            cn = data["cellName" + slLocale.toUpperCase()];
        }

        jQuery("#slPanel h2 small").text(cn + " (" + data.id + ")");

        // Get localized status text
        var status = S.getLocalizedStatus(data.status);

        // Display cell summary
        jQuery("#sl-summary-table table tbody").empty();
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelCell") + ':</strong></td><td><a class="sl-cell">' + data.cellName + ' (' + data.id + ')</a></td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelStatus") + ':</strong></td><td class="sl-' + data.status + '">' + status + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelPlayerA") + ':</strong></td><td>' + data.userA + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelPlayerB") + ':</strong></td><td>' + data.userB + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUser") + ':</strong></td><td>' + data.lastUser + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUpdated") + ':</strong></td><td>' + data.lastUpdated + '</td></tr>');


        // Prevent keystrokes for notes from bubbling
        jQuery("#sl-action-notes").keydown(function(e) {
            e.stopPropagation();
        });

        // Set button handlers
        jQuery("#slPanel .sl-submit").click(S.updateMysticStatus_Submit);
        jQuery("#slPanel .sl-cancel").click(S.updateMysticStatus_Cancel);
    };

    S.updateMysticStatus_Cancel = function() {
        slWindowState = "";

        jQuery("#slPanel").fadeOut();
        jQuery("#slPanelShadow").fadeOut();        
    };
    
    S.updateMysticStatus_Submit = function() {
    	var st = jQuery("#sl-action-status").val();
    	
    	if (slUserRoles.indexOf("admin") == -1 && (st == "need-player-b" || st == "need-admin")) {
    		var msg;
    		
    		if (st == "need-player-b") {
    			msg = "Are you ready to send this cell on to the next player?";
    		} else {
    			msg = "Are you ready to send this cell on to the Admins?";
    		}
    		
            var o = new Attention.Confirmation({
                situation: "information calm",
                title: _("Are You Done?"),
                message: _(msg),
                ok: {
                    label: _("Yes, I'm done"),
                    klass: "flat"
                },
                cancel: {
                    label: _("No"),
                    klass: "flat"
                }
            });
            
            o.on("ok", S.updateMysticStatus_Submit2).on("cancel", S.updateMysticStatus_Cancel).show();
    	} else {
    		S.updateMysticStatus_Submit2();
    	}
    };

    S.updateMysticStatus_Submit2 = function() {
        // Set submission flag
        slWindowSubmitting = true;

        // Set interface
        S.disableForm("#slPanel form");
        jQuery("#sl-action-buttons").append("<p>" + S.getLocalizedString("messageSaving") + "</p>");

        // Get form data
        var c = jQuery("#sl-action-cell").val();
        var s = jQuery("#sl-action-status").val();
        var n = jQuery("#sl-action-notes").val();

        // Prepare data object
        var data = {
            cell: c,
            status: s,
            notes: n
        };

        // Initiate request through plugin
        S.postRequest(
            slScoutsLogAPIbase + "mystic/cell/" + encodeURIComponent(c) + "/update",
            "data=" + encodeURIComponent(JSON.stringify(data)),
            S.updateMysticStatus_Callback
        );
    };

    S.updateMysticStatus_Callback = function(data) {
        // Clear submission flag
        slWindowSubmitting = false;

        if (data.result === true) {
            // Success, hide screen
            slWindowState = "";

            jQuery("#slPanel").fadeOut();
            jQuery("#slPanelShadow").fadeOut();

            // Refresh cell actions display
            S.setMysticActions(data.cell);

            // See if we need to turn of Msty
            if (data.status == "need-player-a" || data.status == "need-player-b" || data.status == "need-admin") {
                S.getJSON(slEyeWireURIbase + "cell/" + data.cell + "/toggle_msty?value=off", function() {});
            }
        } else {
            // Error

            jQuery("#sl-action-buttons button").prop("disabled", false);
            jQuery("#sl-action-buttons p").html( S.getLocalizedString("error_submission") );
        }
    };


/**
 * UI: Get Mystic Cell Action Entries
 * ----------------------------------------------------------------------------
 */
    S.getMysticCellEntries = function(c) {
        if (c) {
            // Update window state
            slWindowState = "mystic-entries-" + c;

            // Send content request
            S.getContent("mystic-actions.htm", S.getMysticCellEntries_Content);
        }
    };

    S.getMysticCellEntries_Content = function(data) {
        // Check window state
        var wsp = slWindowState.split("-");

        if (wsp[0] !== "mystic" && wsp[1] !== "actions") {
            return;
        }

        var c = wsp[2];

        // Perform content specific string replacements
        data = data.replace(/\{cell\}/gi, c);

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Build data URL
        var url = slScoutsLogAPIbase + "mystic/cell/" + encodeURIComponent(c);
        var url2 = slScoutsLogAPIbase + "mystic/tasks/open";

        // Send data request through plugin
        S.getJSON(
            url,
            S.getMysticCellEntries_Data
        );
        
        // Get open tasks for cell
        S.getJSON(
            url2,
            S.getMysticCellEntries_Data2
        );
    };

    S.getMysticCellEntries_Data = function(data) {
        // Check window state
        var sp = slWindowState.split("-");

        if (sp[0] !== "mystic" && sp[1] !== "entries") {
            return;
        }

        var cell = sp[2];

        if (data.id != cell) {
            return;
        }

        var cn;

        // Set window title
        if (slLocale == "en") {
            cn = data.cellName;
        } else {
            cn = data["cellName" + slLocale.toUpperCase()];
        }

        jQuery("#slPanel h2 small").text(cn + " (" + data.id + ")");

        // Update window history
        if (slWindowHistoryNavigating === false) {
            S.pushWindowHistory({ state: slWindowState, data: {title: cn + " (" + data.id + ")"} });
        }

        slWindowHistoryNavigating = false;

        // Get localized status text
        var status = S.getLocalizedStatus(data.status);

        // Display cell summary
        jQuery("#sl-summary-table table tbody").empty();
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelCell") + ':</strong></td><td><a class="sl-cell">' + data.cellName + ' (' + data.id + ')</a></td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelStatus") + ':</strong></td><td class="sl-' + data.status + '">' + status + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelPlayerA") + ':</strong></td><td>' + data.userA + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelPlayerB") + ':</strong></td><td>' + data.userB + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUser") + ':</strong></td><td>' + data.lastUser + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUpdated") + ':</strong></td><td>' + data.lastUpdated + '</td></tr>');

        // Display cell actions
        jQuery("#sl-main-table table tbody").empty();

        for (var c in data.actions) {
            var s = data.actions[c];

            // Check for status issue indicator
            var st = S.getLocalizedStatus(s.status);

            // Parse notes text
            var notes = S.parseUserText(s.notes);
            
            var row = '<tr>';
            row += '<td class="sl-' + s.status + '">' + st + '</td>';
            row += '<td>' + s.user + '</td>';
            row += '<td>' + notes + '</td>';
            row += '<td>' + s.timestamp + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        // Display action buttons
        jQuery("#sl-main-buttons").empty();

        switch (data.status) {
            case "need-player-a":
                jQuery("#sl-main-buttons").append('<button class="flat blueButton mysticButton control onscreen" data-mystic-status="player-a">Claim (A)</button>');

                break;
            case "need-player-b":
                jQuery("#sl-main-buttons").append('<button class="flat blueButton mysticButton control onscreen" data-mystic-status="player-b">Claim (B)</button>');

                break;
            case "need-admin":
                if (slUserRoles.indexOf("admin") > -1) {
                    jQuery("#sl-main-buttons").append('<button class="flat blueButton mysticButton control onscreen" data-mystic-status="complete">Complete</button>');
                }

                break;
            case "player-a":
                if (slUser == data.user || slUserRoles.indexOf("admin") > -1) {
                    jQuery("#sl-main-buttons").append('<button class="flat blueButton mysticButton control onscreen" data-mystic-status="need-player-b">Done / Player B</button>&nbsp;&nbsp;&nbsp;');
                    jQuery("#sl-main-buttons").append('<button class="flat redButton mysticButton control onscreen" data-mystic-status="need-player-a">Release</button>');
                }

                break;
            case "player-b":
                if (slUser == data.user || slUserRoles.indexOf("admin") > -1) {
                    jQuery("#sl-main-buttons").append('<button class="flat blueButton mysticButton control onscreen" data-mystic-status="need-admin">Done / Need Admin</button>&nbsp;&nbsp;&nbsp;');
                    jQuery("#sl-main-buttons").append('<button class="flat redButton mysticButton control onscreen" data-mystic-status="need-player-b">Release</button>');
                }

                break;
        }

        jQuery("#sl-main-buttons .mysticButton").click(S.updateMysticStatusPanel);

        // Set links for panel
        S.setLinks("#slPanel");
    };
    
    S.getMysticCellEntries_Data2 = function(data) {
        // Check window state
        var sp = slWindowState.split("-");
        var ent1, ent2, st, s, row;

        if (sp[0] !== "mystic" && sp[1] !== "entries") {
            return;
        }

        var cell = sp[2];
        
        jQuery("#sl-tasks-table table tbody").empty();

        for (c in data.tasks) {
            s = data.tasks[c];
            
            if (s.cell != cell) {
            	continue;
            }

            // Check if current user has log entry or watch indicators
            ent1 = "";
            ent2 = "";

            if (s.has_entries == 1) {
                ent1 = ' <img src="' + slImages.tick + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconEntries") + '" />';
            }

            if (s.has_watch == 1) {
                ent2 = ' <img src="' + slImages.magnifier + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconWatch") + '" />';
            }
            

            // Check for status issue indicator
            st = S.getLocalizedStatus(s.status);

            if (s.issue !== "" && s.issue !== null) {
                st += " / " + S.getLocalizedStatusIssue(s.issue);
            }
            
            row = '<tr>';
            row += '<td><a class="sl-task" data-task="' + s.task + '">' + s.task + '</a> | <a class="sl-jump-task" data-task="' + s.task + '">' + S.getLocalizedString("actionJumpTask") + '</a>' + ent1 + ent2 + '</td>';
            row += '<td class="sl-' + s.status + '">' + st + '</td>';
            row += '<td>' + s.lastUser + '</td>';
            row += '<td>' + s.lastUpdated + '</td>';
            row += '</tr>';

            jQuery("#sl-tasks-table table tbody").append(row);
        }

        S.setLinks("#slPanel");
    };


/**
 * UI: Get Status Summary
 * ----------------------------------------------------------------------------
 */
    S.getStatusSummary = function(s, h, i) {
        // Get window subtitle
        var status = S.getLocalizedStatus(s);
        
        if (status !== "") {
            // Update window state
            slWindowState = "status-" + s;

            if (h === true) {
                slWindowState += "-header";
            }

            if (typeof i !== "undefined" && i !== "") {
                slWindowState += ":" + i;
            }

            // Update window history
            if (slWindowHistoryNavigating === false) {
                S.pushWindowHistory({ state: slWindowState, data: {title: S.getLocalizedString("panelOpen") + ": " + status} });
            }

            slWindowHistoryNavigating = false;

            // Send content request
            if (h === true) {
                S.getContent("cell-summary.htm", S.getStatusSummary_Content);
            } else {
                S.getContent("status-open.htm", S.getStatusSummary_Content);
            }
        }
    };

    S.getStatusSummary_Content = function(data) {
        // Check window state
        var spp = slWindowState.split(":"),
            sp = spp[0].split("-"),
            si = spp[1] || "",
            hd = false,
            url,
            st;

        if (sp[0] !== "status") {
            return;
        }

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Generate data URL
        url = slScoutsLogAPIbase + "status/";

        sp.shift();

        if (sp[sp.length - 1] == "header") {
             sp.pop();

             st = sp.join("-");

             url += encodeURIComponent(st);
             url += "/header";

             hd = true;
        } else {
             st = sp.join("-");

             url += encodeURIComponent(st);
        }

        if (si !== "") {
             url += "/issue/" + encodeURIComponent(si);
        }

        // Set status flag dropdown
        if (hd === false) {
            jQuery("#sl-status").dropdown({
                value: st,
                change: function(status) {
                    var spp2 = slWindowState.split(":");
                    var sp2 = spp2[0].split("-");
                    var si2 = spp2[1];

                    var hd2 = false;

                    if (sp2[sp2.length - 1] == "header") {
                        sp2.pop();
                        hd2 = true;   
                    }

                    S.getStatusSummary(status, hd2, si2);
                }
            });

            // Set issue flag dropdown
            jQuery("#sl-issue").dropdown({
                value: si,
                change: function(issue) {
                    var spp2 = slWindowState.split(":");
                    var sp2 = spp2[0].split("-");
                    sp2.shift();

                    var hd2 = false;

                    if (sp2[sp2.length - 1] == "header") {
                        sp2.pop();
                        hd2 = true;   
                    }

                    var st2 = sp2.join("-");

                    S.getStatusSummary(st2, hd2, issue);
                }
            });
        }
            
        // Set window title
        var status = S.getLocalizedStatus(st);
        jQuery("#slPanel h2 small").html(S.getLocalizedString("panelOpen") + ": " + status);

        // Send data request through plugin
        S.getJSON(
            url,
            S.getStatusSummary_Data
        );
    };

    S.getStatusSummary_Data = function(data) {
        // Check window state
        var spp = slWindowState.split(":"),
            sp = spp[0].split("-"),
            c, s, cn, ent1 = "", ent2 = "",
            st, row;

        if (sp[0] !== "status") {
            return;
        }

        jQuery("#sl-main-table table tbody").empty();

        for (c in data.tasks) {
            s = data.tasks[c];

            // Determine cell name
            if (slLocale == "en") {
                cn = s.cellName;
            } else {
                cn = s["cellName" + slLocale.toUpperCase()];
            }

            // Check if current user has log entry or watch indicators
            ent2 = "";

            if (s.has_entries == 1) {
                ent2 = ' <img src="' + slImages.tick + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconEntries") + '" />';
            }

            if (s.has_watch == 1) {
                ent2 = ' <img src="' + slImages.magnifier + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconWatch") + '" />';
            }
            

            // Check for status issue indicator
            st = S.getLocalizedStatus(s.status);

            if (s.issue !== "" && s.issue !== null) {
                st += " / " + S.getLocalizedStatusIssue(s.issue);
            }
            
            row = '<tr>';
            row += '<td><a class="sl-task" data-task="' + s.task + '">' + s.task + '</a> | <a class="sl-jump-task" data-task="' + s.task + '">' + S.getLocalizedString("actionJumpTask") + '</a>' + ent1 + ent2 + '</td>';
            row += '<td><a class="sl-cell" data-cell="' + s.cell + '">' + cn + ' (' + s.cell + ')</a></td>';
            row += '<td class="sl-' + s.status + '">' + st + '</td>';
            row += '<td>' + s.lastUser + '</td>';
            row += '<td>' + s.lastUpdated + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        S.setLinks("#slPanel");
    };


/**
 * UI: Get Mystic Status Summary
 * ----------------------------------------------------------------------------
 */
    S.getMysticStatusSummary = function(s, i) {
        // Get window subtitle
        var status = S.getLocalizedStatus(s);
        
        if (status !== "") {
            // Update window state
            slWindowState = "mystic-tasks-" + s;

            if (typeof i !== "undefined" && i !== "") {
                slWindowState += ":" + i;
            }

            // Update window history
            if (slWindowHistoryNavigating === false) {
                S.pushWindowHistory({ state: slWindowState, data: {title: "Mystic Tasks: " + status} });
            }

            slWindowHistoryNavigating = false;

            // Send content request
            S.getContent("mystic-open.htm", S.getMysticStatusSummary_Content);
        }
    };

    S.getMysticStatusSummary_Content = function(data) {
        // Check window state
        var spp = slWindowState.split(":"),
            sp = spp[0].split("-"),
            si = spp[1] || "",
            url,
            st;

        if (sp[0] !== "mystic" && sp[1] !== "tasks") {
            return;
        }

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Generate data URL
        url = slScoutsLogAPIbase + "mystic/tasks/";

        sp.shift();
        sp.shift();

        st = sp.join("-");

        url += encodeURIComponent(st);

        if (si !== "") {
             url += "/issue/" + encodeURIComponent(si);
        }

        // Set status flag dropdown
            jQuery("#sl-status").dropdown({
                value: st,
                change: function(status) {
                    var spp2 = slWindowState.split(":");
                    var sp2 = spp2[0].split("-");
                    var si2 = spp2[1];

                    S.getMysticStatusSummary(status, si2);
                }
            });

            // Set issue flag dropdown
            jQuery("#sl-issue").dropdown({
                value: si,
                change: function(issue) {
                    var spp2 = slWindowState.split(":");
                    var sp2 = spp2[0].split("-");
                    sp2.shift();
                    sp2.shift();

                    var st2 = sp2.join("-");

                    S.getMysticStatusSummary(st2, issue);
                }
            });
            
        // Set window title
        var status = S.getLocalizedStatus(st);
        jQuery("#slPanel h2 small").html("Mystic Tasks: " + status);

        // Send data request through plugin
        S.getJSON(
            url,
            S.getMysticStatusSummary_Data
        );
    };

    S.getMysticStatusSummary_Data = function(data) {
        // Check window state
        var spp = slWindowState.split(":"),
            sp = spp[0].split("-"),
            c, s, cn, ent1 = "", ent2 = "",
            st, row;

        if (sp[0] !== "mystic" && sp[1] !== "tasks") {
            return;
        }

        jQuery("#sl-main-table table tbody").empty();

        for (c in data.tasks) {
            s = data.tasks[c];

            // Determine cell name
            if (slLocale == "en") {
                cn = s.cellName;
            } else {
                cn = s["cellName" + slLocale.toUpperCase()];
            }

            // Check if current user has log entry or watch indicators
            ent2 = "";

            if (s.has_entries == 1) {
                ent2 = ' <img src="' + slImages.tick + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconEntries") + '" />';
            }

            if (s.has_watch == 1) {
                ent2 = ' <img src="' + slImages.magnifier + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconWatch") + '" />';
            }
            

            // Check for status issue indicator
            st = S.getLocalizedStatus(s.status);

            if (s.issue !== "" && s.issue !== null) {
                st += " / " + S.getLocalizedStatusIssue(s.issue);
            }
            
            row = '<tr>';
            row += '<td><a class="sl-task" data-task="' + s.task + '">' + s.task + '</a> | <a class="sl-jump-task" data-task="' + s.task + '">' + S.getLocalizedString("actionJumpTask") + '</a>' + ent1 + ent2 + '</td>';
            row += '<td><a class="sl-cell" data-cell="' + s.cell + '">' + cn + ' (' + s.cell + ')</a></td>';
            row += '<td class="sl-' + s.status + '">' + st + '</td>';
            row += '<td>' + s.lastUser + '</td>';
            row += '<td>' + s.lastUpdated + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        S.setLinks("#slPanel");
    };



/**
 * UI: Get Cell Task Entries
 * ----------------------------------------------------------------------------
 */
    S.getCellEntries = function(c, s, i) {
        // Set window state
        slWindowState = "cell-entries-" + c;

        if (typeof s !== "undefined" && s !== "") {
            slWindowState += "-" + s;
        }

        if (typeof i !== "undefined" && i !== "") {
            slWindowState += ":" + i;
        }

        // Send content request
        S.getContent("cell-tasks.htm", S.getCellEntries_Content);
    };

    S.getCellEntries_Content = function(data) {
        // Check window state
        var wsp = slWindowState.split("-");

        if (wsp[0] !== "cell" && wsp[1] !== "entries") {
            return;
        }

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Get state options
        var spp = slWindowState.split(":");
        var sp = spp[0].split("-");
        var c = sp[2];

        // Remove cell entry parts
        sp.shift();
        sp.shift();
        sp.shift();

        var st = sp.join("-");
        var is = spp[1] || "";

        // Set display option dropdown menus
        var ch = function(v) {
            var spp2 = slWindowState.split(":");
            var sp2 = spp2[0].split("-");
            var cell = sp2[2];

            // Remove cell entry parts
            sp2.shift();
            sp2.shift();
            sp2.shift();

            // Get status and issue settings
            var status = sp2.join("-");
            var issue = spp2[1] || "";

            // Update from current selection
            var cn = this.selector[0].id;

            switch (cn) {
                case "sl-status":
                    status = v;

                    break;
                case "sl-issue":
                    issue = v;

                    break;
            }
            
            S.getCellEntries(cell, status, issue);
        };

        jQuery("#slPanel div.slOptions #sl-status").dropdown({
            value: st,
            change: ch
        });

        jQuery("#slPanel div.slOptions #sl-issue").dropdown({
            value: is,
            change: ch
        });

        // Build data URL
        var url = slScoutsLogAPIbase + "cell/" + encodeURIComponent(c) + "/tasks";

        if (st !== "") {
            url += "/status/" + encodeURIComponent(st);
        }

        if (is !== "") {
            url += "/issue/" + encodeURIComponent(is);
        }

        // Send data request through plugin
        S.getJSON(
            url,
            S.getCellEntries_Data
        );
    };

    S.getCellEntries_Data = function(data) {
        // Check window state
        var sp = slWindowState.split("-");

        if (sp[0] !== "cell" && sp[1] !== "entries" && sp[2] !== data.cell) {
            return;
        }

        var cn;

        // Set window title
        if (slLocale == "en") {
            cn = data.cellName;
        } else {
            cn = data["cellName" + slLocale.toUpperCase()];
        }

        jQuery("#slPanel h2 small").text(cn + " (" + data.cell + ")");

        // Update window history
        if (slWindowHistoryNavigating === false) {
            // Get state options
            var st = "";

            if (sp.length > 3) {
                // Remove cell entry parts
                sp.shift();
                sp.shift();
                sp.shift();

                // Get status
                st = sp.join("-");
            }

            var sts = S.getLocalizedStatus(st);

            S.pushWindowHistory({ state: slWindowState, data: {title: cn + " (" + data.cell + ") - " + sts} });
        }

        slWindowHistoryNavigating = false;

        jQuery("#sl-main-table table tbody").empty();

        if (data.tasks.length > 0) {    
            for (var c in data.tasks) {
                var s = data.tasks[c];

                // Check if current user has log entry or watch indicators
                var ent1 = "";
                var ent2 = "";
                
                if (s.has_entries == 1) {
                    ent2 = ' <img src="' + slImages.tick + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconEntries") + '" />';
                }

                if (s.has_watch == 1) {
                    ent2 = ' <img src="' + slImages.magnifier + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconWatch") + '" />';
                }
                
                // Check for status issue indicator
                var st2 = S.getLocalizedStatus(s.status);

                if (s.issue !== "" && s.issue !== null) {
                    st2 += " / " + S.getLocalizedStatusIssue(s.issue);
                }
    
                var row = '<tr>';
                row += '<td><a class="sl-task" data-task="' + s.task + '">' + s.task + '</a> | <a class="sl-jump-task" data-task="' + s.task + '">' + S.getLocalizedString("actionJumpTask") + '</a>' + ent1 + ent2 + '</td>';
                row += '<td class="sl-' + s.status + '">' + st2 + '</td>';
                row += '<td>' + s.lastUser + '</td>';
                row += '<td>' + s.lastUpdated + '</td>';
                row += '</tr>';
    
                jQuery("#sl-main-table table tbody").append(row);
            }
    
            S.setLinks("#slPanel");
        } else {
            // No entries found
            
            jQuery("#sl-main-table table tbody").append('<tr><td colspan="4">' + S.getLocalizedString("error_notasks") + '</td></tr>');
        }
    };


/**
 * UI: Get Task Details
 * ----------------------------------------------------------------------------
 */


    S.getTaskEntries = function(t) {
        // Update window state
        slWindowState = "task-" + t;

        // Update window history
        if (slWindowHistoryNavigating === false) {
            S.pushWindowHistory({ state: slWindowState, data: {} });
        }

        slWindowHistoryNavigating = false;

        // Send content request
        S.getContent("task-detail.htm", S.getTaskEntries_Content);
    };
    
    S.getTaskEntriesInspect = function() {
        // Get current cube/task
        var target = S.getTargetCube();
        
        if (typeof target.task !== "undefined") {
            // Update window state
            slWindowState = "task-" + target.task;

            // Update window history
            if (slWindowHistoryNavigating === false) {
                S.pushWindowHistory({ state: slWindowState, data: {} });
            }

            slWindowHistoryNavigating = false;

            // Send content request
            S.getContent("task-detail.htm", S.getTaskEntries_Content);
        } else {
            alert( S.getLocalizedString("error_cube") );
        }
    };

    S.getTaskEntries_Content = function(data) {
        // Check window state
        var sp = slWindowState.split("-");

        if (sp[0] !== "task") {
            return;
        }

        // Get current task
        var t = slWindowState.split("-")[1];

        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("labelTask") + " #" + t );

        // Perform content specific string replacements
        data = data.replace(/\{task\}/gi, t);

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Set handler for new action buttons
        jQuery("#slPanel button.sl-new-action").click(function() {
            // Display new task action window
            S.prepareTaskActionWindow(t);
        });

        // Initiate data request through plugin
        S.getJSON(
            slScoutsLogAPIbase + "task/" + encodeURIComponent(t) + "/actions",
            S.getTaskEntries_Data
        );
    };

    S.getTaskEntries_Data = function(data) {
        S.getTaskDetails(data.task, function(data2) {
            // Add task details to original data
            data.cell = data2.cell;
            data.cellName = data2.cellName;
            data.weight = data2.weight;
            data.votes = data2.votes;
            data.votesMax = data2.votesMax;
            data.ewstatus = data2.ewstatus;
            
            // Trigger callback to display data
            S.getTaskEntries_Data2(data);
        });
    };

    S.getTaskEntries_Data2 = function(data) {
        // Check window state
        var sp = slWindowState.split("-");

        if (sp[0] !== "task" && sp[1] !== data.task) {
            return;
        }

        // Check for admin weight
        var wstyle = "";
        
        if (data.weight >= 1000000) {
            wstyle =' class="sl-admin"';
        }
        
        // Check for admin complete
        var vstyle = "";
        if (data.votes >= 1000000) {
            vstyle = ' class="sl-admin"';
        }

        // Check for status issue indicator
        var status = S.getLocalizedStatus(data.status);

        if (data.issue !== "" && data.issue !== null) {
            status += " / " + S.getLocalizedStatusIssue(data.issue);
        }
        
        // Display task summary
        jQuery("#sl-summary-table table tbody").empty();
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelCell") + ':</strong></td><td><a class="sl-cell" data-cell="' + data.cell + '">' + data.cellName + ' (' + data.cell + ')</a></td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelStatus") + ':</strong></td><td class="sl-' + data.status + '">' + status + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelWeight") + ':</strong></td><td' + wstyle + '>' + nice_number(data.weight) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelVotes") + ':</strong></td><td' + vstyle + '>' + nice_number(data.votes) + ' / ' + nice_number(data.votesMax) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUser") + ':</strong></td><td>' + data.lastUser + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUpdated") + ':</strong></td><td>' + data.lastUpdated + '</td></tr>');
        
        // Check for EyeWire status flags
        switch (data.ewstatus) {
            case 6:
                jQuery("#sl-summary-table table tbody").append('<td colspan="2" style="background-color:#f33;color:#fff;">Cube is stashed</td>');

                break;
            case 10:
                jQuery("#sl-summary-table table tbody").append('<td colspan="2" style="background-color:#fff;color:#000;">Cube is frozen</td>');

                break;
            case 11:
                jQuery("#sl-summary-table table tbody").append('<td colspan="2" style="background-color:#33f;color:#fff;">Duplicate cube</td>');

                break;
        }

        // Update task and cell ID values for action form
        jQuery("#sl-action-task").val(data.task);
        jQuery("#sl-action-cell").val(data.cell);
        
        // Display task actions
        jQuery("#sl-main-table table tbody").empty();

        for (var c in data.actions) {
            var s = data.actions[c];
            
            var img = "";
            
            if (s.image !== "") {
                img = '<a class="sl-image" href="' + s.image + '" target="_blank" title="' + S.getLocalizedString("actionViewImageTooltip") + '">' + S.getLocalizedString("actionViewImage") + '</a>';
            }

            var user = s.user;

            if (s.reaped === 0) {
                user = '(' + s.user + ')';
            }

            var edit = "";

            if (slUser == s.user) {
                edit = '<a href="javascript:void(0);" class="sl-edit-action" data-entry="' + s.id + '" title="' + S.getLocalizedString("actionEditEntryTooltip") + '"><img src="' + slImages.pencil + '" /></a>';
            }

            // Check for status issue indicator
            var st = S.getLocalizedStatus(s.status);

            if (s.issue !== "" && s.issue !== null) {
                st += " / " + S.getLocalizedStatusIssue(s.issue);
            }

            // Parse notes text
            var notes = S.parseUserText(s.notes);
            
            var row = '<tr>';
            row += '<td>' + edit + '</td>';
            row += '<td class="sl-' + s.status + '">' + st + '</td>';
            row += '<td>' + user + '</td>';
            row += '<td>' + notes + '</td>';
            row += '<td>' + img + '</td>';
            row += '<td>' + s.timestamp + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }
                
        // Check 'set good' button status
        if (data.status !== "" && data.status !== "good") {            
            jQuery("#slPanel button.sl-good-action").fadeIn();

            jQuery("#slPanel button.sl-good-action").unbind("click");

            jQuery("#slPanel button.sl-good-action").click(function() {
                // Prepare data object
                var d = {
                    cell: data.cell,
                    task: data.task,
                    status: "good",
                    issue: "",
                    reaped: 0,
                    notes: "",
                    image: ""
                };

                // Initiate request through plugin
                S.postRequest(
                    slScoutsLogAPIbase + "task/" + encodeURIComponent(data.task) + "/action/create",
                    "data=" + encodeURIComponent(JSON.stringify(d)),
                    S.setTaskGoodCallback
                );
            });
        } else {
            // Hide 'set good' button
            jQuery("#slPanel button.sl-good-action").fadeOut();
        }


        // Set event handler for edit icons
        jQuery("#sl-main-table a.sl-edit-action").click(function() {
            // Get current entry
            var en = jQuery(this).attr("data-entry");

            // Display edit screen
            S.prepareTaskActionEditWindow(data.task, en);
        });
        
        // Set links for panel
        S.setLinks("#slPanel");

        // Set update timer
        setTimeout(function() { S.updateTaskDetails(data.task); }, slTaskInterval);
    };

    S.setTaskGoodCallback = function(data) {
        S.getTaskEntries(data.task);
    };

    S.getTaskDetails = function(id, callback) {
        jQuery.getJSON(slEyeWireURIbase + "task/" + encodeURIComponent(id), function(d1) {
            var task = {
                id: d1.id,
                cell: d1.cell
            };
            
            jQuery.getJSON(slEyeWireURIbase + "task/" + encodeURIComponent(id) + "/aggregate", function(d2) {
                task.weight = d2.weight;
                task.votes = d2.votes.total;
                task.votesMax = d2.votes.max;
                task.ewstatus = d2.status;
                
                jQuery.getJSON(slEyeWireURIbase + "cell/" + encodeURIComponent(task.cell), function(d3) {
                    task.cellName = d3.name;
                    
                    // Send combined task data to original callback
                    callback(task);
                });
            });
        });
    };

    S.updateTaskDetails = function(task) {
        // Check window state
        if (slWindowState !== "task-" + task) {
            return;
        }

        // Initiate data request through plugin
        S.getJSON(
            slScoutsLogAPIbase + "task/" + encodeURIComponent(task) + "/actions",
            S.getTaskEntries_Data
        );
    };


/**
 * UI: Prepare Window for New Task Action
 * ----------------------------------------------------------------------------
 */
    S.prepareTaskActionWindow = function(t) {
        if (typeof t !== "undefined") {
            // Set window state
            slWindowState = "action-" + t;

            // Send content request
            S.getContent("task-action.htm", S.prepareTaskActionWindow_Content);
        } else {
            // Invalid task/cube

            alert( S.getLocalizedString("error_cube") );
        }
    };

    S.prepareTaskActionWindow_Content = function(data) {
        // Check window state
        var sp = slWindowState.split("-");

        if (sp[0] !== "action") {
            return;
        }

        // Clear submission flag
        slWindowSubmitting = false;

        // Get current task and cell
        var ts = slWindowState.split("-")[1];

        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowNewEntryTitle") + " (" + S.getLocalizedString("labelTask") + " #" + ts + ")" );

        // Perform content specific string replacements
        data = data.replace(/\{task\}/gi, ts);

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Prevent keystrokes for notes from bubbling
        jQuery("#sl-action-notes").keydown(function(e) {
            e.stopPropagation();
        });
        
        // Set handlers for buttons
        jQuery("#slPanel button.sl-cancel").click(function() {
            jQuery("#slPanel").fadeOut();
            jQuery("#slPanelShadow").fadeOut();
        });

        jQuery("#slPanel button.sl-submit").click(function() {
            // Set submission flag
            slWindowSubmitting = true;

            // Set interface
            S.disableForm("#slPanel form");
            jQuery("#sl-action-buttons").append("<p>" + S.getLocalizedString("messageSaving") + "</p>");

            // Get current task and cell
            var t = jQuery("#sl-action-task").val();
            var c = jQuery("#sl-action-cell").val();

            // Prepare data object
            var data = {
                cell: c,
                task: t,
                status: jQuery("#sl-action-status").val(),
                issue: jQuery("#sl-action-issue").val(),
                reaped: jQuery("#sl-action-table input:radio[name=reaped]:checked").val(),
                notes: jQuery("#sl-action-notes").val()
            };

            // Prepare image data
            var im = "";

            if (jQuery("#sl-action-image-annotated").val() !== "") {
                im = jQuery("#sl-action-image-annotated").val();
            } else {
                im = jQuery("#sl-action-image").val();
            }

            if (im !== "") {
                var bs = atob(im.split(",")[1]);
                var ms = im.split(",")[0].split(":")[1].split(";")[0];

                var ab = new ArrayBuffer(bs.length);
                var ia = new Uint8Array(ab);

                for (var i = 0; i < bs.length; i++)
                {
                    ia[i] = bs.charCodeAt(i);
                }

                // Initiate request through plugin with image upload
                S.fileRequest(
                    slScoutsLogAPIbase + "task/" + encodeURIComponent(t) + "/action/create/upload",
                    { data: JSON.stringify(data) },
                    [{ name: "image", filename: "capture.png", type: ms, data: ab }],
                    S.submitTaskActionCallback
                );
            } else {
                // Initiate request through plugin, no image
                S.postRequest(
                    slScoutsLogAPIbase + "task/" + encodeURIComponent(t) + "/action/create",
                    "data=" + encodeURIComponent(JSON.stringify(data)),
                    S.submitTaskActionCallback
                );
            }

        });

        // Get task summary
        S.getTaskSummary(ts);
    };

    S.submitTaskActionCallback = function(data) {
        // Clear submission flag
        slWindowSubmitting = false;

        if (data.result === true) {
            // Success, hide screen

            slWindowState = "";

            jQuery("#slPanel").fadeOut();
            jQuery("#slPanelShadow").fadeOut();
        } else {
            // Error

            jQuery("#sl-action-buttons button").prop("disabled", false);
            jQuery("#sl-action-buttons p").html( S.getLocalizedString("error_submission") );
        }
    };


    S.getTaskSummary = function(t) {
        S.getJSON(
            slScoutsLogAPIbase + "task/" + encodeURIComponent(t),
            S.getTaskSummary_Data
        );
    };
    
    S.getTaskSummary_Data = function(data) {
        S.getTaskDetails(data.task, function(data2) {
            // Add task details to original data
            data.cell = data2.cell;
            data.cellName = data2.cellName;
            data.weight = data2.weight;
            data.votes = data2.votes;
            data.votesMax = data2.votesMax;
            data.ewstatus = data2.ewstatus;
            
            // Trigger final callback to display info
            S.getTaskSummary_Data2(data);
        });
    };

    S.getTaskSummary_Data2 = function(data) {
        // Check for admin weight
        var wstyle = "";
        
        if (data.weight >= 1000000) {
            wstyle =' class="sl-admin"';
        }
        
        // Check for admin complete
        var vstyle = "";
        if (data.votes >= 1000000) {
            vstyle = ' class="sl-admin"';
        }

        // Update task and cell ID values for action form
        jQuery("#sl-action-task").val(data.task);
        jQuery("#sl-action-cell").val(data.cell);

        // Check task status
        var status = "n/a";
        var status_class = "";

        var sp = slWindowState.split("-");

        if (data.status !== "") {
            status = S.getLocalizedStatus(data.status);
            status_class = ' class="sl-' + data.status + '"';

            if (data.issue !== "" && data.issue !== null) {
                status += " / " + S.getLocalizedStatusIssue(data.issue);
            }

            if (sp.length != 4 && sp[3] !== "edit") {
                jQuery("#sl-action-status").val(data.status);
                jQuery("#sl-action-issue").val(data.issue);
            }
        }
        
        // Display task summary
        jQuery("#sl-summary-table table tbody").empty();
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelCell") + ':</strong></td><td><a class="sl-cell" data-cell="' + data.cell + '">' + data.cellName + ' (' + data.cell + ')</a></td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelStatus") + ':</strong></td><td' + status_class + '>' + status + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelWeight") + ':</strong></td><td' + wstyle + '>' + nice_number(data.weight) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelVotes") + ':</strong></td><td' + vstyle + '>' + nice_number(data.votes) + ' / ' + nice_number(data.votesMax) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUser") + ':</strong></td><td>' + data.lastUser + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUpdated") + ':</strong></td><td>' + data.lastUpdated + '</td></tr>');
        
        // Check for EyeWire status flags
        switch (data.ewstatus) {
            case 6:
                jQuery("#sl-summary-table table tbody").append('<td colspan="2" style="background-color:#f33;color:#fff;">Cube is stashed</td>');

                break;
            case 10:
                jQuery("#sl-summary-table table tbody").append('<td colspan="2" style="background-color:#fff;color:#000;">Cube is frozen</td>');

                break;
            case 11:
                jQuery("#sl-summary-table table tbody").append('<td colspan="2" style="background-color:#33f;color:#fff;">Duplicate cube</td>');

                break;
        }


        // Set links
        S.setLinks("#slPanel");

        // Get captured image
        if (jQuery("#sl-action-entry").length === 0) {
            S.captureImage();
        }
    };


    S.parseTransform = function(a) {
        var m=a.match(/([0-9\.]+)/g);

        var tra={x:m[4], y:m[5]},
            rot=0,
            sca={x:1, y:1},
            ske={x:0, y:0},
            det=m[0] * m[3] - m[1] * m[2];
                
        if (m[0] || m[1]) {
            var r = Math.sqrt(m[0]*m[0] + m[1]*m[1]);
            rot = m[1] > 0 ? Math.acos(m[0] / r) : -Math.acos(m[0] / r);
            sca = {x: r, y: det / r};
            ske.x = Math.atan((m[0]*m[2] + m[1]*m[3]) / (r*r));
        } else if (m[2] || m[3]) {
            var s = Math.sqrt(m[2]*m[2] + m[3]*m[3]);
            rot = Math.pi * 0.5 - (m[3] > 0 ? Math.acos(-m[2] / s) : -Math.acos(m[2] / s));
            sca = {x: det / s, y: s};
            ske.y = Math.atan((m[0]*m[2] + m[1]*m[3]) / (s*s));
        } else {
            sca = {x:0, y:0};
        }

        return {
            scale: sca,
            translate: tra,
            rotation: rot,
            skew: ske
        };
    };

    S.captureImage = function() {
        // Get current task and cell
        var task = jQuery("#sl-action-task").val();
        var cell = jQuery("#sl-action-cell").val();

        // Capture 3D image
        if (jQuery("#threeD canvas").length == 1) {
            // Get 3D canvas object
            var c3d = jQuery("#threeD canvas")[0];
            
            // Force a render
            window.tomni.threeD.render();
            
            // Store image data
            jQuery("#sl-action-image-3d").val(c3d.toDataURL());
        } else {
            // 3D canvas is not visible/available

            // Clear image data
            jQuery("#sl-action-image-3d").val("");
        }

        // Capture 2D image
        if (jQuery("#twoD").length == 1 && window.tomni.gameMode) {
            // Get 2D canvas object
            var c2d = jQuery("#twoD")[0];
            
            // Force a render
            window.tomni.twoD.render();
            
            // Store image data
            jQuery("#sl-action-image-2d").val(c2d.toDataURL());
            
        } else {
            // 2D canvas is not visible/available

            // Clear image data
            jQuery("#sl-action-image-2d").val("");
        }

        // Create basic image preview
        var cvA = jQuery("#threeD canvas")[0];
        var cxA = cvA.getContext("2d");

        var cv = document.createElement("canvas");
        cv.height = cvA.height;
        cv.width = cvA.width;

        var cx = cv.getContext("2d");
        cx.imageSmoothingEnabled = false;

        cx.beginPath();
        cx.rect(0, 0, cvA.width, cvA.height);
        cx.fillStyle = "#232323";
        cx.fill();

        var cvB = jQuery("#twoD")[0];

        if (cvB && window.tomni.gameMode) {
            var imC = jQuery("#twoD").parent()[0];
            var sX = Math.floor((cvA.width - imC.clientWidth) / 2);
            var sW = Math.floor(cvA.width / 2);

            // Draw 3D canvas
            cx.drawImage(cvA, sX, 0, sW, cvA.height, 0, 0, sW, cvA.height);

            // Get 2D canvas scaling and offset
            var tB = S.parseTransform( jQuery(cvB).css("transform") );
            var tL = parseFloat(jQuery(cvB).css("left"));
            var tT = parseFloat(jQuery(cvB).css("bottom")) * -1;

            // Get view coordinates
            var v1 = {x: 0, y: 0};
            var v2 = {x: sW, y: cvA.height};

            // Get scaled canvas coordinates (relative to view)
            var c1 = {
                x: ((sW - (cvB.width * tB.scale.x)) / 2) + tL,
                y: ((cvA.height - (cvB.height * tB.scale.y)) / 2) + tT
            };

            var c2 = {
                x: c1.x + (cvB.width * tB.scale.x),
                y: c1.y + (cvB.height * tB.scale.y)
            };

            // Calculate intersection of view and canvas coordinates
            var i1 = {
                x: Math.max( v1.x, c1.x ),
                y: Math.max( v1.y, c1.y )
            };

            var i2 = {
                x: Math.min( v2.x, c2.x ),
                y: Math.min( v2.y, c2.y )
            };

            // Calculate clip region for non-scaled 2D canvas
            var clip = {
                x: (c1.x < i1.x) ? ((Math.abs(i1.x - c1.x) / tB.scale.x) < 0 ? 0 : (Math.abs(i1.x - c1.x) / tB.scale.x) > cvB.width ? cvB.width-1 : (Math.abs(i1.x - c1.x) / tB.scale.x)) : 0,
                y: (c1.y < i1.y) ? ((Math.abs(i1.y - c1.y) / tB.scale.y) < 0 ? 0 : (Math.abs(i1.y - c1.y) / tB.scale.y) > cvB.height ? cvB.height-1 : (Math.abs(i1.y - c1.y) / tB.scale.y)) : 0,
                w: Math.abs( (i2.x - i1.x) / tB.scale.x ),
                h: Math.abs( (i2.y - i1.y) / tB.scale.y )
            };

            // Draw, and scale, clipped region to the working canvas
            cx.drawImage(cvB, clip.x, clip.y, clip.w, clip.h, sW + i1.x, i1.y, i2.x - i1.x, i2.y - i1.y);

            // Add divider line
            cx.beginPath();
            cx.setLineDash([3, 3]);
            cx.moveTo(sW + 0.5, 0);
            cx.lineTo(sW + 0.5, cvA.height);
            cx.lineWidth = 1;
            cx.strokeStyle = "#888";
            cx.stroke();

            // Add details panel background
            cx.beginPath();
            cx.rect(5, 5, 300, 88);
            cx.fillStyle = "rgba(0, 0, 0, 0.5)";
            cx.fill();

            // Add details panel text
            var dir = window.tomni.twoD.axis;

            cx.font = "normal 10pt sans-serif";
            cx.fillStyle = "#bbb";      
            cx.fillText("Cell: " + cell, 10, 23);
            cx.fillText("Cube: " + task, 10, 43);
            cx.fillText("Plane: " + dir, 10, 63);
            cx.fillText("User: " + slUser, 10, 83);

        } else {
            // Draw 3D canvas image
            cx.drawImage(cvA, 0, 0);

            // Add details panel background
            cx.beginPath();
            cx.rect(5, 5, 300, 48);
            cx.fillStyle = "rgba(0, 0, 0, 0.5)";
            cx.fill();

            // Add details panel text
            cx.font = "normal 10pt sans-serif";
            cx.fillStyle = "#bbb";      
            cx.fillText("Cell: " + cell, 10, 23);
            cx.fillText("User: " + slUser, 10, 43);
        }

        // Add logo
        //var im = new Image();
        //im.height = 32;
        //im.width = 32;
        //im.src = slScoutsLogURIbase + "images/scouts-log.svg";
        //im.onload = function() {
        //    S.captureImage2(cv, cx, cvA, im);
        //};

        S.captureImage2(cv, cx, cvA, null);
    };

    S.captureImage2 = function(cv, cx, cvA, im) {
        // Finish copying logo
        //cx.drawImage(im, cvA.width - 48, cvA.height - 48, 32, 32);

        // Save image data from working canvas
        jQuery("#sl-action-image").val(cv.toDataURL());

        
        // Reset annotation/sketch data
        jQuery("#sl-action-image-annotated").val("");
        jQuery("#sl-action-image-sketch").val("");

        // Update status, set links
        var status = '<a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '"><img src="' + slImages.photo + '" /></a> <a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '">' + S.getLocalizedString("actionPreview") + '</a> | ';
        status += '<a class="sl-annotate" title="' + S.getLocalizedString("actionAnnotateTooltip") + '"><img src="' + slImages.pencil + '" /></a> <a class="sl-annotate" title="' + S.getLocalizedString("actionAnnotateTooltip") + '">' + S.getLocalizedString("actionAnnotate") + '</a> | ';
        status += '<a class="sl-capture" title="' + S.getLocalizedString("actionRecaptureTooltip") + '"><img src="' + slImages.refresh + '" /></a> <a class="sl-capture" title="' + S.getLocalizedString("actionRecaptureTooltip") + '">' + S.getLocalizedString("actionRecapture") + '</a> | ';
        status += '<a class="sl-remove" title="' + S.getLocalizedString("actionRemoveTooltip") + '"><img src="' + slImages.delete + '" /></a> <a class="sl-remove" title="' + S.getLocalizedString("actionRemoveTooltip") + '">' + S.getLocalizedString("actionRemove") + '</a>';

        jQuery("#sl-action-image-status").html(status);

        // Set event handlers

        jQuery("#sl-action-image-status a.sl-preview").click(function() {
            // Exit if we are submitting
            if (slWindowSubmitting === true) return;

            var w = window.open();

            var im;

            if (jQuery("#sl-action-image-annotated").val() !== "") {
                im = jQuery("#sl-action-image-annotated").val();
            } else {
                im = jQuery("#sl-action-image").val();
            }
                
            w.document.open();
            w.document.write('<!DOCTYPE html><head><title>' + S.getLocalizedString("windowImagePreviewTitle") + '</title>');
            w.document.write('<style type="text/css">body { background-color: #232323; color: #fff; }</style>');
            w.document.write('</head><body>');
            w.document.write('<img src="' + im + '"/>');
            w.document.write('</body></html>');
            w.document.close();
        });

        jQuery("#sl-action-image-status a.sl-annotate").click(function() {
            // Exit if we are submitting
            if (slWindowSubmitting === true) return;

            if (jQuery("#sl-action-image-annotated").val() === "") {
                S.createAnnotation();
            } else {
                S.showAnnotation();
            }
        });

        jQuery("#sl-action-image-status a.sl-capture").click(function() {
            // Exit if we are submitting
            if (slWindowSubmitting === true) return;

            var res = true;

            if (jQuery("#sl-action-image-sketch").val() !== "") {
                res = confirm("Are you sure you want to to re-capture this image?  Any annotations will be lost.");
            }

            if (res) {
                jQuery("#sl-action-image").val("");
                jQuery("#sl-action-image-3d").val("");
                jQuery("#sl-action-image-2d").val("");
                jQuery("#sl-action-image-annotated").val("");
                jQuery("#sl-action-image-sketch").val("");

                jQuery("#sl-action-image-status").html( S.getLocalizedString("messageProcessing") );
                
                setTimeout(function() { S.captureImage(); }, 1000);
            }
        });

        jQuery("#sl-action-image-status a.sl-remove").click(function() {
            // Exit if we are submitting
            if (slWindowSubmitting === true) return;

            var res = true;

            if (jQuery("#sl-action-image-sketch").val() !== "") {
                res = confirm("Are you sure you want to to remove this image?  Any annotations will be lost.");
            }

            if (res) {
                jQuery("#sl-action-image").val("");
                jQuery("#sl-action-image-3d").val("");
                jQuery("#sl-action-image-2d").val("");
                jQuery("#sl-action-image-annotated").val("");
                jQuery("#sl-action-image-sketch").val("");

                jQuery("#sl-action-image-status").html( S.getLocalizedString("labelNotApplicable") + ' | <a class="sl-capture" title="' + S.getLocalizedString("actionCaptureTooltip") + '">' + S.getLocalizedString("actionCapture") + '</a>');
                
                jQuery("#sl-action-image-status a.sl-capture").click(function() {
                    jQuery("#sl-action-image-status").html( S.getLocalizedString("messageProcessing") );
                    
                    setTimeout(function() { S.captureImage(); }, 1000);
                });
            }
        });
    };


/**
 * UI:  Show Edit Task Entry Screen
 * ----------------------------------------------------------------------------
 */
    S.prepareTaskActionEditWindow = function(t, e) {
        if (typeof t !== "undefined") {
            // Set window state
            slWindowState = "action-" + t + "-" + e + "-edit";

            // Send content request
            S.getContent("task-action-edit.htm", S.prepareTaskActionEditWindow_Content);
        } else {
            // Invalid task/cube

            alert( S.getLocalizedString("error_cube") );
        }
    };

    S.prepareTaskActionEditWindow_Content = function(data) {
        // Check window state
        var sp = slWindowState.split("-");

        if (sp[0] !== "action" && sp[3] !== "edit") {
            return;
        }

        // Get current task and cell
        var ts = slWindowState.split("-")[1];
        var en = slWindowState.split("-")[2];


        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowEditEntryTitle") + " (" + S.getLocalizedString("labelTask") + " #" + ts + ")" );

        // Perform content specific string replacements
        data = data.replace(/\{task\}/gi, ts);
        data = data.replace(/\{entry\}/gi, en);


        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Prevent keystrokes for notes from bubbling
        jQuery("#sl-action-notes").keydown(function(e) {
            e.stopPropagation();
        });
        
        // Set handlers for buttons
        jQuery("#slPanel button.sl-cancel").click(function() {
            S.navigateWindowHistory(slWindowHistoryPosition);
        });

        jQuery("#slPanel button.sl-submit").click(function() {
            // Set interface
            jQuery("#sl-action-buttons button").prop("disabled", true);
            jQuery("#sl-action-buttons").append("<p>" + S.getLocalizedString("messageSaving") + "</p>");

            // Get current task and cell
            var t = jQuery("#sl-action-task").val();
            var c = jQuery("#sl-action-cell").val();
            var e = jQuery("#sl-action-entry").val();

            // Prepare data object
            var data = {
                cell: c,
                task: t,
                id: e,
                status: jQuery("#sl-action-status").val(),
                issue: jQuery("#sl-action-issue").val(),
                reaped: jQuery("#sl-action-table input:radio[name=reaped]:checked").val(),
                notes: jQuery("#sl-action-notes").val()
            };

            // Initiate request through plugin
            S.postRequest(
                slScoutsLogAPIbase + "task/" + encodeURIComponent(t) + "/action/update",
                "data=" + encodeURIComponent(JSON.stringify(data)),
                S.submitTaskActionCallback
            );
        });

        // Get task summary
        S.getTaskSummary(ts);

        // Initiate data request through plugin
        S.getJSON(
            slScoutsLogAPIbase + "task/" + encodeURIComponent(ts) + "/actions",
            S.getTaskEditEntries_Data
        );
    };

    S.getTaskEditEntries_Data = function(data) {
        // Check window state
        var sp = slWindowState.split("-");

        if (sp[0] !== "action" && sp[3] !== "edit") {
            return;
        }

        // Get current task and cell
        var t = slWindowState.split("-")[1];
        var e = slWindowState.split("-")[2];

        // Get specified entry data
        var entry = jQuery.grep(data.actions, function(a){ return (a.id == e); })[0];

        if (typeof entry !== "undefined") {
            // Populate form with existing data

            jQuery("#sl-action-status").val(entry.status);
            jQuery("#sl-action-issue").val(entry.issue);
            jQuery("#sl-action-notes").val(entry.notes);

            if (entry.image !== "") {
                 jQuery("#sl-action-image-status").html('<a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '"><img src="' + slImages.photo + '" /></a> <a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '">' + S.getLocalizedString("actionPreview") + '</a>');
            } else {
                 jQuery("#sl-action-image-status").html( S.getLocalizedString("labelNotApplicable") );
            }

            if (entry.reaped == 1) {
                jQuery("#sl-action-table input:radio[name=reaped][value=1]").prop("checked", true);
            } else {
                jQuery("#sl-action-table input:radio[name=reaped][value=0]").prop("checked", true);
            }

            jQuery("#sl-action-image-status a.sl-preview").click(function() {
                window.open(entry.image);
            });
        } else {
            // Error

        }
    };


/**
 * UI:  Show annotation preview/image
 * ----------------------------------------------------------------------------
 */
    S.showAnnotation = function() {
        S.getContent("annotation.htm", S.showAnnotation_Content);
    };

    S.showAnnotation_Content = function(data) {
        // Get current task
        var t = jQuery("#slPanel h2 small").text().replace(/[^0-9]+/, "");
        
        // Open a new window/tab
        var w = window.open();

        // Set the captured image
        data = data.replace( "[IMAGE]", jQuery("#sl-action-image").val() );

        // Write content to the new window/tab
        w.document.open();
        w.document.write(data);
        w.document.close();

        // Load existing sketch data
        setTimeout(function() {
            w.load_annotation( jQuery("#sl-action-image-sketch").val() );
        }, 1000);
    };

    S.createAnnotation = function() {
        S.getContent("annotation.htm", S.createAnnotation_Content);
    };

    S.createAnnotation_Content = function(data) {
        // Get current task
        var t = jQuery("#slPanel h2 small").text().replace(/[^0-9]+/, "");
        
        // Open a new window/tab
        var w = window.open();

        // Set the captured image
        data = data.replace( "[IMAGE]", jQuery("#sl-action-image").val() );

        // Write content to the new window/tab
        w.document.open();
        w.document.write(data);
        w.document.close();
    };

    S.saveAnnotation = function(data) {
        // Store annotation data in form
        jQuery("#sl-action-image-annotated").val(data.image);
        jQuery("#sl-action-image-sketch").val(data.sketch);
    };


/**
 * UI: Prepare Window for User Submission History
 * ----------------------------------------------------------------------------
 */


    S.getHistory = function() {
        if (slWindowState !== "history") {
            // Set window state
            slWindowState = "history";
            slHistoryDisplay = 4;
            slHistoryPosition = 0;

            // Send content request
            S.getContent("history.htm", S.getHistory_Content);
        } else {
            // Get additional data for view
            S.getHistory_GetData();
        }
    };

    S.getHistory_Content = function(data) {
        // Check window state
        if (slWindowState !== "history") {
            return;
        }

        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowHistoryTitle") );

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();


        // Set handler for more link
        jQuery("#slPanel div.slPanelContent a.sl-more").click(function() {
            S.getHistory();
        });


        // Set default values
        jQuery("#sl-history-type").val(slHistoryType);
        
        if (slHistoryCell !== 0) {
            jQuery("#sl-history-cell").val(slHistoryCell);
        } else {
            jQuery("#sl-history-cell").val("");
        }
        
        jQuery("#sl-history-accuracy").val(slHistoryAccuracy);
        
        // Prevent bubbling for cell ID
        jQuery("#sl-history-cell").keydown(function(e) {
            e.stopPropagation();
        });
        
        jQuery("#sl-history-cell").keyup(function(e) {
            e.stopPropagation();
        });

        // Set event handlers
        jQuery("#sl-history-refresh").click(function() {
            slHistoryType = jQuery("#sl-history-type").val();

            var c = parseInt(jQuery("#sl-history-cell").val(), 10);
            
            if (isNaN(c)) {
                c = 0;
                jQuery("#sl-history-cell").val("");
            }
            
            slHistoryCell = c;
            slHistoryAccuracy = jQuery("#sl-history-accuracy").val();
            
            slWindowState = "";

            S.getHistory();
        });

        // Get initial data
        S.getHistory_GetData();
    };

    S.getHistory_GetData = function() {
        // Check window state
        if (slWindowState !== "history") {
            return;
        }

        // Generate request URL
        var url = slScoutsLogAPIbase + "history/";
        url += encodeURIComponent(slHistoryPosition) + "/" + encodeURIComponent(slHistoryDisplay);

        if (slHistoryType !== "") {
            url += "/type/" + encodeURIComponent(slHistoryType);
        }
        
        if (slHistoryCell > 0) {
            url += "/cell/" + encodeURIComponent(slHistoryCell);
        }
        
        if (slHistoryAccuracy !== "1") {
            url += "/accuracy/" + encodeURIComponent(slHistoryAccuracy);
        }

        // Initiate request
        S.getJSON(url, S.getHistory_Data);
    };

    S.getHistory_Data = function(data) {
        // Check window state
        if (slWindowState !== "history") {
            return;
        }

        // Update history position
        slHistoryType = data.type;
        slHistoryCell = data.cell;
        slHistoryAccuracy = data.accuracy;
        slHistoryPosition = data.start + data.limit;
        slHistoryDisplay = data.limit;

        // Update window history
        if (slWindowHistoryNavigating === false) {
            var updated = false;

            if (slWindowHistory.length > 0) {
                if (slWindowHistory[slWindowHistoryPosition].state == "history") {
                    // Update current history point

                    slWindowHistory[slWindowHistoryPosition] = {
                        state: slWindowState,
                        data: {
                            historyType: data.type,
                            historyCell: data.cell,
                            historyAccuracy: data.accuracy,
                            historyPosition: data.start + data.limit,
                            historyDisplay: 4
                        }
                    };

                    updated = true;
                }
            }

            if (updated === false) {
                // Create new window history point

                S.pushWindowHistory({
                    state: slWindowState,
                    data: {
                        historyType: data.type,
                        historyCell: data.cell,
                        historyAccuracy: data.accuracy,
                        historyPosition: data.start + data.limit,
                        historyDisplay: 4
                    }
                });
            }
        }

        slWindowHistoryNavigating = false;
        
        // Set default values
        jQuery("#sl-history-type").val(slHistoryType);
        
        if (slHistoryCell !== 0) {
            jQuery("#sl-history-cell").val(slHistoryCell);
        } else {
            jQuery("#sl-history-cell").val("");
        }
        
        jQuery("#sl-history-accuracy").val(slHistoryAccuracy);

        // Display history data
        if (data.tasks.length > 0) {
            for (var i in data.tasks) {
                var h = data.tasks[i];

                var a = h.accuracy * 100;
                a = a.toFixed(2);

                if (a == 100.00) {
                    a = '<span style="color:#0f0;font-weight:bold;">' + a + '%</span>';
                } else if (a >= 90.00) {
                    a = '<span style="color:#0c0;">' + a + '%</span>';
                } else if (a <= 50.00) {
                    a = '<span style="color:#f33;font-weight:bold;">' + a + '%</span>';
                } else {
                    a += '%';
                }

                var cn;

                if (slLocale == "en") {
                    cn = h.cellName;
                } else {
                    cn = h["cellName" + slLocale.toUpperCase()];
                }

                // Check if current user has log entry or watch indicators
                var ent1 = "";
                var ent2 = "";
                
                if (h.has_entries == 1) {
                    ent2 = ' <img src="' + slImages.tick + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconEntries") + '" />';
                }

                if (h.has_watch == 1) {
                    ent2 = ' <img src="' + slImages.magnifier + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconWatch") + '" />';
                }
                
    
                var row = '<tr>';
                row += '<td>' + ent1 + ent2 + h.task + '<br /><a class="sl-task" data-task="' + h.task + '">' + S.getLocalizedString("actionTask") + '</a> | <a class="sl-jump-task" data-task="' + h.task + '">' + S.getLocalizedString("actionJumpTask") + '</a></td>';
                row += '<td>' + h.cell + '<br /><a class="sl-history-cell" data-cell="' + h.cell + '">' + cn + '</a></td>';
                row += '<td>' + h.type + '<br />&nbsp;</td>';


                if (h.type == "reaped") {
                    row += '<td>' + S.getLocalizedString("labelNotApplicable") + '<br />&nbsp;</td>';
                } else if (h.type == "scythed" || h.trailblazer == 1) {
                    row += '<td>' + h.score + ' ' + S.getLocalizedString("labelPoints") + '<br />&nbsp;</td>';
                } else {
                    row += '<td>' + h.score + ' ' + S.getLocalizedString("labelPoints") + '<br />' + a + '</td>';
                }

                row += '<td>' + h.timestamp + '<br />&nbsp;</td>';
                row += '</tr>';

                jQuery("#sl-main-table table tbody").append(row);
            }

            // Scroll to end of history data
            var slpc = jQuery("#slPanel div.slPanelContent")[0];
            slpc.scrollTop = slpc.scrollHeight - slpc.offsetHeight;


            // Check for end of data
            if (data.tasks.length < data.limit) {
                jQuery("#slPanel a.sl-more").remove();
            }
        } else {
            // No more data
            
            jQuery("#slPanel a.sl-more").remove();
        }

        // Set links
        S.setLinks("#slPanel");

        // Reset display value
        slHistoryDisplay = 4;
    };


/**
 * UI: Show Window History Entries
 * ----------------------------------------------------------------------------
 */


    S.getWindowHistory = function() {
        // Set window state
        slWindowState = "window-history";

        // Send content request
        S.getContent("window-history.htm", S.getWindowHistory_Content);
    };

    S.getWindowHistory_Content = function(data) {
        // Check window state
        if (slWindowState !== "window-history") {
            return;
        }

        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowWindowHistoryTitle") );

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();

        // Display window history entries
        jQuery("#sl-main-table table tbody").empty();

        for (var n=slWindowHistory.length-1; n >= 0; n--) {
            // Get history data
            var h = slWindowHistory[n];

            // Get window state
            var sp = h.state.split("-");

            // Determine window title text
            var title = "";

            switch (sp[0]) {
                case "cell":
                    if (sp[1] == "entries") {
                        // Cell Task Summary

                        title = h.data.title;
                    } else {
                        // Cell List

                        title = S.getLocalizedString("windowCellSummary");
                    }

                    break;
                case "history":
                    // User History

                    title = S.getLocalizedString("windowHistoryTitle");

                    break;
                case "mystic":
                    if (sp[1] == "entries" || sp[1] == "tasks") {
                        // Mystic Cell Actions

                        title = h.data.title;
                    } else {
                        // Mystic Cell Summary
                        sp.shift();

                        var st = sp.join("-");

                        if (typeof h.data.title !== "undefined" && h.data.title !== "") {
                            title = h.data.title;
                        } else {
                            title = S.getLocalizedStatus(st);
                        }
                    }

                    break;
                case "status":
                    // Status Summary
                    var hdr = false;

                    sp.shift();

                    if (sp[sp.length - 1] == "header") {
                        sp.pop();
                        hdr = true;
                    }

                    var st = sp.join("-");

                    if (typeof h.data.title !== "undefined" && h.data.title !== "") {
                        title = h.data.title;
                    } else {
                        title = S.getLocalizedStatus(st);
                    }

                    break;
                case "task":
                    // Task Details

                    title = S.getLocalizedString("labelTask") + " #" + sp[1];

                    break;
            }

            // Check if this entry is the current point
            var icon = "";

            if (slWindowHistoryPosition == n) {
                icon = ' <img src="' + slImages.star + '" />';
            }

            var row = '<tr><td><a href="javascript:void(0);" class="sl-history" data-history="' + n + '">' + title + '</a>' + icon + '</td></tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        // Set event handlers
        jQuery("#sl-main-table a.sl-history").click(function() {
             // Get history point
             var p = parseInt(jQuery(this).attr("data-history"), 10);

             // Set history point position
             slWindowHistoryPosition = p;

             // Navigate to history point
             S.navigateWindowHistory(p);
        });

        jQuery("#slPanel button.sl-history-clear").click(function() {
            // Clear history
            S.clearWindowHistory();

            // Refresh screen
            S.getWindowHistory();
        });
    };


/**
 * UI: Get Promotions Screen
 * ----------------------------------------------------------------------------
 */
    S.getPromotions = function() {
        // Set window state
        slWindowState = "promotions";

        // Update window history
        if (slWindowHistoryNavigating === false) {
            S.pushWindowHistory({ state: slWindowState, data: {} });
        }

        slWindowHistoryNavigating = false;

        // Send content request
        S.getContent("promotions.htm", S.getPromotions_Content);
    };

    S.getPromotions_Content = function(data) {
        // Check window state
        if (slWindowState !== "promotions") {
            return;
        }

        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("panelPromotions") );

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").fadeIn();
        jQuery("#slPanelShadow").fadeIn();
    };



/**
 * Get Cube Details Summary
 *
 * Function retrieves the number of log entries for the cube if it is still open
 * ----------------------------------------------------------------------------
 */

    S.getCubeDetailsSummary = function() {
        // Get current cube/task
        var target = S.getTargetCube();

        // Send data request
        if (typeof target.task !== "undefined") {
            S.getJSON(
                slScoutsLogAPIbase + "task/" + target.task + "/actions",
                S.getCubeDetailsSummary_Data
            );
        }
    };

    S.getCubeDetailsSummary_Data = function(data) {
        // Get current cube/task
        var target = S.getTargetCube();

        // Make sure target cube matches the data
        if (data.task == target.task) {
            if (data.status !== "good" && data.status !== "" && data.actions.length > 0) {
                jQuery("#sl-cube-badge").fadeIn();
                jQuery("#sl-cube-badge").text(data.actions.length);
            } else {
                jQuery("#sl-cube-badge").fadeOut();
            }
        }
    };









///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                       WINDOW HISTORY FUNCTIONS                            //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


    /**
     * Clear Window History
     */
    S.clearWindowHistory = function() {
        if (slWindowHistory.length > 0) {
            var cur = slWindowHistory[slWindowHistoryPosition];

            slWindowHistory = [];
            slWindowHistoryPosition = 0;

            slWindowHistory.push(cur);
        } else {
            slWindowHistory = [];
            slWindowHistoryPosition = -1;
        }

        // Update button status
        S.updateWindowHistoryButtons();
    };


    /**
     * Navigate to Window History Point
     *
     * @param p integer History point index
     */
    S.navigateWindowHistory = function(p) {
        if (typeof slWindowHistory[p] !== "undefined") {
            // Set navigating flag
            slWindowHistoryNavigating = true;

            // Get history data
            var h = slWindowHistory[p];

            // Get window state
            var spp = h.state.split(":");
            var sp = spp[0].split("-");

            // Determine navigation function
            switch (sp[0]) {
                case "cell":
                    if (sp[1] == "entries") {
                        // Show Cell Task Summary
                        var c = sp[2];
                        var s = "";

                        if (sp.length > 3) {
                            // Remove cell entry parts
                            sp.shift();
                            sp.shift();
                            sp.shift();

                            // Get status
                            s = sp.join("-");
                        }

                        S.getCellEntries(c, s, spp[1]);
                    } else {
                        // Show Cell List

                        S.getCellList();
                    }

                    break;
                case "history":
                    // Set history view
                    slWindowState = "history";
                    slHistoryType = h.data.historyType;
                    slHistoryCell = h.data.historyCell;
                    slHistoryAccuracy = h.data.historyAccuracy;
                    slHistoryPosition = 0;
                    slHistoryDisplay = h.data.historyPosition;

                    // Send content request
                    S.getContent("history.htm", S.getHistory_Content);

                    break;
                case "mystic":
                    if (sp[1] == "entries") {
                        // Show Mystic Cell Details/Actions

                        var c = sp[2];

                        S.getMysticCellEntries(c);
                    } else if (sp[1] == "tasks") {
                        // Show Mystic Task Summary

                        sp.shift();
                        sp.shift();

                        var st = sp.join("-");

                        // Display status summary
                        S.getMysticStatusSummary(st, spp[1]);

                        break;
                    } else {
                        sp.shift();

                        var st = sp.join("-");

                        // Display mystic summary
                        S.getMysticSummary(st);
                    }

                    break;
                case "status":
                    // Get status value
                    var hdr = false;

                    sp.shift();

                    if (sp[sp.length - 1] == "header") {
                        sp.pop();
                        hdr = true;
                    }

                    var st = sp.join("-");

                    // Display status summary
                    S.getStatusSummary(st, hdr, spp[1]);

                    break;
                case "task":
                    // Display task details
                    S.getTaskEntries(sp[1]);

                    break;
            }

            // Update button status
            S.updateWindowHistoryButtons();
        } else {
            // Error: invalid history position

            console.log("Invalid history position: " + p);
        }
    };


    /**
     * Add Window History Point
     *
     * Supplied object should use the following keys:
     *   state: the window state value
     *   data: object with any additional data needed
     *
     * @param o object Object containing history point details
     */
    S.pushWindowHistory = function(o) {
        // Check if we are not at the most recent point
        // and if so clear any remaining points
        if (slWindowHistoryPosition < (slWindowHistory.length - 1)) {
            slWindowHistory.splice(slWindowHistoryPosition + 1, slWindowHistory.length - slWindowHistoryPosition);
        }

        // See if we have reached the limit for items
        if (slWindowHistory.length == slWindowHistoryLimit) {
            // Remove oldest item

            slWindowHistory.shift();
            slWindowHistoryPosition--;
        }

        // Add history point
        slWindowHistory.push(o);

        // Increment history position
        slWindowHistoryPosition++;

        // Update button status
        S.updateWindowHistoryButtons();

        // Update window timestamp
        slWindowHistoryTimestamp = Date.now();
    };


    /**
     * Update History Buttons Status
     */
    S.updateWindowHistoryButtons = function() {
        if (slWindowHistoryPosition <= 0) {
            jQuery("#slPanel .slPanelHeader a.sl-window-previous").addClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-previous img").attr("src", slImages.previousDisabled);
        } else {
            jQuery("#slPanel .slPanelHeader a.sl-window-previous").removeClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-previous img").attr("src", slImages.previous);
        }

        if (slWindowHistoryPosition == (slWindowHistory.length - 1)) {
            jQuery("#slPanel .slPanelHeader a.sl-window-next").addClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-next img").attr("src", slImages.nextDisabled);
        } else {
            jQuery("#slPanel .slPanelHeader a.sl-window-next").removeClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-next img").attr("src", slImages.next);
        }

        if (slWindowHistory.length > 0) {
            jQuery("#slPanel .slPanelHeader a.sl-window-history").removeClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-history img").attr("src", slImages.history);
        } else {
            jQuery("#slPanel .slPanelHeader a.sl-window-history").addClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-history img").attr("src", slImages.historyDisabled);
        }
    };


    S.isStaleWindow = function() {
        var n = Date.now(),
            t = (n - slWindowHistoryTimestamp) / 1000,
            sp;

        if (slWindowState !== "") {
            sp = slWindowState.split("-");
        } else {
            sp = [""];
        }

        if (t >= slWindowHistoryStale && sp[0] !== "action") {
            return true;
        } else {
            return false;
        }
    };
}

// Create ScoutsLog object and perform initialization
    window.scoutsLog = new ScoutsLogPlatformContent();


    // Inject initialization into page
    var s = document.createElement("script");
    var sc = document.createTextNode("jQuery(document).ready(function() { window.scoutsLog.init(); });");

    s.appendChild(sc);
    
    (document.documentElement).appendChild(s);