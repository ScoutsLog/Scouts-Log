
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

(function(S) {
	S.images = {};
	S.imagesCount = 0;
	
	S.windowState = '';

	S.historyType = '';
	S.historyCell = 0;
	S.historyAccuracy = 1;
	S.historyPosition = 0;
	S.historyDisplay = 10;
	
	
	// Create listener for SLEW_AUTH event (in response to SLEW_REGISTER)
	document.addEventListener('SLEW_AUTH', function() {
		var panel = '';
		panel += '<div id="scoutsLogAuthPanel">';
		panel += '<h2>Scouts\' Log Authorization</h2>';
		panel += '<p>In order to use the Scouts\'s Log extension, you must authorize the application to use your EyeWire account.</p>';
		panel += '<p>Please click the link below to authorize the application:</p>';
		panel += '<p style="text-align:center;"><a class="task" href="http://scoutslog.org/?do=extension-auth" target="_blank">scoutslog.org</a></p>';
		panel += '<p>Once the authorization process is completed, please <a class="cell" href="javascript:document.location.reload();">re-load</a> this page.</p>';
		panel += '</div>';
		
		jQuery("#content .gameBoard").append(panel);
	});

	// Create listener for SLEW_UPDATE event (in response to SLEW_REGISTER)
	document.addEventListener('SLEW_UPDATE', function() {
		var panel = '';
		panel += '<div id="scoutsLogAuthPanel">';
		panel += '<h2>Scouts\' Log Extension</h2>';
		panel += '<p>Your extension is out of date!</p>';
		panel += '<p>Please upgrade now to continue using the extension.</p>';
		panel += '<p style="text-align:center;"><a class="cell" href="javascript:void(0);">Close</a></p>';
		panel += '</div>';
		
		jQuery("#content .gameBoard").append(panel);

		jQuery('#scoutsLogAuthPanel a.cell').click(function() {
			jQuery('#scoutsLogAuthPanel').remove();
		});
	});
	
	// Create listener for SLEW_INIT event (in response to SLEW_REGISTER)
	document.addEventListener('SLEW_INIT', function() {
		S.init();
	});
	
	
	S.init = function() {
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
					S.windowState = '';
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
					} else {
						jQuery('#slPanel').show();
					}
				}
			}
		});


		// Hook chat window
		jQuery('body').on('DOMNodeInserted', '#content .gameBoard .chatMsgContainer', function(e) {
			if ($(e.target).attr('class') === 'chatMsg') {
				S.setChatLinks(e.target);
			}
		});
		
		
		// Create listener for ScoutsLogEyeWire.getJSON response event
		document.addEventListener('SLEW_getJSON', function(e) {
		    // Extract data
			var cb = e.detail.callback;		// Callback function
			var res = e.detail.response;	// Response object
			
			var fn = eval(cb);
			fn(res);
		});
		
		// Create listener for ScoutsLogEyeWire.getResource response event
		document.addEventListener('SLEW_getResource', function(e) {
			// Extract data
			var cb = e.detail.callback;		// Callback function
			var res = e.detail.response;	// Response object
			
			var fn = eval(cb);
			fn(res);
		});
		
		// Create listener for ScoutsLogEyeWire.postRequest response event
		document.addEventListener('SLEW_postRequest', function(e) {
			// Extract data
			var cb = e.detail.callback;		// Callback function
			var res = e.detail.response;	// Response object
			
			var fn = eval(cb);
			fn(res);
		});

		// Create listener for ScoutsLogEyeWire.getPanelPosition response event
		document.addEventListener('SLEW_getPanelPosition', function(e) {
		    // Extract data
			var cb = e.detail.callback;		// Callback function
			var pos = e.detail.position;	// Response object
			
			var fn = eval(cb);
			fn(pos);
		});

		// Create listener for cube submission data
		jQuery(document).on('cube-submission-data', function(e, data) {
			// Get current cube/task
			var target = window.tomni.getTarget();
			var t = target.id;
			var c = target.cell;
		
			if (typeof t == 'undefined') {
				t = window.tomni.task.id;
				c = window.tomni.task.cell;
			}

			// Update data object
			data.cell = c;
			data.task = t;

			var dt = new Date();
			data.timestamp = dt.toLocaleString();

			// Send submission data to server
			setTimeout(function() {
				document.dispatchEvent(new CustomEvent('SLEW_requestPostRequest', {
					detail: {
						"url": "http://scoutslog.org/1.1/task/" + encodeURIComponent(t) + "/submit",
						"data": "data=" + encodeURIComponent(JSON.stringify(data)),
						"callback": ""
					}
				}));
			}, 0);

		});
		
		
		// Load image resources
		S.loadImages();
	};

	S.loadImages = function() {
		S.images = {};
		S.imagesCount = 0;
		
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetResource', {
		        detail: {
		        	"name": "logo",
		        	"url": "images/icon48.png",
		        	"callback": "window.scoutsLog.loadImagesCallback"
		        }
		    }));
		}, 0);
		
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetResource', {
		        detail: {
		        	"name": "popout",
		        	"url": "images/popout.png",
		        	"callback": "window.scoutsLog.loadImagesCallback"
		        }
		    }));
		}, 0);
		
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetResource', {
		        detail: {
		        	"name": "close",
		        	"url": "images/close.png",
		        	"callback": "window.scoutsLog.loadImagesCallback"
		        }
		    }));
		}, 0);

		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetResource', {
		        detail: {
		        	"name": "minimize",
		        	"url": "images/minimize.png",
		        	"callback": "window.scoutsLog.loadImagesCallback"
		        }
		    }));
		}, 0);
	}
	
	S.loadImagesCallback = function(res) {
		var name = res.name;
		var data = res.data;
		
		S.images[name] = data;
		S.imagesCount++;
		
		if (S.imagesCount == 4) {
			S.setMainPanel();
			S.setFloatingPanel();
			S.setGameTools();
		}
	}
	
	
	
	S.getCellSummary = function() {
		// Prepare display window
		S.prepareCellWindow();
		
		// Initiate request through plugin
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": "http://scoutslog.org/1.1/stats",
		        	"callback": "window.scoutsLog.getCellSummaryCallback"
		        }
		    }));
		}, 0);
	};
	
	S.getCellSummaryCallback = function(d) {
		jQuery("#slPanel h2 small").text('Cell Summary');
		jQuery("#slMainTable table tbody").empty();

		for (var c in d['cell_summary']) {
			var s = d['cell_summary'][c];

			var row = '<tr>';
			row += '<td><a class="cell" data-cell="' + s.cell + '">' + s.cellName + ' (' + s.cell + ')</a></td>';
			row += '<td>' + s.tasks + '</td>';
			row += '</tr>';

			jQuery("#slMainTable table tbody").append(row);
		}

		S.setLinks('#slPanel');
	};
	
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
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	'url': url,
		        	'callback': 'window.scoutsLog.getCellEntriesCallback'
		        }
		    }));
		}, 0);
	};

	S.getCellEntriesCallback = function(d) {
		jQuery("#slPanel h2 small").text(d.cellName + " (" + d.cell + ")");
		jQuery("#slMainTable table tbody").empty();

		if (d.tasks.length > 0) {	
			for (var c in d.tasks) {
				var s = d.tasks[c];
	
				var row = '<tr>';
				row += '<td><a class="task" data-task="' + s.task + '">' + s.task + '</a> | <a class="jumpTask" data-task="' + s.task + '">Jump</a></td>';
				row += '<td class="' + s.status + '">' + s.statusText + '</td>';
				row += '<td>' + s.lastUser + '</td>';
				row += '<td>' + s.lastUpdated + '</td>';
				row += '</tr>';
	
				jQuery("#slMainTable table tbody").append(row);
			}
	
			S.setLinks('#slPanel');
		} else {
			// No entries found
			
			jQuery("#slMainTable table tbody").append('<tr><td colspan="4">No tasks found for this cell/status</td></tr>');
		}
	};
	
	S.getStatusEntries = function(s) {
		// Prepare display window
		S.prepareSummaryWindow();
		
		// Set window subtitle
		var status = '';
		
		switch (s) {
			case 'need-admin':
				status = 'Need Admin';
				
				break;
			case 'need-scythe':
				status = 'Need Scythe';
				
				break;
			case 'missing-nub':
				status = 'Missing Nub List'
				
					break;
			case 'missing-branch':
				status = 'Missing Branch List';
				
				break;
			case 'merger':
				status = 'Merger List';
				
				break;
			case 'watch':
				status = 'Watch List';
				
				break;
		}
		
		if (status != '') {
			// Update window state
			S.windowState = 'status-' + s;
			
			// Set window title
			jQuery('#slPanel h2 small').html(status);
			
			// Initiate request through plugin
			setTimeout(function() {
			    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
			        detail: {
			        	"url": "http://scoutslog.org/1.1/status/" + encodeURIComponent(s),
			        	"callback": "window.scoutsLog.getStatusEntriesCallback"
			        }
			    }));
			}, 0);
		}
	};
	
	S.getStatusEntriesCallback = function(d) {
		jQuery("#slMainTable table tbody").empty();

		for (var c in d.tasks) {
			var s = d.tasks[c];

			var row = '<tr>';
			row += '<td><a class="task" data-task="' + s.task + '">' + s.task + '</a> | <a class="jumpTask" data-task="' + s.task + '">Jump</a></td>';
			row += '<td><a class="cell" data-cell="' + s.cell + '">' + s.cellName + ' (' + s.cell + ')</a></td>';
			row += '<td class="' + s.status + '">' + s.statusText + '</td>';
			row += '<td>' + s.lastUser + '</td>';
			row += '<td>' + s.lastUpdated + '</td>';
			row += '</tr>';

			jQuery("#slMainTable table tbody").append(row);
		}

		S.setLinks('#slPanel');
	};
	
	
	S.getTaskEntries = function(t) {
		// Prepare display window
		S.prepareTaskWindow(t);
		
		// Update window state
		S.windowstate = 'task-' + t;
		
		// Initiate request
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": "http://scoutslog.org/1.1/task/" + encodeURIComponent(t) + "/actions",
		        	"callback": "window.scoutsLog.getTaskEntriesCallback"
		        }
		    }));
		}, 0);
	};
	
	S.getTaskEntriesInspect = function() {
		// Get current cube/task
		var target = window.tomni.getTarget();
		var t = target.id;
		
		if (typeof t == 'undefined') {
			var t = window.tomni.task.id;
		}
		
		// Update window state
		S.windowstate = 'task-' + t;
		
		// Prepare display window
		S.prepareTaskWindow(t);
		
		// Initiate request
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": "http://scoutslog.org/1.1/task/" + encodeURIComponent(t) + "/actions",
		        	"callback": "window.scoutsLog.getTaskEntriesCallback"
		        }
		    }));
		}, 0);
	};
	
	
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
		jQuery("#slSummaryTable table tbody").empty();
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Cell:</strong></td><td><a class="cell" data-cell="' + d.cell + '">' + d.cellName + ' (' + d.cell + ')</a></td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Status:</strong></td><td class="' + d.status + '">' + d.statusText + '</td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Weight:</strong></td><td' + wstyle + '>' + nice_number(d.weight) + '</td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Votes:</strong></td><td' + vstyle + '>' + nice_number(d.votes) + ' / ' + nice_number(d.votesMax) + '</td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Last User:</strong></td><td>' + d.lastUser + '</td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Last Updated (UTC):</strong></td><td>' + d.lastUpdated + '</td></tr>');
		
		
		// Display task actions
		jQuery("#slMainTable table tbody").empty();

		for (var c in d.actions) {
			var s = d.actions[c];
			
			var img = '';
			
			if (s.image != "") {
				img = '<a class="image" href="' + s.image + '" target="_blank">View Image</a>';
			}
			
			var row = '<tr>';
			row += '<td class="' + s.status + '">' + s.statusText + '</td>';
			row += '<td>' + s.user + '</td>';
			row += '<td>' + s.notes + '</td>';
			row += '<td>' + img + '</td>';
			row += '<td>' + s.timestamp + '</td>';
			row += '</tr>';

			jQuery("#slMainTable table tbody").append(row);
		}
		
		// Check button status
		if (d.status != '' && d.status != 'good') {
			var btn = '<button type="button" class="greenButton good-action" style="margin-left: 10px;">Set to Good</button>';
			
			jQuery(btn).insertAfter("#slPanel button.new-action");

			jQuery('#slPanel button.good-action').click(function() {
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
				var url = "http://scoutslog.org/1.1/task/" + encodeURIComponent(d.task) + "/action/create";

				setTimeout(function() {
					document.dispatchEvent(new CustomEvent('SLEW_requestPostRequest', {
						detail: {
							"url": url,
							"data": "data=" + encodeURIComponent(JSON.stringify(data)),
							"callback": "window.scoutsLog.setTaskGoodCallback"
						}
					}));
				}, 0);
			});
		}
		
		// Set links for panel
		S.setLinks('#slPanel');
	};

	S.setTaskGoodCallback = function(d) {
		// Refresh cube details
		S.getTaskEntries(d.task);
	}

	
	S.getTaskSummary = function(t) {
		// Get current cube/task
		var target = window.tomni.getTarget();
		var t = target.id;
		
		if (typeof t == 'undefined') {
			var t = window.tomni.task.id;
		}
		
		// Initiate request
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": "http://scoutslog.org/1.1/task/" + encodeURIComponent(t),
		        	"callback": "window.scoutsLog.getTaskSummaryCallback"
		        }
		    }));
		}, 0);
	}
	
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
		jQuery("#slPanel h2 small").text('Task #' + d.task);
		
		// Display task summary
		jQuery("#slSummaryTable table tbody").empty();
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Cell:</strong></td><td><a class="cell" data-cell="' + d.cell + '">' + d.cellName + ' (' + d.cell + ')</a></td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Status:</strong></td><td class="' + d.status + '">' + d.statusText + '</td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Weight:</strong></td><td' + wstyle + '>' + nice_number(d.weight) + '</td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Votes:</strong></td><td' + vstyle + '>' + nice_number(d.votes) + ' / ' + nice_number(d.votesMax) + '</td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Last User:</strong></td><td>' + d.lastUser + '</td></tr>');
		jQuery("#slSummaryTable table tbody").append('<tr><td><strong>Last Updated (UTC):</strong></td><td>' + d.lastUpdated + '</td></tr>');
		
		// Set links
		S.setLinks('#slPanel');
	}
	
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
					setTimeout(callback(task2), 0);
				});
			});

		});
	}
	

	S.getHistory = function() {
		// Prepare history window
		if (S.windowState != 'history') {
			S.historyDisplay = 10;
			
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
		
		if (S.historyAccuracy < 1) {
			url += '/accuracy/' + encodeURIComponent(S.historyAccuracy);
		}

		// Initiate request
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": url,
		        	"callback": "window.scoutsLog.getHistoryCallback"
		        }
		    }));
		}, 0);
	}

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
				row += '<td><a class="task" data-task="' + h.task + '">' + h.task + '</a> | <a class="jumpTask" data-task="' + h.task + '">Jump</a></td>';
				row += '<td><a class="cell" data-cell="' + h.cell + '">' + h.cellName + ' (' + h.cell + ')</a></td>';
				row += '<td>' + h.type + '</td>';

				if (h.type == "scythed" || h.trailblazer == 1) {
					row += '<td>' + h.score + ' pts</td>';
				} else {
					row += '<td>' + h.score + ' pts / ' + a + '</td>';
				}

				if (h.trailblazer == 1) {
					row += '<td>Yes</td>';
				} else {
					row += '<td>No</td>';
				}

				row += '<td>' + h.timestamp + '</td>';
				row += '</tr>';

				jQuery("#slMainTable table tbody").append(row);
			}

			// Check for end of data
			if (d.tasks.length < d.limit) {
				jQuery('#slPanel a.more').remove();
			}
		} else {
			// No more data
			
			jQuery('#slPanel a.more').remove();
		}

		// Set links
		S.setLinks('#slPanel');
	}

	S.submitTaskActionCallback = function(d) {
		if (d.result == true) {
			// Success

			jQuery('#slActionButtons button.submit').remove();
			jQuery('#slActionButtons button').prop('disabled', false);
			jQuery('#slActionButtons p').html('Success! Saved.');
		} else {
			// Error

			jQuery('#slActionButtons button').prop('disabled', false);
			jQuery('#slActionButtons p').html('Sorry, there was an error while submitting. Please try again.');
		}
	}
	
	
	S.prepareCellWindow = function() {
		// Set window state
		S.windowState = 'cell';
		
		// Prepare display window
		var doc = '';
		doc += '<h2>Scouts\' Log<small/></h2>';
		
		doc += '<div id="slMainTable">';
		doc += '<table class="slTable">';
		doc += '<colgroup>';
		doc += '<col style="width: 75%" />';
		doc += '<col style="width: 25%" />';
		doc += '</colgroup>';
		doc += '<thead><tr>';
		doc += '<th>Cell</th>';
		doc += '<th>Open Tasks</th>';
		doc += '</tr></thead>';
		doc += '<tbody>';
		doc += '<tr><td colspan="2" style="text-align: center; font-size: 18pt;">Loading...</td></tr>';
		doc += '</tbody>';
		doc += '</table>';
		doc += '</div>';

		jQuery("#slPanel div.slPanelContent").html(doc);
		jQuery("#slPanel").show();
					
		// Make sure content panel height is updated
		var h = (jQuery('.gameBoard').height() * 0.80) - 30;
		jQuery('#slPanel div.slPanelContent').height(h);
	}

	S.prepareSummaryWindow = function() {
		// Set window state
		S.windowState = 'summary';
		
		// Prepare display window
		var doc = '';
		doc += '<h2>Scouts\' Log<small/></h2>';
		
		doc += '<div id="slMainTable">';
		doc += '<table class="slTable">';
		doc += '<col style="width: 15%" />';
		doc += '<col style="width: 20%" />';
		doc += '<col style="width: 20%" />';
		doc += '<col style="width: 25%" />';
		doc += '<col style="width: 20%" />';
		doc += '<thead><tr>';
		doc += '<th>Cube</th>';
		doc += '<th>Cell</th>';
		doc += '<th>Status</th>';
		doc += '<th>Last User</th>';
		doc += '<th>Last Updated (UTC)</th>';
		doc += '</tr></thead>';
		doc += '<tbody>';
		doc += '<tr><td colspan="5" style="text-align: center; font-size: 18pt;">Loading...</td></tr>';
		doc += '</tbody>';
		doc += '</table>';
		doc += '</div>';

		jQuery("#slPanel div.slPanelContent").html(doc);
		jQuery("#slPanel").show();
					
		// Make sure content panel height is updated
		var h = (jQuery('.gameBoard').height() * 0.80) - 30;
		jQuery('#slPanel div.slPanelContent').height(h);
	}
	
	S.prepareCellEntriesWindow = function() {
		// Set window state
		S.windowState = 'cell-entries';
		
		// Prepare display window
		var doc = '';
		doc += '<h2>Scouts\' Log<small/></h2>';
		
		doc += '<div class="slOptions">';
		doc += '<select>';
		doc += '<option value="" selected>Open</option>';
		doc += '<option value="all">All</option>';
		doc += '<option value="-" disabled>---------------</option>';
		doc += '<option value="missing-nub">Missing Nub</option>';
		doc += '<option value="missing-branch">Missing Branch</option>';
		doc += '<option value="merger">Merger</option>';
		doc += '<option value="watch">Watch</option>';
		doc += '<option value="need-scythe">Need Scythe</option>';
		doc += '<option value="need-admin">Need Admin</option>';
		doc += '<option value="scythe-complete">Scythe Complete</option>';
		doc += '<option value="branch-checking">Branch Checking</option>';
		doc += '<option value="still-growing">Still Growing</option>';
		doc += '<option value="subtree-complete">Subtree Complete</option>';
		doc += '<option value="good">Good</option>';
		doc += '<option value="note">Note</option>';
		doc += '</select>';
		doc += '</div><br />';
		
		doc += '<div id="slMainTable">';
		doc += '<table class="slTable">';
		doc += '<col style="width: 25%" />';
		doc += '<col style="width: 25%" />';
		doc += '<col style="width: 25%" />';
		doc += '<col style="width: 25%" />';
		doc += '<thead><tr>';
		doc += '<th>Cube</th>';
		doc += '<th>Status</th>';
		doc += '<th>Last User</th>';
		doc += '<th>Last Updated (UTC)</th>';
		doc += '</tr></thead>';
		doc += '<tbody>';
		doc += '<tr><td colspan="5" style="text-align: center; font-size: 18pt;">Loading...</td></tr>';
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

	S.prepareTaskWindow = function(t) {
		// Set window state
		S.windowState = 'task';
		
		// Prepare display window
		var doc = '';
		doc += '<h2>Scouts\' Log<small>Task #' + t + '</small></h2>';
		
		doc += '<div id="slSummaryTable">';
		doc += '<table class="slTable">';
		doc += '<colgroup>';
		doc += '<col style="width: 25%" />';
		doc += '<col style="width: 75%" />';
		doc += '</colgroup>';
		doc += '<tbody>';
		doc += '<tr><td colspan="2" style="text-align: center; font-size: 18pt;">Loading...</td></tr>';
		doc += '</tbody>';
		doc += '</table>';
		doc += '</div><br />';
		
		doc += '<button type="button" class="blueButton new-action">New Entry</button><br />';
		
		doc += '<div id="slMainTable">';
		doc += '<table class="slTable">';
		doc += '<colgroup>';
		doc += '<col style="width: 15%" />';
		doc += '<col style="width: 20%" />';
		doc += '<col style="width: 35%" />';
		doc += '<col style="width: 15%" />';
		doc += '<col style="width: 15%" />';
		doc += '</colgroup>';
		doc += '<thead><tr>';
		doc += '<th>Status</th>';
		doc += '<th>User</th>';
		doc += '<th>Notes</th>';
		doc += '<th>Image</th>';
		doc += '<th>Updated (UTC)</th>';
		doc += '</tr></thead>';
		doc += '<tbody>';
		doc += '<tr><td colspan="5" style="text-align: center; font-size: 18pt;">Loading...</td></tr>';
		doc += '</tbody>';
		doc += '</table>';
		doc += '</div><br />';
		
		doc += '<button type="button" class="blueButton new-action">New Entry</button><br />';
		

		jQuery("#slPanel div.slPanelContent").html(doc);
		jQuery("#slPanel").show();
					
		// Make sure content panel height is updated
		var h = (jQuery('.gameBoard').height() * 0.80) - 30;
		jQuery('#slPanel div.slPanelContent').height(h);
		
		// Set handler for new action buttons
		jQuery("#slPanel button.new-action").click(function() {
			// Prepare display window
			S.prepareTaskActionWindow();
			
			// Capture 3D image data
			S.capture3D();
			
			// Get task summary
			S.getTaskSummary();
		});
	}

	S.prepareTaskActionWindow = function() {
		// Set window state
		S.windowState = 'action';
		
		// Prepare display window
		var doc = '';
		doc += '<h2>New Log Entry<small /></h2>';
		
		doc += '<div id="slSummaryTable">';
		doc += '<table class="slTable">';
		doc += '<colgroup>';
		doc += '<col style="width: 25%" />';
		doc += '<col style="width: 75%" />';
		doc += '</colgroup>';
		doc += '<tbody>';
		doc += '<tr><td colspan="2" style="text-align: center; font-size: 18pt;">Loading...</td></tr>';
		doc += '</tbody>';
		doc += '</table>';
		doc += '</div><br />';
		
		doc += '<form onsubmit="return false;">';
		doc += '<div id="slActionTable">';
		doc += '<table class="slTable">';
		doc += '<colgroup>';
		doc += '<col style="width: 25%" />';
		doc += '<col style="width: 75%" />';
		doc += '</colgroup>';
		doc += '<tbody>';
		doc += '<tr>';
		doc += '<td><label for="sl-action-status">Status:</label></td>';
		doc += '<td>';
		doc += '<select id="sl-action-status" name="status">';
		doc += '<option value="missing-nub">Missing Nub</option>';
		doc += '<option value="missing-branch">Missing Branch</option>';
		doc += '<option value="merger">Merger</option>';
		doc += '<option value="watch">Watch</option>';
		doc += '<option value="need-scythe">Need Scythe</option>';
		doc += '<option value="need-admin">Need Admin</option>';
		doc += '<option value="scythe-complete">Scythe Complete</option>';
		doc += '<option value="branch-checking">Branch Checking</option>';
		doc += '<option value="still-growing">Still Growing</option>';
		doc += '<option value="subtree-complete">Subtree Complete</option>';
		doc += '<option value="good">Good</option>';
		doc += '<option value="note">Note</option>';
		doc += '</select>';
		doc += '</td>';
		doc += '</tr>';
		doc += '<tr><td><strong>Reaped?</strong></td><td><input type="radio" name="reaped" value="1" /> Yes&nbsp;&nbsp;&nbsp;<input type="radio" name="reaped" value="0" checked />No</td></tr>';
		doc += '<tr><td><strong>Image:</strong></td><td><input type="hidden" id="sl-action-image" name="image-data" value="" /><div id="sl-action-image-status">Processing...</div></td></tr>';
		doc += '<tr><td><strong>Notes:</strong></td><td><textarea name="notes" id="sl-action-notes" rows="4" cols="75"></textarea></td></tr>';
		doc += '</tbody>';
		doc += '</table>';
		doc += '</div>';

		doc += '<div id="slActionButtons" style="text-align:center;">';
		doc += '<button type="button" class="submit greenButton">Submit</button> ';
		doc += '<button type="button" class="cancel redButton">Cancel</button> ';
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
		jQuery('#slPanel button.cancel').click(function() {
			jQuery('#slPanel').hide();
			S.windowState = '';
		});

		jQuery('#slPanel button.submit').click(function() {
			// Set interface
			jQuery('#slActionButtons button').prop('disabled', true);
			jQuery('#slActionButtons').append('<p>Saving...</p>');

			// Get current cube/task
			var target = window.tomni.getTarget();
			var t = target.id;
		
			if (typeof t == 'undefined') {
				var t = window.tomni.task.id;
			}

			// Prepare data object
			var data = {
				cell: window.tomni.cell,
				task: t,
				status: jQuery('#sl-action-status').val(),
				reaped: jQuery('#slActionTable input:radio[name=reaped]:checked').val(),
				notes: jQuery('#sl-action-notes').val(),
				image: jQuery('#sl-action-image').val()
			};

			// Initiate request through plugin
			var url = "http://scoutslog.org/1.1/task/" + encodeURIComponent(t) + "/action/create";

			setTimeout(function() {
			    document.dispatchEvent(new CustomEvent('SLEW_requestPostRequest', {
			        detail: {
			        	"url": url,
					"data": "data=" + encodeURIComponent(JSON.stringify(data)),
			        	"callback": "window.scoutsLog.submitTaskActionCallback"
			        }
			    }));
			}, 0);
		});
	}

	S.prepareHistoryWindow = function() {
		// Set window state
		S.windowState = 'history';
		S.historyPosition = 0;

		
		// Prepare display window
		var doc = '';
		doc += '<h2>Scouts\' Log<small>Cube Submission History</small></h2>';

		doc += '<div id="slOptions">';
		doc += '<div style="display:inline-block;margin-right:10px;">';
		doc += '<label>Submission Type:</label><br />';
		doc += '<select id="sl-history-type">';
		doc += '<option value="">All Types</option>';
		doc += '<option value="normal">Normal</option>';
		doc += '<option value="trailblazer">Normal Trailblaze</option>';
		doc += '<option value="scythed">Scythed</option>';
		doc += '</select>';
		doc += '</div>';
		doc += '<div style="display:inline-block;margin-right:10px;">';
		doc += '<label>Cell ID:</label><br />';
		doc += '<input type="text" id="sl-history-cell" value="" size="12" />';
		doc += '</div>';
		doc += '<div style="display:inline-block;margin-right:10px;">';
		doc += '<label>Consensus:</label><br />';
		doc += '<select id="sl-history-accuracy">';
		doc += '<option value="1">All Values</option>';
		doc += '<option value="0.5">50% or less</option>';
		doc += '<option value="0">No Agreement</option>';
		doc += '</select>';
		doc += '</div>';
		doc += '</div><br />';
		
		doc += '<div id="slMainTable">';
		doc += '<table class="slTable">';
		doc += '<col style="width: 15%" />';
		doc += '<col style="width: 25%" />';
		doc += '<col style="width: 10%" />';
		doc += '<col style="width: 15%" />';
		doc += '<col style="width: 10%" />';
		doc += '<col style="width: 25%" />';
		doc += '<thead><tr>';
		doc += '<th>Cube</th>';
		doc += '<th>Cell</th>';
		doc += '<th>Type</th>';
		doc += '<th>Score</th>';
		doc += '<th>Trailblazer</th>';
		doc += '<th>Timestamp</th>';
		doc += '</tr></thead>';
		doc += '<tbody>';
		doc += '</tbody>';
		doc += '</table>';
		doc += '</div>';
		doc += '<p style="text-align: center;"><a class="more" href="javascript:void(0);">&#10836; more &#10836;</a></p>';

		jQuery("#slPanel div.slPanelContent").html(doc);
		jQuery("#slPanel").show();
					
		// Make sure content panel height is updated
		var h = (jQuery('.gameBoard').height() * 0.80) - 30;
		jQuery('#slPanel div.slPanelContent').height(h);

		// Set handler for more link
		jQuery('#slPanel div.slPanelContent a.more').click(function() {
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
		
		

		// Set option handlers
		jQuery('#sl-history-type').change(function() {
			S.historyType = jQuery('#sl-history-type').val();
			S.windowState = '';

			S.getHistory();
		});
		
		jQuery('#sl-history-cell').blur(function() {
			var c = parseInt(jQuery('#sl-history-cell').val(), 10);
			
			if (isNaN(c)) {
				c = 0;
				jQuery('#sl-history-cell').val('');
			}
			
			S.historyCell = c;
			S.windowState = '';

			S.getHistory();
		});
		
		jQuery('#sl-history-accuracy').change(function() {
			var a = parseFloat(jQuery('#sl-history-accuracy').val());
			
			if (a > 1.00 || a < 0.00) {
				a = 1;
			}
			
			S.historyAccuracy = a;
			S.windowState = '';

			S.getHistory();
		});
	}
	
	
	
	S.setLinks = function(o) {
		jQuery(o).find('a.jumpTask').each(function() {
			var task = jQuery(this).attr('data-task');
			
			jQuery(this).attr("title", "Click to view this cube in EyeWire");
			
			jQuery(this).click(function() {
				var cc = window.tomni.getCurrentCell();

				if (cc) {
					cc.killPendingCubeSelection();
				}

				if (window.tomni.gameMode) {
					window.tomni.leave();
				} else {
					window.tomni.threeD.setTarget(null);
				}

				jQuery.getJSON("/1.0/task/" + task).done(function(d) {
					if (!d.data.channel.metadata) {
						return;
					}

					jQuery('#slPanel').hide();
					//window.scoutsLog.windowState = '';

					window.tomni.ui.jumpToTask(d);
				});
			});
		});
		
		jQuery(o).find('a.task').each(function() {
			var t = jQuery(this).attr('data-task');
			
			jQuery(this).attr("title", "Click to view actions for this task");
			
			jQuery(this).click(function() {	
				S.getTaskEntries(t);
			});
		});
		
		jQuery(o).find('a.cell').each(function() {
			var c = jQuery(this).attr('data-cell');
			
			jQuery(this).attr("title", "Click to view open tasks for this cell");
			
			jQuery(this).click(function() {	
				S.getCellEntries(c, '');
			});
		});
		
	};

	S.setChatLinks = function(o) {
		// Get actual chat text
		var t = jQuery(o).children('.actualText').html();

		// Search for cube links
		var text = t.replace(/#([0-9]+)/g, '<a class="jumpTask" data-task="$1">#$1</a>');

		// Replace chat text
		jQuery(o).children('.actualText').html(text);

		// Refresh chat links
		S.setLinks(o);

	}


	S.setMainPanel = function() {
		var panel = '<div id="slPanel" style="display: none;">';
		panel += '<a href="javascript:void(0);" class="minimize-window" title="Minimize window"><img src="' + S.images.minimize + '"/></a>';
		panel += '<a href="javascript:void(0);" class="close-window" title="Close window"><img src="' + S.images.close + '"/></a>';
		panel += '<div class="slPanelContent"></div>';
		panel += '</div>';
		jQuery("#content .gameBoard").append(panel);

		jQuery('#slPanel a.close-window').click(function() {
			jQuery('#slPanel').hide();
			S.windowState = '';
		});

		jQuery('#slPanel a.minimize-window').click(function() {
			jQuery('#slPanel').hide();
		});
	}
	
	S.setFloatingPanel = function() {
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetPanelPosition', {
		        detail: {
		        	"callback": "window.scoutsLog.setFloatingPanelCallback"
		        }
		    }));
		}, 0);
	}

	S.setFloatingPanelCallback = function(pos) {
		var style = '';
		var vertical = false;

		if (pos) {
			var t = pos.top;
			var l = Math.abs(pos.left);

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
			
			if (pos.vertical) {
				style += ' class="vertical"';
				vertical = true;
			}
		}

		var panel = '<div id="scoutsLogFloatingControls"' + style + '>';
		panel += '<img src="' + S.images.logo + '" style="float: left;" />';
		
		if (vertical) {
			panel += '<a class="translucent flat minimalButton active cell-list" title="Display list of uncompleted cells and a summary of open tasks">C</a>';
			panel += '<a class="translucent flat minimalButton active need-admin" title="Display tasks requiring admin attention">A <span id="need-admin-badge" class="badge">0</span></a>';
			panel += '<a class="translucent flat minimalButton active need-scythe" title="Display tasks requiring scythe attention">S <span id="need-scythe-badge" class="badge">0</span></a>';
			panel += '<a class="translucent flat minimalButton active watch" title="Display tasks set to watch">W <span id="watch-badge" class="badge">0</span></a>';
			panel += '<a class="translucent flat minimalButton active history" title="View details regarding your cubes submitted or scythed">H</a>';
			panel += '<a class="translucent flat minimalButton active task" id="sl-task-details" title="View summary and log entries for this cube." style="display: none;">D</a>';
			panel += '<a class="translucent flat minimalButton active task" id="sl-task-entry" title="Create a new log entry for this cube." style="display: none;">L</a>';
		} else {
			panel += '<a class="translucent flat minimalButton active cell-list" title="Display list of uncompleted cells and a summary of open tasks">Cell List</a>';
			panel += '<a class="translucent flat minimalButton active need-admin" title="Display tasks requiring admin attention">Need Admin <span id="need-admin-badge" class="badge">0</span></a>';
			panel += '<a class="translucent flat minimalButton active need-scythe" title="Display tasks requiring scythe attention">Need Scythe <span id="need-scythe-badge" class="badge">0</span></a>';
			panel += '<a class="translucent flat minimalButton active watch" title="Display tasks set to watch">Watch List <span id="watch-badge" class="badge">0</span></a>';
			panel += '<a class="translucent flat minimalButton active history" title="View details regarding your cubes submitted or scythed">History</a>';
			panel += '<a class="translucent flat minimalButton active task" id="sl-task-details" title="View summary and log entries for this cube." style="display: none;">Cube Details</a>';
			panel += '<a class="translucent flat minimalButton active task" id="sl-task-entry" title="Create a new log entry for this cube." style="display: none;">Log Entry</a>';			
		}
		
		panel += '</div>';
		
		// Add panel to game board
		jQuery(panel).appendTo('#content .gameBoard');
		
		jQuery('#scoutsLogFloatingControls').draggable({
			container: 'window',
			stop: function(e, ui) {
				// Update position in settings
				setTimeout(function() {
					document.dispatchEvent(new CustomEvent('SLEW_requestSetPanelPosition', {
						detail: {
							"position": ui.position,
							"vertical": jQuery('#scoutsLogFloatingControls').hasClass('vertical')
						}
					}));
				}, 0);

			}
		});
		
		// Add events to links
		jQuery('#scoutsLogFloatingControls img').dblclick(function() {
			// Toggle floating panel display
			
			if (jQuery('#scoutsLogFloatingControls').hasClass('vertical')) {
				jQuery('#scoutsLogFloatingControls').removeClass('vertical');
		
				jQuery('#scoutsLogFloatingControls a.cell-list').html('Cell List');
				jQuery('#scoutsLogFloatingControls a.need-admin').html('Need Admin <span id="need-admin-badge" class="badge">0</span>');
				jQuery('#scoutsLogFloatingControls a.need-scythe').html('Need Scythe <span id="need-scythe-badge" class="badge">0</span>');
				jQuery('#scoutsLogFloatingControls a.watch').html('Watch List <span id="watch-badge" class="badge">0</span>');
				jQuery('#scoutsLogFloatingControls a.history').html('History');
				jQuery('#scoutsLogFloatingControls #sl-task-details').html('Cube Details');
				jQuery('#scoutsLogFloatingControls #sl-task-entry').html('Log Entry');
			} else {
				jQuery('#scoutsLogFloatingControls').addClass('vertical');

				jQuery('#scoutsLogFloatingControls a.cell-list').html('C');
				jQuery('#scoutsLogFloatingControls a.need-admin').html('A <span id="need-admin-badge" class="badge">0</span>');
				jQuery('#scoutsLogFloatingControls a.need-scythe').html('S <span id="need-scythe-badge" class="badge">0</span>');
				jQuery('#scoutsLogFloatingControls a.watch').html('W <span id="watch-badge" class="badge">0</span>');
				jQuery('#scoutsLogFloatingControls a.history').html('H');
				jQuery('#scoutsLogFloatingControls #sl-task-details').html('D');
				jQuery('#scoutsLogFloatingControls #sl-task-entry').html('L');
			}
			
			setTimeout(S.doPanelStats(), 0);
		});
		
		
		jQuery('#scoutsLogFloatingControls a.cell-list').click(S.showCells);
		jQuery('#scoutsLogFloatingControls a.need-admin').click(S.showAdmin);
		jQuery('#scoutsLogFloatingControls a.need-scythe').click(S.showScythe);
		jQuery('#scoutsLogFloatingControls a.watch').click(S.showWatch);
		jQuery('#scoutsLogFloatingControls a.history').click(S.showHistory);

		jQuery('#sl-task-details').click(function() {
			// Get current cube/task
			var target = window.tomni.getTarget();
			var t = target.id;
			
			if (typeof t == 'undefined') {
				t = window.tomni.task.id;
			}
			
			var test = 'task-' + t;
			
			// Check window state
			if (window.scoutsLog.windowState == test || window.scoutsLog.windowState == 'task') {
				// Same task window is open, close instead
				
				jQuery('#slPanel').hide();
				window.scoutsLog.windowState = '';
			} else {
				// Show log entries for currently selected cube
				window.scoutsLog.getTaskEntriesInspect();
			}
		});
		
		jQuery("#sl-task-entry").click(function() {
			// Prepare display window
			S.prepareTaskActionWindow();
			
			// Capture 3D image data
			S.capture3D();
			
			// Get task summary
			S.getTaskSummary();
		});

		// Set stats refresh function
		S.doPanelStats();
	}

	S.setGameTools = function() {
		var button = '<div title="Show Scouts\' Log Panel (alt + L)" id="scoutsLogPanelButton" class="menuButton"><img src="' + S.images.logo + '" height="20" width="20" /></div>';

		jQuery("#gameTools").append(button);

		jQuery('#scoutsLogPanelButton').click(function() {
			if (S.windowState != '') {
				if (jQuery('#slPanel').is(':visible')) {
					jQuery('#slPanel').hide();
				} else {
					jQuery('#slPanel').show();
				}
			}
		});
	}
	
	S.doPanelStats = function() {
		setTimeout("window.scoutsLog.doPanelStats()", 60000);
		
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": "http://scoutslog.org/1.0/stats/header",
		        	"callback": "window.scoutsLog.doPanelStatsCallback"
		        }
		    }));
		}, 0);
	};
		
	S.doPanelStatsCallback = function(D) {
		var a = D['task_summary']['need-admin'].tasks;
		var s = D['task_summary']['need-scythe'].tasks;
		var w = D['task_summary'].watch.tasks;

		if (a > 0) {
			var c = parseInt(jQuery('#need-admin-badge').text(), 10);

			if (c != a) {
				jQuery('#need-admin-badge').show().text(a);
				jQuery('#need-admin-badge').fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
			}
		} else {
			jQuery('#need-admin-badge').hide().text(0);
		}

		if (s > 0) {
			var c = parseInt(jQuery('#need-scythe-badge').text(), 10);

			if (c != s) {
				jQuery('#need-scythe-badge').show().text(s);
				jQuery('#need-scythe-badge').fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
			}
		} else {
			jQuery('#need-scythe-badge').hide().text(0);
		}

		if (w > 0) {
			var c = parseInt(jQuery('#watch-badge').text(), 10);

			if (c != w) {
				jQuery('#watch-badge').show().text(w);
				jQuery('#watch-badge').fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600).fadeOut(300).fadeIn(600);
			}
		} else {
			jQuery('#watch-badge').hide().text(0);
		}
	};
	
	
	
	
	S.capture3D = function() {
		if (jQuery('#threeD canvas').length == 1) {
			// Get 3D canvas object
			var c = jQuery('#threeD canvas')[0];
			
			// Force a render
			window.tomni.threeD.render();
			
			// Store image data
			jQuery('#sl-action-image').val(c.toDataURL());
			
			// Update image status
			jQuery('#sl-action-image-status').html('<a class="preview">Preview</a> | <a class="capture">Re-Capture</a> | <a class="remove">Remove</a>');
			
			// Assign click functions
			jQuery('#sl-action-image-status a.preview').click(function() {
				var w = window.open();
				
				w.document.open();
				w.document.write('<!DOCTYPE html><head><title>Image Preview</title>');
				w.document.write('<style type="text/css">body { background-color: #000; color: #fff; }</style>');
				w.document.write('</head><body>');
				w.document.write('<img src="' + jQuery('#sl-action-image').val() + '"/>');
				w.document.write('</body></html>');
				w.document.close();
			});
			
			jQuery('#sl-action-image-status a.capture').click(function() {
				jQuery('#sl-action-image-status').html('Processing...');
				
				setTimeout(window.scoutsLog.capture3D, 1000);
			});
			
			jQuery('#sl-action-image-status a.remove').click(function() {
				jQuery('#sl-action-image').val('');
							
				jQuery('#sl-action-image-status').html('(none) | <a class="capture">Capture</a>');
				
				jQuery('#sl-action-image-status a.capture').click(function() {
					jQuery('#sl-action-image-status').html('Processing...');
					
					setTimeout(window.scoutsLog.capture3D, 1000);
				});
			})
			
		}
		
	}
	
	
	
	S.showCells = function() {
		if (S.windowState != 'cell') {
			S.getCellSummary();
		} else {
			jQuery('#slPanel').hide();
			S.windowState = '';
		}
	}
	
	S.showAdmin = function() {
		if (S.windowState != 'status-need-admin') {
			S.getStatusEntries('need-admin');
		} else {
			jQuery('#slPanel').hide();
			S.windowState = '';
		}
	}
	
	S.showScythe = function() {
		if (S.windowState != 'status-need-scythe') {
			S.getStatusEntries('need-scythe');
		} else {
			jQuery('#slPanel').hide();
			S.windowState = '';
		}
	}
	
	S.showWatch = function() {
		if (S.windowState != 'status-watch') {
			S.getStatusEntries('watch');
		} else {
			jQuery('#slPanel').hide();
			S.windowState = '';
		}
	}

	S.showHistory = function() {
		if (S.windowState != 'history') {
			S.getHistory();
		} else {
			jQuery('#slPanel').hide();
			S.windowState = '';
		}
	}
	

}(window.scoutsLog = window.scoutsLog || {}));

jQuery(document).ready(function() {
	
	setTimeout(function() {
	    document.dispatchEvent(new CustomEvent('SLEW_REGISTER'));
	}, 0);
	
});

