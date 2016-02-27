

function ScoutsLogPlatformContent() {
    var S = this;


    this.locale = 'en';
    this.localizedStrings = {};

    this.baseDataURL = '';
    this.images = {};

    this.user = '';
    this.userPrefs = {};
    this.userRoles = [];
    
    this.windowState = '';

    this.windowHistory = [];
    this.windowHistoryPosition = -1;
    this.windowHistoryNavigating = false;

    this.panelVertical = false;
    this.panelPosition = {};

    this.statsInterval = 20000;
    this.taskInterval = 15000;

    this.historyType = '';
    this.historyCell = 0;
    this.historyAccuracy = 1;
    this.historyPosition = 0;
    this.historyDisplay = 4;

    this.scoutsLogURIbase = 'http://scoutslog.org/1.1/';



    /**
     * Receive Routed Message
     *
     * This function accepts a dispatched event object from the plugin
     * script and executes the specified 'callback' function.
     */
    S.receiveMessage = function(e) {
        // Extract message parameters
        var dst = e.detail.destination;
        var data = e.detail.data;

        if (dst != "") {
            if (typeof S[dst] == "function") {
                S[dst](data);
            } else {
                // Error: Unknown callback
                console.log("Unknown callback function: " + dst.toString() );
            }
        }
    }

    document.addEventListener('RoutedMessageCS', S.receiveMessage);


    /**
     * Send Routed Message
     * 
     * This function routes a message from the main page script
     * to the main content script.
     */
    S.sendMessage = function(dst, data, callback) {
        var d = {detail: {
            destination: dst,
            data: data,
            callback: callback
        }};
        
        var ev = new CustomEvent('RoutedMessagePS', d);
        
        document.dispatchEvent(ev);
    }


    /**
     * Get Localized String Text
     *
     * This function retrieve the translated text for a given
     * localized key name.
     */
    S.getLocalizedString = function(key) {
        if (S.localizedStrings[key]) {
            return S.localizedStrings[key];
        } else {
            return '__' + key + '__';
        }
    }


    /**
     * Get Content Template
     *
     * This function retrieves the text of a content template file
     * and sends the text to the specified callback function.
     *
     * The returned text is already processed for localized strings.
     */
    S.getContent = function(name, callback) {
        S.sendMessage(
            "getContent",
            { name: name },
            callback
        );
    }


    /**
     * Error Handler
     *
     * This function is executed when a platform request has failed.
     */
    S.platformError = function(data) {
        console.log("Platform Error: source: " + data.source + "; status: " + data.status + "; url: " + data.url + ";");

        var ev = new CustomEvent('PlatformContentError', {detail: data});

        document.dispatchEvent(ev);
    }




///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                MAIN EXTENSION INITIALIZATION FUNCTIONS                    //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


    /**
     * Initialize Localization Strings
     *
     * This function loads locale data for the currently
     * specified language/locale.
     */
    S.init_locale = function(data) {
        // Store localized strings
        S.localizedStrings = data;
        
        // Begin user registration process
        S.sendMessage("register", {}, "");
    }


    /**
     * Display Authorization Message
     * 
     * This function is triggered in response to 'register'
     * when the user is not authorized for the application.
     */
    S.slew_auth = function() {
        S.getContent("auth.htm", "slew_auth_content");
    }

    S.slew_auth_content = function(data) {
        jQuery("#content .gameBoard").append(data);
    }


    /**
     * Display Extension Update Message
     * 
     * This function is triggered in response to 'register'
     * when the extension is out of date.
     */
    S.slew_update = function(e) {
        S.getContent("update.htm", "slew_update_content");
    }

    S.slew_update_content = function(data) {
        jQuery("#content .gameBoard").append(data);

        jQuery('#scoutsLogAuthPanel a.sl-cell').click(function() {
            jQuery('#scoutsLogAuthPanel').remove();
        });
    }


    /**
     * Extension Initialization
     * 
     * This function is triggered in response to 'register'
     * when all pre-checks have been passed.
     * This function initializes the local page object and
     * creates the UI.
     */
    S.slew_init = function(msg) {
        // Store extension details
        S.baseDataURL = msg.baseDataURL;
        S.locale = msg.locale;
        S.user = msg.user;
        S.userPrefs = msg.userPrefs;
        S.userRoles = msg.userRoles;

        // Begin creating UI elements
        S.init_ui();
    }








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
        jQuery(window).on(InspectorPanel.Events.ModelFetched, function(d) {
            var ea = jQuery("#gameControls #editActions").length;
            var ci = jQuery("#gameControls #cubeInspector").length;
            var ra = jQuery("#gameControls #realActions").length;
            var td = false;
            
            if (ea > 0 || ci > 0) {
                jQuery('#sl-task-details').show();
                jQuery('#sl-task-entry').show();

                td = true;
            } else if (ra > 0) {
                jQuery('#sl-task-details').show();
                jQuery('#sl-task-entry').hide();

                td = true;
            }

            if (td == true) {
                S.getCubeDetailsSummary();
            }
        });
        
        // Hook window resize event for main window 
        jQuery(window).resize(function() {                    
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

            S.panelPosition = {top: t, left: l};

            jQuery("#scoutsLogFloatingControls").css("top", t).css("left", l);

            S.sendMessage(
                "setPosition",
                { position: S.panelPosition, vertical: S.panelVertical },
                ""
            );
        });
        
        // Hook document keypress
        jQuery(window).keyup(function(k) {
            if (k.keyCode === Keycodes.codes.esc) {
                if (jQuery("#slPanel").is(":visible")) {
                    jQuery("#slPanel").hide();
                    jQuery("#slPanelShadow").hide();
                }
                
                if (jQuery("#sl-task-details").is(":visible")) {
                    jQuery("#sl-task-details").hide();
                    jQuery("#sl-task-entry").hide();
                    jQuery("#sl-cube-badge").hide();
                }
                
                S.flagEditActions = false;
                S.flagRealActions = false;
            } else if (k.keyCode === Keycodes.codes.l && (k.metaKey || k.altKey)) {
                // Toggle scouts" log panel display

                if (S.windowState != "") {
                    if (jQuery("#slPanel").is(":visible")) {
                        jQuery("#slPanel").hide();
                        jQuery("#slPanelShadow").hide();
                        jQuery("#scoutsLogFloatingControls").hide();
                    } else {
                        if (S.windowState == "history" && S.historyPosition == S.historyDisplay) {
                            S.windowState = "";

                            S.getHistory();
                        }

                        jQuery("#slPanel").show();
                        jQuery("#slPanelShadow").show();
                        jQuery("#scoutsLogFloatingControls").show();
                    }
                } else {
                    if (jQuery("#scoutsLogFloatingControls").is(":visible")) {
                        jQuery("#scoutsLogFloatingControls").hide();
                    } else {
                        jQuery("#scoutsLogFloatingControls").show();
                    }
                }
            }
        });


        // Create listener for cube submission data
        jQuery(document).on("cube-submission-data", function(e, data) {
            // Get current cube/task
            var target = S.getTargetCube();

            // Update data object
            if (typeof target.task != "undefined" && typeof target.cell != "undefined") {
                data.cell = target.cell;
                data.task = target.task;

                var dt = new Date();
                data.timestamp = dt.toLocaleString();

                // Send submission data to server
                S.sendMessage(
                    "postRequest",
                    {
                        url: S.scoutsLogURIbase + "task/" + encodeURIComponent(target.task) + "/submit",
                        data: "data=" + encodeURIComponent(JSON.stringify(data))
                    },
                    ""
                );
            }
        });
        
        
        // Load resources
        S.loadImages();

        // Load UI
        S.setMainPanel();
        S.setFloatingPanel();
        S.setGameTools();
        S.setSettingsPanel();
    }


    /**
     * Load Image Resources
     *
     * This function creates an array of extension URLs
     * for common images.
     */
    S.loadImages = function() {
        S.images = {
            close: S.baseDataURL + "images/close.png",
            delete: S.baseDataURL + "images/delete.png",
            error: S.baseDataURL + "images/error.png",
            history: S.baseDataURL + "images/history.png",
            historyDisabled: S.baseDataURL + "images/history-disabled.png",
            lock: S.baseDataURL + "images/lock.png",
            logo: S.baseDataURL + "images/icon48.png",
            logoSmall: S.baseDataURL + "images/icon32.png",
            magnifier: S.baseDataURL + "images/magnifier.png",
            next: S.baseDataURL + "images/next.png",
            nextDisabled: S.baseDataURL + "images/next-disabled.png",
            pencil: S.baseDataURL + "images/pencil.png",
            photo: S.baseDataURL + "images/photo.png",
            previous: S.baseDataURL + "images/previous.png",
            previousDisabled: S.baseDataURL + "images/previous-disabled.png",
            refresh: S.baseDataURL + "images/arrow_refresh.png",
            star: S.baseDataURL + "images/bullet_star.png",
            tick: S.baseDataURL + "images/tick.png"
        };
    }


    /**
     * UI: Create Main Window
     */
    S.setMainPanel = function() {
        S.getContent("panel-main.htm", "setMainPanel_Content");
    }

    S.setMainPanel_Content = function(data) {
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
            stop, resize: function(e, ui) {
                var h = jQuery("#slPanel").height() - 71;

                jQuery("#slPanel div.slPanelContent").height(h);
            }
        });

        // Set initial height on panel content
        var h = jQuery("#slPanel").height() - 71;
        jQuery("#slPanel div.slPanelContent").height(h);

        // Set event handler for close button
        jQuery("#slPanel a.sl-close-window, #slPanelShadow").click(function() {
            if (S.windowState == "error") {
                S.windowState = "";
                jQuery("#slPanelError").hide();
            } else {
                jQuery("#slPanel").hide();
            }

            jQuery("#slPanelShadow").hide();
        });

        // Set event handlers for window history buttons
        jQuery("#slPanel a.sl-window-previous").click(function() {
            if (jQuery(this).hasClass("disabled") == false) {
                // Update window history position
                if (S.windowHistoryPosition > 0) {
                    var p = S.windowHistoryPosition;
                    p--;
                    S.windowHistoryPosition = p;

                    // Navigate to history point
                    S.navigateWindowHistory(p);
                }
            }
        });

        jQuery("#slPanel a.sl-window-next").click(function() {
            if (jQuery(this).hasClass("disabled") == false) {
                // Update window history position
                if (S.windowHistoryPosition < S.windowHistory.length) {
                    var p = S.windowHistoryPosition;
                    p++;
                    S.windowHistoryPosition = p;

                    // Navigate to history point
                    S.navigateWindowHistory(p);
                }
            }
        });

        jQuery("#slPanel a.sl-window-history").click(function() {
            if (jQuery(this).hasClass("disabled") == false) {
                if (S.windowState == "window-history") {
                    S.navigateWindowHistory(S.windowHistoryPosition);
                } else {
                    S.getWindowHistory();
                }
            }
        });
    }


    /**
     * UI: Create Floating Panel
     */
    S.setFloatingPanel = function() {
        S.sendMessage("getPosition", {}, "setFloatingPanel_Position");
    }

    S.setFloatingPanel_Position = function(data) {
        if (data.position) {
            var t = data.position.top;
            var l = Math.abs(data.position.left);

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

            S.panelPosition = {top: t, left: l};

            if (data.position.vertical) {
                S.panelVertical = true;
            }
        }

        if (S.panelVertical == true) {
            S.getContent("panel-floating-vertical.htm", "setFloatingPanel_Content");
        } else {
            S.getContent("panel-floating-horizontal.htm", "setFloatingPanel_Content");
        }
    }

    S.setFloatingPanel_Content = function(data) {
        // Generate CSS for panel position
        var style = ' style="top:' + S.panelPosition.top + 'px;left:' + S.panelPosition.left + 'px;"';
            
        if (S.panelVertical == true) {
            style += ' class="sl-vertical"';
        }

        // Perform content-specific string replacements
        data = data.replace(/{style}/gi, style);

        // Add panel to game board
        jQuery("body").append(data);

        // Set floating panel to be draggable
        jQuery("#scoutsLogFloatingControls").draggable({
            containment: 'window',
            stop: function(e, ui) {
                jQuery("#scoutsLogFloatingControls").css("width", "");

                if (ui.position.top < 0) {
                    ui.position.top = 0;

                    jQuery("#scoutsLogFloatingControls").css("top", ui.position.top);
                }

                // Update position in settings
                S.panelPosition = ui.position;
                S.panelVertical = jQuery('#scoutsLogFloatingControls').hasClass('sl-vertical');

                S.sendMessage(
                    "setPosition",
                    { position: S.panelPosition, vertical: S.panelVertical },
                    ""
                );
            }
        });

        // Event Handler:  Icon Double Click
        jQuery('#scoutsLogFloatingControls img').dblclick(function() {
            // Toggle floating panel display
            
            if (jQuery('#scoutsLogFloatingControls').hasClass('sl-vertical')) {
                jQuery('#scoutsLogFloatingControls').removeClass('sl-vertical');
        
                jQuery('#scoutsLogFloatingControls a.sl-cell-list').html( S.getLocalizedString("panelCellList") );
                jQuery('#scoutsLogFloatingControls a.sl-open').html( S.getLocalizedString("panelOpen") + ' <span id="sl-open-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-need-admin').html( S.getLocalizedString("panelNeedAdmin") + ' <span id="sl-need-admin-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-need-scythe').html( S.getLocalizedString("panelNeedScythe") + ' <span id="sl-need-scythe-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-watch').html( S.getLocalizedString("panelWatch") + ' <span id="sl-watch-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-history').html( S.getLocalizedString("panelHistory") );
                jQuery('#scoutsLogFloatingControls #sl-task-details').html( S.getLocalizedString("panelTaskDetails") );
                jQuery('#scoutsLogFloatingControls #sl-task-entry').html( S.getLocalizedString("panelTaskEntry") );
            } else {
                jQuery('#scoutsLogFloatingControls').addClass('sl-vertical');

                jQuery('#scoutsLogFloatingControls a.sl-cell-list').html( S.getLocalizedString("panelCellListShort") );
                jQuery('#scoutsLogFloatingControls a.sl-open').html( S.getLocalizedString("panelOpenShort") + ' <span id="sl-open-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-need-admin').html( S.getLocalizedString("panelNeedAdminShort") + ' <span id="sl-need-admin-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-need-scythe').html( S.getLocalizedString("panelNeedScytheShort") + ' <span id="sl-need-scythe-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-watch').html( S.getLocalizedString("panelWatchShort") + ' <span id="sl-watch-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-history').html( S.getLocalizedString("panelHistoryShort") );
                jQuery('#scoutsLogFloatingControls #sl-task-details').html( S.getLocalizedString("panelTaskDetailsShort") );
                jQuery('#scoutsLogFloatingControls #sl-task-entry').html( S.getLocalizedString("panelTaskEntryShort") );
            }

            // Update position in settings
            S.panelVertical = jQuery('#scoutsLogFloatingControls').hasClass('sl-vertical');

            S.sendMessage(
                "setPosition",
                { position: S.panelPosition, vertical: S.panelVertical },
                ""
            );
            
            // Set timer to update panel stats
            window.scoutsLog.doPanelStats();
        });
        
        // Add individual button event handlers
        jQuery('#scoutsLogFloatingControls a.sl-cell-list').click(S.showCells);
        jQuery('#scoutsLogFloatingControls a.sl-open').click(S.showOpen);
        jQuery('#scoutsLogFloatingControls a.sl-need-admin').click(S.showAdmin);
        jQuery('#scoutsLogFloatingControls a.sl-need-scythe').click(S.showScythe);
        jQuery('#scoutsLogFloatingControls a.sl-watch').click(S.showWatch);
        jQuery('#scoutsLogFloatingControls a.sl-history').click(S.showHistory);

        // Task details button event handler
        jQuery('#sl-task-details').click(function() {
            // Get current cube/task
            var target = S.getTargetCube();

            var test = 'task-' + target.task;
            
            // Check window state
            if (window.scoutsLog.windowState == test || window.scoutsLog.windowState == 'task') {
                // Same task window is open, close instead
                
                if (jQuery('#slPanel').is(':visible')) {
                    jQuery('#slPanel').hide();
                    jQuery('#slPanelShadow').hide();
                } else {
                    jQuery('#slPanel').show();
                    jQuery('#slPanelShadow').show();
                }
            } else {
                // Show log entries for currently selected cube
                window.scoutsLog.getTaskEntriesInspect();
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
        setInterval(function() {
            if (S.windowState != "error") {
                S.doPanelStats();
            }
        }, S.statsInterval);
        
        S.doPanelStats();

        // Set initial button state
        S.doPanelButtonState();
    }


    /**
     * Update Floating Panel Buttons
     */
    S.doPanelButtonState = function() {
        // Get user preferences
        if (typeof S.userPrefs["display-cell-list"] != "undefined") {
            var cl = (S.userPrefs["display-cell-list"] == true) ? true : false;
        } else {
            var cl = false;
        }

        if (typeof S.userPrefs["display-open-tasks"] != "undefined") {
            var ot = (S.userPrefs["display-open-tasks"] == true) ? true : false;
        } else {
            var ot = true;
        }

        if (typeof S.userPrefs["display-need-admin"] != "undefined") {
            var na = (S.userPrefs["display-need-admin"] == true) ? true : false;
        } else {
            var na = true;
        }

        if (typeof S.userPrefs["display-need-scythe"] != "undefined") {
            var ns = (S.userPrefs["display-need-scythe"] == true) ? true : false;
        } else {
            var ns = true;
        }

        if (typeof S.userPrefs["display-watch"] != "undefined") {
            var wt = (S.userPrefs["display-watch"] == true) ? true : false;
        } else {
            var wt = true;
        }

        if (typeof S.userPrefs["display-history"] != "undefined") {
            var hs = (S.userPrefs["display-history"] == true) ? true : false;
        } else {
            var hs = true;
        }


        // Update button states
        if (cl == true) {
            jQuery("#scoutsLogFloatingControls a.sl-cell-list").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-cell-list").addClass("hidden");
        }

        if (ot == true) {
            jQuery("#scoutsLogFloatingControls a.sl-open").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-open").addClass("hidden");
        }

        if (na == true) {
            jQuery("#scoutsLogFloatingControls a.sl-need-admin").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-need-admin").addClass("hidden");
        }

        if (ns == true) {
            jQuery("#scoutsLogFloatingControls a.sl-need-scythe").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-need-scythe").addClass("hidden");
        }

        if (wt == true) {
            jQuery("#scoutsLogFloatingControls a.sl-watch").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-watch").addClass("hidden");
        }

        if (hs == true) {
            jQuery("#scoutsLogFloatingControls a.sl-history").removeClass("hidden");
        } else {
            jQuery("#scoutsLogFloatingControls a.sl-history").addClass("hidden");
        }

    }


    /**
     * Update Floating Panel Stats Values
     */
    S.doPanelStats = function() {
        S.sendMessage(
            "getJSON",
            { url: S.scoutsLogURIbase + "stats/header" },
            "doPanelStatsCallback"
        );
    }
    
    /**
     * Callback: Update Floating Panel Stats Values
     */
    S.doPanelStatsCallback = function(D) {
        var a = D['task_summary']['need-admin'].tasks;
        var s = D['task_summary']['need-scythe'].tasks;
        s += D['task_summary']['missing-nub'].tasks;
        s += D['task_summary']['missing-branch'].tasks;
        s += D['task_summary']['merger'].tasks;
        s += D['task_summary']['scythe-complete'].tasks;
        var w = D['task_summary'].watch.tasks;
        var o = D['tasks'];

        if (a > 0) {
            var c = parseInt(jQuery('#sl-need-admin-badge').text(), 10);

            if (c != a) {
                jQuery('#sl-need-admin-badge').show().text(a);
                jQuery('#sl-need-admin-badge').fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
            }
        } else {
            jQuery('#sl-need-admin-badge').hide().text(0);
        }

        if (s > 0) {
            var c = parseInt(jQuery('#sl-need-scythe-badge').text(), 10);

            if (c != s) {
                jQuery('#sl-need-scythe-badge').show().text(s);
                jQuery('#sl-need-scythe-badge').fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
            }
        } else {
            jQuery('#sl-need-scythe-badge').hide().text(0);
        }

        if (w > 0) {
            var c = parseInt(jQuery('#sl-watch-badge').text(), 10);

            if (c != w) {
                jQuery('#sl-watch-badge').show().text(w);
                jQuery('#sl-watch-badge').fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
            }
        } else {
            jQuery('#sl-watch-badge').hide().text(0);
        }

        if (o > 0) {
	    var c = parseInt(jQuery('#sl-open-badge').text(), 10);

            if (c != o) {
                jQuery('#sl-open-badge').show().text(o);
                jQuery('#sl-open-badge').fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
            }
        } else {
            jQuery('#sl-open-badge').hide().text(0);
        }
	
    }


    /**
     * UI: Create Window Display Toggle Button
     */
    S.setGameTools = function() {
        var button = '<div title="' + S.getLocalizedString("actionShowWindowTooltip") + '" id="scoutsLogPanelButton" class="menuButton"><img src="' + S.images.logo + '" height="20" width="20" alt="' + S.getLocalizedString("actionShowWindowTooltip") + '" /></div>';

        jQuery("#gameTools").append(button);

        jQuery('#scoutsLogPanelButton').click(function() {
            if (S.windowState == "error") { return; }

            if (S.windowState != "") {
                if (jQuery("#slPanel").is(":visible")) {
                    jQuery("#slPanel").hide();
                    jQuery("#slPanelShadow").hide();
                    jQuery("#scoutsLogFloatingControls").hide();
                } else {
                    if (S.windowState == "history" && S.historyPosition == S.historyDisplay) {
                        S.windowState = "";

                        S.getHistory();
                    }

                    jQuery("#slPanel").show();
                    jQuery("#slPanelShadow").show();
                    jQuery("#scoutsLogFloatingControls").show();
                }
            } else {
                if (jQuery("#scoutsLogFloatingControls").is(":visible")) {
                    jQuery("#scoutsLogFloatingControls").hide();
                } else {
                    jQuery("#scoutsLogFloatingControls").show();
                }
            }
        });
    }


    /**
     * Button: Display Cell List
     */
    S.showCells = function() {
        if (S.windowState != "cell") {
            S.getCellList();
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").hide();
                jQuery("#slPanelShadow").hide();
            } else {
                jQuery("#slPanel").show();
                jQuery("#slPanelShadow").show();
            }
        }
    }


    /**
     * Button: Display Open Tasks List
     */
    S.showOpen = function() {
        if (S.windowState != "status-open") {
            S.getStatusSummary("open", false);
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").hide();
                jQuery("#slPanelShadow").hide();
            } else {
                jQuery("#slPanel").show();
                jQuery("#slPanelShadow").show();
            }
        }
    }
    

    /**
     * Button: Display 'Need Admin' Tasks
     */
    S.showAdmin = function() {
        if (S.windowState != "status-need-admin") {
            S.getStatusSummary("need-admin", false);
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").hide();
                jQuery("#slPanelShadow").hide();
            } else {
                jQuery("#slPanel").show();
                jQuery("#slPanelShadow").show();
            }
        }
    }
    

    /**
     * Button: Display 'Need Scythe' Tasks
     */
    S.showScythe = function() {
        if (S.windowState != "status-need-scythe") {
            S.getStatusSummary("need-scythe", true);
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").hide();
                jQuery("#slPanelShadow").hide();
            } else {
                jQuery("#slPanel").show();
                jQuery("#slPanelShadow").show();
            }
        }
    }
    

    /**
     * Button: Display 'Watch List' Tasks
     */
    S.showWatch = function() {
        if (S.windowState != "status-watch") {
            S.getStatusSummary("watch", false);
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").hide();
                jQuery("#slPanelShadow").hide();
            } else {
                jQuery("#slPanel").show();
                jQuery("#slPanelShadow").show();
            }
        }
    }


    /**
     * Button: Display User Submission History
     */
    S.showHistory = function() {
        if (S.windowState != "history") {
            S.getHistory();
        } else {
            if (jQuery("#slPanel").is(":visible")) {
                jQuery("#slPanel").hide();
                jQuery("#slPanelShadow").hide();
            } else {
                if (S.historyPosition == S.historyDisplay) {
                    S.windowState ="";

                    S.getHistory();
                }

                jQuery("#slPanel").show();
                jQuery("#slPanelShadow").show();
            }
        }
    }


    /**
     * UI: Set Settings Panel Items
     *
     * This function loads settings for application within the EyeWire settings panel
     */
    S.setSettingsPanel = function() {
        // Send content request
        S.getContent("settings.htm", "setSettingsPanel_Content");
    }

    S.setSettingsPanel_Content = function(data) {
        // Save content to settings panel
        jQuery("#settingsMenu").append(data);

        // Apply UI functionality
	jQuery("#settingsMenu .sl-setting-group [prefcheck]").checkbox().each(function() {
            var t = jQuery(this).find("[prefcheck]");
            var p = t.attr("prefcheck").split("_")[1];

            if (typeof S.userPrefs[p] != "undefined") {
                t.prop("checked", S.userPrefs[p]);
                
                if (S.userPrefs[p] == true) {
                    jQuery(this).removeClass("off").addClass("on");
                } else {
                    jQuery(this).removeClass("on").addClass("off");
                }
            }
        });

        jQuery("#settingsMenu .sl-setting-group [prefcheck]").change(function(e) {
            e.stopPropagation();

            var t = jQuery(this);

            var p = t.attr("prefcheck").split("_")[1];
            S.userPrefs[p] = t.is(":checked");

            S.sendMessage("setUserPrefs", S.userPrefs, "");

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

    }









///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                    USER INTERFACE UTILITY FUNCTIONS                       //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////



    /**
     * Utils: Set Links for Common Items
     */
    S.setLinks = function(o) {
        jQuery(o).find(".sl-jump-task").each(function() {
            var task = jQuery(this).attr("data-task");

            var p = jQuery(this);
            
            p.attr( "title", S.getLocalizedString("actionJumpTaskTooltip") );
            
            p.click(function() {
                // Hide main panel
                jQuery("#slPanel").hide();
                jQuery("#slPanelShadow").hide();

                // Get cube details and jump
                jQuery.getJSON("/1.0/task/" + task).done(function(d) {
                    if (!d.data.channel.metadata) {
                        return;
                    }

                    var am = window.tomni.getCurrentCell();

                    if (am) {
                        am.killPendingCubeSelection();
                    }

                    if (window.tomni.gameMode) {
                        window.tomni.leave();
                    } else {
                        window.tomni.threeD.setTarget(null);
                        window.tomni.ui.setControls(4);
                    }

                    window.tomni.ui.jumpToTask(d);
                });               
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

        jQuery(o).find("a.sl-history-cell").each(function() {
            var c = jQuery(this).attr("data-cell");
            
            jQuery(this).attr( "title", S.getLocalizedString("actionCellTooltip") );
            
            jQuery(this).click(function() {    
                S.historyCell = c;
                S.windowState = "";

                S.getHistory();
            });
        });
        
    }


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
            case "need-scythe":
                result = S.getLocalizedString("statusNeedScythe");
                
                break;
            case "note":
                result = S.getLocalizedString("statusNote");;

                break;
            case "open":
                result = S.getLocalizedString("statusOpen");;

                break;
            case "scythe-complete":
                result = S.getLocalizedString("statusScytheComplete");;

                break;
            case "still-growing":
                result = S.getLocalizedString("statusStillGrowing");;

                break;
            case "subtree-complete":
                result = S.getLocalizedString("statusSubtreeComplete");;

                break;
            case "watch":
                result = S.getLocalizedString("statusWatch");
                
                break;
            default:
                result = S.getLocalizedString("statusOpen");;

                break;
        }

        return result;
    }


    /**
     * Utils: Get Issue Indicator Text
     */
    S.getLocalizedStatusIssue = function(issue) {
        var result = "";

        switch (issue) {
            case "ai-merger":
                result = S.getLocalizedString("issueAIMerger");

                break;
            case "blackspill":
                result = S.getLocalizedString("issueBlackSpill");

                break;
            case "duplicate":
                result = S.getLocalizedString("issueDuplicate");

                break;
            case "inter-duplicate":
                result = S.getLocalizedString("issueInterHalfDuplicate");

                break;
            case "wrong-parent":
                result = S.getLocalizedString("issueWrongParent");

                break;

        }

        return result;
    }


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
    }








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
        S.windowState = "cell";

        // Update window history
        if (S.windowHistoryNavigating == false) {
            S.pushWindowHistory({ state: S.windowState, data: {} });
        }

        S.windowHistoryNavigating = false;

        // Send content request
        S.getContent("cell-list.htm", "getCellList_Content");
    }

    S.getCellList_Content = function(data) {
        // Check window state
        if (S.windowState != "cell") {
            return;
        }

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").show();
        jQuery("#slPanelShadow").show();

        // Send data request through plugin
        S.sendMessage(
            "getJSON",
            { url: S.scoutsLogURIbase + "stats" },
            "getCellList_Data"
        );
    }

    S.getCellList_Data = function(data) {
        // Check window state
        if (S.windowState != "cell") {
            return;
        }

        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowCellSummary") );
        jQuery("#sl-main-table table tbody").empty();

        for (var c in data["cell_summary"]) {
            var s = data["cell_summary"][c];

            var cn;

            if (S.locale == "en") {
                cn = s.cellName;
            } else {
                cn = s["cellName" + S.locale.toUpperCase()];
            }

            var row = '<tr>';
            row += '<td><a class="sl-cell" data-cell="' + s.cell + '">' + cn + ' (' + s.cell + ')</a></td>';
            row += '<td>' + s.tasks + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        S.setLinks("#slPanel");
    }


/**
 * UI: Get Status Summary
 * ----------------------------------------------------------------------------
 */
    S.getStatusSummary = function(s, h) {
        // Get window subtitle
        var status = S.getLocalizedStatus(s);
        
        if (status != "") {
            // Update window state
            S.windowState = "status-" + s;

            if (h == true) {
                S.windowState += "-header";
            }

            // Update window history
            if (S.windowHistoryNavigating == false) {
                S.pushWindowHistory({ state: S.windowState, data: {} });
            }

            S.windowHistoryNavigating = false;

            // Send content request
            S.getContent("cell-summary.htm", "getStatusSummary_Content");
        }
    }

    S.getStatusSummary_Content = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "status") {
            return;
        }

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").show();
        jQuery("#slPanelShadow").show();

        // Generate data URL
        var url = S.scoutsLogURIbase + "status/";
        var sp = S.windowState.split("-");
        sp.shift();

        var st;

        if (sp[sp.length - 1] == "header") {
             sp.pop();

             st = sp.join("-");

             url += st;
             url += "/header";
        } else {
             st = sp.join("-");

             url += st;
        }

        // Update window state
        S.windowState = "status-" + st;
            
        // Set window title
        var status = S.getLocalizedStatus(st);
        jQuery("#slPanel h2 small").html(status);

        // Send data request through plugin
        S.sendMessage(
            "getJSON",
            { url: url },
            "getStatusSummary_Data"
        );
    }

    S.getStatusSummary_Data = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "status") {
            return;
        }

        jQuery("#sl-main-table table tbody").empty();

        for (var c in data.tasks) {
            var s = data.tasks[c];

            // Determine cell name
            var cn;

            if (S.locale == "en") {
                cn = s.cellName;
            } else {
                cn = s["cellName" + S.locale.toUpperCase()];
            }

            // Check if current user has log entry or watch indicators
            var ent1 = "";
            var ent2 = "";
            
            if (s.has_entries == 1) {
                ent2 = ' <img src="' + S.images.tick + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconEntries") + '" />';
            }

            if (s.has_watch == 1) {
                ent2 = ' <img src="' + S.images.magnifier + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconWatch") + '" />';
            }
            
            if (s.mismatched == 1) {
                ent1 = ' <img src="' + S.images.error + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconError") + '" />';
            }

            // Check for status issue indicator
            var st = S.getLocalizedStatus(s.status);

            if (s.issue != "" && s.issue != null) {
                st += " / " + S.getLocalizedStatusIssue(s.issue);
            }
            
            var row = '<tr>';
            row += '<td><a class="sl-task" data-task="' + s.task + '">' + s.task + '</a> | <a class="sl-jump-task" data-task="' + s.task + '">' + S.getLocalizedString("actionJumpTask") + '</a>' + ent1 + ent2 + '</td>';
            row += '<td><a class="sl-cell" data-cell="' + s.cell + '">' + cn + ' (' + s.cell + ')</a></td>';
            row += '<td class="sl-' + s.status + '">' + st + '</td>';
            row += '<td>' + s.lastUser + '</td>';
            row += '<td>' + s.lastUpdated + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        S.setLinks("#slPanel");
    }


/**
 * UI: Get Cell Task Entries
 * ----------------------------------------------------------------------------
 */
    S.getCellEntries = function(c, s) {
        // Set window state
        S.windowState = "cell-entries-" + c;

        if (typeof s != "undefined" && s != "") {
            S.windowState += "-" + s;
        }

        // Send content request
        S.getContent("cell-tasks.htm", "getCellEntries_Content");
    }

    S.getCellEntries_Content = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "cell" && sp[1] != "entries") {
            return;
        }

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").show();
        jQuery("#slPanelShadow").show();

        // Get state options
        var sp = S.windowState.split("-");
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

        // Update status display
        jQuery("#slPanel div.slOptions select").val(s);

        // Set handler for display option dropdown
        jQuery("#slPanel div.slOptions select").change(function() {
            var cell = window.scoutsLog.windowState.split("-")[2];
            var status = jQuery("#slPanel div.slOptions select").val();
            
            S.getCellEntries(cell, status);
        });

        // Build data URl
        var url = S.scoutsLogURIbase + "cell/" + encodeURIComponent(c) + "/tasks";

        if (s != "") {
            url += "/status/" + encodeURIComponent(s);
        }

        // Send data request through plugin
        S.sendMessage(
            "getJSON",
            { url: url },
            "getCellEntries_Data"
        );
    }

    S.getCellEntries_Data = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "cell" && sp[1] != "entries" && sp[2] != data.cell) {
            return;
        }

        var cn;

        // Set window title
        if (S.locale == "en") {
            cn = data.cellName;
        } else {
            cn = data["cellName" + S.locale.toUpperCase()];
        }

        jQuery("#slPanel h2 small").text(cn + " (" + data.cell + ")");

        // Update window history
        if (S.windowHistoryNavigating == false) {
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

            S.pushWindowHistory({ state: S.windowState, data: {title: cn + " (" + data.cell + ") - " + sts} });
        }

        S.windowHistoryNavigating = false;

        jQuery("#sl-main-table table tbody").empty();

        if (data.tasks.length > 0) {    
            for (var c in data.tasks) {
                var s = data.tasks[c];

                // Check if current user has log entry or watch indicators
                var ent1 = "";
                var ent2 = "";
                
                if (s.has_entries == 1) {
                    ent2 = ' <img src="' + S.images.tick + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconEntries") + '" />';
                }

                if (s.has_watch == 1) {
                    ent2 = ' <img src="' + S.images.magnifier + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconWatch") + '" />';
                }
                
                if (s.mismatched == 1) {
                    ent1 = ' <img src="' + S.images.error + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconError") + '" />';
                }

                // Check for status issue indicator
                var st = S.getLocalizedStatus(s.status);

                if (s.issue != "" && s.issue != null) {
                    st += " / " + S.getLocalizedStatusIssue(s.issue);
                }
    
                var row = '<tr>';
                row += '<td><a class="sl-task" data-task="' + s.task + '">' + s.task + '</a> | <a class="sl-jump-task" data-task="' + s.task + '">' + S.getLocalizedString("actionJumpTask") + '</a>' + ent1 + ent2 + '</td>';
                row += '<td class="sl-' + s.status + '">' + st + '</td>';
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
    }


/**
 * UI: Get Task Details
 * ----------------------------------------------------------------------------
 */


    S.getTaskEntries = function(t) {
        // Update window state
        S.windowState = "task-" + t;

        // Update window history
        if (S.windowHistoryNavigating == false) {
            S.pushWindowHistory({ state: S.windowState, data: {} });
        }

        S.windowHistoryNavigating = false;

        // Send content request
        S.getContent("task-detail.htm", "getTaskEntries_Content");
    }
    
    S.getTaskEntriesInspect = function() {
        // Get current cube/task
        var target = S.getTargetCube();
        
        if (typeof target.task != "undefined") {
            // Update window state
            S.windowState = "task-" + target.task;

            // Update window history
            if (S.windowHistoryNavigating == false) {
                S.pushWindowHistory({ state: S.windowState, data: {} });
            }

            S.windowHistoryNavigating = false;

            // Send content request
            S.getContent("task-detail.htm", "getTaskEntries_Content");
        } else {
            alert( S.getLocalizedString("error_cube") );
        }
    }

    S.getTaskEntries_Content = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "task") {
            return;
        }

        // Get current task
        var t = S.windowState.split("-")[1];

        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("labelTask") + " #" + t );

        // Perform content specific string replacements
        data = data.replace(/{task}/gi, t);

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").show();
        jQuery("#slPanelShadow").show();

        // Set handler for new action buttons
        jQuery("#slPanel button.sl-new-action").click(function() {
            // Display new task action window
            S.prepareTaskActionWindow(t);
        });

        // Initiate data request through plugin
        S.sendMessage(
            "getJSON",
            { url: S.scoutsLogURIbase + "task/" + encodeURIComponent(t) + "/actions" },
            "getTaskEntries_Data"
        );
    }

    S.getTaskEntries_Data = function(data) {
        S.getTaskDetails(data.task, function(data2) {
            // Add task details to original data
            data.cell = data2.cell;
            data.cellName = data2.cellName;
            data.weight = data2.weight;
            data.votes = data2.votes;
            data.votesMax = data2.votesMax;
            
            // Trigger callback to display data
            S.getTaskEntries_Data2(data);
        });
    }

    S.getTaskEntries_Data2 = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "task" && sp[1] != data.task) {
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

        if (data.issue != "" && data.issue != null) {
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
        
        // Update task and cell ID values for action form
        jQuery("#sl-action-task").val(data.task);
        jQuery("#sl-action-cell").val(data.cell);
        
        // Display task actions
        jQuery("#sl-main-table table tbody").empty();

        for (var c in data.actions) {
            var s = data.actions[c];
            
            var img = "";
            
            if (s.image != "") {
                img = '<a class="sl-image" href="' + s.image + '" target="_blank" title="' + S.getLocalizedString("actionViewImageTooltip") + '">' + S.getLocalizedString("actionViewImage") + '</a>';
            }

            var user = s.user;

            if (s.reaped == 0) {
                user = '(' + s.user + ')';
            }

            var edit = "";

            if (S.user == s.user) {
                edit = '<a href="javascript:void(0);" class="sl-edit-action" data-entry="' + s.id + '" title="' + S.getLocalizedString("actionEditEntryTooltip") + '"><img src="' + S.images.pencil + '" /></a>';
            }

            // Check for status issue indicator
            var st = S.getLocalizedStatus(s.status);

            if (s.issue != "" && s.issue != null) {
                st += " / " + S.getLocalizedStatusIssue(s.issue);
            }
            
            var row = '<tr>';
            row += '<td>' + edit + '</td>';
            row += '<td class="sl-' + s.status + '">' + st + '</td>';
            row += '<td>' + user + '</td>';
            row += '<td>' + s.notes + '</td>';
            row += '<td>' + img + '</td>';
            row += '<td>' + s.timestamp + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }
        
        // Check for mismatched cell IDs
        if (data.mismatched == 1) {
            // Display button           
            jQuery("#slPanel button.sl-mismatched").show();

            // Set event handler
            jQuery("#slPanel button.sl-mismatched").unbind("click");
            jQuery("#slPanel button.sl-mismatched").click(function() { S.prepareTaskMismatchWindow(data.task); });
        } else {
            // Hide 'fix mismatch' button
            jQuery("#slPanel button.sl-mismatched").hide();
        }
        
        // Check 'set good' button status
        if (data.status != "" && data.status != "good") {            
            jQuery("#slPanel button.sl-good-action").show();

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
                S.sendMessage(
                    "postRequest",
                    {
                        url: S.scoutsLogURIbase + "task/" + encodeURIComponent(data.task) + "/action/create",
                        data: "data=" + encodeURIComponent(JSON.stringify(d))
                    },
                    "setTaskGoodCallback"
                );
            });
        } else {
            // Hide 'set good' button
            jQuery("#slPanel button.sl-good-action").hide();
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
        setTimeout(function() { S.updateTaskDetails(data.task); }, S.taskInterval);
    }

    S.setTaskGoodCallback = function(data) {
        S.getTaskEntries(data.task);
    }

    S.getTaskDetails = function(id, callback) {
        jQuery.getJSON("http://eyewire.org/1.0/task/" + encodeURIComponent(id), function(d1) {
            var task = {
                id: d1.id,
                cell: d1.cell
            };
            
            jQuery.getJSON("http://eyewire.org/1.0/task/" + encodeURIComponent(id) + "/aggregate", function(d2) {
                task.weight = d2.weight;
                task.votes = d2.votes.total;
                task.votesMax = d2.votes.max;
                
                jQuery.getJSON("http://eyewire.org/1.0/cell/" + encodeURIComponent(task.cell), function(d3) {
                    task.cellName = d3.name;
                    
                    // Send combined task data to original callback
                    callback(task);
                });
            });
        });
    }

    S.updateTaskDetails = function(task) {
        // Check window state
        if (S.windowState != "task-" + task) {
            return;
        }

        // Initiate data request through plugin
        S.sendMessage(
            "getJSON",
            { url: S.scoutsLogURIbase + "task/" + encodeURIComponent(task) + "/actions" },
            "getTaskEntries_Data"
        );
    }


/**
 * UI: Prepare Window for New Task Action
 * ----------------------------------------------------------------------------
 */
    S.prepareTaskActionWindow = function(t) {
        if (typeof t != "undefined") {
            // Set window state
            S.windowState = "action-" + t;

            // Send content request
            S.getContent("task-action.htm", "prepareTaskActionWindow_Content");
        } else {
            // Invalid task/cube

            alert( S.getLocalizedString("error_cube") );
        }
    }

    S.prepareTaskActionWindow_Content = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "action") {
            return;
        }

        // Get current task and cell
        var ts = S.windowState.split("-")[1];

        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowNewEntryTitle") + " (" + S.getLocalizedString("labelTask") + " #" + ts + ")" );

        // Perform content specific string replacements
        data = data.replace(/{task}/gi, ts);

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").show();
        jQuery("#slPanelShadow").show();

        // Prevent keystrokes for notes from bubbling
        jQuery("#sl-action-notes").keydown(function(e) {
            e.stopPropagation();
        });
        
        // Set handlers for buttons
        jQuery("#slPanel button.sl-cancel").click(function() {
            jQuery("#slPanel").hide();
            jQuery("#slPanelShadow").hide();
        });

        jQuery("#slPanel button.sl-submit").click(function() {
            // Set interface
            jQuery("#sl-action-buttons button").prop("disabled", true);
            jQuery("#sl-action-buttons").append("<p>" + S.getLocalizedString("messageSaving") + "</p>");

            // Get current task and cell
            var t = jQuery("#sl-action-task").val();
            var c = jQuery("#sl-action-cell").val();

            // Prepare data object
            if (jQuery("#sl-action-image-annotated").val() != "") {
                var data = {
                    cell: c,
                    task: t,
                    status: jQuery("#sl-action-status").val(),
                    issue: jQuery("#sl-action-issue").val(),
                    reaped: jQuery("#sl-action-table input:radio[name=reaped]:checked").val(),
                    notes: jQuery("#sl-action-notes").val(),
                    image: jQuery("#sl-action-image-annotated").val()
                };
            } else {
                var data = {
                    cell: c,
                    task: t,
                    status: jQuery("#sl-action-status").val(),
                    issue: jQuery("#sl-action-issue").val(),
                    reaped: jQuery("#sl-action-table input:radio[name=reaped]:checked").val(),
                    notes: jQuery("#sl-action-notes").val(),
                    image: jQuery("#sl-action-image").val()
                };
            }

            // Initiate request through plugin
            S.sendMessage(
                "postRequest",
                {
                     url: S.scoutsLogURIbase + "task/" + encodeURIComponent(t) + "/action/create",
                     data: "data=" + encodeURIComponent(JSON.stringify(data))
                },
                "submitTaskActionCallback"
            );
        });

        // Get task summary
        S.getTaskSummary(ts);
    }

    S.submitTaskActionCallback = function(data) {
        if (data.result == true) {
            // Success, go back to previous screen

            S.navigateWindowHistory(S.windowHistoryPosition);
        } else {
            // Error

            jQuery("#sl-action-buttons button").prop("disabled", false);
            jQuery("#sl-action-buttons p").html( S.getLocalizedString("error_submission") );
        }
    }


    S.getTaskSummary = function(t) {
        S.sendMessage(
            "getJSON",
            { url: S.scoutsLogURIbase + "task/" + encodeURIComponent(t) },
            "getTaskSummary_Data"
        );
    }
    
    S.getTaskSummary_Data = function(data) {
        S.getTaskDetails(data.task, function(data2) {
            // Add task details to original data
            data.cell = data2.cell;
            data.cellName = data2.cellName;
            data.weight = data2.weight;
            data.votes = data2.votes;
            data.votesMax = data2.votesMax;
            
            // Trigger final callback to display info
            S.getTaskSummary_Data2(data);
        });
    }

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

        if (data.status != "") {
            status = S.getLocalizedStatus(data.status);
            status_class = ' class="sl-' + data.status + '"';

            if (data.issue != "" && data.issue != null) {
                status += " / " + S.getLocalizedStatusIssue(data.issue);
            }

            var sp = S.windowState.split("-");

            if (sp.length != 4 && sp[3] != "edit") {
                jQuery("#sl-action-status").val(data.status);
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
        
        // Set links
        S.setLinks("#slPanel");

        // Get captured image
        if (jQuery("#sl-action-entry").length == 0) {
            S.captureImage();
        }
    }


    S.captureImage = function() {
        // Get current task and cell
        var task = jQuery("#sl-action-task").val();
        var cell = jQuery("#sl-action-cell").val();

        // Capture 3D image
        if (jQuery("#threeD canvas").length == 1) {
            // Get 3D canvas object
            var c = jQuery("#threeD canvas")[0];
            
            // Force a render
            window.tomni.threeD.render();
            
            // Store image data
            jQuery("#sl-action-image-3d").val(c.toDataURL());
        } else {
            // 3D canvas is not visible/available

            // Clear image data
            jQuery("#sl-action-image-3d").val("");
        }

        // Capture 2D image
        if (jQuery("#twoD canvas").length == 1 && window.tomni.gameMode) {
            // Get 2D canvas object
            var c = jQuery("#twoD canvas")[0];
            
            // Force a render
            window.tomni.twoD.render();
            
            // Store image data
            jQuery("#sl-action-image-2d").val(c.toDataURL());
            
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

        cx.beginPath();
        cx.rect(0, 0, cvA.width, cvA.height);
        cx.fillStyle = "#232323";
        cx.fill();

        var cvB = jQuery("#twoD canvas")[0];

        if (cvB && window.tomni.gameMode) {
            var imC = jQuery("#twoD")[0];
            var sX = Math.floor((cvA.width - imC.clientWidth) / 2);
            //var sX = Math.floor(cvA.width / 4);

            var sW = Math.floor(cvA.width / 2);

            cx.drawImage(cvA, sX, 0, sW, cvA.height, 0, 0, sW, cvA.height);

            cx.drawImage(cvB, sW, 0);

            cx.beginPath();
            cx.setLineDash([3, 3]);
            cx.moveTo(sW + 0.5, 0);
            cx.lineTo(sW + 0.5, cvA.height);
            cx.lineWidth = 1;
            cx.strokeStyle = "#888";
            cx.stroke();

            cx.beginPath();
            cx.rect(5, 5, 300, 88);
            cx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            cx.fill();

            var dir;
            switch (window.tomni.task.dir) {
                case "x":
                    dir = "zy";

                    break;
                case "y":
                    dir = "xz";

                    break;
                case "z":
                    dir = "xy";

                    break;
            }

            cx.font = "normal 10pt sans-serif";
            cx.fillStyle = '#bbb';      
            cx.fillText('Cell: ' + cell, 10, 23);
            cx.fillText('Cube: ' + task, 10, 43);
            cx.fillText('Plane: ' + dir, 10, 63);
            cx.fillText('User: ' + S.user, 10, 83);

        } else {
            cx.drawImage(cvA, 0, 0);

            cx.beginPath();
            cx.rect(5, 5, 300, 48);
            cx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            cx.fill();

            cx.font = 'normal 10pt sans-serif';
            cx.fillStyle = '#bbb';      
            cx.fillText('Cell: ' + cell, 10, 23);
            cx.fillText('User: ' + S.user, 10, 43);
        }


        jQuery("#sl-action-image").val(cv.toDataURL());


        
        // Reset annotation/sketch data
        jQuery("#sl-action-image-annotated").val("");
        jQuery("#sl-action-image-sketch").val("");

        // Update status, set links
        var status = '<a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '"><img src="' + S.images.photo + '" /></a> <a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '">' + S.getLocalizedString("actionPreview") + '</a> | ';
        status += '<a class="sl-annotate" title="' + S.getLocalizedString("actionAnnotateTooltip") + '"><img src="' + S.images.pencil + '" /></a> <a class="sl-annotate" title="' + S.getLocalizedString("actionAnnotateTooltip") + '">' + S.getLocalizedString("actionAnnotate") + '</a> | ';
        status += '<a class="sl-capture" title="' + S.getLocalizedString("actionRecaptureTooltip") + '"><img src="' + S.images.refresh + '" /></a> <a class="sl-capture" title="' + S.getLocalizedString("actionRecaptureTooltip") + '">' + S.getLocalizedString("actionRecapture") + '</a> | ';
        status += '<a class="sl-remove" title="' + S.getLocalizedString("actionRemoveTooltip") + '"><img src="' + S.images.delete + '" /></a> <a class="sl-remove" title="' + S.getLocalizedString("actionRemoveTooltip") + '">' + S.getLocalizedString("actionRemove") + '</a>';

        jQuery("#sl-action-image-status").html(status);

        // Set event handlers

        jQuery("#sl-action-image-status a.sl-preview").click(function() {
            var w = window.open();

            var im;

            if (jQuery("#sl-action-image-annotated").val() != "") {
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
            if (jQuery("#sl-action-image-annotated").val() == "") {
                S.createAnnotation();
            } else {
                S.showAnnotation();
            }
        });

        jQuery("#sl-action-image-status a.sl-capture").click(function() {
            var res = true;

            if (jQuery("#sl-action-image-sketch").val() != "") {
                res = confirm("Are you sure you want to to re-capture this image?  Any annotations will be lost.");
            }

            if (res) {
                jQuery("#sl-action-image").val("");
                jQuery("#sl-action-image-3d").val("");
                jQuery("#sl-action-image-2d").val("");
                jQuery("#sl-action-image-annotated").val("");
                jQuery("#sl-action-image-sketch").val("");

                jQuery("#sl-action-image-status").html( S.getLocalizedString("messageProcessing") );
                
                setTimeout(function() { window.scoutsLog.captureImage(); }, 1000);
            }
        });

        jQuery("#sl-action-image-status a.sl-remove").click(function() {
            var res = true;

            if (jQuery("#sl-action-image-sketch").val() != "") {
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
                    
                    setTimeout(function() { window.scoutsLog.captureImage(); }, 1000);
                });
            }
        });

    }


/**
 * UI:  Show Edit Task Entry Screen
 * ----------------------------------------------------------------------------
 */
    S.prepareTaskActionEditWindow = function(t, e) {
        if (typeof t != "undefined") {
            // Set window state
            S.windowState = "action-" + t + "-" + e + "-edit";

            // Send content request
            S.getContent("task-action-edit.htm", "prepareTaskActionEditWindow_Content");
        } else {
            // Invalid task/cube

            alert( S.getLocalizedString("error_cube") );
        }
    }

    S.prepareTaskActionEditWindow_Content = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "action" && sp[3] != "edit") {
            return;
        }

        // Get current task and cell
        var ts = S.windowState.split("-")[1];
        var en = S.windowState.split("-")[2];


        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowEditEntryTitle") + " (" + S.getLocalizedString("labelTask") + " #" + ts + ")" );

        // Perform content specific string replacements
        data = data.replace(/{task}/gi, ts);
        data = data.replace(/{entry}/gi, en);


        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").show();
        jQuery("#slPanelShadow").show();

        // Prevent keystrokes for notes from bubbling
        jQuery("#sl-action-notes").keydown(function(e) {
            e.stopPropagation();
        });
        
        // Set handlers for buttons
        jQuery("#slPanel button.sl-cancel").click(function() {
            S.navigateWindowHistory(S.windowHistoryPosition);
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
            S.sendMessage(
                "postRequest",
                {
                     url: S.scoutsLogURIbase + "task/" + encodeURIComponent(t) + "/action/update",
                     data: "data=" + encodeURIComponent(JSON.stringify(data))
                },
                "submitTaskActionCallback"
            );
        });

        // Get task summary
        S.getTaskSummary(ts);

        // Initiate data request through plugin
        S.sendMessage(
            "getJSON",
            { url: S.scoutsLogURIbase + "task/" + encodeURIComponent(ts) + "/actions" },
            "getTaskEditEntries_Data"
        );
    }

    S.getTaskEditEntries_Data = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "action" && sp[3] != "edit") {
            return;
        }

        // Get current task and cell
        var t = S.windowState.split("-")[1];
        var e = S.windowState.split("-")[2];

        // Get specified entry data
        var entry = jQuery.grep(data.actions, function(a){ return (a.id == e); })[0];

        if (typeof entry != "undefined") {
            // Populate form with existing data

            jQuery("#sl-action-status").val(entry.status);
            jQuery("#sl-action-issue").val(entry.issue);
            jQuery("#sl-action-notes").val(entry.notes);

            if (entry.image != "") {
                 jQuery("#sl-action-image-status").html('<a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '"><img src="' + S.images.photo + '" /></a> <a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '">' + S.getLocalizedString("actionPreview") + '</a>');
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
    }


/**
 * UI:  Show Task Cell Mismatch Screen
 * ----------------------------------------------------------------------------
 */
    S.prepareTaskMismatchWindow = function(t) {
        if (typeof t != "undefined") {
            // Set window state
            S.windowState = "mismatch-" + t;

            // Send content request
            S.getContent("task-mismatch.htm", "prepareTaskMismatchWindow_Content");
        } else {
            // Invalid task/cube

            alert( S.getLocalizedString("error_cube") );
        }
    }

    S.prepareTaskMismatchWindow_Content = function(data) {
        // Check window state
        var sp = S.windowState.split("-");

        if (sp[0] != "mismatch") {
            return;
        }

        // Get current task and cell
        var ts = S.windowState.split("-")[1];


        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowTaskMismatchTitle") + " (" + S.getLocalizedString("labelTask") + " #" + ts + ")" );

        // Perform content specific string replacements
        data = data.replace(/{task}/gi, ts);


        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").show();
        jQuery("#slPanelShadow").show();

        // Prevent keystrokes for notes from bubbling
        jQuery("#sl-action-notes").keydown(function(e) {
            e.stopPropagation();
        });
        
        // Set handlers for buttons
        jQuery("#slPanel button.sl-cancel").click(function() {
            S.navigateWindowHistory(S.windowHistoryPosition);
        });

        jQuery("#slPanel button.sl-submit").click(function() {
            // Set interface
            jQuery("#sl-action-buttons button").prop("disabled", true);
            jQuery("#sl-action-buttons").append("<p>" + S.getLocalizedString("messageSaving") + "</p>");


        });

        // Get task summary
        S.getTaskSummary(ts);

        // Initiate data request through plugin

    }




/**
 * UI:  Show annotation preview/image
 * ----------------------------------------------------------------------------
 */
    S.showAnnotation = function() {
        S.getContent("annotation.htm", "showAnnotation_Content");
    }

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
    }

    S.createAnnotation = function() {
        S.getContent("annotation.htm", "createAnnotation_Content");
    }

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
    }

    S.saveAnnotation = function(data) {
        // Store annotation data in form
        jQuery("#sl-action-image-annotated").val(data.image);
        jQuery("#sl-action-image-sketch").val(data.sketch);
    }


/**
 * UI: Prepare Window for User Submission History
 * ----------------------------------------------------------------------------
 */


    S.getHistory = function() {
        if (S.windowState != "history") {
            // Set window state
            S.windowState = "history";
            S.historyDisplay = 4;
            S.historyPosition = 0;

            // Send content request
            S.getContent("history.htm", "getHistory_Content");
        } else {
            // Get additional data for view
            S.getHistory_GetData();
        }
    }

    S.getHistory_Content = function(data) {
        // Check window state
        if (S.windowState != "history") {
            return;
        }

        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowHistoryTitle") );

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").show();
        jQuery("#slPanelShadow").show();


        // Set handler for more link
        jQuery("#slPanel div.slPanelContent a.sl-more").click(function() {
            S.getHistory();
        });


        // Set default values
        jQuery("#sl-history-type").val(S.historyType);
        
        if (S.historyCell != 0) {
            jQuery("#sl-history-cell").val(S.historyCell);
        } else {
            jQuery("#sl-history-cell").val("");
        }
        
        jQuery("#sl-history-accuracy").val(S.historyAccuracy);
        
        // Prevent bubbling for cell ID
        jQuery("#sl-history-cell").keydown(function(e) {
            e.stopPropagation();
        });
        
        jQuery("#sl-history-cell").keyup(function(e) {
            e.stopPropagation();
        });

        // Set event handlers
        jQuery("#sl-history-refresh").click(function() {
            S.historyType = jQuery("#sl-history-type").val();

            var c = parseInt(jQuery("#sl-history-cell").val(), 10);
            
            if (isNaN(c)) {
                c = 0;
                jQuery("#sl-history-cell").val("");
            }
            
            S.historyCell = c;
            S.historyAccuracy = jQuery("#sl-history-accuracy").val();
            
            S.windowState = "";

            S.getHistory();
        });

        // Get initial data
        S.getHistory_GetData();
    }

    S.getHistory_GetData = function() {
        // Check window state
        if (S.windowState != "history") {
            return;
        }

        // Generate request URL
        var url = S.scoutsLogURIbase + "history/";
        url += encodeURIComponent(S.historyPosition) + "/" + encodeURIComponent(S.historyDisplay);

        if (S.historyType != "") {
            url += "/type/" + encodeURIComponent(S.historyType);
        }
        
        if (S.historyCell > 0) {
            url += "/cell/" + encodeURIComponent(S.historyCell);
        }
        
        if (S.historyAccuracy != "1") {
            url += "/accuracy/" + encodeURIComponent(S.historyAccuracy);
        }

        // Initiate request
        S.sendMessage(
            "getJSON",
            { url: url },
            "getHistory_Data"
        );
    }

    S.getHistory_Data = function(data) {
        // Check window state
        if (S.windowState != "history") {
            return;
        }

        // Update history position
        S.historyType = data.type;
        S.historyCell = data.cell;
        S.historyAccuracy = data.accuracy;
        S.historyPosition = data.start + data.limit;
        S.historyDisplay = data.limit;

        // Update window history
        if (S.windowHistoryNavigating == false) {
            var updated = false;

            if (S.windowHistory.length > 0) {
                if (S.windowHistory[S.windowHistoryPosition].state == "history") {
                    // Update current history point

                    S.windowHistory[S.windowHistoryPosition] = {
                        state: S.windowState,
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

            if (updated == false) {
                // Create new window history point

                S.pushWindowHistory({
                    state: S.windowState,
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

        S.windowHistoryNavigating = false;
        
        // Set default values
        jQuery("#sl-history-type").val(S.historyType);
        
        if (S.historyCell != 0) {
            jQuery("#sl-history-cell").val(S.historyCell);
        } else {
            jQuery("#sl-history-cell").val("");
        }
        
        jQuery("#sl-history-accuracy").val(S.historyAccuracy);

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

                if (S.locale == "en") {
                    cn = h.cellName;
                } else {
                    cn = h["cellName" + S.locale.toUpperCase()];
                }

                // Check if current user has log entry or watch indicators
                var ent1 = "";
                var ent2 = "";
                
                if (h.has_entries == 1) {
                    ent2 = ' <img src="' + S.images.tick + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconEntries") + '" />';
                }

                if (h.has_watch == 1) {
                    ent2 = ' <img src="' + S.images.magnifier + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconWatch") + '" />';
                }
                
                if (h.mismatched == 1) {
                    ent1 = ' <img src="' + S.images.error + '" class="sl-table-icon" title="' + S.getLocalizedString("labelIconError") + '" />';
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
        S.historyDisplay = 4;
    }


/**
 * UI: Show Window History Entries
 * ----------------------------------------------------------------------------
 */


    S.getWindowHistory = function() {
        // Set window state
        S.windowState = "window-history";

        // Send content request
        S.getContent("window-history.htm", "getWindowHistory_Content");
    }

    S.getWindowHistory_Content = function(data) {
        // Check window state
        if (S.windowState != "window-history") {
            return;
        }

        // Set panel title
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowWindowHistoryTitle") );

        // Set panel content
        jQuery("#slPanel div.slPanelContent").html(data);
        jQuery("#slPanel").show();
        jQuery("#slPanelShadow").show();

        // Display window history entries
        jQuery("#sl-main-table table tbody").empty();

        for (var n=S.windowHistory.length-1; n >= 0; n--) {
            // Get history data
            var h = S.windowHistory[n];

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
                case "status":
                    // Status Summary
                    var hdr = false;

                    sp.shift();

                    if (sp[sp.length - 1] == "header") {
                        sp.pop();
                        hdr = true;
                    }

                    var st = sp.join("-");

                    title = S.getLocalizedStatus(st);

                    break;
                case "task":
                    // Task Details

                    title = S.getLocalizedString("labelTask") + " #" + sp[1];

                    break;
            }

            // Check if this entry is the current point
            var icon = "";

            if (S.windowHistoryPosition == n) {
                icon = ' <img src="' + S.images.star + '" />';
            }

            var row = '<tr><td><a href="javascript:void(0);" class="sl-history" data-history="' + n + '">' + title + '</a>' + icon + '</td></tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        // Set event handlers
        jQuery("#sl-main-table a.sl-history").click(function() {
             // Get history point
             var p = parseInt(jQuery(this).attr("data-history"), 10);

             // Set history point position
             S.windowHistoryPosition = p;

             // Navigate to history point
             S.navigateWindowHistory(p);
        });

        jQuery("#slPanel button.sl-history-clear").click(function() {
            // Clear history
            S.clearWindowHistory();

            // Refresh screen
            S.getWindowHistory();
        });
    }


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
        if (typeof target.task != "undefined") {
            S.sendMessage(
                "getJSON",
                {url: S.scoutsLogURIbase + "task/" + target.task + "/actions"},
                "getCubeDetailsSummary_Data"
            );
        }
    }

    S.getCubeDetailsSummary_Data = function(data) {
        // Get current cube/task
        var target = S.getTargetCube();

        // Make sure target cube matches the data
        if (data.task == target.task) {
            if (data.status != "good" && data.status != "" && data.actions.length > 0) {
                jQuery("#sl-cube-badge").show();
                jQuery("#sl-cube-badge").text(data.actions.length);
            } else {
                jQuery("#sl-cube-badge").hide();
            }
        }
    }









///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                       WINDOW HISTORY FUNCTIONS                            //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


    /**
     * Clear Window History
     */
    S.clearWindowHistory = function() {
        if (S.windowHistory.length > 0) {
            var cur = S.windowHistory[S.windowHistoryPosition];

            S.windowHistory = [];
            S.windowHistoryPosition = 0;

            S.windowHistory.push(cur);
        } else {
            S.windowHistory = [];
            S.windowHistoryPosition = -1;
        }

        // Update button status
        S.updateWindowHistoryButtons();
    }


    /**
     * Navigate to Window History Point
     *
     * @param p integer History point index
     */
    S.navigateWindowHistory = function(p) {
        if (typeof S.windowHistory[p] != "undefined") {
            // Set navigating flag
            S.windowHistoryNavigating = true;

            // Get history data
            var h = S.windowHistory[p];

            // Get window state
            var sp = h.state.split("-");

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

                        S.getCellEntries(c, s);
                    } else {
                        // Show Cell List

                        S.getCellList();
                    }

                    break;
                case "history":
                    // Set history view
                    S.windowState = "history";
                    S.historyType = h.data.historyType;
                    S.historyCell = h.data.historyCell;
                    S.historyAccuracy = h.data.historyAccuracy;
                    S.historyPosition = 0;
                    S.historyDisplay = h.data.historyPosition;

                    // Send content request
                    S.getContent("history.htm", "getHistory_Content");

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
                    S.getStatusSummary(st, hdr);

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
    }


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
        if (S.windowHistoryPosition < (S.windowHistory.length - 1)) {
            S.windowHistory.splice(S.windowHistoryPosition + 1, S.windowHistory.length - S.windowHistoryPosition);
        }

        // Add history point
        S.windowHistory.push(o);

        // Increment history position
        S.windowHistoryPosition++;

        // Update button status
        S.updateWindowHistoryButtons();
    }


    /**
     * Update History Buttons Status
     */
    S.updateWindowHistoryButtons = function() {
        if (S.windowHistoryPosition <= 0) {
            jQuery("#slPanel .slPanelHeader a.sl-window-previous").addClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-previous img").attr("src", S.images.previousDisabled);
        } else {
            jQuery("#slPanel .slPanelHeader a.sl-window-previous").removeClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-previous img").attr("src", S.images.previous);
        }

        if (S.windowHistoryPosition == (S.windowHistory.length - 1)) {
            jQuery("#slPanel .slPanelHeader a.sl-window-next").addClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-next img").attr("src", S.images.nextDisabled);
        } else {
            jQuery("#slPanel .slPanelHeader a.sl-window-next").removeClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-next img").attr("src", S.images.next);
        }

        if (S.windowHistory.length > 0) {
            jQuery("#slPanel .slPanelHeader a.sl-window-history").removeClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-history img").attr("src", S.images.history);
        } else {
            jQuery("#slPanel .slPanelHeader a.sl-window-history").addClass("disabled");
            jQuery("#slPanel .slPanelHeader a.sl-window-history img").attr("src", S.images.historyDisabled);
        }
    }



///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                     PLATFORM CONTENT ERROR HANDLING                       //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


    document.addEventListener("PlatformContentError", function(e) {
        // Hide main panel
        jQuery("#slPanel").hide();

        // Set window state
        S.windowState = "error";

        if (e.detail.status == "invalid authentication-token") {
            // Hide controls
            jQuery("#scoutsLogFloatingControls").hide();
            jQuery("#scoutsLogPanelButton").hide();

            // Display authorization prompt
            S.slew_auth();
        } else {
            jQuery("#slPanelShadow").show();
            jQuery("#slPanelError").show();

            jQuery("#slPanelErrorMessage").html( S.getLocalizedString("error_request") );

            jQuery("#slPanelError button").click(function() {
                S.windowState = "";

                jQuery("#slPanelShadow").hide();
                jQuery("#slPanelError").hide();
            });
        }
    });








///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                          MAIN INITIALIZATION                              //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


    S.sendMessage("getLocalizedStrings", {}, "init_locale");

}

window.scoutsLog = new ScoutsLogPlatformContent();
