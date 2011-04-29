all :: zip

zip :
	/bin/rm -f hammerhead.xpi
	zip hammerhead.xpi chrome.manifest install.rdf chrome/content/*.js chrome/content/*.xul chrome/content/*.png chrome/content/*.gif
