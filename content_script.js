const LS = {
  getAllItems: () => chrome.storage.local.get(),
  getItem: async key => (await chrome.storage.local.get(key))[key],
  setItem: (key, val) => chrome.storage.local.set({[key]: val}),
  removeItems: keys => chrome.storage.local.remove(keys),
};

var currentSiteItems = [];
var blockStoredList = [];
var isEletricHide = false;
var levelHide = 0;

initialize();

async function initialize()
{
  var blockList = await LS.getItem('blockList');
  if(blockList != null)
    blockStoredList = blockList;

  var tempIsEletricHide = await LS.getItem('isEletricHide');
  if(tempIsEletricHide)
    isEletricHide = tempIsEletricHide;

  var tempLevelHide = await LS.getItem('levelHide');
  if(tempLevelHide)
    levelHide = tempLevelHide;
}

function isBlock(nickname, levelSrc)
{
  if(levelSrc != null)
  {
    var levelMatch = levelSrc.match('(?<=https:\/\/static.inven.co.kr\/image_2011\/member\/level\/1202\/lv)(.*?)(?=.gif)');
    if(levelMatch.length > 0)
    {
      if(levelHide > 0)
      {
        var level = parseInt(levelMatch[0]);
        if(level <= levelHide)
          return true;
      }
    }
  }

  if(blockStoredList.find(o => o.name == nickname))
    return true;

  return false;
}

var commentObserver;
const commentObserverCallback = function(mutationsList, observer) {
  for (const mutation of mutationsList) {
    var target = mutation.target;
    if(target.classList.contains('commentList1'))
    {
      var comments = target.querySelectorAll('.cmtOne');
      comments.forEach(comment =>
      {
        var levelSrc = comment.querySelector('.lvicon').src;
        var userNickname = comment.querySelector('.nickname').textContent;
        if(isBlock(userNickname, levelSrc))
        {
          var parent = comment.parentNode.parentNode;
          if(parent.parentNode.classList.contains('replyCmt'))
            comment.parentNode.parentNode.style.display = "none";
          else
          {
            if(parent.parentNode.nextSibling.classList.contains('replyCmt'))
            {
              parent.replaceChildren();
              parent.innerHTML = "블라인드 된 코멘트입니다.";
            }
            else
            {
              comment.parentNode.parentNode.style.display = "none";
            }
          }
        }
      });
    }
  }
};

const observerCallback = function(mutationsList, observer) {
  for (const mutation of mutationsList) {
      var target = mutation.target;
      if (target.id === "board-electric-target") {
        if(isEletricHide)
          target.parentNode.style.display = "none";
      }
      else if(target.classList.contains('user')) // 글
      {
        if(target.children.length >= 2)
        {
          var levelSrc = target.children[0].src;
          var userNickname = target.textContent.replace(/\s/g, "");
          if(isBlock(userNickname, levelSrc))
          {
            target.parentNode.style.display = "none";
          }
        }
      }
      else if(target.classList.contains('nickname'))
      {
        var li = target.parentNode.parentNode;
        var ul = li.parentNode;
        if(ul.parentNode.id == "board-electric-target")
        {
          var nickname = target.textContent.match('\\[(.*?)\\]')[1];
          if(isBlock(nickname, null))
          {
            ul.removeChild(li);
          }
        }
      }
      else if(target.id === "powerbbsCmt2")
      {
        if(!commentObserver)
        {
          commentObserver = new MutationObserver(commentObserverCallback);
          commentObserver.observe(target, {childList: true, subtree: true });
        }
      }
  }
};
const observer = new MutationObserver(observerCallback);
observer.observe(document.documentElement, {childList: true, subtree: true });

document.addEventListener("DOMContentLoaded", async function() {

  var contextLayer = document.querySelector('div#nickNameLayer');
  if(contextLayer != null)
  {
    // Context Menu Observer
    new MutationObserver(async function(mutations) {
      var nickName = document.querySelector('li.search').children[0].getAttribute('onclick').match(new RegExp("'([^']*)'"))[1];
      var blockList = await LS.getItem('blockList');
      if(!blockList)
        blockList = [];

      for(var i=0; i<mutations.length; i++)
      {
        var mutation = mutations[i];
        if(mutation.type == "childList")
        {
          var ul = mutation.addedNodes[0];
          var closeli = ul.children[ul.children.length-1];

          var blockEntireui = document.createElement('li');
          blockEntireui.classList.add('blockuser', 'cleaninven-entire');

          var blockEntirea = document.createElement('a');
          if(blockList.find(o => o.name == nickName))
          {
            blockEntirea.nodeName = "removeBlock";
            blockEntirea.onclick = async function()
            {
              var blockList = await LS.getItem('blockList');
              if(!blockList)
                blockList = [];
            
              if(!blockList.find(o => o.name == nickName))
                return;
            
              blockList = blockList.filter(o => o.name != nickName);
              await LS.setItem('blockList', blockList);
            };
            var blockEntireText = document.createTextNode("로컬 차단 해제");
          }
          else
          {
            blockEntirea.nodeName = "addBlock";
            blockEntirea.onclick = async function()
            {
              var blockList = await LS.getItem('blockList');
              if(!blockList)
                blockList = [];
            
              if(blockList.find(o => o.name == nickName))
                return;
            
              blockList.push({__KEY__: uuidv4(), name: nickName});
              await LS.setItem('blockList', blockList);
            };
            var blockEntireText = document.createTextNode("로컬 차단");
          }
          blockEntirea.appendChild(blockEntireText);
          blockEntireui.appendChild(blockEntirea);

          ul.insertBefore(blockEntireui, closeli);
        }
      }
    }).observe(contextLayer, {childList: true});
  }
});

// var wildcardCheck = function(i, m) {
//   var regex = m.replace(/\*/g, "[^ ]*");
//   return i.match(regex) != null;
// };

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}