/*!
* Hammerhead Loader - a performance testing tool
* copyright Steve Souders 2011
* http://code.google.com/p/hammerhead-loader/
* MIT License
*/

TestRun = function(aUrls, targetWin, numloads, callback, sleep, runcache) {
	this.aUrls = aUrls;
	this.targetWin = targetWin;
	this.numloads = numloads;
	this.callback = callback;
	this.sleep = sleep || 3000;
	this.runcache = runcache || "both"; // one of "both", "primed", "empty"

	if ( "primed" == this.runcache ) {
		this.bEmptyCache = false;
		this.bPriming = true;
	}
	else {
		this.bEmptyCache = true;
		this.bPriming = false;
	}

	this.bDone = false;
	this.sUrl = undefined;
	this.iUrl = undefined;
	this.bStop = false;
	this.totalLoads = 0;
	this.hDataPrimed = {};
	this.hDataEmpty = {};
};

TestRun.prototype.start = function() {
	this.bStop = false;
	this.loadUrl();
};

TestRun.prototype.step = function() {
	if ( !this.bDone ) {
		this.bStop = true;
		this.loadUrl();
	}
};

TestRun.prototype.continue = function() {
	if ( !this.bDone ) {
		this.bStop = false;
		this.loadUrl();
	}
};

TestRun.prototype.loadUrl = function() {
	var url = this.getUrl();
	if ( "" === url ) {
		this.tStart = Number(new Date());
		this.doContentOnload();
	}
	else if ( url ) {
		if ( this.bPriming ) {
			// TODO - this is one place where testrun.js is NOT standalone. 
			FirebugContext.getPanel("hammerhead").setMessage('priming cache...');
		}
		Firebug.HammerheadModule.clearCache(this.bEmptyCache, true);
		this.tStart = Number(new Date());
		// Setting targetWin.location causes an exception in Firefox 3.5. 
		// this.targetWin.location = url;
		// This works, but makes TestRun less flexible.
		(FirebugContext.window.wrappedJSObject || FirebugContext.window).frames[1].location = url;
	}
};

TestRun.prototype.getUrl = function() {
	if ( this.aUrls ) {
		var iUrl = this.totalLoads%this.aUrls.length;
		this.iUrl = iUrl;
		this.sUrl = this.aUrls[iUrl];
		return this.sUrl;
	}

	return null;
};

TestRun.prototype.doContentOnload = function(endTime) {
	var end = endTime || Number(new Date());

	var url = this.getUrl();
	this.totalLoads++;
	var curLoadTime = end - this.tStart;
	if ( ! this.bPriming ) {
		this.saveTime(url, curLoadTime);
	}

	if ( ggGetPref('hammerhead.sendBeacon') && ggGetPref('hammerhead.beaconUrl') ) {
		var src = ggGetPref('hammerhead.beaconUrl');
		var img = new Image();
		img.src = src + "?url=" + escape(url) + "&t=" + curLoadTime + "&rand=" + Number(new Date());
	}

	if ( this.bPriming && this.totalLoads >= this.aUrls.length ) {
		// Turn off priming!
		this.bPriming = false;
		this.totalLoads = 0;
		FirebugContext.getPanel("hammerhead").setMessage('');
	}

	if ( this.totalLoads < this.numloads*this.aUrls.length ) {
		if ( !this.bStop ) {
			setTimeout('FirebugContext.getPanel("hammerhead").testrun.loadUrl()', this.sleep);
		}
	}
	else {
		if ( this.bEmptyCache && "both" == this.runcache ) {
			// do another primed cache run
			this.bEmptyCache = false;
			this.bPriming = true;  // we have to iterate over once without clearing the cache
			this.totalLoads = 0;
			if ( !this.bStop ) {
				setTimeout('FirebugContext.getPanel("hammerhead").testrun.loadUrl()', this.sleep);
			}
		}
		else {
			// all done
			this.bDone = true;
			if ( this.callback ) {
				this.callback();
			}
		}
	}
};


TestRun.prototype.getData = function(url, bEmptyCache) {
	if ( "undefined" === typeof(bEmptyCache) ) {
		bEmptyCache = this.bEmptyCache;
	}

	if ( bEmptyCache ) {
		if ( "undefined" == typeof(this.hDataEmpty[url]) ) {
			this.hDataEmpty[url] = new Array();
		}
		return this.hDataEmpty[url];
	}
	else {
		if ( "undefined" == typeof(this.hDataPrimed[url]) ) {
			this.hDataPrimed[url] = new Array();
		}
		return this.hDataPrimed[url];
	}
}

TestRun.prototype.saveTime = function(url, time, bEmptyCache) {
	var aData = this.getData(url, bEmptyCache);
	aData[ aData.length ] = time;
};


TestRun.prototype.getAverage = function(url, bEmptyCache) {
	var aData = this.getData(url, bEmptyCache);
	if ( "undefined" == typeof(aData) ) {
		return undefined;
	}

	var sum = 0;
	var numData = aData.length;
	for ( var i = 0; i < numData; i++ ) {
		sum += aData[i];
	}
	return parseInt( sum / numData );
};


TestRun.prototype.getMedian = function(url, bEmptyCache) {
	var aData = this.getData(url, bEmptyCache);
	if ( "undefined" == typeof(aData) || 0 == aData.length ) {
		return undefined;
	}

	// Copy the array - so that we preserve the test results in order.
    var tmpData = aData.slice(0);
    tmpData.sort(this.compareNumbers);

	// This is ALREADY zero-based.
	// For even numbers it errs closer to zero, eg, if there are 4 measurements it returns the 2nd measurement (not the 3rd).
	var iMedian = parseInt(tmpData.length/2 + 0.5) - 1;  // this is ALREADY zero-based
	return tmpData[iMedian];
};


TestRun.prototype.getNumData = function(url, bEmptyCache) {
	var aData = this.getData(url, bEmptyCache);
	if ( "undefined" == typeof(aData) || 0 == aData.length ) {
		return undefined;
	}

	return aData.length;
};


TestRun.prototype.getLatest = function(url, bEmptyCache) {
	var aData = this.getData(url, bEmptyCache);
	if ( "undefined" == typeof(aData) || 0 == aData.length ) {
		return undefined;
	}

	return aData[aData.length-1];
};


// returns a csv string
TestRun.prototype.exportRawData = function() {
	var sData = 'url,cachetype,time1,time2,etc\n';

	var len = this.aUrls.length;
	for ( var i = 0; i < len; i++ ) {
		var url = this.aUrls[i];
		var aData = this.getData(url, true);
		if ( aData ) {
			sData += '"' + url + '",emptycache,' + aData.join(',') + '\n';
		}
		aData = this.getData(url, false);
		if ( aData ) {
			sData += '"' + url + '",primedcache,' + aData.join(',') + '\n';
		}
	}

	return sData;
};


// returns a csv string
TestRun.prototype.exportSummaryData = function() {
	var sData = 'url,cachetype,numdata,latest,median,average\n';

	var len = this.aUrls.length;
	for ( var i = 0; i < len; i++ ) {
		var url = this.aUrls[i];
		if ( "primed" != this.runcache ) {
			sData += '"' + url + '",emptycache,' + this.getNumData(url,true) + ',' + this.getLatest(url,true) + ',' + this.getMedian(url,true) + ',' + this.getAverage(url,true) + '\n';
		}
		aData = this.getData(url, false);
		if ( "empty" != this.runcache ) {
			sData += '"' + url + '",primedcache,' + this.getNumData(url,false) + ',' + this.getLatest(url,false) + ',' + this.getMedian(url,false) + ',' + this.getAverage(url,false) + '\n';
		}
	}

	return sData;
};

TestRun.prototype.compareNumbers = function(a, b) {
	if(a > b) {
		return 1;
	}

	if(a < b) {
		return -1;
	}

	return 0;
}
