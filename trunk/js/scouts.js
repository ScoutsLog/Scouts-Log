    
function nice_number(n) {
    // Make sure we have a number
    n = parseInt(n, 10);

    // is this a number?
    if (isNaN(n)) return;

    // now filter it
    var v;
    var u;
        
    if (n >= 1000000000000) {
        v = (n / 1000000000000);
        v = v.toFixed(1);
        u = 'T';
    } else if (n >= 1000000000) {
        v = (n / 1000000000);
        v = v.toFixed(1);
        u = 'B';
    } else if (n >= 1000000) {
        v = (n / 1000000);
        v = v.toFixed(1);
        u = 'M';
    } else if (n >= 1000) {
        v = (n / 1000);
        v = v.toFixed(1);
        u = 'K';
    } else {
        v = n.toFixed(1);
        u = '';
    }
        
    var final = v + u;
        
    return final;
}

////////////////////////////////////////////////////////////////////////////////

(function(S) {
    S.images = {};
    S.locale = 'en';
    S.localizedStrings = {};
    
    S.windowState = '';

    S.historyType = '';
    S.historyCell = 0;
    S.historyAccuracy = 1;
    S.historyPosition = 0;
    S.historyDisplay = 4;

    var baseDataURL = '';
    
    
    /**
     * Routed Message Event Listener
     * 
     * This function routes messages from the main content script
     * to this page script.
     */
    document.addEventListener('RoutedMessageCS', function(e) {
        // Extract message parameters
        var dst = e.detail.destination;
        var data = e.detail.data;

        if (S[dst]) {
            S[dst](data);
        }
    });
    
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
    };
    
    
    
    
    /**
     * Display Authorization Message
     * 
     * This function is triggered in response to slew_register()
     * when the user is not authorized for the application.
     */
    S.slew_auth = function() {
        var panel = '';
        panel += '<div id="scoutsLogAuthPanel">';
        panel += '<h2>' + S.getLocalizedString("windowAuthTitle") + '</h2>';
        panel += S.getLocalizedString("windowAuthText");
        panel += '</div>';
        
        jQuery("#content .gameBoard").append(panel);
    };

    /**
     * Display Extension Update Message
     * 
     * This function is triggered in response to slew_register()
     * when the extension is out of date.
     */
    S.slew_update = function(e) {
        var panel = '';
        panel += '<div id="scoutsLogAuthPanel">';
        panel += '<h2>' + S.getLocalizedString("windowUpdateTitle") + '</h2>';
        panel += S.getLocalizedString("windowUpdateText");
        panel += '</div>';
        
        jQuery("#content .gameBoard").append(panel);

        jQuery('#scoutsLogAuthPanel a.sl-cell').click(function() {
            jQuery('#scoutsLogAuthPanel').remove();
        });
    };
    
    /**
     * Extension Initialization
     * 
     * This function is triggered in response to slew_register()
     * when all pre-checks have been passed.    This function initializes
     * the local page object and creates the UI.
     */
    S.slew_init = function(msg) {
        S.baseDataURL = msg.baseDataURL;
        S.locale = msg.locale;

        S.init_ui();
    };

    /**
     * Initialize Localization Strings
     *
     * This function loads locale data for the currently
     * specified language/locale.
     */
    S.init_locale = function(data) {
        S.localizedStrings = data;
        
        S.sendMessage("register", {}, "");
    };



    
    /**
     * Initialialize User Interface (UI)
     * 
     * This function loads resouces from the extension,
     * adds necessary HTML elements, and hooks into the
     * various parts of the EyeWire web application.
     */
    S.init_ui = function() {
        // Hook game control modes
        jQuery(window).on(InspectorPanel.Events.ModelFetched, function() {
            var ea = jQuery("#gameControls #editActions").length;
            var ci = jQuery("#gameControls #cubeInspector").length;
            var ra = jQuery("#gameControls #realActions").length;
            
            if (ea > 0 || ci > 0) {
                jQuery('#sl-task-details').show();
                jQuery('#sl-task-entry').show();
            } else if (ra > 0) {
                jQuery('#sl-task-details').show();
                jQuery('#sl-task-entry').hide();
            }
        });
        
        // Hook window resize event for main window 
        jQuery(window).resize(function() {        
            var pH = (jQuery('.gameBoard').height() * 0.80) - 30;
            
            if (jQuery('#slPanel').is(':visible')) {                
                jQuery('#slPanel div.slPanelContent').height(pH);
            }
        });
        
        // Hook document keypress
        jQuery(window).keyup(function(k) {
            if (k.keyCode === Keycodes.codes.esc) {
                if (jQuery('#slPanel').is(':visible')) {
                    jQuery('#slPanel').hide();
                }
                
                if (jQuery('#sl-task-details').is(':visible')) {
                    jQuery('#sl-task-details').hide();
                    jQuery('#sl-task-entry').hide();
                }
                
                S.flagEditActions = false;
                S.flagRealActions = false;
            } else if (k.keyCode === Keycodes.codes.l && (k.metaKey || k.altKey)) {
                // Toggle scouts' log panel display

                if (S.windowState != '') {
                    if (jQuery('#slPanel').is(':visible')) {
                        jQuery('#slPanel').hide();
                        jQuery('#scoutsLogFloatingControls').hide();
                    } else {
                        if (S.windowState == 'history' && S.historyPosition == S.historyDisplay) {
                            S.windowState = '';

                            S.getHistory();
                        }

                        jQuery('#slPanel').show();
                        jQuery('#scoutsLogFloatingControls').show();
                    }
                }
            }
        });


        // Hook chat window
        jQuery('body').on('DOMNodeInserted', '#content .gameBoard .chatMsgContainer', function(e) {
            if (jQuery(e.target).attr('class') === 'chatMsg') {
                S.setChatLinks(e.target);
            }
        });

        // Create listener for cube submission data
        jQuery(document).on('cube-submission-data', function(e, data) {
            // Get current cube/task
            var target = window.tomni.getTarget();
            var t;
            var c;

            if (Array.isArray(target)) {
                t = target[0].id;
                c = target[0].cell;
            } else {
                t = target.id;
                c = target.cell;
            }
        
            if (typeof t == 'undefined') {
                t = window.tomni.task.id;
            }
        
            if (typeof c == 'undefined') {
                c = window.tomni.task.cell;
            }

            // Update data object
            data.cell = c;
            data.task = t;

            var dt = new Date();
            data.timestamp = dt.toLocaleString();

            // Send submission data to server
            S.sendMessage(
                "postRequest",
                {
                    url: "http://scoutslog.org/1.1/task/" + encodeURIComponent(t) + "/submit",
                    data: "data=" + encodeURIComponent(JSON.stringify(data))
                },
                ""
            );
        });
        
        
        // Load resources
        S.loadImages();

        // Load UI
        S.setMainPanel();
        S.setFloatingPanel();
        S.setGameTools();
    };

    /**
     * Load Image Resources
     */
    S.loadImages = function() {
        S.images = {
            logo: S.baseDataURL + "images/icon48.png",
            logoSmall: S.baseDataURL + "images/icon32.png",
            close: S.baseDataURL + "images/close.png"
        };
    };


    /**
     * Get Summary of Cells (Cell List)
     */
    S.getCellSummary = function() {
        // Prepare display window
        S.prepareCellWindow();
        
        // Initiate request through plugin
        S.sendMessage(
            "getJSON",
            { url: "http://scoutslog.org/1.1/stats" },
            "getCellSummaryCallback"
        );
    };
    
    /**
     * Callback: Get Summary of Cells (Cell List)
     */
    S.getCellSummaryCallback = function(d) {
        jQuery("#slPanel h2 small").text( S.getLocalizedString("windowCellSummary") );
        jQuery("#sl-main-table table tbody").empty();

        for (var c in d['cell_summary']) {
            var s = d['cell_summary'][c];

            var row = '<tr>';
            row += '<td><a class="sl-cell" data-cell="' + s.cell + '">' + s.cellName + ' (' + s.cell + ')</a></td>';
            row += '<td>' + s.tasks + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        S.setLinks('#slPanel');
    };
    
    /**
     * Get Task Entries for Cell
     */
    S.getCellEntries = function(c, s) {
        // Prepare display window
        S.prepareCellEntriesWindow();
        
        // Update window state
        S.windowState = 'cell-entries-' + c;
        
        // Update status display
        jQuery('#slPanel div.slOptions select').val(s);

        // Generate request URL
        var url = 'http://scoutslog.org/1.1/cell/' + encodeURIComponent(c) + '/tasks';

        if (s != '') {
            url += '/status/' + encodeURIComponent(s);
        }
        
        // Initiate request
        S.sendMessage(
            "getJSON",
            { url: url },
            "getCellEntriesCallback"
        );
    };

    /**
     * Callback: Get Task Entries for Cell
     */
    S.getCellEntriesCallback = function(d) {
        jQuery("#slPanel h2 small").text(d.cellName + " (" + d.cell + ")");
        jQuery("#sl-main-table table tbody").empty();

        if (d.tasks.length > 0) {    
            for (var c in d.tasks) {
                var s = d.tasks[c];
    
                var row = '<tr>';
                row += '<td><a class="sl-task" data-task="' + s.task + '">' + s.task + '</a> | <a class="sl-jump-task" data-task="' + s.task + '">' + S.getLocalizedString("actionJumpTask") + '</a></td>';
                row += '<td class="sl-' + s.status + '">' + S.getLocalizedStatus(s.status) + '</td>';
                row += '<td>' + s.lastUser + '</td>';
                row += '<td>' + s.lastUpdated + '</td>';
                row += '</tr>';
    
                jQuery("#sl-main-table table tbody").append(row);
            }
    
            S.setLinks('#slPanel');
        } else {
            // No entries found
            
            jQuery("#sl-main-table table tbody").append('<tr><td colspan="4">' + S.getLocalizedString("error_notasks") + '</td></tr>');
        }
    };
    
    /**
     * Get Tasks set to a Given Status
     */
    S.getStatusEntries = function(s, h) {
        // Prepare display window
        S.prepareSummaryWindow();
        
        // Set window subtitle
        var status = S.getLocalizedStatus(s);
        
        if (status != '') {
            // Update window state
            S.windowState = 'status-' + s;
            
            // Set window title
            jQuery('#slPanel h2 small').html(status);
            
            // Generate URL
            var url = "http://scoutslog.org/1.1/status/" + encodeURIComponent(s);
            
            if (h == true) {
                url += "/header";
            }
            
            // Initiate request through plugin
            S.sendMessage(
                "getJSON",
                { url: url },
                "getStatusEntriesCallback"
            );
        }
    };
    
    /**
     * Callback: Get Tasks set to a Given Status
     */
    S.getStatusEntriesCallback = function(d) {
        jQuery("#sl-main-table table tbody").empty();

        for (var c in d.tasks) {
            var s = d.tasks[c];

            var row = '<tr>';
            row += '<td><a class="sl-task" data-task="' + s.task + '">' + s.task + '</a> | <a class="sl-jump-task" data-task="' + s.task + '">' + S.getLocalizedString("actionJumpTask") + '</a></td>';
            row += '<td><a class="sl-cell" data-cell="' + s.cell + '">' + s.cellName + ' (' + s.cell + ')</a></td>';
            row += '<td class="sl-' + s.status + '">' + S.getLocalizedStatus(s.status) + '</td>';
            row += '<td>' + s.lastUser + '</td>';
            row += '<td>' + s.lastUpdated + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }

        S.setLinks('#slPanel');
    };
    
    /**
     * Get Actions for a Given Task (UI)
     */
    S.getTaskEntries = function(t) {
        // Prepare display window
        S.prepareTaskWindow(t);
        
        // Update window state
        S.windowstate = 'task-' + t;
        
        // Initiate request
        S.sendMessage(
            "getJSON",
            { url: "http://scoutslog.org/1.1/task/" + encodeURIComponent(t) + "/actions" },
            "getTaskEntriesCallback"
        );
    };
    
    /**
     * Get Actions for a Given Task (Inspect Mode)
     */
    S.getTaskEntriesInspect = function() {
        // Get current cube/task
        var target = window.tomni.getTarget();
        var t;

        if (Array.isArray(target)) {
            t = target[0].id;
        } else {
            t = target.id;
        }
        
        if (typeof t == 'undefined') {
            t = window.tomni.task.id;
        }
        
        // Update window state
        S.windowstate = 'task-' + t;
        
        // Prepare display window
        S.prepareTaskWindow(t);
        
        // Initiate request
        S.sendMessage(
            "getJSON",
            { url: "http://scoutslog.org/1.1/task/" + encodeURIComponent(t) + "/actions" },
            "getTaskEntriesCallback"
        );
    };
    
    /**
     * Callback: Get Actions for a Given Task (Part 1/2)
     */
    S.getTaskEntriesCallback = function(d) {
        S.getTaskDetails(d.task, function(data) {
            // Add task details to original data
            d.cell = data.cell;
            d.cellName = data.cellName;
            d.weight = data.weight;
            d.votes = data.votes;
            d.votesMax = data.votesMax;
            
            // Trigger final callback to display info
            S.getTaskEntriesCallback2(d);
        });
    }
    
    /**
     * Callback: Get Actions for a Given Task (Part 2/2)
     */
    S.getTaskEntriesCallback2 = function(d) {
        // Check for admin weight
        var wstyle = '';
        
        if (d.weight >= 1000000) {
            wstyle =' class="sl-admin"';
        }
        
        // Check for admin complete
        var vstyle = '';
        if (d.votes >= 1000000) {
            vstyle = ' class="sl-admin"';
        }
        
        // Display task summary
        jQuery("#sl-summary-table table tbody").empty();
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelCell") + ':</strong></td><td><a class="sl-cell" data-cell="' + d.cell + '">' + d.cellName + ' (' + d.cell + ')</a></td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelStatus") + ':</strong></td><td class="sl-' + d.status + '">' + S.getLocalizedStatus(d.status) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelWeight") + ':</strong></td><td' + wstyle + '>' + nice_number(d.weight) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelVotes") + ':</strong></td><td' + vstyle + '>' + nice_number(d.votes) + ' / ' + nice_number(d.votesMax) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUser") + ':</strong></td><td>' + d.lastUser + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUpdated") + ':</strong></td><td>' + d.lastUpdated + '</td></tr>');
        
        
        // Display task actions
        jQuery("#sl-main-table table tbody").empty();

        for (var c in d.actions) {
            var s = d.actions[c];
            
            var img = '';
            
            if (s.image != "") {
                img = '<a class="sl-image" href="' + s.image + '" target="_blank" title="' + S.getLocalizedString("actionViewImageTooltip") + '">' + S.getLocalizedString("actionViewImage") + '</a>';
            }

            var user = s.user;

            if (s.reaped == 0) {
                user = '(' + s.user + ')';
            }
            
            var row = '<tr>';
            row += '<td class="sl-' + s.status + '">' + S.getLocalizedStatus(s.status) + '</td>';
            row += '<td>' + user + '</td>';
            row += '<td>' + s.notes + '</td>';
            row += '<td>' + img + '</td>';
            row += '<td>' + s.timestamp + '</td>';
            row += '</tr>';

            jQuery("#sl-main-table table tbody").append(row);
        }
        
        // Check button status
        if (d.status != '' && d.status != 'good') {
            var btn = '<button type="button" class="greenButton sl-good-action" style="margin-left: 10px;" title="' + S.getLocalizedString("actionSetToGoodTooltip") + '">' + S.getLocalizedString("actionSetToGood") + '</button>';
            
            jQuery(btn).insertAfter("#slPanel button.sl-new-action");

            jQuery('#slPanel button.sl-good-action').click(function() {
                // Prepare data object
                var data = {
                    cell: d.cell,
                    task: d.task,
                    status: 'good',
                    reaped: 0,
                    notes: '',
                    image: ''
                };

                // Initiate request through plugin
                S.sendMessage(
                "postRequest",
                {
                    url: "http://scoutslog.org/1.1/task/" + encodeURIComponent(d.task) + "/action/create",
                    data: "data=" + encodeURIComponent(JSON.stringify(data))
                },
                "setTaskGoodCallback"
            );
            });
        }
        
        // Set links for panel
        S.setLinks('#slPanel');
    };

    /**
     * Callback: Set Task to Good
     */
    S.setTaskGoodCallback = function(d) {
        // Refresh cube details
        S.getTaskEntries(d.task);
    }

    /**
     * Get Action Summary for a Given Task
     */
    S.getTaskSummary = function(t) {
        if (typeof t == 'undefined' || isNaN(t)) {
            // Get current cube/task
            var target = window.tomni.getTarget();

            if (Array.isArray(target)) {
                t = target[0].id;
            } else {
                t = target.id;
            }
        
            if (typeof t == 'undefined') {
                t = window.tomni.task.id;
            }
        }
        
        // Initiate request
        S.sendMessage(
            "getJSON",
            { url: "http://scoutslog.org/1.1/task/" + encodeURIComponent(t) },
            "getTaskSummaryCallback"
        );
    }
    
    /**
     * Callback: Get Action Summary for a Given Task (Part 1/2)
     */
    S.getTaskSummaryCallback = function(d) {
        S.getTaskDetails(d.task, function(data) {
            // Add task details to original data
            d.cell = data.cell;
            d.cellName = data.cellName;
            d.weight = data.weight;
            d.votes = data.votes;
            d.votesMax = data.votesMax;
            
            // Trigger final callback to display info
            S.getTaskSummaryCallback2(d);
        });
    }
    
    /**
     * Callback: Get Action Summary for a Given Task (Part 2/2)
     */
    S.getTaskSummaryCallback2 = function(d) {
        // Check for admin weight
        var wstyle = '';
        
        if (d.weight >= 1000000) {
            wstyle =' class="sl-admin"';
        }
        
        // Check for admin complete
        var vstyle = '';
        if (d.votes >= 1000000) {
            vstyle = ' class="sl-admin"';
        }
        
        // Update title
        //jQuery("#slPanel h2 small").text(S.getLocalizedString("labelTask") + ' #' + d.task);
        
        // Display task summary
        jQuery("#sl-summary-table table tbody").empty();
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelCell") + ':</strong></td><td><a class="sl-cell" data-cell="' + d.cell + '">' + d.cellName + ' (' + d.cell + ')</a></td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelStatus") + ':</strong></td><td class="sl-' + d.status + '">' + S.getLocalizedStatus(d.status) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelWeight") + ':</strong></td><td' + wstyle + '>' + nice_number(d.weight) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelVotes") + ':</strong></td><td' + vstyle + '>' + nice_number(d.votes) + ' / ' + nice_number(d.votesMax) + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUser") + ':</strong></td><td>' + d.lastUser + '</td></tr>');
        jQuery("#sl-summary-table table tbody").append('<tr><td><strong>' + S.getLocalizedString("labelLastUpdated") + ':</strong></td><td>' + d.lastUpdated + '</td></tr>');
        
        // Set links
        S.setLinks('#slPanel');
    }
    
    /**
     * Get Full Details for a Given Task
     */
    S.getTaskDetails = function(id, callback) {
        jQuery.getJSON('http://eyewire.org/1.0/task/' + encodeURIComponent(id), function(d1) {
            var task = {
                id: d1.id,
                cell: d1.cell,
                weight: d1.weightsum
            };
            
            jQuery.getJSON('http://eyewire.org/1.0/task/' + encodeURIComponent(id) + '/aggregate', function(d2) {
                var task2 = task;
                
                task2.votes = d2.votes.total;
                task2.votesMax = d2.votes.max;
                
                jQuery.getJSON('http://eyewire.org/1.0/cell/' + encodeURIComponent(task2.cell), function(d3) {
                    task2.cellName = d3.name;
                    
                    // Send task data to callback
                    callback(task2);
                });
            });

        });
    }
    
    /**
     * Get History of User Submissions
     */
    S.getHistory = function() {
        // Prepare history window
        if (S.windowState != 'history') {
            S.historyDisplay = 4;
            
            S.prepareHistoryWindow();
        }

        // Generate request URL
        var url = 'http://scoutslog.org/1.1/history/';
        url += encodeURIComponent(S.historyPosition) + '/' + encodeURIComponent(S.historyDisplay);

        if (S.historyType != '') {
            url += '/type/' + encodeURIComponent(S.historyType);
        }
        
        if (S.historyCell > 0) {
            url += '/cell/' + encodeURIComponent(S.historyCell);
        }
        
        if (S.historyAccuracy != "1") {
            url += '/accuracy/' + encodeURIComponent(S.historyAccuracy);
        }

        // Initiate request
        S.sendMessage(
            "getJSON",
            { url: url },
            "getHistoryCallback"
        );
    }

    /**
     * Callback: Get History of User Submissions
     */
    S.getHistoryCallback = function(d) {
        // Update history position
        S.historyType = d.type;
        S.historyCell = d.cell;
        S.historyAccuracy = d.accuracy;
        S.historyPosition = d.start + d.limit;
        S.historyDisplay = d.limit;
        
        // Set default values
        jQuery('#sl-history-type').val(S.historyType);
        
        if (S.historyCell != 0) {
            jQuery('#sl-history-cell').val(S.historyCell);
        } else {
            jQuery('#sl-history-cell').val('');
        }
        
        jQuery('#sl-history-accuracy').val(S.historyAccuracy);

        // Display history data
        if (d.tasks.length > 0) {
            for (var i in d.tasks) {
                var h = d.tasks[i];

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
    
                var row = '<tr>';
                row += '<td>' + h.task + '<br /><a class="sl-task" data-task="' + h.task + '">' + S.getLocalizedString("actionTask") + '</a> | <a class="sl-jump-task" data-task="' + h.task + '">' + S.getLocalizedString("actionJumpTask") + '</a></td>';
                row += '<td>' + h.cell + '<br /><a class="sl-history-cell" data-cell="' + h.cell + '">' + h.cellName + '</a></td>';
                row += '<td>' + h.type + '<br />&nbsp;</td>';

                if (h.type == "scythed" || h.trailblazer == 1) {
                    row += '<td>' + h.score + ' ' + S.getLocalizedString("labelPoints") + '<br />&nbsp;</td>';
                } else {
                    row += '<td>' + h.score + ' ' + S.getLocalizedString("labelPoints") + '<br />' + a + '</td>';
                }

                row += '<td>' + h.timestamp + '<br />&nbsp;</td>';
                row += '</tr>';

                jQuery("#sl-main-table table tbody").append(row);
            }

            // @TODO: Scroll to end of history data
            var slpc = jQuery("#slPanel div.slPanelContent")[0];
            slpc.scrollTop = slpc.scrollHeight - slpc.offsetHeight;


            // Check for end of data
            if (d.tasks.length < d.limit) {
                jQuery('#slPanel a.sl-more').remove();
            }
        } else {
            // No more data
            
            jQuery('#slPanel a.sl-more').remove();
        }

        // Set links
        S.setLinks('#slPanel');
    }

    /**
     * Callback: Submit New Task Action
     */
    S.submitTaskActionCallback = function(d) {
        if (d.result == true) {
            // Success

            jQuery('#slPanel').hide();
            S.windowState = '';
        } else {
            // Error

            jQuery('#sl-action-buttons button').prop('disabled', false);
            jQuery('#sl-action-buttons p').html( S.getLocalizedString("error_submission") );
        }
    }
    
    /**
     * UI: Prepare Window for Cell Summary
     */
    S.prepareCellWindow = function() {
        // Set window state
        S.windowState = 'cell';
        
        // Prepare display window
        var doc = '';
        doc += '<h2>' + S.getLocalizedString("title") + '<small/></h2>';
        
        doc += '<div id="sl-main-table">';
        doc += '<table class="sl-table">';
        doc += '<colgroup>';
        doc += '<col style="width: 75%" />';
        doc += '<col style="width: 25%" />';
        doc += '</colgroup>';
        doc += '<thead><tr>';
        doc += '<th>' + S.getLocalizedString("columnCell") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnOpenTasks") + '</th>';
        doc += '</tr></thead>';
        doc += '<tbody>';
        doc += '<tr><td colspan="2" style="text-align: center; font-size: 18pt;">' + S.getLocalizedString("messageLoading") + '</td></tr>';
        doc += '</tbody>';
        doc += '</table>';
        doc += '</div>';

        jQuery("#slPanel div.slPanelContent").html(doc);
        jQuery("#slPanel").show();
                    
        // Make sure content panel height is updated
        var h = (jQuery('.gameBoard').height() * 0.80) - 30;
        jQuery('#slPanel div.slPanelContent').height(h);
    }

    /**
     * UI: Prepare Window for Task/Cell Summary
     */
    S.prepareSummaryWindow = function() {
        // Set window state
        S.windowState = 'summary';
        
        // Prepare display window
        var doc = '';
        doc += '<h2>' + S.getLocalizedString("title") + '<small/></h2>';
        
        doc += '<div id="sl-main-table">';
        doc += '<table class="sl-table">';
        doc += '<col style="width: 15%" />';
        doc += '<col style="width: 20%" />';
        doc += '<col style="width: 20%" />';
        doc += '<col style="width: 25%" />';
        doc += '<col style="width: 20%" />';
        doc += '<thead><tr>';
        doc += '<th>' + S.getLocalizedString("columnCube") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnCell") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnStatus") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnLastUser") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnLastUpdated") + '</th>';
        doc += '</tr></thead>';
        doc += '<tbody>';
        doc += '<tr><td colspan="5" style="text-align: center; font-size: 18pt;">' + S.getLocalizedString("messageLoading") + '</td></tr>';
        doc += '</tbody>';
        doc += '</table>';
        doc += '</div>';

        jQuery("#slPanel div.slPanelContent").html(doc);
        jQuery("#slPanel").show();
                    
        // Make sure content panel height is updated
        var h = (jQuery('.gameBoard').height() * 0.80) - 30;
        jQuery('#slPanel div.slPanelContent').height(h);
    }
    
    /**
     * UI: Prepare Window for Cell Task Entries
     */
    S.prepareCellEntriesWindow = function() {
        // Set window state
        S.windowState = 'cell-entries';
        
        // Prepare display window
        var doc = '';
        doc += '<h2>' + S.getLocalizedString("title") + '<small/></h2>';
        
        doc += '<div class="slOptions">';
        doc += '<select>';
        doc += '<option value="" selected>' + S.getLocalizedString("statusOpen") + '</option>';
        doc += '<option value="all">' + S.getLocalizedString("statusAll") + '</option>';
        doc += '<option value="-" disabled>---------------</option>';
        doc += '<option value="missing-nub">' + S.getLocalizedString("statusMissingNub") + '</option>';
        doc += '<option value="missing-branch">' + S.getLocalizedString("statusMissingBranch") + '</option>';
        doc += '<option value="merger">' + S.getLocalizedString("statusMerger") + '</option>';
        doc += '<option value="watch">' + S.getLocalizedString("statusWatch") + '</option>';
        doc += '<option value="need-scythe">' + S.getLocalizedString("statusNeedScythe") + '</option>';
        doc += '<option value="need-admin">' + S.getLocalizedString("statusNeedAdmin") + '</option>';
        doc += '<option value="scythe-complete">' + S.getLocalizedString("statusScytheComplete") + '</option>';
        doc += '<option value="branch-checking">' + S.getLocalizedString("statusBranchChecking") + '</option>';
        doc += '<option value="still-growing">' + S.getLocalizedString("statusStillGrowing") + '</option>';
        doc += '<option value="subtree-complete">' + S.getLocalizedString("statusSubtreeComplete") + '</option>';
        doc += '<option value="good">' + S.getLocalizedString("statusGood") + '</option>';
        doc += '<option value="note">' + S.getLocalizedString("statusNote") + '</option>';
        doc += '</select>';
        doc += '</div><br />';
        
        doc += '<div id="sl-main-table">';
        doc += '<table class="sl-table">';
        doc += '<col style="width: 25%" />';
        doc += '<col style="width: 25%" />';
        doc += '<col style="width: 25%" />';
        doc += '<col style="width: 25%" />';
        doc += '<thead><tr>';
        doc += '<th>' + S.getLocalizedString("columnCube") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnStatus") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnLastUser") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnLastUpdated") + '</th>';
        doc += '</tr></thead>';
        doc += '<tbody>';
        doc += '<tr><td colspan="5" style="text-align: center; font-size: 18pt;">' + S.getLocalizedString("messageLoading") + '</td></tr>';
        doc += '</tbody>';
        doc += '</table>';
        doc += '</div>';

        jQuery("#slPanel div.slPanelContent").html(doc);
        jQuery("#slPanel").show();
                    
        // Make sure content panel height is updated
        var h = (jQuery('.gameBoard').height() * 0.80) - 30;
        jQuery('#slPanel div.slPanelContent').height(h);
        
        // Set handler for display option dropdown
        jQuery('#slPanel div.slOptions select').change(function() {
            var cell = window.scoutsLog.windowState.split('-')[2];
            var status = jQuery('#slPanel div.slOptions select').val();
            
            S.getCellEntries(cell, status);
        });
    }

    /**
     * UI: Prepare Window for Task Summary
     */
    S.prepareTaskWindow = function(t) {
        // Set window state
        S.windowState = 'task-' + t;
        
        // Prepare display window
        var doc = '';
        doc += '<h2>' + S.getLocalizedString("title") + ' | ' + S.getLocalizedString("labelTask") + ' #' + t + ' <button type="button" class="blueButton sl-jump-task" data-task="' + t + '">' + S.getLocalizedString("actionJumpTask") + '</button></h2>';
        
        doc += '<div id="sl-summary-table">';
        doc += '<table class="sl-table">';
        doc += '<colgroup>';
        doc += '<col style="width: 25%" />';
        doc += '<col style="width: 75%" />';
        doc += '</colgroup>';
        doc += '<tbody>';
        doc += '<tr><td colspan="2" style="text-align: center; font-size: 18pt;">' + S.getLocalizedString("messageLoading") + '</td></tr>';
        doc += '</tbody>';
        doc += '</table>';
        doc += '</div><br />';
        
        doc += '<button type="button" class="blueButton sl-new-action" title="' + S.getLocalizedString("actionNewEntryTooltip") + '">' + S.getLocalizedString("actionNewEntry") + '</button><br />';
        
        doc += '<div id="sl-main-table">';
        doc += '<table class="sl-table">';
        doc += '<colgroup>';
        doc += '<col style="width: 15%" />';
        doc += '<col style="width: 20%" />';
        doc += '<col style="width: 35%" />';
        doc += '<col style="width: 15%" />';
        doc += '<col style="width: 15%" />';
        doc += '</colgroup>';
        doc += '<thead><tr>';
        doc += '<th>' + S.getLocalizedString("columnStatus") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnUser") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnNotes") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnImage") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnLastUpdated") + '</th>';
        doc += '</tr></thead>';
        doc += '<tbody>';
        doc += '<tr><td colspan="5" style="text-align: center; font-size: 18pt;">' + S.getLocalizedString("messageLoading") + '</td></tr>';
        doc += '</tbody>';
        doc += '</table>';
        doc += '</div><br />';
        
        doc += '<button type="button" class="blueButton sl-new-action" title="' + S.getLocalizedString("actionNewEntryTooltip") + '">' + S.getLocalizedString("actionNewEntry") + '</button><br />';
        

        jQuery("#slPanel div.slPanelContent").html(doc);
        jQuery("#slPanel").show();
                    
        // Make sure content panel height is updated
        var h = (jQuery('.gameBoard').height() * 0.80) - 30;
        jQuery('#slPanel div.slPanelContent').height(h);
        
        // Set handler for new action buttons
        jQuery("#slPanel button.sl-new-action").click(function() {
            // Prepare display window
            S.prepareTaskActionWindow(t);
            
            // Capture image data
            S.capture3D();
            S.capture2D();
            
            // Get task summary
            S.getTaskSummary(t);
        });
    }

    /**
     * UI: Prepare Window for Task Action
     */
    S.prepareTaskActionWindow = function(t) {
        // Set window state
        S.windowState = 'action';
        
        // Prepare display window
        var doc = '';
        doc += '<h2>' + S.getLocalizedString("windowNewEntryTitle") + '<small>Task #' + t + '</small></h2>';
        
        doc += '<div id="sl-summary-table">';
        doc += '<table class="sl-table">';
        doc += '<colgroup>';
        doc += '<col style="width: 25%" />';
        doc += '<col style="width: 75%" />';
        doc += '</colgroup>';
        doc += '<tbody>';
        doc += '<tr><td colspan="2" style="text-align: center; font-size: 18pt;">' + S.getLocalizedString("messageLoading") + '</td></tr>';
        doc += '</tbody>';
        doc += '</table>';
        doc += '</div><br />';
        
        doc += '<form onsubmit="return false;">';
        doc += '<div id="sl-action-table">';
        doc += '<table class="sl-table">';
        doc += '<colgroup>';
        doc += '<col style="width: 25%" />';
        doc += '<col style="width: 75%" />';
        doc += '</colgroup>';
        doc += '<tbody>';
        doc += '<tr>';
        doc += '<td><label for="sl-action-status">' + S.getLocalizedString("labelStatus") + ':</label></td>';
        doc += '<td>';
        doc += '<select id="sl-action-status" name="status">';
        doc += '<option value="missing-nub">' + S.getLocalizedString("statusMissingNub") + '</option>';
        doc += '<option value="missing-branch">' + S.getLocalizedString("statusMissingBranch") + '</option>';
        doc += '<option value="merger">' + S.getLocalizedString("statusMerger") + '</option>';
        doc += '<option value="watch">' + S.getLocalizedString("statusWatch") + '</option>';
        doc += '<option value="need-scythe">' + S.getLocalizedString("statusNeedScythe") + '</option>';
        doc += '<option value="need-admin">' + S.getLocalizedString("statusNeedAdmin") + '</option>';
        doc += '<option value="scythe-complete">' + S.getLocalizedString("statusScytheComplete") + '</option>';
        doc += '<option value="branch-checking">' + S.getLocalizedString("statusBranchChecking") + '</option>';
        doc += '<option value="still-growing">' + S.getLocalizedString("statusStillGrowing") + '</option>';
        doc += '<option value="subtree-complete">' + S.getLocalizedString("statusSubtreeComplete") + '</option>';
        doc += '<option value="good">' + S.getLocalizedString("statusGood") + '</option>';
        doc += '<option value="note">' + S.getLocalizedString("statusNote") + '</option>';
        doc += '</select>';
        doc += '</td>';
        doc += '</tr>';
        doc += '<tr><td><strong>' + S.getLocalizedString("labelReaped") + '</strong></td><td><input type="radio" name="reaped" value="1" /> ' + S.getLocalizedString("labelYes") + '&nbsp;&nbsp;&nbsp;<input type="radio" name="reaped" value="0" checked />' + S.getLocalizedString("labelNo") + '</td></tr>';
        doc += '<tr><td><strong>' + S.getLocalizedString("label3DImage") + ':</strong></td><td><input type="hidden" id="sl-action-image-3d" name="image-data-3d" value="" /><div id="sl-action-image-status-3d">' + S.getLocalizedString("messageProcessing") + '</div></td></tr>';
        doc += '<tr><td><strong>' + S.getLocalizedString("label2DImage") + ':</strong></td><td><input type="hidden" id="sl-action-image-2d" name="image-data-2d" value="" /><div id="sl-action-image-status-2d">' + S.getLocalizedString("messageProcessing") + '</div></td></tr>';
        doc += '<tr><td><strong>' + S.getLocalizedString("labelAnnotatedImage") + ':</strong></td><td><input type="hidden" id="sl-action-image-annotated" name="image-data-annotated" value="" /><input type="hidden" id="sl-action-image-annotated-sketch" name="image-data-annotated-sketch" value="" /><div id="sl-action-image-status-annotated">' + S.getLocalizedString("labelNotApplicable") + ' | <a class="sl-capture" title="' + S.getLocalizedString("actionAnnotateTooltip") + '">' + S.getLocalizedString("actionAnnotate") + '</a>' + '</div></td></tr>';
        doc += '<tr><td><strong>' + S.getLocalizedString("labelNotes") + ':</strong></td><td><textarea name="notes" id="sl-action-notes" rows="4" cols="75"></textarea></td></tr>';
        doc += '</tbody>';
        doc += '</table>';
        doc += '</div>';

        doc += '<div id="sl-action-buttons" style="text-align:center;">';
        doc += '<button type="button" class="sl-submit greenButton" title="' + S.getLocalizedString("actionSubmitTooltip") + '">' + S.getLocalizedString("actionSubmit") + '</button> ';
        doc += '<button type="button" class="sl-cancel redButton" title="' + S.getLocalizedString("actionCancelTooltip") + '">' + S.getLocalizedString("actionCancel") + '</button> ';
        doc += '</div>';
        doc += '</form>';
        
        jQuery("#slPanel div.slPanelContent").html(doc);
        jQuery("#slPanel").show();
                    
        // Make sure content panel height is updated
        var h = (jQuery('.gameBoard').height() * 0.80) - 30;
        jQuery('#slPanel div.slPanelContent').height(h);

        // Prevent keystrokes for notes from bubbling
        jQuery('#sl-action-notes').keydown(function(e) {
            e.stopPropagation();
        });
        
        // Set handlers for buttons
        jQuery('#slPanel button.sl-cancel').click(function() {
            jQuery('#slPanel').hide();
        });
        
        jQuery('#slPanel #sl-action-image-status-annotated a.sl-capture').click(function() {
            S.createAnnotation(t);
        });


        jQuery('#slPanel button.sl-submit').click(function() {
            // Set interface
            jQuery('#sl-action-buttons button').prop('disabled', true);
            jQuery('#sl-action-buttons').append('<p>' + S.getLocalizedString("messageSaving") + '</p>');

            // Get current cube/task
            if (!t) {
                var target = window.tomni.getTarget();

                if (target) {
                    if (Array.isArray(target)) {
                        t = target[0].id;
                    } else {
                        t = target.id;
                    }

                    if (typeof t == 'undefined') {
                        t = window.tomni.task.id;
                    }
                }
            }
        

            // Prepare data object
            var imA = jQuery('#sl-action-image-annotated').val();

            if (imA != "") {
                var data = {
                    cell: window.tomni.cell,
                    task: t,
                    status: jQuery('#sl-action-status').val(),
                    reaped: jQuery('#sl-action-table input:radio[name=reaped]:checked').val(),
                    notes: jQuery('#sl-action-notes').val(),
                    image: imA
                };
            } else {
                var data = {
                    cell: window.tomni.cell,
                    task: t,
                    status: jQuery('#sl-action-status').val(),
                    reaped: jQuery('#sl-action-table input:radio[name=reaped]:checked').val(),
                    notes: jQuery('#sl-action-notes').val(),
                    image2D: jQuery('#sl-action-image-2d').val(),
                    image3D: jQuery('#sl-action-image-3d').val()
                };
            }

            // Initiate request through plugin
            S.sendMessage(
                "postRequest",
                {
                     url: "http://scoutslog.org/1.1/task/" + encodeURIComponent(t) + "/action/create",
                     data: "data=" + encodeURIComponent(JSON.stringify(data))
                },
                "submitTaskActionCallback"
            );
        });
    }

    /**
     * UI: Prepare Window for User Submission History
     */
    S.prepareHistoryWindow = function() {
        // Set window state
        S.windowState = 'history';
        S.historyPosition = 0;

        
        // Prepare display window
        var doc = '';
        doc += '<h2>' + S.getLocalizedString("title") + '<small>' + S.getLocalizedString("windowHistoryTitle") + '</small></h2>';

        doc += '<div id="slOptions">';
        doc += '<div style="display:inline-block;margin-right:10px;">';
        doc += '<label>' + S.getLocalizedString("labelSubmissionType") + ':</label><br />';
        doc += '<select id="sl-history-type">';
        doc += '<option value="">' + S.getLocalizedString("historyTypesAll") + '</option>';
        doc += '<option value="normal">' + S.getLocalizedString("historyTypesNormal") + '</option>';
        doc += '<option value="trailblazer">' + S.getLocalizedString("historyTypesTrailblazer") + '</option>';
        doc += '<option value="scythed">' + S.getLocalizedString("historyTypesScythed") + '</option>';
        doc += '</select>';
        doc += '</div>';
        doc += '<div style="display:inline-block;margin-right:10px;">';
        doc += '<label>' + S.getLocalizedString("labelCellID") + ':</label><br />';
        doc += '<input type="text" id="sl-history-cell" value="" size="12" />';
        doc += '</div>';
        doc += '<div style="display:inline-block;margin-right:10px;">';
        doc += '<label>' + S.getLocalizedString("labelConsensus") + ':</label><br />';
        doc += '<select id="sl-history-accuracy">';
        doc += '<option value="1">' + S.getLocalizedString("historyConsensusAll") + '</option>';
        doc += '<option value="0.5-0.9">' + S.getLocalizedString("historyConsensus5090") + '</option>';        
        doc += '<option value="0.5">' + S.getLocalizedString("historyConsensus50") + '</option>';
        doc += '<option value="0">' + S.getLocalizedString("historyConsensusNone") + '</option>';
        doc += '</select>';
        doc += '</div>';
        doc += '<div style="display:inline-block;margin-right:10px;">';
        doc += '<button type="button" id="sl-history-refresh" class="blueButton" title="' + S.getLocalizedString("actionRefreshTooltip") + '">' + S.getLocalizedString("actionRefresh") + '</button>';
        doc += '</div>';
        doc += '</div><br />';
        
        doc += '<div id="sl-main-table">';
        doc += '<table class="sl-table">';
        doc += '<col style="width: 20%" />';
        doc += '<col style="width: 30%" />';
        doc += '<col style="width: 10%" />';
        doc += '<col style="width: 15%" />';
        doc += '<col style="width: 25%" />';
        doc += '<thead><tr>';
        doc += '<th>' + S.getLocalizedString("columnCube") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnCell") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnType") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnScore") + '</th>';
        doc += '<th>' + S.getLocalizedString("columnTimestamp") + '</th>';
        doc += '</tr></thead>';
        doc += '<tbody>';
        doc += '</tbody>';
        doc += '</table>';
        doc += '</div>';
        doc += '<p style="text-align: center;"><a class="sl-more" href="javascript:void(0);" title="' + S.getLocalizedString("actionMoreTooltip") + '">&#10836; ' + S.getLocalizedString("actionMore") + ' &#10836;</a></p>';

        jQuery("#slPanel div.slPanelContent").html(doc);
        jQuery("#slPanel").show();
                    
        // Make sure content panel height is updated
        var h = (jQuery('.gameBoard').height() * 0.80) - 30;
        jQuery('#slPanel div.slPanelContent').height(h);

        // Set handler for more link
        jQuery('#slPanel div.slPanelContent a.sl-more').click(function() {
            S.getHistory();
        });

        // Set default values
        jQuery('#sl-history-type').val(S.historyType);
        
        if (S.historyCell != 0) {
            jQuery('#sl-history-cell').val(S.historyCell);
        } else {
            jQuery('#sl-history-cell').val('');
        }
        
        jQuery('#sl-history-accuracy').val(S.historyAccuracy);
        
        // Prevent bubbling for cell ID
        jQuery('#sl-history-cell').keydown(function(e) {
            e.stopPropagation();
        });
        
        jQuery('#sl-history-cell').keyup(function(e) {
            e.stopPropagation();
        });
        
        

        // Set event handlers
        jQuery('#sl-history-refresh').click(function() {
            S.historyType = jQuery('#sl-history-type').val();

            var c = parseInt(jQuery('#sl-history-cell').val(), 10);
            
            if (isNaN(c)) {
                c = 0;
                jQuery('#sl-history-cell').val('');
            }
            
            S.historyCell = c;
            S.historyAccuracy = jQuery('#sl-history-accuracy').val();
            
            S.windowState = '';

            S.getHistory();
        });
    }
    
    
    /**
     * Utils: Set Links for Common Items
     */
    S.setLinks = function(o) {
        jQuery(o).find('.sl-jump-task').each(function() {
            var task = jQuery(this).attr('data-task');
            
            jQuery(this).attr( "title", S.getLocalizedString("actionJumpTaskTooltip") );
            
            jQuery(this).click(function() {
                jQuery('#slPanel').hide();

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
        
        jQuery(o).find('a.sl-task').each(function() {
            var t = jQuery(this).attr('data-task');
            
            jQuery(this).attr( "title", S.getLocalizedString("actionTaskTooltip") );
            
            jQuery(this).click(function() {    
                S.getTaskEntries(t);
            });
        });
        
        jQuery(o).find('a.sl-cell').each(function() {
            var c = jQuery(this).attr('data-cell');
            
            jQuery(this).attr( "title", S.getLocalizedString("actionCellTooltip") );
            
            jQuery(this).click(function() {    
                S.getCellEntries(c, '');
            });
        });

        jQuery(o).find('a.sl-history-cell').each(function() {
            var c = jQuery(this).attr('data-cell');
            
            jQuery(this).attr( "title", S.getLocalizedString("actionCellTooltip") );
            
            jQuery(this).click(function() {    
                S.historyCell = c;
                S.windowState = '';

                S.getHistory();
            });
        });
        
    };

    /**
     * Utils: Set Common Links in Chat Window
     */
    S.setChatLinks = function(o) {
        // Get actual chat text
        var t = jQuery(o).children('.actualText').html();

        // Search for cube links
        var text = t.replace(/#([0-9]+)/g, '<a class="sl-jump-task" data-task="$1" title="' + S.getLocalizedString("actionJumpTaskTooltip") + '">#$1</a>');

        // Replace chat text
        jQuery(o).children('.actualText').html(text);

        // Refresh chat links
        S.setLinks(o);

    }

    /**
     * UI: Create Main Window
     */
    S.setMainPanel = function() {
        var panel = '<div id="slPanel" style="display: none;">';
        panel += '<a href="javascript:void(0);" class="sl-close-window" title="' + S.getLocalizedString("actionHideWindowTooltip") + '"><img src="' + S.images.close + '" alt="' + S.getLocalizedString("actionHideWindowTooltip") + '" /></a>';
        panel += '<div class="slPanelContent"></div>';
        panel += '</div>';
        jQuery("#content .gameBoard").append(panel);

        jQuery('#slPanel a.sl-close-window').click(function() {
            jQuery('#slPanel').hide();
        });
    }
    
    /**
     * UI: Create Floating Panel
     */
    S.setFloatingPanel = function() {
        S.sendMessage("getPosition", {}, "setFloatingPanelCallback");
    }

    S.setFloatingPanelCallback = function(msg) {
        var style = '';
        var vertical = false;

        if (msg.position) {
            var t = msg.position.top;
            var l = Math.abs(msg.position.left);

            if (l > (jQuery(window).width() - 50)) {
                l = jQuery(window).width() - 50;
            }

            if (t > (jQuery(window).height() - 50)) {
                t = jQuery(window).height() - 50;
            }

            if (t < - 50) {
                t = 0;
            }

            style = ' style="top:' + t + 'px;left:' + l + 'px;"';
            
            if (msg.position.vertical) {
                style += ' class="sl-vertical"';
                vertical = true;
            }
        }

        var panel = '<div id="scoutsLogFloatingControls"' + style + '>';
        panel += '<img src="' + S.images.logo + '" style="float: left;" />';
        
        if (vertical) {
            panel += '<a class="translucent flat minimalButton active sl-cell-list" title="' + S.getLocalizedString("panelCellListTooltip") + '">' + S.getLocalizedString("panelCellListShort") + '</a>';
            panel += '<a class="translucent flat minimalButton active sl-open" title="' + S.getLocalizedString("panelOpenTooltip") + '">' + S.getLocalizedString("panelOpenShort") + '</a>';
            panel += '<a class="translucent flat minimalButton active sl-need-admin" title="' + S.getLocalizedString("panelNeedAdminTooltip") + '">' + S.getLocalizedString("panelNeedAdminShort") + ' <span id="sl-need-admin-badge" class="sl-badge">0</span></a>';
            panel += '<a class="translucent flat minimalButton active sl-need-scythe" title="' + S.getLocalizedString("panelNeedScytheTooltip") + '">' + S.getLocalizedString("panelNeedScytheShort") + ' <span id="sl-need-scythe-badge" class="sl-badge">0</span></a>';
            panel += '<a class="translucent flat minimalButton active sl-watch" title="' + S.getLocalizedString("panelWatchTooltip") + '">' + S.getLocalizedString("panelWatchShort") + ' <span id="sl-watch-badge" class="sl-badge">0</span></a>';
            panel += '<a class="translucent flat minimalButton active sl-history" title="' + S.getLocalizedString("panelHistoryTooltip") + '">' + S.getLocalizedString("panelHistoryShort") + '</a>';
            panel += '<a class="translucent flat minimalButton active sl-task" id="sl-task-details" title="' + S.getLocalizedString("panelTaskDetailsTooltip") + '" style="display: none;">' + S.getLocalizedString("panelTaskDetailsShort") + '</a>';
            panel += '<a class="translucent flat minimalButton active sl-task" id="sl-task-entry" title="' + S.getLocalizedString("panelTaskEntryTooltip") + '" style="display: none;">' + S.getLocalizedString("panelTaskEntryShort") + '</a>';
        } else {
            panel += '<a class="translucent flat minimalButton active sl-cell-list" title="' + S.getLocalizedString("panelCellListTooltip") + '">' + S.getLocalizedString("panelCellList") + '</a>';
            panel += '<a class="translucent flat minimalButton active sl-open" title="' + S.getLocalizedString("panelOpenTooltip") + '">' + S.getLocalizedString("panelOpen") + '</a>';
            panel += '<a class="translucent flat minimalButton active sl-need-admin" title="' + S.getLocalizedString("panelNeedAdminTooltip") + '">' + S.getLocalizedString("panelNeedAdmin") + ' <span id="sl-need-admin-badge" class="sl-badge">0</span></a>';
            panel += '<a class="translucent flat minimalButton active sl-need-scythe" title="' + S.getLocalizedString("panelNeedScytheTooltip") + '">' + S.getLocalizedString("panelNeedScythe") + ' <span id="sl-need-scythe-badge" class="sl-badge">0</span></a>';
            panel += '<a class="translucent flat minimalButton active sl-watch" title="' + S.getLocalizedString("panelWatchTooltip") + '">' + S.getLocalizedString("panelWatch") + ' <span id="sl-watch-badge" class="sl-badge">0</span></a>';
            panel += '<a class="translucent flat minimalButton active sl-history" title="' + S.getLocalizedString("panelHistoryTooltip") + '">' + S.getLocalizedString("panelHistory") + '</a>';
            panel += '<a class="translucent flat minimalButton active sl-task" id="sl-task-details" title="' + S.getLocalizedString("panelTaskDetailsTooltip") + '" style="display: none;">' + S.getLocalizedString("panelTaskDetails") + '</a>';
            panel += '<a class="translucent flat minimalButton active sl-task" id="sl-task-entry" title="' + S.getLocalizedString("panelTaskEntryTooltip") + '" style="display: none;">' + S.getLocalizedString("panelTaskEntry") + '</a>';            
        }
        
        panel += '</div>';
        
        // Add panel to game board
        jQuery(panel).appendTo('#content .gameBoard');
        
        jQuery('#scoutsLogFloatingControls').draggable({
            container: 'window',
            stop: function(e, ui) {
                jQuery('#scoutsLogFloatingControls').css('width', '');

                // Update position in settings
                S.sendMessage(
                    "setPosition",
                    { position: ui.position, vertical: jQuery('#scoutsLogFloatingControls').hasClass('vertical') },
                    ""
                );
            }
        });
        
        // Add events to links
        jQuery('#scoutsLogFloatingControls img').dblclick(function() {
            // Toggle floating panel display
            
            if (jQuery('#scoutsLogFloatingControls').hasClass('sl-vertical')) {
                jQuery('#scoutsLogFloatingControls').removeClass('sl-vertical');
        
                jQuery('#scoutsLogFloatingControls a.sl-cell-list').html( S.getLocalizedString("panelCellList") );
                jQuery('#scoutsLogFloatingControls a.sl-open').html( S.getLocalizedString("panelOpen") );
                jQuery('#scoutsLogFloatingControls a.sl-need-admin').html( S.getLocalizedString("panelNeedAdmin") + ' <span id="sl-need-admin-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-need-scythe').html( S.getLocalizedString("panelNeedScythe") + ' <span id="sl-need-scythe-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-watch').html( S.getLocalizedString("panelWatch") + ' <span id="sl-watch-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-history').html( S.getLocalizedString("panelHistory") );
                jQuery('#scoutsLogFloatingControls #sl-task-details').html( S.getLocalizedString("panelTaskDetails") );
                jQuery('#scoutsLogFloatingControls #sl-task-entry').html( S.getLocalizedString("panelTaskEntry") );
            } else {
                jQuery('#scoutsLogFloatingControls').addClass('sl-vertical');

                jQuery('#scoutsLogFloatingControls a.sl-cell-list').html( S.getLocalizedString("panelCellListShort") );
                jQuery('#scoutsLogFloatingControls a.sl-open').html( S.getLocalizedString("panelOpenShort") );
                jQuery('#scoutsLogFloatingControls a.sl-need-admin').html( S.getLocalizedString("panelNeedAdminShort") + ' <span id="sl-need-admin-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-need-scythe').html( S.getLocalizedString("panelNeedScytheShort") + ' <span id="sl-need-scythe-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-watch').html( S.getLocalizedString("panelWatchShort") + ' <span id="sl-watch-badge" class="sl-badge">0</span>');
                jQuery('#scoutsLogFloatingControls a.sl-history').html( S.getLocalizedString("panelHistoryShort") );
                jQuery('#scoutsLogFloatingControls #sl-task-details').html( S.getLocalizedString("panelTaskDetailsShort") );
                jQuery('#scoutsLogFloatingControls #sl-task-entry').html( S.getLocalizedString("panelTaskEntryShort") );
            }
            
            // Set timer to update panel stats
            window.scoutsLog.doPanelStats();
        });
        
        
        jQuery('#scoutsLogFloatingControls a.sl-cell-list').click(S.showCells);
        jQuery('#scoutsLogFloatingControls a.sl-open').click(S.showOpen);
        jQuery('#scoutsLogFloatingControls a.sl-need-admin').click(S.showAdmin);
        jQuery('#scoutsLogFloatingControls a.sl-need-scythe').click(S.showScythe);
        jQuery('#scoutsLogFloatingControls a.sl-watch').click(S.showWatch);
        jQuery('#scoutsLogFloatingControls a.sl-history').click(S.showHistory);

        jQuery('#sl-task-details').click(function() {
            // Get current cube/task
            var target = window.tomni.getTarget();
            var t;

            if (Array.isArray(target)) {
                t = target[0].id;
            } else {
                t = target.id;
            }
            
            if (typeof t == 'undefined') {
                t = window.tomni.task.id;
            }
            
            var test = 'task-' + t;
            
            // Check window state
            if (window.scoutsLog.windowState == test || window.scoutsLog.windowState == 'task') {
                // Same task window is open, close instead
                
                if (jQuery('#slPanel').is(':visible')) {
                    jQuery('#slPanel').hide();
                } else {
                    jQuery('#slPanel').show();
                }
            } else {
                // Show log entries for currently selected cube
                window.scoutsLog.getTaskEntriesInspect();
		jQuery('#slPanel').show();
            }
        });
        
        jQuery("#sl-task-entry").click(function() {
            var target = window.tomni.getTarget();
            var t;

            if (Array.isArray(target)) {
                t = target[0].id;
            } else {
                t = target.id;
            }
            
            if (typeof t == 'undefined') {
                t = window.tomni.task.id;
            }
            
            // Prepare display window
            S.prepareTaskActionWindow(t);
            
            // Capture image data
            S.capture3D();
            S.capture2D();
            
            // Get task summary
            S.getTaskSummary();
        });

        // Set stats refresh function
        setInterval(function() {
            S.doPanelStats();
        }, 60000);
        
        S.doPanelStats();
    }

    /**
     * UI: Create Window Display Toggle Button
     */
    S.setGameTools = function() {
        var button = '<div title="' + S.getLocalizedString("actionShowWindowTooltip") + '" id="scoutsLogPanelButton" class="menuButton"><img src="' + S.images.logo + '" height="20" width="20" alt="' + S.getLocalizedString("actionShowWindowTooltip") + '" /></div>';

        jQuery("#gameTools").append(button);

        jQuery('#scoutsLogPanelButton').click(function() {
            if (S.windowState != '') {
                if (jQuery('#slPanel').is(':visible')) {
                    jQuery('#slPanel').hide();
                    jQuery('#scoutsLogFloatingControls').hide();
                } else {
                    if (S.windowState == 'history' && S.historyPosition == S.historyDisplay) {
                        S.windowState = '';

                        S.getHistory();
                    }

                    jQuery('#slPanel').show();
                    jQuery('#scoutsLogFloatingControls').show();
                }
            }
        });
    }
    
    /**
     * Update Floating Panel Stats Values
     */
    S.doPanelStats = function() {
        S.sendMessage(
            "getJSON",
            { url: "http://scoutslog.org/1.1/stats/header" },
            "doPanelStatsCallback"
        );
    };
    
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
    };
    
    
    
    /**
     * Utils: Capture Image Data from 3D Canvas
     */
    S.capture3D = function() {
        if (jQuery('#threeD canvas').length == 1) {
            // Get 3D canvas object
            var c = jQuery('#threeD canvas')[0];
            
            // Force a render
            window.tomni.threeD.render();
            
            // Store image data
            jQuery('#sl-action-image-3d').val(c.toDataURL());
            
            // Update image status
            jQuery('#sl-action-image-status-3d').html('<a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '">' + S.getLocalizedString("actionPreview") + '</a> | <a class="sl-capture" title="' + S.getLocalizedString("actionRecaptureTooltip") + '">' + S.getLocalizedString("actionRecapture") + '</a> | <a class="sl-remove" title="' + S.getLocalizedString("actionRemoveTooltip") + '">' + S.getLocalizedString("actionRemove") + '</a>');
            
            // Assign click functions
            jQuery('#sl-action-image-status-3d a.sl-preview').click(function() {
                var w = window.open();
                
                w.document.open();
                w.document.write('<!DOCTYPE html><head><title>' + S.getLocalizedString("windowImagePreviewTitle") + '</title>');
                w.document.write('<style type="text/css">body { background-color: #232323; color: #fff; }</style>');
                w.document.write('</head><body>');
                w.document.write('<img src="' + jQuery('#sl-action-image-3d').val() + '"/>');
                w.document.write('</body></html>');
                w.document.close();
            });
            
            jQuery('#sl-action-image-status-3d a.sl-capture').click(function() {
                var res = confirm("Are you sure you want to to re-capture this image?  Any annotations will be lost.");

                if (res) {
                    jQuery('#sl-action-image-status-3d').html( S.getLocalizedString("messageProcessing") );
                
                    setTimeout(function() { window.scoutsLog.capture3D(); }, 1000);


                    // Clear annotations
                    jQuery('#sl-action-image-annotated').val('');
                        
                    jQuery('#sl-action-image-status-annotated').html( S.getLocalizedString("labelNotApplicable") + ' | <a class="sl-capture" title="' + S.getLocalizedString("actionAnnotateTooltip") + '">' + S.getLocalizedString("actionAnnotate") + '</a>');
            
                    jQuery('#sl-action-image-status-annotated a.sl-capture').click(function() {
                        S.createAnnotation();
                    });                }
            });
            
            jQuery('#sl-action-image-status-3d a.sl-remove').click(function() {
                var res = confirm("Are you sure you want to to remove this image?  Any annotations will be lost.");

                if (res) {
                    jQuery('#sl-action-image-3d').val('');
                            
                    jQuery('#sl-action-image-status-3d').html( S.getLocalizedString("labelNotApplicable") + ' | <a class="sl-capture" title="' + S.getLocalizedString("actionCaptureTooltip") + '">' + S.getLocalizedString("actionCapture") + '</a>');
                
                    jQuery('#sl-action-image-status-3d a.sl-capture').click(function() {
                        jQuery('#sl-action-image-status-3d').html( S.getLocalizedString("messageProcessing") );
                    
                        setTimeout(function() { window.scoutsLog.capture3D(); }, 1000);
                    });


                    // Clear annotations
                    jQuery('#sl-action-image-annotated').val('');
                        
                    jQuery('#sl-action-image-status-annotated').html( S.getLocalizedString("labelNotApplicable") + ' | <a class="sl-capture" title="' + S.getLocalizedString("actionAnnotateTooltip") + '">' + S.getLocalizedString("actionAnnotate") + '</a>');
            
                    jQuery('#sl-action-image-status-annotated a.sl-capture').click(function() {
                        S.createAnnotation();
                    });
                }
            })
            
        }
        
    }

    /**
     * Utils: Capture Image Data from 2D Canvas
     */
    S.capture2D = function() {
        if (jQuery('#twoD canvas').length == 1 && window.tomni.gameMode) {
            // Get 2D canvas object
            var c = jQuery('#twoD canvas')[0];
            
            // Force a render
            window.tomni.twoD.render();
            
            // Store image data
            jQuery('#sl-action-image-2d').val(c.toDataURL());
            
            // Update image status
            jQuery('#sl-action-image-status-2d').html('<a class="sl-preview" title="' + S.getLocalizedString("actionPreviewTooltip") + '">' + S.getLocalizedString("actionPreview") + '</a> | <a class="sl-capture" title="' + S.getLocalizedString("actionRecaptureTooltip") + '">' + S.getLocalizedString("actionRecapture") + '</a> | <a class="sl-remove" title="' + S.getLocalizedString("actionRemoveTooltip") + '">' + S.getLocalizedString("actionRemove") + '</a>');
            
            // Assign click functions
            jQuery('#sl-action-image-status-2d a.sl-preview').click(function() {
                var w = window.open();
                
                w.document.open();
                w.document.write('<!DOCTYPE html><head><title>' + S.getLocalizedString("windowImagePreviewTitle") + '</title>');
                w.document.write('<style type="text/css">body { background-color: #232323; color: #fff; }</style>');
                w.document.write('</head><body>');
                w.document.write('<img src="' + jQuery('#sl-action-image-2d').val() + '"/>');
                w.document.write('</body></html>');
                w.document.close();
            });
            
            jQuery('#sl-action-image-status-2d a.sl-capture').click(function() {
                var res = confirm("Are you sure you want to to re-capture this image?  Any annotations will be lost.");

                if (res) {
                    jQuery('#sl-action-image-status-2d').html( S.getLocalizedString("messageProcessing") );
                
                    setTimeout(function() { window.scoutsLog.capture2D(); }, 1000);

                    // Clear annotations
                    jQuery('#sl-action-image-annotated').val('');
                        
                    jQuery('#sl-action-image-status-annotated').html( S.getLocalizedString("labelNotApplicable") + ' | <a class="sl-capture" title="' + S.getLocalizedString("actionAnnotateTooltip") + '">' + S.getLocalizedString("actionAnnotate") + '</a>');
            
                    jQuery('#sl-action-image-status-annotated a.sl-capture').click(function() {
                        S.createAnnotation();
                    });
                }
            });
            
            jQuery('#sl-action-image-status-2d a.sl-remove').click(function() {
                var res = confirm("Are you sure you want to to remove this image?  Any annotations will be lost.");

                if (res) {
                    jQuery('#sl-action-image-2d').val('');
                            
                    jQuery('#sl-action-image-status-2d').html( S.getLocalizedString("labelNotApplicable") + ' | <a class="sl-capture" title="' + S.getLocalizedString("actionCaptureTooltip") + '">' + S.getLocalizedString("actionCapture") + '</a>');
                
                    jQuery('#sl-action-image-status-2d a.sl-capture').click(function() {
                        jQuery('#sl-action-image-status-2d').html( S.getLocalizedString("messageProcessing") );
                    
                        setTimeout(function() { window.scoutsLog.capture2D(); }, 1000);
                    });

                    // Clear annotations
                    jQuery('#sl-action-image-annotated').val('');
                        
                    jQuery('#sl-action-image-status-annotated').html( S.getLocalizedString("labelNotApplicable") + ' | <a class="sl-capture" title="' + S.getLocalizedString("actionAnnotateTooltip") + '">' + S.getLocalizedString("actionAnnotate") + '</a>');
            
                    jQuery('#sl-action-image-status-annotated a.sl-capture').click(function() {
                        S.createAnnotation();
                    });
                }
            });
            
        } else {
            // 2D canvas is not visible/available

            jQuery('#sl-action-image-status-2d').html( S.getLocalizedString("labelNotApplicable") );
        }
        
    }


    S.showAnnotation = function() {
        S.sendMessage(
            "getRequest",
            { url: S.baseDataURL + "_locales/" + S.locale + "/composite.htm" },
            "showAnnotationCallback"
        );
    };

    S.showAnnotationCallback = function(msg) {
        var t = jQuery('#slPanel h2 small').text().replace(/[^0-9]+/, '');
        
        var w = window.open();
    
        msg = msg.replace( "[ICON]", S.images.logoSmall );
        msg = msg.replace( "[TASK]", t );
        msg = msg.replace( "[IMAGE_3D]", jQuery('#sl-action-image-3d').val() );
        msg = msg.replace( "[IMAGE_2D]", jQuery('#sl-action-image-2d').val() );
                    
        w.document.open();
        w.document.write(msg);
        w.document.close();

        setTimeout(function() {
            w.load_annotation( jQuery("#sl-action-image-annotated-sketch").val() );
        }, 1000);
    };
    
    S.createAnnotation = function() {
        S.sendMessage(
            "getRequest",
            { url: S.baseDataURL + "_locales/" + S.locale + "/composite.htm" },
            "createAnnotationCallback"
        );
    };

    S.createAnnotationCallback = function(msg) {
        var t = jQuery('#slPanel h2 small').text().replace(/[^0-9]+/, '');
        
        var w = window.open();
    
        msg = msg.replace( "[ICON]", S.images.logoSmall );
        msg = msg.replace( "[TASK]", t );
        msg = msg.replace( "[IMAGE_3D]", jQuery('#sl-action-image-3d').val() );
        msg = msg.replace( "[IMAGE_2D]", jQuery('#sl-action-image-2d').val() );
                    
        w.document.open();
        w.document.write(msg);
        w.document.close();
    };
    
    S.saveAnnotation = function(data) {
        // Store data
        jQuery("#sl-action-image-annotated").val(data.image);
        jQuery("#sl-action-image-annotated-sketch").val(data.sketch);
        
        // Update image status
        jQuery('#sl-action-image-status-annotated').html('<a class="sl-preview" title="' + S.getLocalizedString("actionAnnotateTooltip") + '">' + S.getLocalizedString("actionAnnotate") + '</a> | <a class="sl-remove" title="' + S.getLocalizedString("actionRemoveTooltip") + '">' + S.getLocalizedString("actionRemove") + '</a>');

        // Assign click functions
        jQuery('#sl-action-image-status-annotated a.sl-preview').click(function() {
            S.showAnnotation();
        });
        
        jQuery('#sl-action-image-status-annotated a.sl-remove').click(function() {
            jQuery('#sl-action-image-annotated').val('');
                        
            jQuery('#sl-action-image-status-annotated').html( S.getLocalizedString("labelNotApplicable") + ' | <a class="sl-capture" title="' + S.getLocalizedString("actionAnnotateTooltip") + '">' + S.getLocalizedString("actionAnnotate") + '</a>');
            
            jQuery('#sl-action-image-status-annotated a.sl-capture').click(function() {
                S.createAnnotation();
            });
        });
    }



    /**
     * Utils: Get localized string
     */
    S.getLocalizedString = function(key) {
        if (S.localizedStrings[key]) {
            return S.localizedStrings[key];
        } else {
            return '__' + key + '__';
        }
    }

    S.getLocalizedStatus = function(status) {
        var result = "";

        switch (status) {
            case 'admin':
                result = S.getLocalizedString("statusAdmin");

                break;
            case 'branch-checking':
                result = S.getLocalizedString("statusBranchChecking");

                break;
            case 'good':
                result = S.getLocalizedString("statusGood");

                break;
            case 'image':
                result = S.getLocalizedString("statusImage");

                break;
            case 'merger':
                result = S.getLocalizedString("statusMerger");
                
                break;
            case 'missing-branch':
                result = S.getLocalizedString("statusMissingBranch");
                
                break;
            case 'missing-nub':
                result = S.getLocalizedString("statusMissingNub");
                
                        break;
            case 'need-admin':
                result = S.getLocalizedString("statusNeedAdmin");
                
                break;
            case 'need-scythe':
                result = S.getLocalizedString("statusNeedScythe");
                
                break;
            case 'note':
                result = S.getLocalizedString("statusNote");;

                break;
            case 'open':
                result = S.getLocalizedString("statusOpen");;

                break;
            case 'scythe-complete':
                result = S.getLocalizedString("statusScytheComplete");;

                break;
            case 'still-growing':
                result = S.getLocalizedString("statusStillGrowing");;

                break;
            case 'subtree-complete':
                result = S.getLocalizedString("statusSubtreeComplete");;

                break;
            case 'watch':
                result = S.getLocalizedString("statusWatch");
                
                break;
        }

        return result;
    }

    
    
    /**
     * Button: Display Cell List
     */
    S.showCells = function() {
        if (S.windowState != 'cell') {
            S.getCellSummary();
        } else {
            if (jQuery('#slPanel').is(':visible')) {
                jQuery('#slPanel').hide();
            } else {
                jQuery('#slPanel').show();
            }
        }
    }

    /**
     * Button: Display Open Tasks List
     */
    S.showOpen = function() {
        if (S.windowState != 'status-open') {
            S.getStatusEntries('open', false);
        } else {
            if (jQuery('#slPanel').is(':visible')) {
                jQuery('#slPanel').hide();
            } else {
                jQuery('#slPanel').show();
            }
        }
    }
    
    /**
     * Button: Display 'Need Admin' Tasks
     */
    S.showAdmin = function() {
        if (S.windowState != 'status-need-admin') {
            S.getStatusEntries('need-admin', false);
        } else {
            if (jQuery('#slPanel').is(':visible')) {
                jQuery('#slPanel').hide();
            } else {
                jQuery('#slPanel').show();
            }
        }
    }
    
    /**
     * Button: Display 'Need Scythe' Tasks
     */
    S.showScythe = function() {
        if (S.windowState != 'status-need-scythe') {
            S.getStatusEntries('need-scythe', true);
        } else {
            if (jQuery('#slPanel').is(':visible')) {
                jQuery('#slPanel').hide();
            } else {
                jQuery('#slPanel').show();
            }
        }
    }
    
    /**
     * Button: Display 'Watch List' Tasks
     */
    S.showWatch = function() {
        if (S.windowState != 'status-watch') {
            S.getStatusEntries('watch', false);
        } else {
            if (jQuery('#slPanel').is(':visible')) {
                jQuery('#slPanel').hide();
            } else {
                jQuery('#slPanel').show();
            }
        }
    }

    /**
     * Button: Display User Submission History
     */
    S.showHistory = function() {
        if (S.windowState != 'history') {
            S.getHistory();
        } else {
            if (jQuery('#slPanel').is(':visible')) {
                jQuery('#slPanel').hide();
            } else {
                if (S.historyPosition == S.historyDisplay) {
                    S.windowState ='';

                    S.getHistory();
                }

                jQuery('#slPanel').show();
            }
        }
    }


    S.sendMessage("getLocalizedStrings", {}, "init_locale");

}(window.scoutsLog = window.scoutsLog || {}));
