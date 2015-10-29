
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
	S.flagEditActions = false;
	
	S.images = {};
	S.imagesCount = 0;
	
	S.windowState = '';
	
	
	S.init = function() {
		// Create log box (inspect mode)
		var panel = '<div id="slPanel" style="display: none;">';
		panel += '<div class="slPanelContent"></div>';
		panel += '</div>';
		jQuery("#content .gameBoard").append(panel);


		// Hook game control modes
		jQuery(window).on(InspectorPanel.Events.ModelFetched, function() {
			if (jQuery("#editActions").length) {
				if (S.flagEditActions == false) {
					S.flagEditActions = true;
					
					S.setEditActions();
				}
			} else {
				S.flagEditActions = false;
			}
		});
		
		// Hook window resize event for main window 
		jQuery(window).resize(function() {		
			var pH = (jQuery('.gameBoard').height() * 0.80) - 20;
			
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
	}
	
	S.loadImagesCallback = function(res) {
		var name = res.name;
		var data = res.data;
		
		S.images[name] = data;
		S.imagesCount++;
		
		if (S.imagesCount == 3) {
			S.setFloatingPanel();
		}
	}
	
	
	
	S.getCellSummary = function() {
		// Prepare display window
		S.prepareCellWindow();
		
		// Initiate request through plugin
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": "http://scoutslog.org/1.0/stats",
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
	
	S.getCellEntries = function(c) {
		// Prepare display window
		S.prepareCellEntriesWindow();
		
		// Update window state
		S.windowState = 'cell-entries-' + c;
		
		// Initiate request
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": "http://scoutslog.org/1.0/actions?cell=" + encodeURIComponent(c),
		        	"callback": "window.scoutsLog.getCellEntriesCallback"
		        }
		    }));
		}, 0);
	};

	S.getCellEntriesCallback = function(d) {
		jQuery("#slMainTable h2 small").text(d[0].cellName + " (" + d[0].cell + ")");
		jQuery("#slMainTable table tbody").empty();

		for (var c in d) {
			var s = d[c];

			var row = '<tr>';
			row += '<td><a class="task" data-task="' + s.task + '">' + s.task + '</a> | <a class="jumpTask" data-task="' + s.task + '">Jump</a></td>';
			row += '<td class="' + s.status + '">' + s.statusText + '</td>';
			row += '<td>' + s.lastUser + '</td>';
			row += '<td>' + s.lastUpdated + '</td>';
			row += '</tr>';

			jQuery("#slMainTable table tbody").append(row);
		}

		S.setLinks('#slPanel');
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
			S.windowState = 'status-' + status;
			
			// Set window title
			jQuery('#slPanel h2 small').html(status);
			
			// Initiate request through plugin
			setTimeout(function() {
			    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
			        detail: {
			        	"url": "http://scoutslog.org/1.0/actions?status=" + encodeURIComponent(s),
			        	"callback": "window.scoutsLog.getStatusEntriesCallback"
			        }
			    }));
			}, 0);
		}
	};
	
	S.getStatusEntriesCallback = function(d) {
		jQuery("#slMainTable table tbody").empty();

		for (var c in d) {
			var s = d[c];

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
		S.prepareTaskWindow();
		
		// Update window state
		S.windowstate = 'task-' + t;
		
		// Initiate request
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": "http://scoutslog.org/1.0/actions?task=" + encodeURIComponent(t),
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
		S.prepareTaskWindow();
		
		// Initiate request
		setTimeout(function() {
		    document.dispatchEvent(new CustomEvent('SLEW_requestGetJSON', {
		        detail: {
		        	"url": "http://scoutslog.org/1.0/actions?task=" + encodeURIComponent(t),
		        	"callback": "window.scoutsLog.getTaskEntriesCallback"
		        }
		    }));
		}, 0);
	};
	
	S.getTaskEntriesCallback = function(d) {
		// Check for admin weight
		var wstyle = '';
		
		if (d.weight >= 1000000) {
			wstyle =' class="sl-admin';
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
		
		S.setLinks('#slPanel');
	};
	
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
		        	"url": "http://scoutslog.org/1.0/actions?task=" + encodeURIComponent(t),
		        	"callback": "window.scoutsLog.getTaskSummaryCallback"
		        }
		    }));
		}, 0);
	}
	
	S.getTaskSummaryCallback = function(d) {
		// Check for admin weight
		var wstyle = '';
		
		if (d.weight >= 1000000) {
			wstyle =' class="sl-admin';
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
		
		// Set links
		S.setLinks('#slPanel');
	}
	
	
	S.prepareCellWindow = function() {
		// Set window state
		S.windowState = 'cell';
		
		// Prepare display window
		var doc = '';
		doc += '<a href="javascript:void(0);" class="close-window" style="float: right;" title="Close window"><img src="' + S.images.close + '"/></a>';
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
		var h = (jQuery('.gameBoard').height() * 0.80) - 20;
		jQuery('#slPanel div.slPanelContent').height(h);
	}

	S.prepareSummaryWindow = function() {
		// Set window state
		S.windowState = 'summary';
		
		// Prepare display window
		var doc = '';
		doc += '<a href="javascript:void(0);" class="close-window" style="float: right;" title="Close window"><img src="' + S.images.close + '"/></a>';
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
		var h = (jQuery('.gameBoard').height() * 0.80) - 20;
		jQuery('#slPanel div.slPanelContent').height(h);
	}
	
	S.prepareCellEntriesWindow = function() {
		// Set window state
		S.windowState = 'cell-entries';
		
		// Prepare display window
		var doc = '';
		doc += '<a href="javascript:void(0);" class="close-window" style="float: right;" title="Close window"><img src="' + S.images.close + '"/></a>';
		doc += '<h2>Scouts\' Log<small/></h2>';
		
		doc += '<div class="slOptions">';
		doc += '<select>';
		doc += '<option value="" selected>Open</option>';
		doc += '<option value="all">All</option>';
		doc += '<option value="" disabled>---------------</option>';
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
		doc += ' <button type="button" class="blueButton">New Action</button><br />';
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
		var h = (jQuery('.gameBoard').height() * 0.80) - 20;
		jQuery('#slPanel div.slPanelContent').height(h);		
	}

	S.prepareTaskWindow = function() {
		// Set window state
		S.windowState = 'task';
		
		// Prepare display window
		var doc = '';
		doc += '<a href="javascript:void(0);" class="close-window" style="float: right;" title="Close window"><img src="' + S.images.close + '"/></a>';
		doc += '<h2>Scouts\' Log<small/></h2>';
		
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
		
		doc += '<button type="button" class="blueButton">New Action</button><br />';
		
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
		
		doc += '<button type="button" class="blueButton">New Action</button><br />';
		

		jQuery("#slPanel div.slPanelContent").html(doc);
		jQuery("#slPanel").show();
					
		// Make sure content panel height is updated
		var h = (jQuery('.gameBoard').height() * 0.80) - 20;
		jQuery('#slPanel div.slPanelContent').height(h);
	}

	S.prepareTaskActionWindow = function() {
		// Set window state
		S.windowState = 'action';
		
		// Prepare display window
		var doc = '';
		doc += '<a href="javascript:void(0);" class="close-window" style="float: right;" title="Close window"><img src="' + S.images.close + '"/></a>';
		doc += '<h2>New Log Entry</h2>';
		
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
		doc += '<tr><td><strong>Notes:</strong></td><td><textarea name="notes" rows="4" cols="75"></textarea></td></tr>';
		doc += '</tbody>';
		doc += '</table>';
		doc += '</div>';
		
		jQuery("#slPanel div.slPanelContent").html(doc);
		jQuery("#slPanel").show();
					
		// Make sure content panel height is updated
		var h = (jQuery('.gameBoard').height() * 0.80) - 20;
		jQuery('#slPanel div.slPanelContent').height(h);
	}
	
	
	
	
	S.setEditActions = function() {
		if (S.flagEditActions == true) {
			jQuery('#sl-task-details').show();
			jQuery('#sl-task-entry').show();
		}
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

					if (jQuery('#slPanel').is(':visible')) {
						jQuery('#slPanel').hide();
					}

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
				S.getCellEntries(c);
			});
		});
		
		jQuery(o).find('a.close-window').each(function() {
			jQuery(this).click(function() {
				jQuery('#slPanel').hide();
			});
		});
	};

	
	S.setFloatingPanel = function() {
		var panel = '<div id="scoutsLogFloatingControls">';
		panel += '<img src="' + S.images.logo + '" style="float: left;" />';
		panel += '<a class="translucent flat minimalButton active cell-list">Cell List</a>';
		panel += '<a class="translucent flat minimalButton active need-admin">Need Admin <span id="need-admin-badge" class="badge">0</span></a>';
		panel += '<a class="translucent flat minimalButton active need-scythe">Need Scythe <span id="need-scythe-badge" class="badge">0</span></a>';
		panel += '<a class="translucent flat minimalButton active watch">Watch List <span id="watch-badge" class="badge">0</span></a>';
		panel += '<a class="translucent flat minimalButton active task" id="sl-task-details" style="display: none;">Cube Details</a>';
		panel += '<a class="translucent flat minimalButton active task" id="sl-task-entry" style="display: none;">Log Entry</a>';
		panel += '</div>';
		
		// Add panel to game board
		jQuery("#content .gameBoard").append(panel);
		jQuery('#scoutsLogFloatingControls').draggable({container: 'parent'});
		
		// Add events to links
		jQuery('#scoutsLogFloatingControls a.cell-list').click(S.showCells);
		jQuery('#scoutsLogFloatingControls a.need-admin').click(S.showAdmin);
		jQuery('#scoutsLogFloatingControls a.need-scythe').click(S.showScythe);
		jQuery('#scoutsLogFloatingControls a.watch').click(S.showWatch);
		
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
		S.getCellSummary();
	}
	
	S.showAdmin = function() {
		S.getStatusEntries('need-admin');
	}
	
	S.showScythe = function() {
		S.getStatusEntries('need-scythe');
	}
	
	S.showWatch = function() {
		S.getStatusEntries('watch');
	}
	

}(window.scoutsLog = window.scoutsLog || {}));

jQuery(document).ready(function() {
	window.scoutsLog.init();
});

