/*!
* Hammerhead Loader - a performance testing tool
* copyright Steve Souders 2011
* http://code.google.com/p/hammerhead-loader/
* MIT License
*/

/* TODO
 - Do as a standalone FF Extension
 - images for play, pause, etc.
 - show timing of backend vs. frontend, in addition to overall page load time
 - get the timer to work on first page view in tab, browser
*/
FBL.ns(function() { with (FBL) {
Firebug.HammerheadModule = extend(Firebug.Module,
	{
		//**************************************
		//Extends module
		iClearCache: 0,
		runcache: "both",
		nSleep: 2000,

		initContext: function() {
			// The way YSlow resizes the status bar is distracting. Give it a fixed width.
			dprint(9, "Firebug.HammerheadModule.initContext: enter");
			var yslowTime = FirebugChrome.window.document.getElementById("yslowStatusTime");
			if ( yslowTime ) {
				yslowTime.style.width = "35px";
			}
		},

		shutdown: function() {
			dprint(9, "Firebug.HammerheadModule.shutdown: enter");
			if(Firebug.getPref('defaultPanelName')=='hammerhead') {
				Firebug.setPref('defaultPanelName','console');
			}
		},

		showContext: function(browser, context) {
			dprint(9, "Firebug.HammerheadModule.showContext: enter");

			// change status bar icon
			var myIcon = browser.chrome.$("hammerheadStatusIcon");
			myIcon.src = "chrome://hammerhead/content/icon-" + (context ? "" : "disabled-") + "16x16.gif";
			FirebugChrome.window.document.getElementById("hammerheadStatusTime").style.color = ( context ? "black" : "gray" );
		},

		showPanel: function(browser, panel) { 
			dprint(9, "Firebug.HammerheadModule.showPanel: enter");
			
			var bMe = panel && panel.name == "hammerhead"; 
			var myButtons = browser.chrome.$("fbHammerheadButtons"); 
			collapse(myButtons, !bMe);     // hide our buttons if we're not the active panel
		},

		loadedContext: function(context) {
			dprint(9, "Firebug.HammerheadModule.loadedContext: enter");
			// Need this for detach to work.
			if ( gLatestHammerheadContext ) {
				context.hammerheadContext = gLatestHammerheadContext;
			}
		},

		reattachContext: function(context) {
			dprint(9, "Firebug.HammerheadModule.reattachContext: enter");
			// Need this for detach to work.
			if ( ! FirebugContext.getPanel("hammerhead").document.HAMMERHEADPANEL ) {
				FirebugContext.getPanel("hammerhead").document.HAMMERHEADPANEL = FirebugContext.getPanel("hammerhead");
			}
		},

		doHammer: function() {
			dprint(9, "Firebug.HammerheadModule.doHammer: enter");
			FirebugChrome.$("btn_hammer").checked = true;
			FirebugContext.getPanel("hammerhead").doHammer("btn_hammer");
		},

		doSetup: function() {
			dprint(9, "Firebug.HammerheadModule.doSetup: enter");
			FirebugChrome.$("btn_setup").checked = true;
			FirebugContext.getPanel("hammerhead").doSetup("btn_setup");
		},

		doCache: function() {
			dprint(9, "Firebug.HammerheadModule.doCache: enter");
			FirebugChrome.$("btn_cache").checked = true;
			FirebugContext.getPanel("hammerhead").doCache("btn_cache");
		},

		// Called when page changes.
		// Also, it does it late enough that the window is available.
		watchWindow: function(context, win) {
			dprint(9, "Firebug.HammerheadModule.watchWindow: enter");

			win.addEventListener("load", this.doOnloadTime, false);
			win.addEventListener("beforeunload", this.doUnloadTime, false);

			if ( this.getBrowserWindow().frames && this.getBrowserWindow().frames[1] && win == this.getBrowserWindow().frames[1] ) {
				win.addEventListener("load", this.doOnload, false);
			}
		},

		// For every page view, record the load time in the Cache panel.
		doOnloadTime: function() {
			var t_end = Number(new Date());
			dprint(9, "Firebug.HammerheadModule.doOnloadTime: enter");
			if ( FirebugContext.browser.t_hhstart ) {
				var ms = t_end - FirebugContext.browser.t_hhstart;
				// Some pages cause onload to fire twice - seems better to leave this untouched and catch those longer loads.
				// FirebugContext.browser.t_hhstart = undefined;
				FirebugContext.getPanel("hammerhead").setTimeMessage("<b>" + ms + " ms</b> - " + Firebug.HammerheadModule.getBrowserWindow().location.href);
				FirebugChrome.window.document.getElementById("hammerheadStatusTime").value = ms + " ms";
				FirebugChrome.window.document.getElementById("hammerheadStatusTime").style.color = "black";
			}
		},

		// wrapper to get around FF3 change
		getBrowserWindow: function() {
			return FirebugContext.window.wrappedJSObject || FirebugContext.window;
		},
		
		// For every page, record a start time.
		doUnloadTime: function() {
			dprint(9, "Firebug.HammerheadModule.doUnload: enter");

			if ( Firebug.HammerheadModule.iClearCache && 
				 // don't do any cache clearing if we're in the middle of a test
				 ( ! FirebugContext.getPanel("hammerhead").testrun || FirebugContext.getPanel("hammerhead").testrun.bDone )
			   ) {
				Firebug.HammerheadModule.clearCache(1 == Firebug.HammerheadModule.iClearCache, true);
			}

			// TODO - If two tabs overlap unloading this won't work.
			FirebugContext.browser.t_hhstart = Number(new Date());
			FirebugContext.getPanel("hammerhead").setTimeMessage("");
			FirebugChrome.window.document.getElementById("hammerheadStatusTime").value = "";
		},

		// This is only called for pages loaded in the hammer harness frameset.
		doOnload: function() {
			var endTime = Number(new Date());
			dprint(9, "HammerheadModule:doOnload: enter");
			if ( FirebugContext.getPanel("hammerhead").testrun ) {
				var iUrl = FirebugContext.getPanel("hammerhead").testrun.iUrl;
				var sUrl = FirebugContext.getPanel("hammerhead").testrun.sUrl;
				FirebugContext.getPanel("hammerhead").testrun.doContentOnload(endTime);
				FirebugContext.getPanel("hammerhead").updateResults(iUrl, sUrl);
			}
		},

		goHome: function() {
			FirebugContext.getPanel("hammerhead").openLink("http://stevesouders.com/hammerhead/");
		},

		doOpenPanel: function(context, event, elem) {
			if (event.button != 0) {
				return;
			}
			else if (isControl(event)) {
				Firebug.toggleDetachBar(true);
			}
			else {
				Firebug.toggleBar(true);  // don't close - only open
				Firebug.tabBrowser.selectedBrowser.chrome.selectPanel('hammerhead');
			}
		},

		clearCache: function(bDisk, bMemory) {
			dprint(9, "Firebug.HammerheadModule.clearCache: enter");

			var cacheClass = Components.classes["@mozilla.org/network/cache-service;1"];
			var cacheService = cacheClass.getService(Components.interfaces.nsICacheService);
			try {
				if ( bDisk || "undefined" == typeof(bDisk) ) {
					cacheService.evictEntries(Components.interfaces.nsICache.STORE_ON_DISK);
				}
				if ( bMemory || "undefined" == typeof(bMemory) ) {
					cacheService.evictEntries(Components.interfaces.nsICache.STORE_IN_MEMORY);
				}
			}
			catch(err) {
				eprint(err.message);
			}
		},

		setClearCache: function(iValue) {
			dprint(9, "Firebug.HammerheadModule.setClearCache: enter");
			this.iClearCache = iValue;
		},

		destroyContext: function(context) {
			dprint(9, "Firebug.HammerheadModule.destroyContext: enter");
			// Need this for detach to work.
			gLatestHammerheadContext = undefined;
		}
	}
);


function HammerheadPanel() {}
HammerheadPanel.prototype = extend(Firebug.Panel,
	{
		name: "hammerhead",
		title: "Hammerhead",
		searchable: false,
		editable: false,
		trCounter: 1,

		// Initialize the panel. This is called every time the browser's HTML document changes.
		initializeNode: function() {
			dprint(9, "HammerheadPanel.initializeNode: enter");

			if ( FirebugContext.hammerheadContext ) {
				eprint("ERROR: HammerheadPanel.initializeNode: FirebugContext.hammerheadContext already exists!");
				return;
			}

			FirebugContext.hammerheadContext = new HammerheadContext(this);

			// Save a pointer back to this HammerheadPanel so we can have callbacks from  inside the panel's document.
			this.document.HAMMERHEADPANEL = this;
			this.module = Firebug.HammerheadModule;

			if ( FirebugChrome.$("btn_setup").checked ) {
				this.doSetup("btn_setup");
			}
			else if ( FirebugChrome.$("btn_hammer").checked ) {
				if ( -1 == Firebug.HammerheadModule.getBrowserWindow().location.href.indexOf('/hammerhead/hammer.php') ) {
					// We don't want to automatically load the Hammer panel, because it automatically loads the frameset.
					this.doSetup("btn_cache");
				}
				else {
					this.doHammer("btn_hammer");
				}
			}
			else {
				// Default button:
				FirebugChrome.$("btn_cache").checked = true;
				this.doCache("btn_cache");
			}
		},

		doHammer: function(sButtonId) {
			dprint(9, "HammerheadPanel.doHammer: enter");
			if ( FirebugContext.hammerheadContext.getButtonView(sButtonId) ) {
				FirebugContext.hammerheadContext.showButtonView(sButtonId);
			}
			else {
				if ( -1 == Firebug.HammerheadModule.getBrowserWindow().location.href.indexOf('/hammerhead/hammer.php') ) {
					this.loadFrameset(); // this will cause Firebug to reload, too
					return;
				}
				var curUrl = "";
				var i = Firebug.HammerheadModule.getBrowserWindow().location.href.indexOf('?u=');
				if ( -1 != i ) {
					curUrl = unescape(Firebug.HammerheadModule.getBrowserWindow().location.href.substring(i+3));
				}
				var sHtml =
'<style>\n' +
'#hammerurls TH { border-bottom: 1px solid #BBB; background: #EEE; }\n' +
'#hammerurls TD { border-bottom: 1px solid #BBB; text-align: right; }\n' +
'.lb { border-left: 1px solid #BBB; }\n' +
'</style>\n' +
'<div style="padding: 4px; font-size: 11pt;" height=100%>\n' +
'  <div style="float: right;"><a href="http://stevesouders.com/hammerhead/" onclick="document.HAMMERHEADPANEL.openLink(\'http://stevesouders.com/hammerhead\'); return false;"><img border=0 src="chrome://hammerhead/content/icon-52x52.png" width=52 height=52></a></div>\n' +
'    <form name=hammerform onsubmit="document.HAMMERHEADPANEL.startRun(); return false;">\n' +
'      <input type=button id=startbutton value="Start" onclick="document.HAMMERHEADPANEL.startRun()"> ' +
'      <input type=button id=stepbutton value="Step" onclick="document.HAMMERHEADPANEL.stepRun()">\n' +
'      <input type=button id=resetbutton value="Reset" onclick="document.HAMMERHEADPANEL.resetRun()">\n' +
'      <span id=hammerheadmessages style="margin-left: 40px; color: #F55;"></span>\n' +
'      <p>\n' +
'      # of loads: <input type=text size=3 name=numloads id="numloads" style="text-align: right;" value=1>\n' +
'      <table id=hammerurls cellpadding=4 cellspacing=0 style="border: 1px solid #BBB">\n' +
'        <thead>\n' +
'          <tr><th colspan=4 style="border-bottom: 0; background: #EEE;">Empty Cache</th> <th colspan=4 class=lb style="border-bottom: 0; background: #EEE;">Primed Cache</th><th class=lb rowspan=2 vertical-align=bottom>URL</th></tr>\n' +
'          <tr><th>Count</th> <th>Latest</th> <th>Median</th> <th>&nbsp;&nbsp;Avg&nbsp;&nbsp;</th> <th class=lb>Count</th> <th>Latest</th> <th>Median</th> <th>&nbsp;&nbsp;Avg&nbsp;&nbsp;</th></tr>\n' +
'        </thead>\n' +
'        <tbody id=hammerurlsTbody>' +
'<tr id="hhtr_0"><td>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td>' +
'            <td class=lb>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td>' +
'            <td class=lb align=left><a href="javascript:document.HAMMERHEADPANEL.moveUrlUp(\'hhtr_0\')" title="move up"><img border=0 src="chrome://hammerhead/content/arrow-up-12x12.gif" width=12 height=12></a>' +
' <a href="javascript:document.HAMMERHEADPANEL.moveUrlDown(\'hhtr_0\')" title="move down"><img border=0 src="chrome://hammerhead/content/arrow-down-12x12.gif" width=12 height=12></a>' +
' <a href="javascript:document.HAMMERHEADPANEL.removeUrl(\'hhtr_0\')" title="remove"><img border=0 src="chrome://hammerhead/content/delete-12x12.gif" width=12 height=12></a>' +
'&nbsp;&nbsp;&nbsp;<input type=text size=60 value="' + curUrl + '"></td></tr>' +
'</tbody>\n' +
'      </table>\n' +
'    </form>\n' +
'    <p>\n' +
'    <form name=hammerurlform onsubmit="document.HAMMERHEADPANEL.addUrl(); return false;">\n' +
'      <input type=button value="Add URL" onclick="document.HAMMERHEADPANEL.addUrl()">\n' +
'    </form>\n' +
'</div>\n' +
'';
				FirebugContext.hammerheadContext.addButtonView(sButtonId, sHtml);
			}
		},

		addUrl: function() {
			dprint(9, "HammerheadPanel.addUrl: enter");
			var urlsTable = this.getCurElement('hammerurlsTbody');
			var trElem = this.document.createElement('tr');
			trElem.id = "hhtr_" + (this.trCounter++);
			urlsTable.appendChild(trElem);
			trElem.innerHTML = 
			'<td>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td> ' +
			'<td class=lb>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td> <td>&nbsp;</td> ' +
			'<td class=lb align=left><a href="javascript:document.HAMMERHEADPANEL.moveUrlUp(\'' + trElem.id + '\')" title="move up"><img border=0 src="chrome://hammerhead/content/arrow-up-12x12.gif" width=12 height=12></a>' +
			' <a href="javascript:document.HAMMERHEADPANEL.moveUrlDown(\'' + trElem.id + '\')" title="move down"><img border=0 src="chrome://hammerhead/content/arrow-down-12x12.gif" width=12 height=12></a>' +
			' <a href="javascript:document.HAMMERHEADPANEL.removeUrl(\'' + trElem.id + '\')" title="remove"><img border=0 src="chrome://hammerhead/content/delete-12x12.gif" width=12 height=12></a>' +
			'&nbsp;&nbsp;&nbsp;<input type=text size=60></td>';
		},

		startRun: function() {
			dprint(9, "HammerheadPanel.startRun: enter");
			var startbutton = this.getCurElement('startbutton');
			var stepbutton = this.getCurElement('stepbutton');
			if ( "Start" == startbutton.value ) {
				this.initRun();
				this.testrun.start();
				startbutton.value = "Pause";
				stepbutton.disabled = true;
			}
			else if ( "Pause" == startbutton.value ) {
				this.testrun.bStop = true;
				startbutton.value = "Continue";
				stepbutton.disabled = false;
			}
			else if ( "Continue" == startbutton.value ) {
				this.testrun.bStop = false;
				this.testrun.continue();
				startbutton.value = "Pause";
				stepbutton.disabled = true;
			}
		},

		stepRun: function() {
			dprint(9, "HammerheadPanel.stepRun: enter");
			if ( !this.testrun ) {
				this.initRun();
			}
			
			if ( !this.testrun.bDone ) {
				var startbutton = this.getCurElement('startbutton');
				startbutton.value = "Continue";
				this.testrun.step();
			}
			else {
				alert("This test run is done. You can start a new run, but you can't step.");
			}
		},

		resetRun: function() {
			dprint(9, "HammerheadPanel.resetRun: enter");
			this.testrun = undefined;
			this.clearResults();
			var startbutton = this.getCurElement('startbutton');
			startbutton.value = "Start";
		},

		initRun: function() {
			dprint(9, "HammerheadPanel.initRun: enter");
			this.clearResults();
			var urlsTable = this.getCurElement('hammerurlsTbody');
			var aInputs = urlsTable.getElementsByTagName('input');
			var aUrls = new Array();
			for ( var i = 0; i < aInputs.length; i++ ) {
				aUrls[i] = aInputs[i].value;
			}

			if ( 0 === aUrls.length ) {
				alert("Add some URLs to test.");
				return;
			}

			if ( -1 == Firebug.HammerheadModule.getBrowserWindow().location.href.indexOf('/hammerhead/hammer.php') ) {
				this.loadFrameset();
			}
			var targetWin = Firebug.HammerheadModule.getBrowserWindow().frames[1];
			this.testrun = new TestRun(aUrls, targetWin, this.getCurElement('numloads').value, this.hammerDone, this.module.nSleep, this.module.runcache);
			this.setMessage("");
		},

		// callback to notify us that the test run is over
		hammerDone: function() {
			// this is a callback, so don't use "this."
			var thisPanel = FirebugContext.getPanel("hammerhead");
			thisPanel.setMessage('Done <input type=button value="Export Data" onclick="document.HAMMERHEADPANEL.exportData()" style="margin-left: 20px;">');
			thisPanel.getCurElement('startbutton').value = "Start";
		},

		loadFrameset: function() {
			dprint(9, "HammerheadPanel.loadFrameset: enter");
			Firebug.HammerheadModule.getBrowserWindow().document.location = "http://stevesouders.com/hammerhead/hammer.php?u=" +
			    escape(Firebug.HammerheadModule.getBrowserWindow().location.href);
		},

		exportData: function() {
			dprint(9, "HammerheadPanel.exportData: enter");

			var sHtml = this.testrun.exportSummaryData() + '\n\n' + this.testrun.exportRawData();

			var win = Firebug.HammerheadModule.getBrowserWindow().open('', 'exportdata');
			win.document.open('text/plain');
			win.document.write(sHtml);
			win.document.close();
		},

		updateResults: function(iUrl, sUrl) {
			dprint(9, "HammerheadPanel.updateResults: enter");
			var urlsTable = this.getCurElement('hammerurlsTbody');
			var aTRs = urlsTable.getElementsByTagName('tr');
			var tr = aTRs[iUrl];
			var aTDs = tr.getElementsByTagName('td');
			aTDs[0].innerHTML = ( this.testrun.getNumData(sUrl, true) || "&nbsp;" );
			aTDs[1].innerHTML = ( this.testrun.getLatest (sUrl, true) || "&nbsp;" );
			aTDs[2].innerHTML = ( this.testrun.getMedian (sUrl, true) || "&nbsp;" );
			aTDs[3].innerHTML = ( this.testrun.getAverage(sUrl, true) || "&nbsp;" );
			aTDs[4].innerHTML = ( this.testrun.getNumData(sUrl, false) || "&nbsp;" );
			aTDs[5].innerHTML = ( this.testrun.getLatest (sUrl, false) || "&nbsp;" );
			aTDs[6].innerHTML = ( this.testrun.getMedian (sUrl, false) || "&nbsp;" );
			aTDs[7].innerHTML = ( this.testrun.getAverage(sUrl, false) || "&nbsp;" );
		},

		clearResults: function() {
			dprint(9, "HammerheadPanel.clearResults: enter");
			var urlsTable = this.getCurElement('hammerurlsTbody');
			var aTRs = urlsTable.getElementsByTagName('tr');
			for ( var i = aTRs.length-1; i >= 0; i-- ) {
				var tr = aTRs[i];
				var aTDs = tr.getElementsByTagName('td');
				aTDs[0].innerHTML = "&nbsp;";
				aTDs[1].innerHTML = "&nbsp;";
				aTDs[2].innerHTML = "&nbsp;";
				aTDs[3].innerHTML = "&nbsp;";
				aTDs[4].innerHTML = "&nbsp;";
				aTDs[5].innerHTML = "&nbsp;";
				aTDs[6].innerHTML = "&nbsp;";
				aTDs[7].innerHTML = "&nbsp;";
			}
		},

		doSetup: function(sButtonId) {
			dprint(9, "HammerheadPanel.doSetup: enter");
			if ( FirebugContext.hammerheadContext.getButtonView(sButtonId) ) {
				FirebugContext.hammerheadContext.showButtonView(sButtonId);
			}
			else {
				var sValue = this.module.runcache;
				var sHtml =
'<div style="padding: 4px; font-size: 11pt;" height=100%>\n' +
'  <div style="float: right;"><a href="http://stevesouders.com/hammerhead" onclick="document.HAMMERHEADPANEL.openLink(\'http://stevesouders.com/hammerhead\'); return false;"><img border=0 src="chrome://hammerhead/content/icon-52x52.png" width=52 height=52></a></div>\n' +
'    <form name=setupform onsubmit="return false;">\n' +
'      Sleep interval: <input type=text size=3 name=sleep id="sleep" style="text-align: right;" value=2000 onchange="document.HAMMERHEADPANEL.module.nSleep=this.value"> ms\n' +
'<p style="margin-bottom: 4px;">\n' +
'Test each URL with the cache:\n' +
'<p style="margin: 4px 0 0 16px;">\n' +
'<input type=radio name=runcache value="both"' + ( "both" == sValue ? ' checked' : '' ) + ' onclick="document.HAMMERHEADPANEL.module.runcache=\'both\'"> empty and primed\n' +
'<p style="margin: 4px 0 0 16px;">\n' +
'<input type=radio name=runcache value="empty"' + ( "empty" == sValue ? ' checked' : '' ) + ' onclick="document.HAMMERHEADPANEL.module.runcache=\'empty\'"> empty only\n' +
'<p style="margin: 4px 0 0 16px;">\n' +
'<input type=radio name=runcache value="primed"' + ( "primed" == sValue ? ' checked' : '' ) + ' onclick="document.HAMMERHEADPANEL.module.runcache=\'primed\'"> primed only\n' +
'    </form>\n' +
'</div>\n' +
'';
				FirebugContext.hammerheadContext.addButtonView(sButtonId, sHtml);
			}
		},
		
		doCache: function(sButtonId) {
			dprint(9, "HammerheadPanel.doCache: enter");
			if ( FirebugContext.hammerheadContext.getButtonView(sButtonId) ) {
				FirebugContext.hammerheadContext.showButtonView(sButtonId);
			}
			else {
				var iValue = this.module.iClearCache;
				var sHtml =
'<div id=hammerheadcachediv style="padding: 4px; font-size: 11pt;" height=100%>\n' +
'  <div style="float: right;"><a href="http://stevesouders.com/hammerhead/" onclick="document.HAMMERHEADPANEL.openLink(\'http://stevesouders.com/hammerhead\'); return false;"><img border=0 src="chrome://hammerhead/content/icon-52x52.png" width=52 height=52></a></div>\n' +
'  <p style="margin-bottom: 4px;">Page load time:</p>\n' +
'  <div id="hammerheadtimemessage" style="margin-left: 16px;"></div>\n' +
'  <p style="margin-bottom: 0;">\n' +
'  After every page view:\n' +
'  <table cellpadding=2 cellspacing=0 border=0 style="margin-left: 16px;">\n' +
'    <tr><td><input type=radio name=cache value=0' + ( 0 == iValue ? ' checked' : '' ) + ' onclick="document.HAMMERHEADPANEL.module.setClearCache(0)"> Don\'t clear anything</td></tr>\n' +
'    <tr><td><input type=radio name=cache value=1' + ( 1 == iValue ? ' checked' : '' ) + ' onclick="document.HAMMERHEADPANEL.module.setClearCache(1)"> Clear disk and memory caches &nbsp;&nbsp; <input type=button value="Clear Now" onclick="document.HAMMERHEADPANEL.module.clearCache(true, true)"></td></tr>\n' +
'    <tr><td><input type=radio name=cache value=2' + ( 2 == iValue ? ' checked' : '' ) + ' onclick="document.HAMMERHEADPANEL.module.setClearCache(2)"> Clear memory cache only &nbsp;&nbsp; <input type=button value="Clear Now" onclick="document.HAMMERHEADPANEL.module.clearCache(false, true)"></td></tr>\n' +
'  </table>\n' +
'</div>\n' +
'';
				FirebugContext.hammerheadContext.addButtonView(sButtonId, sHtml);
			}
		},

		moveUrlUp: function(trId) {
			var urlsTable = this.getCurElement('hammerurlsTbody');
			var tr = this.getCurElement(trId);
			if ( urlsTable && tr && tr.previousSibling ) {
				prevTr = tr.previousSibling;
				urlsTable.insertBefore(tr, prevTr);
			}
		},

		moveUrlDown: function(trId) {
			var urlsTable = this.getCurElement('hammerurlsTbody');
			var tr = this.getCurElement(trId);
			if ( urlsTable && tr && tr.nextSibling ) {
				nextTr = tr.nextSibling;
				urlsTable.insertBefore(nextTr, tr);
			}
		},

		removeUrl: function(trId) {
			var urlsTable = this.getCurElement('hammerurlsTbody');
			var tr = this.getCurElement(trId);
			if ( urlsTable && tr ) {
				urlsTable.removeChild(tr);
			}
		},

		setMessage: function(sHtml) {
			dprint(9, "HammerheadPanel.setMessage: enter");
			var elem = this.getCurElement('hammerheadmessages');
			if ( elem ) {
				elem.innerHTML = sHtml;
			}
		},

		setTimeMessage: function(sHtml) {
			var elem = this.getCurElement('hammerheadtimemessage');
			if ( elem ) {
				elem.innerHTML = sHtml;
			}
		},

		getAllElementsByTagName: function(tagname) {
			dprint(9, "HammerheadPanel.getAllElementsByTagName: enter");
			// Tricky because you can't push HTML collections.
			var aResults = [];

			// Get all elements for the main document.
			var aElements = Firebug.HammerheadModule.getBrowserWindow().document.getElementsByTagName(tagname);
			for ( var i = 0; i < aElements.length; i++ ) {
				aResults.push(aElements[i]);
			}

			// Get all elements for frames.
			if ( Firebug.HammerheadModule.getBrowserWindow().frames ) {
				for ( var f = 0; f < Firebug.HammerheadModule.getBrowserWindow().frames.length; f++ ) {
					var aElements = Firebug.HammerheadModule.getBrowserWindow().frames[f].document.getElementsByTagName(tagname);
					for ( var i = 0; i < aElements.length; i++ ) {
						aResults.push(aElements[i]);
					}
				}
			}

			return aResults;
		},

		show: function() {
			dprint(9, "HammerheadPanel:show");
			if ( "undefined" === typeof(FirebugContext.hammerheadContext) ) {
				return;
			}

			gLatestHammerheadContext = FirebugContext.hammerheadContext; // need to save this to make detach work
			FirebugContext.hammerheadContext.show();
		},

		openLink: function(url) {
			dprint(9, "HammerheadPanel.openLink: enter");
			if (ggGetPref("browser.link.open_external") == 3) {
				gBrowser.selectedTab = gBrowser.addTab(url);
			}
			else {
				FirebugChrome.window.open(url, "_blank");
			}
		},

		// Wrapper around getting an element from the current Button View.
		getCurElement: function(sId) {
			return FirebugContext.hammerheadContext.getViewElementById(sId);
		},

		comingSoon: function() {
			alert("Coming soon...");
		},

		printObject: function(obj) {
			var msg = "";
			for ( var key in obj ) {
				try {
					if ( "function" == typeof(obj[key]) ) {
						msg += key + " = [function]\n";
					}
					else {
						msg += key + " = " + obj[key] + "\n";
					}
				}
				catch (err) {
					// Probably security restrictions accessing this key.
					msg += key + " - ERROR: unable to access\n";
				}
				if ( msg.length > 400 ) {
					alert(msg);
					msg = "";
				}
			}
			alert(msg);
		}
	}
);


Firebug.registerModule(Firebug.HammerheadModule);
Firebug.registerPanel(HammerheadPanel);

}});

