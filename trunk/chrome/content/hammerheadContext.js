/*!
* Hammerhead Loader - a performance testing tool
* copyright Steve Souders 2011
* http://code.google.com/p/hammerhead-loader/
* MIT License
*/

HammerheadContext = function(panel, win) {
    dprint(9, "HammerheadContext: enter");
	// do this right away!
	if ( win ) {
		this.setWindow(win);
	}

	if ( panel ) {
		this.setPanel(panel);
	}
};


HammerheadContext.prototype.setPanel = function(panel) {
    dprint(9, "HammerheadContext.prototype.setPanel: enter");
	this.buttonViews = {};
	this.panel = panel;
	this.initDiv();
};


HammerheadContext.prototype.initDiv = function() {
    dprint(9, "HammerheadContext.prototype.initDiv: enter");
	var elem = this.panel.document.createElement("div");
	elem.style.display = "block";
	this.panel.panelNode.appendChild(elem);
	this.viewNode = elem;
};


HammerheadContext.prototype.show = function() {
    dprint(9, "HammerheadContext.prototype.show: enter");
	// Display the view for the currently selected button.
	// Select the current button.
	FirebugChrome.$(this.curButtonId).checked = true;

	// Display the view for the currently selected button.
	this.showButtonView(this.curButtonId);
};


HammerheadContext.prototype.addButtonView = function(sButtonId, sHtml) {
    dprint(9, "HammerheadContext.prototype.addButtonView: enter");
	var btnView = this.getButtonView(sButtonId);
	if ( ! btnView ) {
		btnView = this.panel.document.createElement("div");
		btnView.style.display = "none";
		this.viewNode.appendChild(btnView);
		this.buttonViews[sButtonId] = btnView;
	}

	btnView.innerHTML = sHtml;
	this.showButtonView(sButtonId);
};


HammerheadContext.prototype.getButtonView = function(sButtonId) {
    dprint(9, "HammerheadContext.prototype.getButtonView: enter");
	return ( this.buttonViews.hasOwnProperty(sButtonId) ? this.buttonViews[sButtonId] : undefined );
};


HammerheadContext.prototype.showButtonView = function(sButtonId) {
    dprint(9, "HammerheadContext.prototype.showButtonView: enter");
	var btnView = this.getButtonView(sButtonId);

	if ( ! btnView ) {
		eprint("ERROR: HammerheadContext.showButtonView: Couldn't find ButtonView named '" + sButtonId + "'.");
		return false;
	}

	// Hide all the other button views.
	for ( var sId in this.buttonViews ) {
		if ( this.buttonViews.hasOwnProperty(sId) && sId != sButtonId ) {
			this.buttonViews[sId].style.display = "none";
		}
	}

	btnView.style.display = "block";
	this.curButtonId = sButtonId;
	return true;
};


HammerheadContext.prototype.getCurButtonView = function() {
    dprint(9, "HammerheadContext.prototype.getCurButtonView: enter");
	return this.getButtonView(this.curButtonId);
};


HammerheadContext.prototype.getViewElementById = function(sId) {
    dprint(9, "HammerheadContext.prototype.getViewElementById: enter");
	var aElements = this.getCurButtonView().getElementsByTagName("*");
	for ( var i = 0; i < aElements.length; i++ ) {
		var elem = aElements[i];
		if ( sId == elem.id ) {
			return elem;
		}
	}

	dprint(2, "ERROR: getCurElement: Unable to find element '" + sId + "'.");
	return undefined;
};
