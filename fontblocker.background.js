
// Context menu: BLOCK FOR SESSION
chrome.contextMenus.create({
	"title": 'Block font - session',
	"contexts": ["page", "frame", "selection", "link", "editable"],
	"onclick": function(info, tab) {
		chrome.tabs.sendMessage(tab.id, {getLastElementFont: true, sessionStorage: true}, function(data) {
			// Content script takes care of everything
		});
	}
});

// Context menu: BLOCK ALWAYS
chrome.contextMenus.create({
	"title": 'Block font - forever',
	"contexts": ["page", "frame", "selection", "link", "editable"],
	"onclick": function(info, tab) {
		chrome.tabs.sendMessage(tab.id, {getLastElementFont: true}, function(data) {
			if ( !data || !data.name || !data.host ) return;

			chrome.storage.local.get('fonts', function(items) {
				var fonts = items.fonts || [];
				for (var i=0; i<fonts.length; i++) {
					var font = fonts[i];
					if (font.host == data.host && font.name == data.name) {
						// Already exists, cancel
						return;
					}
				}

				data.added = Date.now();
				fonts.unshift(data);
				chrome.storage.local.set({fonts: fonts}, function() {
					// Saved!
				});
			});
		});
	}
});

// Context menu: CLEAR FOR SESSION
// chrome.contextMenus.create({
// 	"title": 'Unblock session-blocked fonts',
// 	"contexts": ["page", "frame", "selection", "link", "editable"],
// 	"onclick": function(info, tab) {
// 		chrome.tabs.sendMessage(tab.id, {unblockSessionStorage: true}, function(data) {
// 			// Content script takes care of everything
// 		});
// 	}
// });

// Context menu: UNBLOCK
chrome.contextMenus.create({
	"title": '(Un)glimpse blocked fonts',
	"contexts": ["page_action"],
	"onclick": function(info, tab) {
		chrome.tabs.sendMessage(tab.id, {glimpseFonts: true}, function(data) {
			// Whatever
		});
	}
});

// Show page action
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
	if ( msg && msg.fontsBlocked ) {
		chrome.pageAction.show(sender.tab.id);
	}
});

// Click on page action
chrome.pageAction.onClicked.addListener(function(tab) {
	var url = chrome.runtime.getURL('options/options.html');
	chrome.tabs.create({
		url: url + '#' + fb.host(tab.url),
	});
});
