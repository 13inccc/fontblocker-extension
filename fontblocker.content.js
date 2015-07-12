
/**
 * Add CSS to override @font-face
 */

function addFonts(fonts) {
	if ( !fonts.length ) return;

	var htmlData = document.documentElement.dataset;
	var blocked = htmlData.blockedFonts ? htmlData.blockedFonts.split('|') : [];
	blocked = blocked.concat(fonts);
	document.documentElement.dataset.blockedFonts = blocked.join('|');

	var weights = ['normal', 'bold', '100', '200', '300', '500', '600', '800', '900'];
	var styles = ['normal', 'italic'];

	// Compile CSS
	var css = [];
	for (var i=0; i<fonts.length; i++) {
		var font = fonts[i];
		weights.forEach(function(weight) {
			styles.forEach(function(style) {
				css.push('@font-face { font-family: "' + font + '"; font-weight: ' + weight + '; font-style: ' + style + '; src: local("' + fb.REPLACEMENT + '"); }');
			});
		});
	}

	// Insert into DOM
	var style = document.createElement('style');
	style.dataset.origin = 'fontblocker';
	style.innerHTML = css.join("\n");
	if (document.head) {
		document.head.appendChild(style);
	}

	// Show page action
	chrome.runtime.sendMessage({fontsBlocked: true}, function(response) {
		// Don't care if that worked
	});
}

// Fetch configured fonts
var host = fb.host(location.hostname);
fb.fontNamesForHost(host, function(fonts) {
	addFonts(fonts);
});



/**
 * Context menu item (background page)
 */

var lastElement, lastContext = {x: 0, y: 0};
document.addEventListener('contextmenu', function(e) {
	lastElement = e.target;
	lastContext.x = e.x;
	lastContext.y = e.y;
});

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
	if (message.getLastElementFont && lastElement) {
		// Currently blocked fonts
		var htmlData = document.documentElement.dataset;
		var blocked = htmlData.blockedFonts ? htmlData.blockedFonts.split('|') : [];

		// Extract used font
		var fontFamily = getComputedStyle(lastElement).fontFamily;
		var rawFonts = fontFamily.split(',');
		var font;
		for (var i=0; i<rawFonts.length; i++) {
			var checkFont = rawFonts[i];
			checkFont = checkFont.trim().replace(/^['"\s]+|['"\s]$/g, '').trim();
			if (checkFont && blocked.indexOf(checkFont) == -1 && fb.UNBLOCKABLE.indexOf(checkFont) == -1) {
				font = checkFont;
			}
		}

		// No blockable font found
		if ( !font ) {
			console.warn('No font found, or all fonts blocked: ' + fontFamily);
			return;
		}

		// Block and persist
		var host = fb.host(location.hostname);
		if (confirm("Do you want to block\n\n" + font + "\n\non\n\n" + host + "\n\n?")) {
			addFonts([font]);

			var data = {
				name: font,
				host: host,
			};
			sendResponse(data);
		}
	}
});



/**
 * (Un)glimpse blocked fonts, from page action
 */

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
	if (message.glimpseFonts) {
		var styles = document.querySelectorAll('style[data-origin="fontblocker"]');
		var enabled = null;
		[].forEach.call(styles, function(style) {
			if (enabled == null) {
				enabled = !style.disabled;
			}
			style.disabled = enabled;
		});
		sendResponse({disabled: enabled});
	}
});
