chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: 'https://www.buymeacoffee.com/churuko'
        });
        var newKey = uuidv4();
        chrome.storage.local.set({[newKey]: {'__KEY__': newKey, 'Url':'*.inven.co.kr','Element':'board-electric-target'}});
    }
})

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}