const LS = {
  getAllItems: () => chrome.storage.local.get(),
  getItem: async key => (await chrome.storage.local.get(key))[key],
  setItem: (key, val) => chrome.storage.local.set({[key]: val}),
  removeItems: keys => chrome.storage.local.remove(keys),
};

var currentSiteItems = [];
var blockStoredList = [];
var keywordStoredList = [];
var isEletricHide = false;
var isFilterTitle = false;
var isFilterContent = false;
var isFilterComment = false;
var levelHide = 0;
var isMobile = false;

var currentUrl = window.location.href;
if(currentUrl.includes("m.inven.co.kr")) // 모바일 용
  isMobile = true;

initialize();

async function initialize()
{
  var items = await LS.getAllItems();

  var blockList = items.blockList;
  if(blockList != null)
    blockStoredList = blockList;

  var keywordList = items.keywordList;
  if(keywordList != null)
    keywordStoredList = keywordList.map(o => o.value);

  var tempIsEletricHide = items.isEletricHide;
  if(tempIsEletricHide)
    isEletricHide = tempIsEletricHide;

  var tempIsFilterTitle = items.isFilterTitle;
  if(tempIsFilterTitle)
    isFilterTitle = tempIsFilterTitle;

  var tempIsFilterContent= items.isFilterContent;
  if(tempIsFilterContent)
    isFilterContent = tempIsFilterContent;

  var tempIsFilterComment = items.isFilterComment;
  if(tempIsFilterComment)
    isFilterComment = tempIsFilterComment;

  var tempLevelHide = items.levelHide;
  if(tempLevelHide)
    levelHide = tempLevelHide;
  
  document.addEventListener("DOMContentLoaded", async function() {
  
    var contextLayer = document.querySelector('div#nickNameLayer');
    var mobileWriterLayer = document.querySelector('div#writerMenu');
    if(contextLayer != null)
    {
      // Context Menu Observer
      new MutationObserver(async function(mutations) {
        var searchElement = document.querySelector('li.search').children[0];
        var nickName = "";
        if(isMobile)
          nickName = searchElement.getAttribute('href').match(new RegExp("'([^']*)'"))[1];
        else
          nickName = searchElement.getAttribute('onclick').match(new RegExp("'([^']*)'"))[1];

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
    if(mobileWriterLayer != null)
    {
      var nickName = mobileWriterLayer.querySelector('a').getAttribute('onclick').match(new RegExp("'([^']*)'"))[1];
      var ul = mobileWriterLayer.querySelector('ul');

      var blockList = await LS.getItem('blockList');
      if(!blockList)
        blockList = [];

      var blockEntireui = document.createElement('li');
      blockEntireui.classList.add('cleaninven-entire');

      var blockEntirea = document.createElement('a');
      blockEntirea.setAttribute('href', 'javascript:nothing();');
      blockEntirea.nodeName = "cleanInven";
      blockEntirea.onclick = async function()
      {
        var blockElement = document.querySelector('.cleaninven-entire').querySelector('a');
        var blockText = blockElement.textContent;
        var blockList = await LS.getItem('blockList');
        if(!blockList)
          blockList = [];

        if(blockText == "로컬 차단")
        {
          if(blockList.find(o => o.name == nickName))
            return;
        
          blockList.push({__KEY__: uuidv4(), name: nickName});
          await LS.setItem('blockList', blockList);

          blockElement.textContent = "로컬 차단 해제";
        }
        else
        {
          if(!blockList.find(o => o.name == nickName))
            return;
        
          blockList = blockList.filter(o => o.name != nickName);
          await LS.setItem('blockList', blockList);

          blockElement.textContent = "로컬 차단";
        }
      };

      if(blockList.find(o => o.name == nickName))
        var blockEntireText = document.createTextNode("로컬 차단 해제");
      else
        var blockEntireText = document.createTextNode("로컬 차단");

      blockEntirea.appendChild(blockEntireText);
      blockEntireui.appendChild(blockEntirea);

      ul.appendChild(blockEntireui);
    }
  });
}

function isFiltering(content)
{
  if(keywordStoredList.find(o => o == content.match(o)))
    return true;

  return false;
}

function isBlock(nickname, levelSrc)
{
  if(levelSrc != null)
  {
    if(isMobile)
    {
      if(levelSrc <= levelHide)
        return true;
    }
    else
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
  }

  if(blockStoredList.find(o => o.name == nickname))
    return true;

  return false;
}

// var wildcardCheck = function(i, m) {
//   var regex = m.replace(/\*/g, "[^ ]*");
//   return i.match(regex) != null;
// };

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
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
          if(parent.parentNode.classList.contains('replyCmt') || parent.parentNode.classList.contains('bestComment'))
            comment.parentNode.style.display = "none";
          else
          {
            if(comment.parentNode.nextSibling.classList.contains('replyCmt'))
            {
              comment.replaceChildren();
              comment.innerHTML = "블라인드 된 코멘트입니다.";
            }
            else
            {
              comment.parentNode.style.display = "none";
            }
          }
        }
        else
        {
          if(isFilterComment)
          {
            var contentNode = comment.querySelector('.content');
            var commentContent = contentNode.textContent;
            if(isFiltering(commentContent))
            {
              var blindContent = document.createElement('div');
              blindContent.classList.add('cleaninven-blind-content');
              blindContent.style.display = "none";

              var nodes = contentNode.childNodes;
              while(nodes.length > 0)
              {
                var node = nodes[0];
                blindContent.appendChild(node);
              }

              var blindAlertContent = document.createElement('div');
              blindAlertContent.classList.add('cleaninven-blind-alert');

              var blindSpan = document.createElement('span');
              blindSpan.style.color = 'silver';
              blindSpan.textContent = "필터링에 감지되어 블라인드 되었습니다. ";
              blindAlertContent.appendChild(blindSpan);

              var blindA = document.createElement('a');
              blindA.setAttribute('href', 'javascript:nothing();');
              blindA.text = '[내용보기]';
              blindA.nodeName = "cleanInven";
              blindA.onclick = async function()
              {
                var blindAlert = this.parentNode;
                var blindContent = this.parentNode.parentNode.querySelector('.cleaninven-blind-content');

                blindAlert.style.display = "none";
                blindContent.style.display = "";
              }
              blindAlertContent.appendChild(blindA);

              contentNode.appendChild(blindAlertContent);
              contentNode.appendChild(blindContent);
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
      else if(target.classList.contains('articleContent')) // 본문
      {
        if(isFilterContent)
        {
          var blindContent = target.querySelector('.powerbbsBodyBlind');
          if(blindContent) // 이미 블라인드 된 글
            continue;

          var targetNode;
          if(isMobile)
            targetNode = target.querySelector('#imageCollectDiv');
          else
            targetNode = target.querySelector('#powerbbsContent');

          if(targetNode != null)
          {
            if(targetNode.querySelector('.cleaninven-blind-content')) // 이미 블라인드됨
              continue;
            var articleText = targetNode.textContent;
            if(isFiltering(articleText))
            {
              var blindContent = document.createElement('div');
              blindContent.classList.add('cleaninven-blind-content');
              blindContent.style.display = "none";

              var nodes = targetNode.childNodes;
              while(nodes.length > 0)
              {
                var node = nodes[0];
                blindContent.appendChild(node);
              }

              var blindAlertContent = document.createElement('div');
              blindAlertContent.classList.add('cleaninven-blind-alert');

              var blindSpan = document.createElement('span');
              blindSpan.style.color = 'red';
              blindSpan.textContent = "필터링에 감지되어 블라인드 되었습니다. ";
              blindAlertContent.appendChild(blindSpan);

              var blindA = document.createElement('a');
              blindA.setAttribute('href', 'javascript:nothing();');
              blindA.style.color = 'blue';
              blindA.text = '[내용보기]';
              blindA.nodeName = "cleanInven";
              blindA.onclick = async function()
              {
                var blindAlert = document.querySelector('.cleaninven-blind-alert');
                var blindContent = document.querySelector('.cleaninven-blind-content');

                blindAlert.style.display = "none";
                blindContent.style.display = "";
              }
              blindAlertContent.appendChild(blindA);

              targetNode.appendChild(blindAlertContent);
              targetNode.appendChild(blindContent);
            }
          }
        }
      }
      else if(target.classList.contains('user')) // 글
      {
        var levelSrc = target.children[0].src;
        var userNickname = target.textContent.replace(/\s/g, "");
        if(isBlock(userNickname, levelSrc))
          target.parentNode.style.display = "none";
        else if(isFilterTitle)
        {
          var subject = target.parentNode.querySelector('.subject-link');
          var title = [...subject.childNodes].filter(o => o.nodeType === Node.TEXT_NODE || o.nodeName == 'B').map(o => o.textContent.trim()).join('');
          if(isFiltering(title))
            target.parentNode.style.display = "none";
        }
      }
      else if(target.classList.contains('li-wrap')) // 모바일용 글
      {
        var levelNode = target.querySelector('.lv');
        if(levelNode != null)
        {
          var level = levelNode.textContent.replace("Lv.", "");
          var userNickname = target.querySelector('.nick').textContent.replace(/\s/g, "");
          if(isBlock(userNickname, level))
            target.parentNode.style.display = "none";
          else if(isFilterTitle)
          {
            var subject = target.querySelector('.subject');
            var title = subject.textContent;
            if(isFiltering(title))
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