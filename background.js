function checkForValidUrl(tabId, changeInfo, tab) {
	if (tab.url.indexOf('sms.tsu.ge/sms/Students/Cxrilebi') > -1) {
		chrome.pageAction.show(tabId);
	}
};

//მოუსმენს ყველა ტაბის ყველა ცვლილებას.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

chrome.pageAction.onClicked.addListener(function(tab){
		chrome.tabs.sendMessage(tab.id, {show: "change"}, function(response) {
		console.log(response);
	});	
});

