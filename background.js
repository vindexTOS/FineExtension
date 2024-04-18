function sendRefreshMessage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshPage' });
      }
    });
  }
  
 const refreshInterval = 24 * 60 * 60 * 1000; 

  setInterval(sendRefreshMessage, refreshInterval);