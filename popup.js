const blockUserList = new DevExpress.data.ArrayStore({
    data: [],
});

const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
};

$(() => {
    initialize();
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
        blockUserList._array = await LS.getItem('blockList');
    else
        blockUserList._array = [];

    $('#lvUsers').dxDataGrid({
        height: '390px',
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
            onKeyDown: function (e) {
                if (e.event.key == 'Delete') {
                    debugger;
                }
            },
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
            // {
            //     locateInMenu: 'always',
            //     widget: 'dxButton',
            //     options: {
            //         icon: 'export',
            //         text: '엑셀로 내보내기',
            //         onClick() {
            //             if(blockUserList._array.length <= 0)
            //             {
            //                 sketchup.alert("사용자가 없습니다.");
            //                 return;
            //             }
            //         },
            //     },
            // },{
            //     locateInMenu: 'always',
            //     widget: 'dxButton',
            //     options: {
            //         locateInMenu: 'always',
            //         icon: 'import',
            //         text: '엑셀에서 불러오기',
            //         onClick() {
                        
            //         },
            //     },
            // }
            ],
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
                    setItem(change.data);
                }
            }
        },
    }).dxDataGrid("instance");
}

async function initSettings()
{
    var isEletricHide = await LS.getItem('isEletricHide');
    if(!isEletricHide)
        isEletricHide = false;

    var levelHide = await LS.getItem('levelHide');
    if(!levelHide)
        levelHide = 0;

    $('#swEletric').dxSwitch({
        value: isEletricHide,
        onValueChanged: function(e) {
            LS.setItem('isEletricHide', e.value);
        }
    }).dxSwitch('instance');

    $("#tbLevel").dxNumberBox({
        min: 0,
        max: 100,
        value: levelHide,
        onChange: function(e)
        {
            LS.setItem('levelHide', parseInt(e.component._changedValue));
        },
    }).dxNumberBox("instance");
}

async function setItem(data)
{
    var blockList = await LS.getItem('blockList');
    if(blockList == null)
      blockList = [];
  
    if(blockList.find(o => o.__KEY__ == data.__KEY__))
      return;
  
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