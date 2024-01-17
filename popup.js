const blockUserList = new DevExpress.data.ArrayStore({
    data: [],
});

const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
};

var lvUsers;
var tagify;
var swTitleKeyword, swContentKeyword, swCommentKeyword, swEletric;
var tbLevel;

$(() => {
    initialize();
});

document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll("a");

    links.forEach(link => {
        const location = link.getAttribute('href');
        link.addEventListener('click', () => chrome.tabs.create({active: true, url: location}));
    });
});

function initialize()
{
    var tabDatas = [];
    var tabUser = {
        title: "차단 사용자 관리",
        template: function (itemData, itemIndex, element) {
            var div = $("<div>")
            div.appendTo(element);

            var template = document.querySelector('#userTemplate');
            div.append(template.content);

            initUser();
        }
    };
    var tabKeyword = {
        title: "키워드 차단",
        template: function (itemData, itemIndex, element) {
            var div = $("<div>")
            div.appendTo(element);

            var template = document.querySelector('#keywordTemplate');
            div.append(template.content);

            initKeyword();
        }
    };
    var tabSettings = {
        title: "설정",
        template: function (itemData, itemIndex, element) {
            var div = $("<div>")
            div.appendTo(element);

            var template = document.querySelector('#settingsTemplate');
            div.append(template.content);

            initSettings();
        }
    };
    tabDatas.push(tabUser);
    tabDatas.push(tabKeyword);
    tabDatas.push(tabSettings);
    $("#tabControl").dxTabPanel({
        dataSource: tabDatas,
        deferRendering: false,
        animationEnabled: false,
        swipeEnabled: false,
    }).dxTabPanel("instance");
}

async function initUser()
{
    var blockList = await LS.getItem('blockList');
    if(blockList)
        blockUserList._array = blockList;
    else
        blockUserList._array = [];

    lvUsers = $('#lvUsers').dxDataGrid({
        height: '400px',
        showBorders: true,
        paging: {
            enabled: false,
        },
        keyboardNavigation: {
            enterKeyAction: 'moveFocus',
            enterKeyDirection: 'row',
            editOnKeyPress: true,
        },
        dataSource: blockUserList,
        editing: {
            mode: 'cell',
            allowUpdating: true,
            allowAdding: true,
            allowDeleting: true,
            newRowPosition: 'last',
            confirmDelete: false,
            useIcons: true,
        },
        scrolling: {
            mode: "virtual"
        },
        sorting: {
            mode: "none"
        },
        searchPanel: {
            visible: true,
            width: 200,
            highlightCaseSensitive: false,
            placeholder: "Search..."
        },
        columns: [{
            dataField: "name",
            caption: "닉네임",
            width: 150,
            dataType: "string",
            validationRules: [{ 
                type: 'custom',
                message: '닉네임은 중복이거나 공백일 수 없습니다.',
                validationCallback: function(options) {  
                    item = blockUserList._array.find(o => o.__KEY__ != options.data.__KEY__ && o.name == options.value);
                    return options.value && (!item || blockUserList._array.length == 0);
                }
            }],
        }, {
            dataField: "memo",
            caption: "메모",
            dataType: "string",
        }, {
            type: 'buttons',
            width: 50,
            buttons: ['delete'],
        }],
        editorOptions: {
            searchEnabled: false,
            showClearButton: false,
        },
        toolbar: {
            items:
            [{
                name: 'searchPanel',
                location: 'before'
            },{
                name: 'addRowButton',
                location: 'after',
                options: {
                    padding: 0,
                    margin: 0,
                },
            },
            {
                locateInMenu: 'always',
                widget: 'dxButton',
                options: {
                    icon: 'export',
                    text: '데이터 내보내기',
                    onClick() {
                        if(blockUserList._array.length <= 0)
                        {
                            DevExpress.ui.dialog.alert("차단된 사용자가 없습니다.");
                            return;
                        }

                        downloadObjectAsJson(blockUserList._array.map(user =>
                        {
                            var data = {};
                            data.name = user.name;
                            data.memo = user.memo;
                            return data;
                        }), "BlockUsers");
                    },
                },
            },{
                locateInMenu: 'always',
                widget: 'dxButton',
                options: {
                    locateInMenu: 'always',
                    icon: 'import',
                    text: '데이터 불러오기',
                    onClick() {
                        var fileDialog = $('<input type="file" accept=".json">');
                        fileDialog.trigger("click");
                        fileDialog.on("change", function(e)
                        {
                            try
                            {
                                var file = $(this)[0].files[0];

                                const reader = new FileReader();
                                reader.addEventListener('load', (event) => {
                                    try
                                    {
                                        var blockUsers = JSON.parse(event.target.result).map(o =>
                                        {
                                            o.__KEY__ = uuidv4(); 
                                            return o;
                                        });
                                        if(Array.isArray(blockUsers))
                                        {
                                            blockUserList._array = blockUsers;
                                            LS.setItem('blockList', blockUsers);
        
                                            lvUsers.refresh();
                                        }
                                        else
                                            throw '지원되지 않는 파일입니다.';
                                    }
                                    catch(e)
                                    {
                                        DevExpress.ui.dialog.alert("데이터 불러오기 중 오류가 발생했습니다.");
                                        loadBlockList();
                                    }
                                });
                                reader.readAsText(file);
                            }
                            catch(e)
                            {
                                DevExpress.ui.dialog.alert("데이터 불러오기 중 오류가 발생했습니다.");
                                console.alert(e);
                                loadBlockList();
                            }
                        });
                    },
                },
            }
            ],
        },
        onEditorPreparing: function(e) {  
            if (e.parentType == 'dataRow') {  
                if(e.dataField == 'memo')
                    e.editorOptions.maxLength = 32;
                else if(e.dataField == 'name')
                    e.editorOptions.maxLength = 16; 
            }
        },
        onCellPrepared: function (e) {
            if (e.rowType != "data")
            {
                if(e.rowType == "header")
                    e.cellElement.css("text-align", "center");
            }
        },
        onSaving: async function(e) {
            var change = e.changes[0];
            if(change != null)
            {
                if(change.type == "remove")
                {
                    removeData(change.key.__KEY__);
                }
                else if(change.type == "insert" || change.type == "update")
                {
                    var item = Object.assign({}, change.key, change.data);
                    setItem(item);
                }
            }
        },
        onFocusedCellChanging: function(e) {
            if (e.event.key == "Enter")
            {
                if (e.newColumnIndex == 2 || (e.newColumnIndex == 1 && e.prevColumnIndex == 1)) {
                    if(e.newRowIndex + 2 > blockUserList._array.length)
                    {
                        e.cancel = true;
                        window.setTimeout(function() {  
                            lvUsers.closeEditCell();
                            lvUsers.addRow(); 
                        }, 0);
                    }
                    else
                    {
                        e.newRowIndex = e.newRowIndex + 1;
                        e.newColumnIndex = 0;
                    }
                }
            }

            if(e.newColumnIndex == 2)
            {
                e.newRowIndex = e.newRowIndex + 1;
                e.newColumnIndex = 0;
            }
		},
    }).dxDataGrid("instance");
}

async function initKeyword()
{
    $('#svKeywords').dxScrollView({
        scrollByThumb: true,
        showScrollbar: 'onScroll',
    }).dxScrollView('instance');

    var isFilterTitle = await LS.getItem('isFilterTitle');
    if(!isFilterTitle)
        isFilterTitle = false;

    var isFilterContent = await LS.getItem('isFilterContent');
    if(!isFilterContent)
        isFilterContent = false;

    var isFilterComment = await LS.getItem('isFilterComment');
    if(!isFilterComment)
        isFilterComment = false;

    swTitleKeyword = $('#swTitleKeyword').dxSwitch({
        value: isFilterTitle,
        onValueChanged: function(e) {
            LS.setItem('isFilterTitle', e.value);
        }
    }).dxSwitch('instance');

    swContentKeyword = $('#swContentKeyword').dxSwitch({
        value: isFilterContent,
        onValueChanged: function(e) {
            LS.setItem('isFilterContent', e.value);
        }
    }).dxSwitch('instance');

    swCommentKeyword = $('#swCommentKeyword').dxSwitch({
        value: isFilterComment,
        onValueChanged: function(e) {
            LS.setItem('isFilterComment', e.value);
        }
    }).dxSwitch('instance');

    $("#btnResetKeyword").dxButton({
        text: "키워드 전체 삭제",
        type: "danger",
        onClick: function() {
            var result = DevExpress.ui.dialog.confirm("키워드를 모두 삭제하시겠습니까?");
            result.done(function(dialogResult) {
                if(dialogResult)
                {
                    LS.setItem('keywordList', []);
                    tagify.removeAllTags();
                }
            });
        }
    });

    var keywordList = await LS.getItem('keywordList');
    if(!keywordList)
        keywordList = [];

    const input = document.querySelector('input[name=ipKeywords]');
    tagify = new Tagify(input); // initialize Tagify
    tagify.addTags(keywordList);

    tagify.on('add', function() {
        LS.setItem('keywordList', tagify.value);
    });
    tagify.on('remove', function() {
        LS.setItem('keywordList', tagify.value);
    })
}

async function initSettings()
{
    var isEletricHide = await LS.getItem('isEletricHide');
    if(!isEletricHide)
        isEletricHide = false;

    var levelHide = await LS.getItem('levelHide');
    if(!levelHide)
        levelHide = 0;

    swEletric = $('#swEletric').dxSwitch({
        value: isEletricHide,
        onValueChanged: function(e) {
            LS.setItem('isEletricHide', e.value);
        }
    }).dxSwitch('instance');

    tbLevel = $("#tbLevel").dxNumberBox({
        min: 0,
        max: 100,
        value: levelHide,
        onChange: function(e)
        {
            LS.setItem('levelHide', parseInt(e.component._changedValue));
        },
    }).dxNumberBox("instance");

    $("#btnExportSetting").dxButton({
        text: "설정 데이터 내보내기",
        onClick: async function() {
            var settingData = {};
            settingData.isEletricHide = await LS.getItem('isEletricHide');
            settingData.isFilterTitle = await LS.getItem('isFilterTitle');
            settingData.isFilterContent = await LS.getItem('isFilterContent');
            settingData.isFilterComment = await LS.getItem('isFilterComment');
            settingData.keywordList = await LS.getItem('keywordList');
            settingData.levelHide = await LS.getItem('levelHide');

            var blockUsers = await LS.getItem('blockList');
            settingData.blockUsers = blockUsers.map(user =>
            {
                var data = {};
                data.name = user.name;
                data.memo = user.memo;
                return data;
            });
            downloadObjectAsJson(settingData, "Settings");
        }
    });

    $("#btnImportSetting").dxButton({
        text: "설정 데이터 불러오기",
        onClick: function() {
            var fileDialog = $('<input type="file" accept=".json">');
            fileDialog.trigger("click");
            fileDialog.on("change", function(e)
            {
                try
                {
                    var file = $(this)[0].files[0];

                    const reader = new FileReader();
                    reader.addEventListener('load', (event) => {
                        try
                        {
                            var settings = JSON.parse(event.target.result);
                            var blockUsers = settings.blockUsers.map(o =>
                            {
                               o.__KEY__ = uuidv4(); 
                               return o;
                            });
    
                            swEletric.option('value', settings.isEletricHide);
                            swTitleKeyword.option('value', settings.isFilterTitle);
                            swContentKeyword.option('value', settings.isFilterContent);
                            swCommentKeyword.option('value', settings.isFilterComment);
    
                            tagify.removeAllTags();
                            tagify.addTags(settings.keywordList);
    
                            tbLevel.option('value', settings.levelHide ? settings.levelHide : 0);
    
                            blockUserList._array = blockUsers;
    
                            LS.setItem('isEletricHide', settings.isEletricHide);
                            LS.setItem('isFilterTitle', settings.isFilterTitle);
                            LS.setItem('isFilterContent', settings.isFilterContent);
                            LS.setItem('isFilterComment', settings.isFilterComment);
                            LS.setItem('keywordList', settings.keywordList);
                            LS.setItem('levelHide', settings.levelHide);
                            LS.setItem('blockList', blockUsers);
    
                            lvUsers.refresh();
                        }
                        catch(e)
                        {
                            DevExpress.ui.dialog.alert("설정 불러오기 중 오류가 발생했습니다.");
                            loadAllData();
                        }
                    });
                    reader.readAsText(file);
                }
                catch(e)
                {
                    DevExpress.ui.dialog.alert("설정 불러오기 중 오류가 발생했습니다.");
                    loadAllData();
                }
            });
        }
    });
}

async function loadBlockList()
{
    blockUserList._array = await LS.getItem('blockList');
    lvUsers.refresh();
}

async function loadAllData()
{
    swEletric.option('value', await LS.getItem('isEletricHide'));
    swTitleKeyword.option('value', await LS.getItem('isFilterTitle'));
    swContentKeyword.option('value', await LS.getItem('isFilterContent'));
    swCommentKeyword.option('value', await LS.getItem('isFilterComment'));

    tagify.removeAllTags();
    tagify.addTags(await LS.getItem('keywordList'));

    var levelHide = await LS.getItem('levelHide');
    tbLevel.option('value', levelHide ? levelHide : 0);

    blockUserList._array = await LS.getItem('blockList');
    lvUsers.refresh();
}

async function setItem(data)
{
    var blockList = await LS.getItem('blockList');
    if(blockList == null)
      blockList = [];
  
    var existItem = blockList.find(o => o.__KEY__ == data.__KEY__);
    if(existItem)
        Object.assign(existItem, data);
    else
        blockList.push(data);

    await LS.setItem('blockList', blockList);
}

async function removeData(key)
{
    var blockList = await LS.getItem('blockList');
    if(!blockList)
      blockList = [];
  
    if(!blockList.find(o => o.__KEY__ == key))
      return;
  
    blockList = blockList.filter(o => o.__KEY__ != key);
    await LS.setItem('blockList', blockList);
}

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

$(window).blur(function() {
    lvUsers.closeEditCell();
    lvUsers.saveEditData()
});