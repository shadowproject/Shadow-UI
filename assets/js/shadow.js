function invalid(el, valid) {
    if(valid == true)
        el.css("background", "").css("color", "");
    else
        el.css("background", "#E51C39").css("color", "white");

    return (valid == true);
}

function updateValue(element) {
    //TODO: add prefix label group_ when addresstype AT = 4. So we can remove it from the label being shown and handle it in the background..
    var curhtml = element.html(),
        value   = (element.parent("td").data("label") != undefined ? element.parent("td").data("label") :
                  (element.parent("td").data("value") != undefined ? element.parent("td").data("value") :
                  (element             .data("label") != undefined ? element             .data("label") :
                  (element             .data("value") != undefined ? element             .data("value") : element.text())))),

        address = element.parents(".selected").find(".address"),
        addresstype = element.parents(".selected").find(".addresstype");

    address = address.data("value") ? address.data("value") : address.text();

    if (addresstype.length === 1)
        addresstype = addresstype.data("value") ? addresstype.data("value") : addresstype.text();

    var prefix = (addresstype == "Group" ? "group_" : "");

    if(addresstype == "Group")
        value.replace("group_", "");

    element.html('<input class="newval" type="text" onchange="bridge.updateAddressLabel(\'' + address + '\', \'' + prefix + '\' +this.value);" value="' + value + '" size=60 />'); //

    function leave(e) {
        var newval = $(".newval");

        if (newval.length === 0)
            return;

        element.html(curhtml.replace(value, newval.val().trim()));
    }

    $(".newval").focus()
        .on("contextmenu", function(e) {
            e.stopPropagation();
        })
        .keyup(function (event) {
            if (event.keyCode == 13)
                leave(event);
        });

    $(document).one('click', leave);
}

$(function() {
    $('.footable,.footable-lookup').footable({breakpoints:{phone:480, tablet:700}, delay: 50})
    .on({'footable_breakpoint': function() {
            //$('table').trigger('footable_expand_first_row'); uncomment if we want the first row to auto-expand
        },
        'footable_redrawn':  resizeFooter,
        'footable_resized':  resizeFooter,
        'footable_filtered': resizeFooter,
        'footable_paging':   resizeFooter,
        'footable_row_expanded': function(event) {
        var editable = $(this).find(".editable");

        editable.off("dblclick");
        editable.on("dblclick", function (event) {
           event.stopPropagation();
           updateValue($(this));
        }).attr("data-title", "Double click to edit").on('mouseenter', tooltip);
    }});

    $(".editable").on("dblclick", function (event) {
       event.stopPropagation();
       updateValue($(this));
    }).attr("data-title", "Double click to edit %column%");

    $(document).ready(function() {
        resizeFooter();
        $("#navitems a[href='#overview']").trigger('click');
    });

    //$('img,i').click(function(e){e.stopPropagation()});

    // On resize, close menu when it gets to the breakpoint
    window.onresize = function (event) {
        if (window.innerWidth > breakpoint)
            $("#layout").removeClass('active');

        resizeFooter();
    };

    // Change page handler
    $("#navitems a, #test343343 a").on("click", changePage);

    if(bridge)
        $("[href='#about']").on("click", function() {bridge.userAction(['aboutClicked'])});

    overviewPage.init();
    sendPageInit();
    receivePageInit();
    transactionPageInit();
    addressBookInit();
    shadowChatInit();
    chainDataPage.init();
    keyManagementPage.init();
    // Tooltip
    $('[data-title]').on('mouseenter', tooltip);

    // Initialise row selection
    $(".footable > tbody tr").selection();
});

// Row select function
$.fn.selection = function(sibling) {
    if (!sibling)
        sibling = "tr";

    return this.on('click', function() {
        $(this)
            .addClass("selected")
        .siblings(sibling)
            .removeClass("selected");
    });
}

// Connect to bridge signals
function connectSignals() {
    bridge.emitPaste.connect(this, pasteValue);

    bridge.emitTransactions.connect(this, appendTransactions);
    bridge.emitAddresses.connect(this, appendAddresses);
    bridge.emitMessages.connect(this, appendMessages);
    bridge.emitMessage.connect(this,  appendMessage);

    bridge.emitCoinControlUpdate.connect(sendPage, "updateCoinControlInfo");

    bridge.emitAddressBookReturn.connect(this, addressBookReturn);

    bridge.triggerElement.connect(this, triggerElement);

    bridge.emitReceipient.connect(this, addRecipientDetail);
    bridge.networkAlert.connect(this, networkAlert);

    optionsModel.displayUnitChanged.connect(unit, "setType");
    optionsModel.reserveBalanceChanged.connect(overviewPage, "updateReserved");
    optionsModel.rowsPerPageChanged.connect(this, "updateRowsPerPage");
    optionsModel.visibleTransactionsChanged.connect(this, "visibleTransactions");

    walletModel.encryptionStatusChanged.connect(overviewPage, "encryptionStatusChanged");
    walletModel.balanceChanged.connect(overviewPage, "updateBalance");

    overviewPage.clientInfo();
    optionsPage.update();
    chainDataPage.updateAnonOutputs();
}

function triggerElement(el, trigger) {
    $(el).trigger(trigger);
}

function updateRowsPerPage(rows) {
    $(".footable").each(function() {
        var table = $(this);

        if (table.hasClass('footable-lookup'))
            return;

        table.data().pageSize = rows;
        table.trigger('footable_initialize');
    });
}

var base58 = {
    base58Chars :"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",

    check: function(field)
    {
        var el = $(field);
        var value = el.val();

        for (var i = 0, len = value.length; i < len; ++i)
            if (base58.base58Chars.indexOf(value[i]) == -1) {
                el.css("background", "#E51C39").css("color", "white");
                return false;
            }

        el.css("background", "").css("color", "");
        return true;
    }
}

var addressLookup = "",
    addressLabel  = "";

function openAddressBook(field, label, sending)
{
    addressLookup = field;
    addressLabel  = label;

    bridge.openAddressBook(sending);
}

function addressBookReturn(address, label)
{
    $(addressLookup).val(address).change();
    $(addressLabel) .val(label)  .change();
}

var pasteTo = "";

function pasteValue(value) {
    $(pasteTo).val(value);
}

function paste(field)
{
    pasteTo = field;
    bridge.paste();
    if (pasteTo.indexOf("#pay_to") == 0
        || pasteTo == '#change_address')
        base58.check(pasteTo);
}

function copy(field, attribute)
{
    var value = '';

    try {
        value = $(field).text();
    } catch(e) {};

    if(value==undefined||attribute!=undefined)
    {
        if(attribute=='copy')
            value = field;
        else
            value = $(field).attr(attribute);
    }

    bridge.copy(value);
}

function networkAlert(alert) {
    $("#network-alert span").text(alert);

    if(alert == "")
        $("#network-alert").hide();
    else
        $("#network-alert").show();
}

var unit = {
    type: 0,
    name: "SDC",
    display: "SDC",
    setType: function(type) {
        this.type = (type == undefined ? 0 : type);

        switch(type) {
            case 1:
                this.name = "mSDC",
                this.display = "mSDC";
                break;

            case 2:
                this.name = "uSDC",
                this.display = "&micro;SDC";
                break;

            case 3:
                this.name    = "sSDC",
                this.display = "Shadowshi";
                break;

            default:
                this.name = this.display = "SDC";
        }

        $("td.unit,span.unit,div.unit").html(this.display);
        $("select.unit").val(type).trigger("change");
        $("input.unit").val(this.name);
        overviewPage.updateBalance();
    },
    format: function(value, type) {
        var el = ($.isNumeric(value) ? null : $(value));

        type  = (type == undefined ? this.type : parseInt(type)),
        value = parseInt(el == undefined ? value : (el.data('value') == undefined ? el.val() : el.data('value')));

        switch(type) {
            case 1: value = value / 100000; break;
            case 2: value = value / 100; break;
            case 3: break;
            default: value = value / 100000000;
        }

        value = value.toFixed(this.mask(type));

        if(el == undefined)
            return value;

        el.val(value);
    },
    parse: function(value, type) {
        var el = ($.isNumeric(value) ? null : $(value));

        type  = (type == undefined ? this.type : parseInt(type)),

        fp = (el == undefined ? value : el.val());
        if (fp == undefined || fp.length < 1)
            fp = ['0', '0'];
        else
        if (fp[0] == '.')
            fp = ['0', fp.slice(1)];
        else
            fp = fp.split('.');

        value = parseInt(fp[0]);

        var ipow = this.mask(type);
        if (ipow > 0)
            value *= Math.pow(10, ipow);
        if (ipow > 0 && fp.length > 1)
        {
            var av = fp[1].split('');

            while (av.length > 1 && av[av.length-1] == '0')
                av.pop();

            var fract = parseInt(av.join(''));

            if (fract > 0)
            {
                ipow -= av.length;

                if (ipow > 0)
                    fract = fract * Math.pow(10, ipow);
                value += fract
            };
        };

        if (el == undefined)
            return value;

        el.data('value', value);
        this.format(el, type);
    },
    mask: function(type) {
        type  = (type == undefined ? this.type : parseInt(type));

        switch(type) {
            case 1: return 5;
            case 2: return 2;
            case 3: return 0;
            default:return 8;
        }
    },
    keydown: function(e) {
        var key = e.which,
            type = $(e.target).siblings(".unit").val();


        if(key==190 || key == 110) {
            if(this.value.toString().indexOf('.') != -1 || unit.mask(type) == 0)
                e.preventDefault();

            return true;
        }

        if(!e.shiftKey && (key>=96 && key<=105 || key>=48 && key<=57)) {
            var selectS = this.selectionStart;
            var indP = this.value.indexOf(".");
            if (!(document.getSelection().type == "Range") && selectS > indP && this.value.indexOf('.') != -1 && this.value.length -1 - indP >= unit.mask(type))
            {
                if (this.value[this.value.length-1] == '0'
                    && selectS < this.value.length)
                {
                    this.value = this.value.slice(0,-1);
                    this.selectionStart = selectS;
                    this.selectionEnd = selectS;
                    return;
                }
                e.preventDefault();
            }
            return;
        }

        if(key==8||key==9||key == 17||key==46||key==45||key>=35 && key<=40||(e.ctrlKey && (key==65||key==67||key==86||key==88)))
            return;

        e.preventDefault();
    },
    paste: function(e) {
        var data = e.originalEvent.clipboardData.getData("text/plain");
        if(!($.isNumeric(data)) || (this.value.indexOf('.') != -1 && document.getSelection().type != "Range"))
            e.preventDefault();
    }
};

var contextMenus = [];
function openContextMenu(el)
{
    if (contextMenus.indexOf(el) == -1)
        contextMenus.push(el);

    if (el.isOpen != undefined && el.isOpen == 1)
    {
        el.isOpen = 0;
        if(el.close)
            el.close();
    }

    // -- close other menus (their onClose isn't called if they were closed by opening another memu)
    for (var i = 0; i < contextMenus.length; ++i)
        contextMenus[i].isOpen = contextMenus[i] == el ? 1 : 0;
}

/* Overview Page */
var overviewPage = {
    init: function() {
        this.balance = $(".balance"),
        this.shadowBal = $(".shadow_balance"),
        this.reserved = $("#reserved"),
        this.stake = $("#stake"),
        this.unconfirmed = $("#unconfirmed"),
        this.immature = $("#immature"),
        this.total = $("#total");

        var menu = [{
                name: 'Backup&nbsp;Wallet...',
                fa: 'fa-save red fa-fw font-20px',
                fun: function () {
                   bridge.userAction(['backupWallet']);
                }
                }, /*
                {
                    name: 'Export...',
                    img: 'qrc:///icons/editcopy',
                    fun: function () {
                        copy('#addressbook .footable .selected .label');
                    }
                }, */
                {
                    name: 'Sign&nbsp;Message...',
                    fa: 'fa-pencil-square-o red fa-fw font-20px',
                    fun: function () {

                       $('#sign-message-button').click();
                    }
                },
                {
                    name: 'Verify&nbsp;Message...',
                    fa: 'fa-check red fa-fw font-20px',
                    fun: function () {
                        $('#verify-message-button').click();
                    }
                },
                {
                    name: 'Exit',
                    fa: 'fa-times red fa-fw font-20px',
                    fun: function () {
                       bridge.userAction(['close']);
                    }
                }];

        $('#file').contextMenu(menu, {onOpen:function(data,e){openContextMenu(data.menu);}, onClose:function(data,e){data.menu.isOpen = 0;}, triggerOn: 'click', displayAround: 'trigger', position: 'bottom', mouseClick: 'left', sizeStyle: 'content'});

        menu = [{
                     id: 'encryptWallet',
                     name: 'Encrypt&nbsp;Wallet...',
                     fa: 'fa-lock red fa-fw font-20px',
                     fun: function () {
                        bridge.userAction(['encryptWallet']);
                     }
                 },
                 {
                     id: 'changePassphrase',
                     name: 'Change&nbsp;Passphrase...',
                     fa: 'fa-user-secret red fa-fw font-20px',
                     fun: function () {
                        bridge.userAction(['changePassphrase']);
                     }
                 },
                 {
                     id: 'toggleLock',
                     name: '(Un)Lock&nbsp;Wallet...',
                     fa: 'fa-unlock red pad fa-fw font-20px',
                     fun: function () {
                        bridge.userAction(['toggleLock']);
                     }
                 },
                 {
                     name: 'Key Management',
                     fa: 'fa-key red fa-fw font-20px',
                     fun: function () {
                        $("#navitems [href=#keymanagement]").click();
                     }
                 },
                 {
                     name: 'Options',
                     fa: 'fa-wrench red fa-fw font-20px',
                     fun: function () {
                        $("#navitems [href=#options]").click();
                     }
                 }];

        $('#settings').contextMenu(menu, {onOpen:function(data,e){openContextMenu(data.menu);}, onClose:function(data,e){data.menu.isOpen = 0;}, triggerOn: 'click', displayAround: 'trigger', position: 'bottom', mouseClick: 'left', sizeStyle: 'content'});

        menu = [{
                     name: 'Debug&nbsp;Window...',
                     fa: 'fa-bug red fa-fw font-20px',
                     fun: function () {
                        bridge.userAction(['debugClicked']);
                     }
                 },
                 {
                     name: 'Developer&nbsp;Tools...',
                     fa: 'fa-edit red fa-fw font-20px',
                     fun: function () {
                        bridge.userAction(['developerConsole']);
                     }
                 },
                 {
                     name: ' About&nbsp;Shadow...',
                     img: 'qrc:///icons/shadow',
                     fun: function () {
                        bridge.userAction(['aboutClicked']);
                     }
                 },
                 {
                     name: 'About&nbsp;Qt...',
                     fa: 'fa-question red fa-fw font-20px',
                     fun: function () {
                        bridge.userAction(['aboutQtClicked']);
                     }
                 }];

        $('#help').contextMenu(menu, {onOpen:function(data,e){openContextMenu(data.menu);}, onClose:function(data,e){data.menu.isOpen = 0;}, triggerOn: 'click', displayAround: 'trigger', position: 'bottom', mouseClick: 'left', sizeStyle: 'content'});
    },

    updateBalance: function(balance, shadowBal, stake, unconfirmed, immature) {
        if(balance == undefined)
            balance     = this.balance    .data("orig"),
            shadowBal   = this.shadowBal  .data("orig"),
            stake       = this.stake      .data("orig"),
            unconfirmed = this.unconfirmed.data("orig"),
            immature    = this.immature   .data("orig");
        else
            this.balance    .data("orig", balance),
            this.shadowBal  .data("orig", shadowBal),
            this.stake      .data("orig", stake),
            this.unconfirmed.data("orig", unconfirmed),
            this.immature   .data("orig", immature);

        this.formatValue("balance",     balance);
        this.formatValue("shadowBal",   shadowBal);
        this.formatValue("stake",       stake);
        this.formatValue("unconfirmed", unconfirmed);
        this.formatValue("immature",    immature);
        this.formatValue("total", balance + stake + unconfirmed + immature);
        resizeFooter();
    },

    updateReserved: function(reserved) {
        this.formatValue("reserved", reserved);
    },

    formatValue: function(field, value) {

        if(field == "total" && value != undefined && !isNaN(value))
        {
            var val = unit.format(value).split(".");

            $("#total-big > span:first-child").text(val[0]);
            $("#total-big .cents").text(val[1]);
        }

        if(field == "stake" && value != undefined && !isNaN(value))
        {
            if(value == 0)
                $("#staking-big").addClass("not-staking");
            else
                $("#staking-big").removeClass("not-staking");

            var val = unit.format(value).split(".");

            $("#staking-big > span:first-child").text(val[0]);
            $("#staking-big .cents").text(val[1]);
        }

        field = this[field];

        if(value == 0) {
            field.html("");
            field.parent("tr").hide();
        } else {
            field.text(unit.format(value));
            field.parent("tr").show();
        }
    },
    recent: function(transactions) {
        for(var i = 0;i < transactions.length;i++)
            overviewPage.updateTransaction(transactions[i]);

        $("#recenttxns [data-title]").off("mouseenter").on("mouseenter", tooltip)
    },
    updateTransaction: function(txn) {
        var format = function(tx) {
            return "<tr><td class='text-left' style='border-top: 1px solid rgba(230, 230, 230, 0.7);border-bottom: none;'><center><label style='margin-top:6px;' class='label label-important inline fs-12'>"+(tx.t == 'input' ? 'Send' : (tx.t == 'output' ? 'Received' : (tx.t == 'inout' ? 'In-Out' : 'Stake')))+"</label></center></td><td class='text-left' style='border-top: 1px solid rgba(230, 230, 230, 0.7);border-bottom: none;'><center><a id='"+tx.id.substring(0,17)+"' data-title='"+tx.tt+"' href='#' onclick='$(\"#navitems [href=#transactions]\").click();$(\"#"+tx.id+"\").click();'> "
              +unit.format(tx.am)+" "+unit.display+" </a></center></td><td style='border-top: 1px solid rgba(230, 230, 230, 0.7);border-bottom: none;'><span class='overview_date' data-value='"+tx.d+"'><center>"+tx.d_s+"</center></span></td></tr>";
        }

 var sid = txn.id.substring(0,17);

        if($("#"+sid).attr("data-title", txn.tt).length==0)
        {
            var set = $('#recenttxns tr');
            var txnHtml = format(txn);

            var appended = false;

            for(var i = 0; i<set.length;i++)
            {
                var el = $(set[i]);

                if (parseInt(txn.d) > parseInt(el.find('.overview_date').data("value")))
                {
                    el.before(txnHtml);
                    appended = true;
                    break;
                }
            }

            if(!appended)
                $("#recenttxns").append(txnHtml);

            set = $('#recenttxns tr');

            while(set.length > 8)
            {
                $("#recenttxns tr:last").remove();

                set = $('#recenttxns tr');
            }
        }
    },
    clientInfo: function() {
        $('#version').text(bridge.info.build.replace(/\-[\w\d]*$/, ''));
        $('#clientinfo').attr('data-title', 'Build Desc: ' + bridge.info.build + '\nBuild Date: ' + bridge.info.date).on('mouseenter', tooltip);
    },
    encryptionStatusChanged: function(status) {
        switch(status)
        {
        case 0: // Not Encrypted
        case 1: // Unlocked
        case 2: // Locked
        }
    }
}

var optionsPage = {
    init: function() {
    },

    update: function() {
        var options = bridge.info.options;
        $("#options-ok,#options-apply").addClass("disabled");

        for(var option in options)
        {
            var element = $("#opt"+option),
                value   = options[option],
                values  = options["opt"+option];

            if(element.length == 0)
            {
                if(option.indexOf('opt') == -1)
                    console.log('Option element not available for %s', option);

                continue;
            }

            if(values)
            {
                element.html("");

                for(var prop in values)
                    if(typeof prop == "string" && $.isArray(values[prop]) && !$.isNumeric(prop))
                    {
                        element.append("<optgroup label='"+prop[0].toUpperCase() + prop.slice(1)+"'>");

                        for(var i=0;i<values[prop].length;i++)
                            element.append("<option>" + values[prop][i] + "</option>");
                    } else
                        element.append("<option" + ($.isNumeric(prop) ? '' : " value='"+prop+"'") + ">" + values[prop] + "</option>");
            }

            function toggleLinked(el) {
                el = $(this);
                var enabled = el.prop("checked"),
                    linked = el.data("linked");

                if(linked)
                    linked = linked.split(" ");
                else
                    return;

                for(var i=0;i<linked.length;i++)
                {
                    var linkedElements = $("#"+linked[i]+",[for="+linked[i]+"]").attr("disabled", !enabled);
                    if(enabled)
                        linkedElements.removeClass("disabled");
                    else
                        linkedElements.addClass("disabled");
                }
            }

            if(element.is(":checkbox"))
            {
                element.prop("checked", value == true||value == "true");
                element.off("change");
                element.on("change", toggleLinked);
                element.change();
            }
            else if(element.is("select[multiple]") && value == "*")
                element.find("option").attr("selected", true);
            else
                element.val(value);

            element.one("change", function() {$("#options-ok,#options-apply").removeClass("disabled");});
        }
    },
    save: function() {
        var options = bridge.info.options,
            changed = {};

        for(var option in options)
        {
            var element  = $("#opt"+option),
                oldvalue = options[option],
                newvalue = false;

            if(oldvalue == null || oldvalue == "false")
                oldvalue = false;

            if(element.length == 0)
                continue;

            if(element.is(":checkbox"))
                newvalue = element.prop("checked");
            else if(element.is("select[multiple]") && element.find("option:not(:selected)").length == 0)
                newvalue = "*";
            else
                newvalue = element.val();

            if(oldvalue != newvalue && oldvalue.toString() != newvalue.toString())
                changed[option] = newvalue;
        }

        if(!$.isEmptyObject(changed))
        {
            bridge.userAction({'optionsChanged': changed});
            optionsPage.update();

            if(changed.hasOwnProperty('AutoRingSize'))
                changeTxnType();
        }
    }
}

/* Send Page */
function sendPageInit() {
    toggleCoinControl(); // TODO: Send correct option value...
    addRecipient();
    changeTxnType();
    $("#cust-add-lkp").leanModal({top : 200, overlay : 0.5, closeButton: "#address-lookup-modal .modal_close"});
}

var recipients = 0;
var returnto = "";
function addRecipient() {

    $("#recipients").append((
           (recipients == 0 || $("div.recipient").length == 0 ? '' : '<hr />')
        +  '<div id="recipient[count]" class="recipient">\
<div class="form-group">\
<label class="col-sm-3 p-l-20 control-label">Pay to <a href="#"><i class="p-b-5 fa fa-question-circle" data-title="Shadowcash.. public.." style="color:#626262;"></i></a></label>\
<div class="col-sm-9">\
<div class="row">\
<div class="col-sm-6">\
<input class="form-control" id="pay_to[count]" data-title="The address to send the payment to" maxlength="128" oninput="base58.check(this);" onchange="$(\'#label[count]\').val(bridge.getAddressLabel(this.value));" placeholder="The address to send the payment to" type="text">\
</div>\
<div class="col-sm-3">\
<input class="form-control" id="label[count]"  maxlength="128" type="text" data-title="Enter a label for this address" placeholder="Enter a label"></div>\
<div class="btn-group col-sm-3 sm-m-t-10">\
<a id="address_lookup[count]" data-title="Choose from address book" data-toggle="modal"  data-target="#address-lookup-modal" href="#" onclick="returnto=\'pay_to[count]\,label[count]\';prepAddressLookup(true);" class="btn btn-default"><i class="fa fa-book"></i>\
</a>\
<a data-title="Paste address from clipboard"  class="btn btn-default" onclick="paste(\'#pay_to[count]\')"><i class="fa fa-files-o"></i>\
</a>\
<a data-title="Remove this recipient" class="btn btn-default" onclick="if($(\'div.recipient\').length == 1) clearRecipients(); else {var recipient=$(\'#recipient[count]\');if(recipient.next(\'hr\').remove().length==0)recipient.prev(\'hr\').remove();$(\'#recipient[count]\').remove();}"><i class="fa fa-close"></i>\
</a>\
</div>\
</div>\
</div>\
</div>\
<div class="form-group">\
<label class="col-sm-3 control-label option p-l-20" for="amount[count]" class="recipient">Amount <a href="#"><i class="p-b-5 fa fa-question-circle" data-title="Shadowcash.. public.." style="color:#626262;"></i></a></label>\
<div class="col-sm-9">\
<div class="row">\
<div class="col-sm-9">\
<input class="form-control" id="amount[count]" class="amount" placeholder="0.00000000" step="0.01" type="text" value="0.00000000" onfocus="invalid($(this), true);" onchange="unit.parse(this, $(\'#unit[count]\').val());updateCoinControl();">\
</div>\
<select class="select-drop-down" style="margin-left:7px" id="unit[count]" onchange="unit.format(\'#amount[count]\', $(this).val());">\
<option value="0" title="Shadow"                    ' + (unit.type == 0 ? "selected" : "") + '>SDC</option>\
<option value="1" title="Milli-Shadow (1 / 1000)"   ' + (unit.type == 1 ? "selected" : "") + '>mSDC</option>\
<option value="2" title="Micro-Shadow (1 / 1000000)"' + (unit.type == 2 ? "selected" : "") + '>&micro;SDC</option>\
<option value="3" title="Shadowshi (1 / 100000000)" ' + (unit.type == 3 ? "selected" : "") + '>Shadowshi</option>\
</select>\
</div>\
</div>\
</div>\
<div class="form-group" id="show_nar" style="border-bottom: 1px solid #F0F1F3">\
<label class="col-sm-3 control-label option p-l-20 recipient" for="narration[count]" title="Narration:">Narration <a href="#"><i class="p-b-5 fa fa-question-circle" data-title="Shadowcash.. public.." style="color:#626262;"></i></a></label>\
<div class="col-sm-9">\
<div class="row">\
<div class="col-sm-9">\
<input class="form-control" id="narration[count]" maxlength="24" data-title="Enter a short note to send with payment (max 24 characters)"\
placeholder="Enter a short note to send with a payment (max 24 characters)">\
</div>\
<div class="col-sm-3">\
</div>\
</div>\
</div>\
</div>\
</form>\
</div>\
</div>\
').replace(/\[count\]/g, recipients++));
        resizeFooter();

        // Don't allow characters in numeric fields
        $("#amount"+(recipients-1).toString()).on("keydown", unit.keydown).on("paste",  unit.paste);

        //$("#address_lookup"+(recipients-1)).leanModal({top : 200, overlay : 0.5, closeButton: "#address-lookup-modal .modal_close"});
		$('#address-lookup-modal'+(recipients-1)).modal('hide');
				
        // Addressbook Modal
        $("#addressbook"+(recipients-1).toString()).leanModal({ top : 10, left: 5, overlay : 0.5, closeButton: ".modal_close" });
		
    bridge.userAction(['clearRecipients']);
}




function clearRecipients() {
    $("#recipients").html("");
    recipients = 0;
    addRecipient();
    resizeFooter();
    returnto = "";
	 $('[data-title]').on('mouseenter', tooltip);
}

function addRecipientDetail(address, label, narration, amount) {
    var recipient = recipients - 1;

    $("#pay_to"+recipient).val(address).change();
    $("#label"+recipient).val(label).change();
    $("#amount"+recipient).val(amount).change();
}

function changeTxnType()
{
    var type=$("#txn_type").val();

    if (type > 1)
    {
        $("#tx_ringsize,#suggest_ring_size")[bridge.info.options.AutoRingSize == true ? 'hide' : 'show']();
        $("#coincontrol,#spend_sdc,#suggest_ring_size,#tx_ringsize").hide();
        $("#spend_shadow").show();
        toggleCoinControl(false);
		$(".hide-coin-controle").hide();
		$(".hide-adv-controle").show();
    }
    else
    {
        $("#tx_ringsize,#suggest_ring_size,#spend_shadow").hide();
        $("#coincontrol,#spend_sdc").show();
		$(".hide-coin-controle").show();
		$(".hide-adv-controle").hide();
    }

    resizeFooter();
}

//rarw


function toggleADVControl(enable) {
$('#txn_type').val();
   if( $('#txn_type').val() == "2")
    {
         $('#tx_ringsize,#suggest_ring_size').toggle();
   }else
   {
      $('#tx_ringsize,#suggest_ring_size').hide();
  }
     resizeFooter();
  }



function suggestRingSize()
{
    chainDataPage.updateAnonOutputs();

    var minsize = bridge.info.options.MinRingSize||3,
        maxsize = bridge.info.options.MaxRingSize||50;

    function mature(value, min_owned) {
        if(min_owned == undefined || !$.isNumeric(min_owned))
            min_owned = 1;

        var anonOutput = chainDataPage.anonOutputs[value];

        if(anonOutput)
            return Math.min(anonOutput
               && anonOutput.owned_mature  >= min_owned
               && anonOutput.system_mature >= minsize
               && anonOutput.system_mature, maxsize);
        else
            return 0;
    }

    function getOutputRingSize(output, test, maxsize)
    {
        switch (output)
        {
            case 0:
                return maxsize;
            case 2:
                return mature(1*test, 2)||getOutputRingSize(++output, test, maxsize);
            case 6:
                return Math.min(mature(5*test, 1),
                                mature(1*test, 1))||getOutputRingSize(++output, test, maxsize);
            case 7:
                return Math.min(mature(4*test, 1),
                                mature(3*test, 1))||getOutputRingSize(++output, test, maxsize);
            case 8:
                return Math.min(mature(5*test, 1),
                                mature(3*test, 1))||getOutputRingSize(++output, test, maxsize);
            case 9:
                return Math.min(mature(5*test, 1),
                                mature(4*test, 1))||getOutputRingSize(++output, test, maxsize);
            default:
                if(output == 10)
                    return mature(test/2, 2);

                maxsize = Math.max(mature(output*test, 1),mature(1*test, output))||getOutputRingSize(output==1?3:++output, test, maxsize);
        }
        return maxsize;
    }

    for(var i=0;i<recipients;i++)
    {
        var test = 1,
            output = 0,
            el = $("#amount"+i),
            amount = unit.parse(el.val(), $("#unit"+i));

        $("[name=err"+el.attr('id')+"]").remove();

        while (amount >= test && maxsize >= minsize)
        {
            output = parseInt((amount / test) % 10);
            try {
                maxsize = getOutputRingSize(output, test, maxsize);
            } catch(e) {
                console.log(e);
            } finally {
                if(!maxsize)
                    maxsize = mature(output*test);

                test *= 10;
            }
        }

        if(maxsize < minsize)
        {
            invalid(el);
            el.parent().before("<div name='err"+el.attr('id')+"' class='warning'>Not enough system and or owned outputs for the requested amount. Only <b>"
                     +maxsize+"</b> anonymous outputs exist for coin value: <b>" + unit.format(output*(test/10), $("#unit"+i)) + "</b></div>");
            el.on('change', function(){$("[name=err"+el.attr('id')+"]").remove();});

            $("#tx_ringsize").show();
            $("#suggest_ring_size").show();

            return;
        }
    }
    $("#ring_size").val(maxsize);
}

function toggleCoinControl(enable) {
    if(enable==undefined && $("#coincontrol_enabled")  .css("display") == "block" || enable == false)
    {
        $("#coincontrol_enabled") .css("display", "none");
        $("#coincontrol_disabled").css("display", "block");
    } else
    {
        $("#coincontrol_enabled") .css("display", "block");
        $("#coincontrol_disabled").css("display", "none");
    }
    resizeFooter();
}

function updateCoinControl() {
    if($("#coincontrol_enabled").css("display") == "none")
        return;
    var amount = 0;

    for(var i=0;i<recipients;i++)
        amount += unit.parse($("#amount"+i).val());

    bridge.updateCoinControlAmount(amount);
}

function updateCoinControlInfo(quantity, amount, fee, afterfee, bytes, priority, low, change)
{
    if($("#coincontrol_enabled").css("display") == "none")
        return;

    if (quantity > 0)
    {
        $("#coincontrol_auto").hide();

        var enable_change = (change == "" ? false : true);

        $("#coincontrol_quantity").text(quantity);
        $("#coincontrol_amount")  .text(unit.format(amount));
        $("#coincontrol_fee")     .text(unit.format(fee));
        $("#coincontrol_afterfee").text(unit.format(afterfee));
        $("#coincontrol_bytes")   .text("~"+bytes).css("color", (bytes > 10000 ? "red" : null));
        $("#coincontrol_priority").text(priority).css("color", (priority.indexOf("low") == 0 ? "red" : null)); // TODO: Translations of low...
        $("#coincontrol_low")     .text(low).toggle(enable_change).css("color", (low == "yes" ? "red" : null)); // TODO: Translations of low outputs
        $("#coincontrol_change")  .text(unit.format(change)).toggle(enable_change);

        $("label[for='coincontrol_low']")   .toggle(enable_change);
        $("label[for='coincontrol_change']").toggle(enable_change);

        $("#coincontrol_labels").show();

    } else
    {
        $("#coincontrol_auto").show();
        $("#coincontrol_labels").hide();
        $("#coincontrol_quantity").text("");
        $("#coincontrol_amount")  .text("");
        $("#coincontrol_fee")     .text("");
        $("#coincontrol_afterfee").text("");
        $("#coincontrol_bytes")   .text("");
        $("#coincontrol_priority").text("");
        $("#coincontrol_low")     .text("");
        $("#coincontrol_change")  .text("");
    }
}

var invalid = function(el, valid) {
    if(valid == true)
        el.css("background", "").css("color", "");
    else
        el.css("background", "#E51C39").css("color", "white");

    return (valid == true);
}

function sendCoins() {
    bridge.userAction(['clearRecipients']);

    if(bridge.info.options.AutoRingSize && $("#txn_type").val() > 1)
        suggestRingSize();

    for(var i=0;i<recipients;i++) {
        var el = $("#pay_to"+i);
        var valid = true;

        valid = invalid(el, bridge.validateAddress(el.val()));

        el = $("#amount"+i);

        if(unit.parse(el.val()) == 0 && !invalid(el))
            valid = false;

        if(!valid || !bridge.addRecipient($("#pay_to"+i).val(), $("#label"+i).val(), $("#narration"+i).val(), unit.parse($("#amount"+i).val(), $("#unit"+i).val()), $("#txn_type").val(), $("#ring_size").val()))
            return false;
    }

    if(bridge.sendCoins($("#coincontrol_enabled").css("display") != "none", $("#change_address").val()))
        clearRecipients();
}

function receivePageInit() {
    var menu = [{
            name: 'Copy&nbsp;Address',
            fun: function () {
                copy('#receive .footable .selected .address');
            }
        },
        {
            name: 'Copy&nbsp;Label',
            fun: function () {
                copy('#receive .footable .selected .label2');
            }
        },
        {
            name: 'Copy&nbsp;Public&nbsp;Key',
            fun: function () {
                copy('#receive .footable .selected .pubkey');
            }
        },
        {
            name: 'Edit',
            fun: function () {
                $("#receive .footable .selected .label2.editable").dblclick();
            }
        }];

    //Calling context menu
     $('#receive .footable tbody').on('contextmenu', function(e) {
        $(e.target).closest('tr').click();
     }).contextMenu(menu, {triggerOn:'contextmenu', sizeStyle: 'content'});

    // Deal with the receive table filtering
    // On any input update the filter
    $('#filter-address').on('input', function () {
        var receiveTable =  $('#receive-table');

        if($('#filter-address').val() == "")
        {
            receiveTable.data('footable-filter').clearFilter();
        }
        $('#receive-filter').val($('#filter-address').val() + " " + $('#filter-addresstype').val() ) ;
        receiveTable.trigger('footable_filter', {filter: $('#receive-filter').val()});
    });

    $('#filter-addresstype').change(function () {
        var receiveTable =  $('#receive-table');
        if($('#filter-addresstype').val() == "")
        {
            receiveTable.data('footable-filter').clearFilter();
        }
        $('#receive-filter').val($('#filter-address').val() + " " + $('#filter-addresstype').val() ) ;
        receiveTable.trigger('footable_filter', {filter: $('#receive-filter').val()});
    });
}

function clearRecvAddress()
{
    $("#new-address-label").val('');
    $("#new-addresstype").val(1);
}

function addAddress()
{
    alert("addAddress with type=" + $("#new-addresstype").val());
    newAdd = bridge.newAddress($("#new-address-label").val(), $("#new-addresstype").val());

    //TODO: Highlight address
    //$("#add-address-modal .modal_close").click();
		$('#add-address-modal').modal('hide');
}

function clearSendAddress()
{
    $("#new-send-label").val('');
    $("#new-send-address").val('');
    $("#new-send-address-error").text('');
    $("#new-send-address").removeClass('inputError');
}

function addSendAddress()
{
    var sendLabel, sendAddress, result;

    sendLabel   = $("#new-send-label").val();
    sendAddress = $("#new-send-address").val();

    var addType = 0; // not used
    result = bridge.newAddress(sendLabel, addType, sendAddress, true);

    if (result == "")
    {
        var errorMsg = bridge.lastAddressError();
        $("#new-send-address-error").text("Error: " + errorMsg);
        $("#new-send-address").addClass('inputError');
    } else
    {;
		$('#add-address-modal').modal('hide');
    };
}

function addressBookInit() {
    var menu = [{
            name: 'Copy&nbsp;Address',
            fun: function () {
                copy('#addressbook .footable .selected .address');
            }
        },
        {
            name: 'Copy&nbsp;Public&nbsp;Key',
            fun: function () {
                copy('#addressbook .footable .selected .pubkey');
            }
        },
        {
            name: 'Copy&nbsp;Label',
            fun: function () {
                copy('#addressbook .footable .selected .label2');
            }
        },
        {
            name: 'Edit',
            fun: function () {
                $("#addressbook .footable .selected .label2.editable").dblclick();
            }
        },
        {
            name: 'Delete',
            fun: function () {
                var addr=$('#addressbook .footable .selected .address');
                if(bridge.deleteAddress(addr.text()))
                    addr.closest('tr').remove();

                resizeFooter();
            }
        }];

    //Calling context menu
     $('#addressbook .footable tbody').on('contextmenu', function(e) {
        $(e.target).closest('tr').click();
     }).contextMenu(menu, {triggerOn:'contextmenu', sizeStyle: 'content'});

    // Deal with the addressbook table filtering
    // On any input update the filter
    $('#filter-addressbook').on('input', function () {
        var addressbookTable =  $('#addressbook-table');

        if($('#filter-addressbook').val() == "")
        {
            addressbookTable.data('footable-filter').clearFilter();
        }
        $('#addressbook-filter').val($('#filter-addressbook').val() + " " + $('#filter-addressbooktype').val() ) ;
        addressbookTable.trigger('footable_filter', {filter: $('#addressbook-filter').val()});
    });

    $('#filter-addressbooktype').change(function () {
        var addressbookTable =  $('#addressbook-table');
        if($('#filter-addresstype').val() == "")
        {
            addressbookTable.data('footable-filter').clearFilter();
        }
        $('#addressbook-filter').val($('#filter-addressbook').val() + " " + $('#filter-addressbooktype').val() ) ;
        addressbookTable.trigger('footable_filter', {filter: $('#addressbook-filter').val()});
    });
}


var Name = 'You';
var initialAddress = true;

function appendAddresses(addresses) {
    if(typeof addresses == "string")
    {
        if(addresses == "[]")
            return;

        addresses = JSON.parse(addresses.replace(/,\]$/, "]"));
    }

    for(var i=0; i< addresses.length;i++)
    {
        var address = addresses[i];
        var addrRow = $("#"+address.address);
        var page = (address.type == "S" ? "#addressbook" : (address.label.lastIndexOf("group_", 0) !== 0 ? "#receive" : "#addressbook"));

        /* add address to chat dropdown box to choose sender from*/
        if(address.type == "R" && sendPage.initSendBalance(address) && address.address.length < 75 && address.label.lastIndexOf("group_", 0) !== 0) {
            if(addrRow.length==0)
                $("#message-from-address").append("<option title='"+address.address+"' value='"+address.address+"'>"+address.label+"</option>");
            else
                $("#message-from-address option[value="+address.address+"]").text(address.label);

            if(initialAddress) {
                $("#message-from-address").prepend("<option title='Anonymous' value='anon' selected>Anonymous</option>");
                $(".user-name")   .text(Name);
                $(".user-address").text(address.address);
                initialAddress = false;
            }
        }

            if(address.at == 4){
                address.label = address.label.replace("group_", "");
                address.label_value = address.label_value.replace("group_", "");
            }

        if (addrRow.length==0)
        {
            $( page + " .footable tbody").append(
                "<tr id='"+address.address+"' lbl='"+address.label+"'>\
               <td style='padding-left:18px;' class='label2 editable' data-value='"+address.label_value+"'>"+address.label+"</td>\
               <td class='address'>"+address.address+"</td>\
               <td class='pubkey'>"+address.pubkey+"</td>\
               <td class='addresstype'>"+(address.at == 4 ? "Group" : address.at == 3 ? "BIP32" : address.at == 2 ? "Stealth" : "Normal")+"</td></tr>");

            $("#"+address.address)
            .on('click', function() {
                $(this).addClass("selected").siblings("tr").removeClass("selected");
            }).find(".editable").on("dblclick", function (event) {
                event.stopPropagation();
                updateValue($(this));
            }).attr("data-title", "Double click to edit").on('mouseenter', tooltip);
        }
        else
        {
            $("#"+address.address+" .label2") .data("value", address.label_value).text(address.label);
            $("#"+address.address+" .pubkey").text(address.pubkey);
        }

    }

    var table = $('#addressbook .footable,#receive .footable').trigger("footable_setup_paging");

}

function addressLookup(returnFields, receive, filterType)
{
    var lookupData = $((receive ? '#receive' : '#addressbook') + ' table.footable > tbody').html(),
        lookupTable = $("#address-lookup-table");

    lookupTable.children('tbody').html(lookupData);
    lookupTable.trigger('footable_initialize');
    lookupTable.data('footable-filter').clearFilter();

    $("#address-lookup-table > tbody tr")
        .selection()
        .on('dblclick', function() {
            var retfields = returnto.split(',');
            $("#" + retfields[0]).val( $(this).attr("id").trim() );
            if(retfields[1] != undefined )
            {
                $("#" + retfields[1])
                    .val($(this).attr("lbl").trim())
                    .text($(this).attr("lbl").trim());
            }
			$('#address-lookup-modal').modal('hide');
        });

    function doFilter() {
        $('#address-lookup-filter').val($('#address-lookup-address-filter').val() + " " + $('#address-lookup-address-type').val() ) ;
        lookupTable.trigger('footable_filter', {filter: $('#address-lookup-filter').val()});
    }

    // Deal with the lookup table filtering
    // On any input update the filter
    $('#address-lookup-address-filter').on('input', function () {
        if($('#lookup-address-filter').val() == "")
            lookupTable.data('footable-filter').clearFilter();

        doFilter();
    });

    $('#address-lookup-address-type').change(function () {
        if($('#address-lookup-address-type').val() == "")
            lookupTable.data('footable-filter').clearFilter();

        doFilter();
    });

    if (filterType) {
        $('#address-lookup-address-type').val(filterType);
        doFilter();
    }
}

function transactionPageInit() {
    var menu = [{
            name: 'Copy&nbsp;Amount',
            fun: function () {
                copy('#transactions .footable .selected .amount', "data-value");
            }
        },
        {
            name: 'Copy&nbsp;transaction&nbsp;ID',
            fun: function () {
                copy('#transactions .footable .selected', "id");
            }
        },
        {
            name: 'Edit&nbsp;label',
            fun: function () {
                $("#transactions .footable .selected .editable").dblclick();
            }
        },
        {
            name: 'Show&nbsp;transaction&nbsp;details',
            fun: function () {
                $("#transactions .footable .selected").dblclick();
            }
        }];

    //Calling context menu
     $('#transactions .footable tbody').on('contextmenu', function(e) {
        $(e.target).closest('tr').click();
     }).contextMenu(menu, {triggerOn:'contextmenu', sizeStyle: 'content'});

    $('#transactions .footable').on("footable_paging", function(e) {
        var transactions = filteredTransactions.slice(e.page * e.size)
            transactions = transactions.slice(0, e.size);

        var $tbody = $("#transactions .footable tbody");

        $tbody.html("");

        delete e.ft.pageInfo.pages[e.page];

        e.ft.pageInfo.pages[e.page] = transactions.map(function(val) {
            val.html = formatTransaction(val);

            $tbody.append(val.html);

            return $("#"+val.id)[0];
			
        });
        e.result = true;

        bindTransactionTableEvents();
        resizeFooter();

    }).on("footable_create_pages", function(e) {
        var $txtable = $("#transactions .footable");
        if(!$($txtable.data("filter")).val())
            filteredTransactions = Transactions;

        /* Sort Columns */
        var sortCol = $txtable.data("sorted"),
            sortAsc = $txtable.find("th.footable-sorted").length == 1,
            sortFun = 'numeric';

        switch(sortCol)
        {
        case 0:
            sortCol = 'd';
            break;
        case 2:
            sortCol = 't_l',
            sortFun = 'alpha';
            break;
        case 3:
            sortCol = 'ad',
            sortFun = 'alpha';
            break;
        case 4:
            sortCol = 'n',
            sortFun = 'alpha';
            break;
        case 5:
            sortCol = 'am';
            break;
        default:
            sortCol = 'c';
            break;
        }

        sortFun = e.ft.options.sorters[sortFun];

        filteredTransactions.sort(function(a, b) {
            return sortAsc ? sortFun(a[sortCol], b[sortCol]) : sortFun(b[sortCol], a[sortCol]);
        });
        /* End - Sort Columns */

        /* Add pages */
        delete e.ft.pageInfo.pages;
        e.ft.pageInfo.pages = [];
        var addPages = Math.ceil(filteredTransactions.length / e.ft.pageInfo.pageSize),
            newPage  = [];

        if(addPages > 0)
        {
            for(var i=0;i<e.ft.pageInfo.pageSize;i++)
                newPage.push([]);

            for(var i=0;i<addPages;i++)
                e.ft.pageInfo.pages.push(newPage);
        }

        /* End - Add pages */
    }).on("footable_filtering", function(e) {
        if(e.clear)
            return true;

        filteredTransactions = Transactions.filter(function(transaction) {
            for(var prop in transaction)
                if(transaction[prop].toString().toLowerCase().indexOf(e.filter.toLowerCase()) != -1)
                    return true;

            return false;
        });
    });
}


var Transactions = [],
    filteredTransactions = [];

function formatTransaction(transaction) {
    return "<tr id='"+transaction.id+"' data-title='"+transaction.tt+"'>\
	                <td data-value='"+transaction.d+"'>"+transaction.d_s+"</td>\
                    <td class='trans-status' data-value='"+transaction.c+"'><center><i class='fa fa-lg "+transaction.s+"'></center></td>\
                    <td class='trans_type'><img height='15' width='15' src='assets/icons/tx_"+transaction.t+".png' /> "+transaction.t_l+"</td>\
                    <td class='address' style='color:"+transaction.a_c+";' data-value='"+transaction.ad+"' data-label='"+transaction.ad_l+"'><span class='editable'>"+transaction.ad_d+"</span></td>\
                    <td class='trans-nar'>"+transaction.n+"</td>\
                    <td class='amount' style='color:"+transaction.am_c+";' data-value='"+transaction.am_d+"'>"+transaction.am_d+"</td>\
                 </tr>";
}

					/* <td class='trans_type'><img height='15' width='15' src='qrc:///icons/tx_"+transaction.t+"' /> "+transaction.t_l+"</td>\  */ //todo

function visibleTransactions(visible) {
    if(visible[0] != "*")
        Transactions = Transactions.filter(function(val) {
            return this.some(function(val){return val == this}, val.t_l);
        }, visible);
}

function bindTransactionTableEvents() {

    $("#transactions .footable tbody tr")
    .on('mouseenter', tooltip)

    .on('click', function() {
        $(this).addClass("selected").siblings("tr").removeClass("selected");
    })

    .on("dblclick", function(e) {
        $(this).attr("href", "#transaction-info-modal");


		$('#transaction-info-modal').appendTo("body").modal('show');
		
        $("#transaction-info").html(bridge.transactionDetails($(this).attr("id")));
        $(this).click();

        $(this).off('click');
        $(this).on('click', function() {
                $(this).addClass("selected").siblings("tr").removeClass("selected");
        })
    }).find(".editable")

   .on("dblclick", function (event) {
      event.stopPropagation();
      event.preventDefault();
      updateValue($(this));
   }).attr("data-title", "Double click to edit").on('mouseenter', tooltip);
}

function appendTransactions(transactions) {
    if(typeof transactions == "string")
    {
        if(transactions == "[]")
            return;

        transactions = JSON.parse(transactions.replace(/,\]$/, "]"));
    }

    if(transactions.length==1 && transactions[0].id==-1)
        return;

    transactions.sort(function (a, b) {
        a.d = parseInt(a.d);
        b.d = parseInt(b.d);

        return b.d - a.d;
    });

    Transactions = Transactions.filter(function(val) {
        return this.some(function(val) {
            return val.id == this.id;
        }, val) == false;
    }, transactions)
    .concat(transactions);

    overviewPage.recent(transactions.slice(0,7));
	
	$("#transactions .footable").trigger("footable_redraw");
	
}

function shadowChatInit() {
    var menu = [{
            name: 'Send&nbsp;Shadow',
            fun: function () {
                clearRecipients();
                $("#pay_to0").val($('#contact-list .selected .contact-address').text());
                $("#navpanel [href=#send]").click();
            }
        },
        {
            name: 'Copy&nbsp;Address',
            fun: function () {
                copy('#contact-list .selected .contact-address');
            }
        },
        /*
        {
            name: 'Send&nbsp;File',
            img: 'qrc:///icons/editcopy',
            fun: function () {
                copy('#transactions .footable .selected .address', "data-label");
            }
        },*/
        {
            name: 'Private&nbsp;Message',
            fun: function () {
                $("#message-text").focus();
            }
        } /*,
        {
            name: 'Edit&nbsp;Label',
            fun: function () {
                console.log("todo"); //TODO: this...
            }
        } /*,
        {
            name: 'Block&nbsp;Address',
            fun: function () {
                console.log("todo"); //TODO: Blacklist...
            }
        }*/
        ];

    //Calling context menu
    $('#contact-list').on('contextmenu', function(e) {
       $(e.target).closest('li').click();
    }).contextMenu(menu, {triggerOn:'contextmenu', sizeStyle: 'content'});

    menu = [{
            name: 'Copy&nbsp;Message',
            fun: function () {
                var selected = $(".contact-discussion li.selected"),
                    id = selected.attr("id");

                $.each(contacts[selected.attr("contact-key")].messages, function(index){if(this.id == id) copy(this.message, 'copy');});
            }
        },
        /*
        {
            name: 'Send&nbsp;File',
            fun: function () {
                copy('#transactions .footable .selected .address', "data-label");
            }
        },*/
        {
            name: 'Delete&nbsp;Message',
            fun: function () {
                $(".contact-discussion li.selected").find(".delete").click();
            }
        }];

    $('.contact-discussion').on('contextmenu', function(e) {
        $(e.target).closest('li').addClass("selected");
    }).contextMenu(menu, {triggerOn:'contextmenu', sizeStyle: 'content'});

    menu = [
        {
            name: 'Copy&nbsp;Selected',
            fun: function () {
                var editor = $("#message-text")[0];

                if (typeof editor.selectionStart !== 'undefined')
                    copy(editor.value.substring(editor.selectionStart, editor.selectionEnd), 'copy');
            }
        },
        {
            name: 'Paste',
            fun: function () {
                paste("#pasteTo");

                var editor = $("#message-text")[0];

                if(typeof editor.selectionStart !== 'undefined')
                    editor.value = editor.value.substring(editor.selectionStart, 0) + $("#pasteTo").val() + editor.value.substring(editor.selectionStart);
                else
                    editor.value += $("#pasteTo").val();
            }
        }];

    $('#message-text').contextMenu(menu, {triggerOn:'contextmenu', sizeStyle: 'content'});
    
    //ON ENTER SUBMIT MESSAGE
    $("#message-text").keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
                    
            if($("#message-text").val() == "")
                return 0;
                
            sendMessage();
        }
    });
    
    //ONCLICK REMOVE NOTIFICATION
    $("#messages")
        .selection()
        .on('click',
        function(e) {
            if(current_key != "")
                removeNotificationCount(current_key);
        });
    
}


var contacts = {};
var contact_list;
var contact_group_list;
var current_key = "";

function appendMessages(messages, reset) {
    contact_list = $("#contact-list ul");
    contact_group_list = $("#contact-group-list ul");

    if(reset)
    {
        contacts = null;
        contacts = {};
        contact_list.html("");
        contact_group_list.html("");
        $("#contact-list").removeClass("in-conversation");
        $("#contact-group-list").removeClass("in-conversation");
        $(".contact-discussion ul").html("");
        $(".user-notifications").hide();
        $("#message-count").text(0);
        messagesScroller.scrollTo(0, 0);
        contactScroll   .scrollTo(0, 0);
    }

    if(messages == "[]")
        return;
        

    console.log("message data=" + messages);
    messages = JSON.parse(messages.replace(/,\]$/, "]"));

    console.log("for loop through messages = " + messages.length);

    // Massage data
    for(var i=0; i<messages.length; i++)
    {
        var message = messages[i];
        appendMessage(message.id,
                      message.type,
                      message.sent_date,
                      message.received_date,
                      message.label_value,
                      message.label,
                      message.labelTo,
                      message.to_address,
                      message.from_address,
                      message.read,
                      message.message,
                      true);
    }


    openConversation(contacts[0].key, false);
    
    if(!contact[0].messages[0].group)
        $("#contact-list").addClass("in-conversation");
    else
        $("#contact-group-list").addClass("in-conversation");

    //contact_list.find("li:first-child").click();

}

function appendMessage(id, type, sent_date, received_date, label_value, label, labelTo, to_address, from_address, read, message, initial) {
    console.log("appendMessage called! type=" + type);
/*
    if(read==false) { //type=="R"&&
        $(".user-notifications").show();
        console.log("Updating messagecount to = " + parseInt($("#message-count").text()) + parseInt(1));
        $("#message-count").text(parseInt($("#message-count").text())+1);
        $("#message-count").show();
    }*/ //should be removed but can't test for the moment
    

    var them = type == "S" ? to_address   : from_address;
    var self = type == "S" ? from_address : to_address;

    var label_msg = type == "S" ? (labelTo == "(no label)" ? self : labelTo) : (label == "(no label)" ? them : label);
    var key = (label_value == "" ? them : label_value).replace(/\s/g, '');

    var group = false;
    //Setup instructions: make sure the receiving address is named 'group_ANYTHING'.
    //It's best to add the sender of the message with a label so you get a nice overview!

    /* This is just a cheat to test the formatting, because the if clause down below is always returning false.
    It will put all messages under the same contact*/

    if(type == "R" && labelTo.lastIndexOf("group_", 0) === 0){ //Received, to group
        key = labelTo.replace('group_', '');
        group = true;
    } else if(label_value.lastIndexOf("group_", 0) === 0){ //sent to group,
        key = label_value.replace('group_', '');
        group = true;
    } else if(labelTo.lastIndexOf("group_", 0) === 0){ //sent by group, should not be possible but yeah anything can happen.
        group = true;
    }
    //alert("Debug label=" + label_value + " label_msg=" + label_msg + " labelTo=" + labelTo + " group=" + group + " key=" + key + " them=" + them + " self=" + self );
    /*
    Basically I seperated the sender of the message (label_msg) from the contact[key].
    So we can still group by the key, but the messages in the chat have the right sender label.
    */
   console.log("appendMessage: for invite");
    //INVITE TO GROUP CODE
    
    if(message.lastIndexOf("/invite", 0) === 0 && message.length >= 61){
       var group_key = message.substring(8, 60).replace(/[^A-Za-z0-9\s!?]/g, ""); // regex priv keys ///^[V79e][1-9A-HJ-NP-Za-km-z]{50,51}$/g
       var group_label = message.substring(61, message.length).replace(/[^A-Za-z0-9\s!?]/g, ""); // regex whitelist only a-z, A-Z, 0-9

        if(group_label.length == 0)
            group_label = them + "_" + group_key.substring(0, 5);

        if(type = "R"){ //If message contains /invite privkey label, insert HTML
            message = 'You\'ve been invited to a group named \'' + group_label + '\'! <a id="add-new-send-address" class="btn btn-danger btn-cons" onclick="//bridge.joinGroupChat(\'' + group_key + '\',\'group_' + group_label + '\')"><i class="fa fa-plus"></i>Join group</a>';
        } else if(type = "S"){
            message = "An invite for group " + group_label + " has been sent.";
        }
    }
    


    var contact = contacts[key];
    var isNewContact = false;
    if(contacts[key] == undefined){
        contacts[key] = {},
        contact = contacts[key],
        contact.key = key,
        contact.label = key,
        contact.group = group,
        contact.avatar = (false ? '' : 'qrc:///images/default'), // TODO: Avatars!!
        contact.messages  = new Array();
        isNewContact = true;
    }

    if($.grep(contact.messages, function(a){ return a.id == id; }).length == 0)
    {     
        if(message.type=="R"&& message.read==false) //not a duplicate, received message and not read => addnotification
            addNotificationCount(key, 1);
    
        contact.messages.push({id:id, them: them, self: self, label_msg: label_msg, group: group, message: message, type: type, sent: sent_date, received: received_date, read: read}); 
        if(current_key == key) //on send of our own message reload convo to add message.
            openConversation(key, false);
         
        if(isNewContact)
            appendContact(key, true); 
         
         if(type == "R" && read == 0)
            addNotificationCount(key, 1);
     }
}



function appendContact (key, newcontact) {
    var contact_el = $("#contact-"+key);
    var contact = contacts[key];
    var unread_count = $.grep(contact.messages, function(a){return a.type=="R"&&a.read==false}).length;
    var new_group = contact.messages[0].group;



    var contact_address = (new_group && contact.messages[0].type != "S") ? contact.messages[0].self : contact.messages[0].them;
    if(contact_el.length == 0) {
        //alert("[appendContact] key=" + key + " address=" + contact.messages[0].them + " self=" + contact.messages[0].self + " group=" + contact.messages[0].group + " type=" + contact.messages[0].type);
        var contact_html =
            "<li id='contact-"+ key +"' class='contact' data-title='"+contact.label+"'>\
                <span class='contact-info'>\
                    <span class='contact-name'>"+contact.label+"</span>\
                    <span class='contact-address'>"+ contact_address + "</span>\
                </span>\
                <span class='contact-options'>\
                        <span class='message-notifications'>0</span>\ " + //"+(unread_count==0?' none':'')+"
                        "<span class='delete' onclick='deleteMessages(\""+key+"\")'><i class='fa fa-minus-circle'></i></span>\
                        " //<span class='favorite favorited'></span>\ //TODO: Favourites
             + "</span>"
             + "</li>";
        if(addressbook) {
                console.log("appending to book!");
                contact_book_list.append(contact_html);
                console.log("appended to book!");
                $("#contact-"+ prefix + key).find(".delete").hide();
         } else if(contact.group){ //if not group
            contact_group_list.append(contact_html);
         } else
            contact_list.append(contact_html);


         if(!new_group)
            contact_list.append(contact_html);
         else
            contact_group_list.append(contact_html);

        contact_el = $("#contact-"+key).on('click',
            function(e) {
                $(this).selected('li');
                if(addressbook)
                    appendContact(key, false);
                openConversation(key, true);


            }).on("mouseenter", tooltip);

        contact_el.find(".delete").on("click", function(e) {e.stopPropagation()});

    }

    var received_message = contact.messages[contact.messages.length-1];


    if(newcontact ){ //|| contact_el.hasClass("selected")
        openConversation(key, false);
    }
}

function addNotificationCount(key, unread_count){
    var notifications_contact = $("#contact-"+key).find(".message-notifications");
    var notifications_contact_value = notifications_contact.html();
    notifications_contact.text(parseInt(notifications_contact_value) + parseInt(unread_count));
    console.log("[addNotificationCount] contact! value=" + notifications_contact_value + " unread_count=" + unread_count);
    notifications_contact.show();
    
    $(".user-notifications").show();
    console.log("[addNotificationCount] menu! value = " + parseInt($("#message-count").text()) + parseInt(1));
    $("#message-count").text(parseInt($("#message-count").text())+1);
    $("#message-count").show();
}

function removeNotificationCount(key){

    //NOTIFICATION IN CONTACT LIST
    var contact = contacts[key];
    var notifications_contact = $("#contact-"+key).find(".message-notifications");
    var notifications_contact_value = notifications_contact.html();

    notifications_contact.text(0);
    notifications_contact.hide();

    //NOTIFICATION IN MENU
    var notifications_menu = $("#message-count"),
        notifications_menu_value = parseInt(notifications_menu.text())-notifications_contact_value;

    notifications_menu.text(notifications_menu_value);

    if(notifications_menu_value==0)
        notifications_menu.hide();
    else
        notifications_menu.show();

    //mark messages as read in JS
    if(contact.messages.length == 0){
        console.log("No messages.");
        return 0;
    }
        
    console.log("removeNotificationCount triggered..")
    for(var i=contact.messages.length-1; i >= 0; i--){
       console.log("#amount of messages=" + i);
        
       if(!contact.messages[i].read){
            console.log("[" + i + "] message");
            bridge.markMessageAsRead(contact.messages[i].id);
            contact.messages[i].read = true;
        } else {
            //not group message, = received normal message and was read.. 
            console.log("All messages are now marked as read. key=" + key);
            break;
        }
        
    }


}

//OpenConversation is split off to allow for opening conversation automatically without removing notification.
function openConversation(key, click) {
            current_key = key;
            //TODO: detect wether user is typing, if so do not reload page to other conversation..
            //$(this).addClass("selected").siblings("li").removeClass("selected");
            var discussion = $(".contact-discussion ul");
            var contact = contacts[key];

            discussion.html("");

            contact.messages.sort(function (a, b) {
              return a.received - b.received;
            });

            var is_group = contact.messages[0].group;
            if(!is_group)
                $("#contact-list").addClass("in-conversation");
            else
                $("#contact-group-list").addClass("in-conversation");


            var message;
            var bSentMessage = false;

            if(click)
                removeNotificationCount(contact.key);

            for(var i=0;i<contact.messages.length;i++)
            {
                message = contact.messages[i];
               
					//<span class='info'>\
                        //<img src='"+contact.avatar+"' />\
                    //</span>\
					
                //title='"+(message.type=='S'? message.self : message.them)+"' taken out below.. titles getting in the way..
                discussion.append(
                    "<li id='"+message.id+"' class='"+(message.type=='S'?'user-message':'other-message')+"' contact-key='"+contact.key+"'>\
                    <span class='message-content'>\
					    <span class='user-name'>"
                            +(message.label_msg)+"\
                        </span>\
                        <span class='timestamp'>"+(new Date(message.received*1000).toLocaleString())+"</span>\
						<span class='delete' onclick='deleteMessages(\""+contact.key+"\", \""+message.id+"\");'><i class='fa fa-minus-circle'></i></span>\
						<span class='message-text'>"+micromarkdown.parse(message.message)+"</span>\
                    </span></li>");

                if(message.group && message.type == 'S' && !bSentMessage){ //Check if group message, if we sent a message in the past and make sure we assigned the same sender address to the chat.
                        bSentMessage = true;
                        $("#message-from-address").val(message.self);
                        $("#message-to-address").val(message.them);
                }


            }


            messagesScroller.refresh();

            messagesScroller.scrollTo(0, messagesScroller.maxScrollY, 600);

            var scrollerBottom = function() {

                var max = messagesScroller.maxScrollY;

                messagesScroller.refresh();

                if(max != messagesScroller.maxScrollY)
                    messagesScroller.scrollTo(0, messagesScroller.maxScrollY, 100);
            };

            setTimeout(scrollerBottom, 700);
            setTimeout(scrollerBottom, 1000);
            setTimeout(scrollerBottom, 1300);
            setTimeout(scrollerBottom, 1600);
            setTimeout(scrollerBottom, 1900);
            setTimeout(scrollerBottom, 2200);
            setTimeout(scrollerBottom, 2500);
            setTimeout(scrollerBottom, 5000);

            //discussion.children("[title]").on("mouseenter", tooltip);

            if(!bSentMessage){
                if(!message.group){ //normal procedure
                    $("#message-from-address").val(message.self);
                    $("#message-to-address").val(message.them); //them
                } else if(message.type == "R") { //if it's a group, and no messages were sent from it yet, then we have not sent a message to it.
                    $("#message-to-address").val(message.self);
                }
            }

        }

function newConversation() {
	$('#new-contact-modal').modal('hide');
    $("#message-to-address").val($("#new-contact-address").val());
    $("#message-text").focus();
    $(".contact-discussion ul").html("<li id='remove-on-send'>Starting Conversation with "+$("#new-contact-address").val()+" - "+$("#new-contact-name").val()+"</li>");

    $("#new-contact-address").val("");
    $("#new-contact-name").val("");
    $("#new-contact-pubkey").val("");
    $("#contact-list ul li").removeClass("selected");
    $("#contact-list").addClass("in-conversation");

    $("#contact-group-list ul li").removeClass("selected");
    $("#contact-group-list").addClass("in-conversation");
}


function sendMessage() {
    $("#remove-on-send").remove();
    if(bridge.sendMessage($("#message-to-address").val(), $("#message-text").val(), $("#message-from-address").val()))
        $("#message-text").val("");
}

function deleteMessages(key, messageid) {
    var contact = contacts[key];

    if(!confirm("Are you sure you want to delete " + (messageid == undefined ? 'these messages?' : 'this message?')))
        return false;

    var message_count = $("#message-count"),
        message_count_val = parseInt(message_count.text());
        
    removeNotificationCount(key);
    
    if(messageid == undefined)
        current_key = "";
        
    for(var i=0;i<contact.messages.length;i++) {

        if(messageid == undefined) { //delete all messages of key
            console.log("Deleting all messages..");
            if(bridge.deleteMessage(contact.messages[i].id))
            {
                $("#"+contact.messages[i].id).remove(); 
                contact.messages.splice(i, 1);
                i--;
            } else{
                console.log("returning false");
                return false;
            }
        } else if(contact.messages[i].id == messageid){ //delete a specific message ID.
            if(bridge.deleteMessage(messageid)) {
                $("#"+messageid).remove();
                console.log("removing message id=" + messageid);
                contact.messages.splice(i, 1);
                i--;
                break; 
            } else {
                console.log("returning false");
                return false;
            }
        }
    }

    if(contact.messages.length == 0)
    {
        $("#contact-"+ key).remove();
        $("#contact-list").removeClass("in-conversation");
        $("#contact-group-list").removeClass("in-conversation");
    }
    else {
        iscrollReload();
        openConversation(key, false);
    }
    
    
}

function signMessage() {
    //Clear any signature to avoid confusion with a previous signature being displayed with errors relating to the current values
    $('#sign-signature').val("");
    var address, message, error, signature = "";
    address = $('#sign-address').val().trim();
    message = $('#sign-message').val().trim();

    var result = bridge.signMessage(address, message);

    error = result.error_msg;
    signature = result.signed_signature;

    if(error != "" )
    {
        $('#sign-result').removeClass('green');
        $('#sign-result').addClass('red');
        $('#sign-result').html(error);
        return false;
    }
    else
    {
        $('#sign-signature').val(result.signed_signature);
        $('#sign-result').removeClass('red');
        $('#sign-result').addClass('green');
        $('#sign-result').html("Message signed successfully");
    }
}

function verifyMessage() {

    var address, message, error, signature = "";
    address = $('#verify-address').val().trim();
    message = $('#verify-message').val().trim();
    signature = $('#verify-signature').val().trim();

    var result = bridge.verifyMessage(address, message, signature);

    error = result.error_msg;

    if(error != "" )
    {
        $('#verify-result').removeClass('green');
        $('#verify-result').addClass('red');
        $('#verify-result').html(error);
        return false;
    }
    else
    {
        $('#verify-result').removeClass('red');
        $('#verify-result').addClass('green');
        $('#verify-result').html("Message verified successfully");
    }
}

var contactScroll = new IScroll('#contact-list', {
    mouseWheel: true,
    scrollbars: true,
    lockDirection: true,
    interactiveScrollbars: true,
    scrollbars: 'custom',
    scrollY: true,
    scrollX: false,
    preventDefaultException:{ tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|P|SPAN)$/ }
});

var messagesScroller = new IScroll('.contact-discussion', {
   mouseWheel: true,
   scrollbars: true,
   lockDirection: true,
   interactiveScrollbars: true,
   scrollbars: 'custom',
   scrollY: true,
   scrollX: false,
   preventDefaultException:{ tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|P|SPAN)$/ }
});


function iscrollReload(scroll) {
    contactScroll.refresh();
    messagesScroller.refresh();

    if(scroll == true)
        messagesScroller.scrollTo(0, messagesScroller.maxScrollY, 0);
}


function editorCommand(text, endText) {

        var range, start, end, txtLen, scrollTop;

        var editor = $("#message-text")[0];

        scrollTop = editor.scrollTop;
        editor.focus();


        if (typeof editor.selectionStart !== 'undefined')
        {
                start  = editor.selectionStart;
                end    = editor.selectionEnd;
                txtLen = text.length;

                if(endText)
                        text += editor.value.substring(start, end) + endText;

                editor.value = editor.value.substring(0, start) + text + editor.value.substring(end, editor.value.length);

                editor.selectionStart = (start + text.length) - (endText ? endText.length : 0);
                editor.selectionEnd = editor.selectionStart;
        }
        else
            editor.value += text + endText;

        editor.scrollTop = scrollTop;
        editor.focus();
};


var chainDataPage = {
    anonOutputs: {},
    init: function() {
        $("#show-own-outputs,#show-all-outputs").on("click", function(e) {
            $(e.target).hide().siblings('a').show();
        });

        $("#show-own-outputs").on("click", function() {
            $("#chaindata .footable tbody tr>td:first-child+td").each(function() {
                if($(this).text()==0)
                    $(this).parents("tr").hide();
            });
        });

        $("#show-all-outputs").on("click", function() {
            $("#chaindata .footable tbody tr:hidden").show();
        });
    },
    updateAnonOutputs: function() {
        chainDataPage.anonOutputs = bridge.listAnonOutputs();
        var tbody = $('#chaindata .footable tbody');
        tbody.html('');

        for (value in chainDataPage.anonOutputs) {
            var anonOutput = chainDataPage.anonOutputs[value];

            tbody.append('<tr>\
                    <td data-value='+value+'>'+anonOutput.value_s+'</td>\
                    <td>' +  anonOutput.owned_outputs
                          + (anonOutput.owned_outputs == anonOutput.owned_mature
                            ? ''
                            : ' (<b>' + anonOutput.owned_mature + '</b>)') + '</td>\
                    <td>'+anonOutput.system_outputs + ' (' + anonOutput.system_mature + ')</td>\
                    <td>'+anonOutput.system_spends  +'</td>\
                    <td>'+anonOutput.least_depth    +'</td>\
                </tr>');
        }

        $('#chaindata .footable').trigger('footable_initialize');
    }
}
var blockExplorerPage =
{
    blockHeader: {},
    findBlock: function(searchID) {

        if(searchID == "" || searchID == null)
        {
            blockExplorerPage.updateLatestBlocks();
        }
        else
        {
            blockExplorerPage.foundBlock = bridge.findBlock(searchID);

            if(blockExplorerPage.foundBlock.error_msg != '' )
            {
                $('#latest-blocks-table  > tbody').html('');
                $("#block-txs-table > tbody").html('');
                $("#block-txs-table").addClass("none");
                alert(blockExplorerPage.foundBlock.error_msg);
                return false;
            }

            var tbody = $('#latest-blocks-table  > tbody');
            tbody.html('');
            var txnTable = $('#block-txs-table  > tbody');
            txnTable.html('');
            $("#block-txs-table").addClass("none");

            tbody.append('<tr data-value='+blockExplorerPage.foundBlock.block_hash+'>\
                                     <td>'+blockExplorerPage.foundBlock.block_hash+'</td>\
                                     <td>'+blockExplorerPage.foundBlock.block_height+'</td>\
                                     <td>'+blockExplorerPage.foundBlock.block_timestamp+'</td>\
                                     <td>'+blockExplorerPage.foundBlock.block_transactions+'</td>\
                        </tr>');
            blockExplorerPage.prepareBlockTable();
        }
        // Keeping this just in case - Will remove if not used
    },
    updateLatestBlocks: function()
    {
        blockExplorerPage.latestBlocks = bridge.listLatestBlocks();
        var txnTable = $('#block-txs-table  > tbody');
        txnTable.html('');
        $("#block-txs-table").addClass("none");
        var tbody = $('#latest-blocks-table  > tbody');
        tbody.html('');
        for (value in blockExplorerPage.latestBlocks) {

            var latestBlock = blockExplorerPage.latestBlocks[value];

            tbody.append('<tr data-value='+latestBlock.block_hash+'>\
                         <td>' +  latestBlock.block_hash   + '</td>\
                         <td>' +  latestBlock.block_height + '</td>\
                         <td>' +  latestBlock.block_timestamp   + '</td>\
                         <td>' +  latestBlock.block_transactions+ '</td>\
                         </tr>');
        }
        blockExplorerPage.prepareBlockTable();
    },
    prepareBlockTable: function()
    {
        $("#latest-blocks-table  > tbody tr")
            .selection()
            .on('click', function()
                {
                    var blkHash = $(this).attr("data-value").trim();
                    blockExplorerPage.blkTxns = bridge.listTransactionsForBlock(blkHash);
                    var txnTable = $('#block-txs-table  > tbody');
                    txnTable.html('');
                    for (value in blockExplorerPage.blkTxns)
                    {
                        var blkTx = blockExplorerPage.blkTxns[value];

                        txnTable.append('<tr data-value='+blkTx.transaction_hash+'>\
                                    <td>' +  blkTx.transaction_hash  + '</td>\
                                    <td>' +  blkTx.transaction_value + '</td>\
                                    </tr>');
                    }

                    $("#block-txs-table").removeClass("none");
                    $("#block-txs-table > tbody tr")
                        .selection()

                        .on("dblclick", function(e) {

							$('#blkexp-txn-modal').appendTo('body').modal('show');
                            //$(this).leanModal({ top : 10, overlay : 0.5, closeButton: "#blkexp-txn-modal .modal_close" });

                            selectedTxn = bridge.txnDetails(blkHash , $(this).attr("data-value").trim());

                            if(selectedTxn.error_msg == '')
                            {
                                $("#txn-hash").html(selectedTxn.transaction_hash);
                                $("#txn-size").html(selectedTxn.transaction_size);
                                $("#txn-rcvtime").html(selectedTxn.transaction_rcv_time);
                                $("#txn-minetime").html(selectedTxn.transaction_mined_time);
                                $("#txn-blkhash").html(selectedTxn.transaction_block_hash);
                                $("#txn-reward").html(selectedTxn.transaction_reward);
                                $("#txn-confirmations").html(selectedTxn.transaction_confirmations);
                                $("#txn-value").html(selectedTxn.transaction_value);
                                $("#error-msg").html(selectedTxn.error_msg);

                                if(selectedTxn.transaction_reward > 0)
                                {
                                    $("#lbl-reward-or-fee").html('<strong>Reward</strong>');
                                    $("#txn-reward").html(selectedTxn.transaction_reward);
                                }
                                else
                                {
                                    $("#lbl-reward-or-fee").html('<strong>Fee</strong>');
                                    $("#txn-reward").html(selectedTxn.transaction_reward * -1);
                                }
                            }

                            var txnInputs = $('#txn-detail-inputs > tbody');
                            txnInputs.html('');
                            for (value in selectedTxn.transaction_inputs) {

                              var txnInput = selectedTxn.transaction_inputs[value];

                              txnInputs.append('<tr data-value='+ txnInput.input_source_address+'>\
                                                   <td>' + txnInput.input_source_address  + '</td>\
                                                   <td>' + txnInput.input_value + '</td>\
                                                </tr>');
                            }

                            var txnOutputs = $('#txn-detail-outputs > tbody');
                            txnOutputs.html('');

                            for (value in selectedTxn.transaction_outputs) {

                              var txnOutput = selectedTxn.transaction_outputs[value];

                              txnOutputs.append('<tr data-value='+ txnOutput.output_source_address+'>\
                                                 <td>' +  txnOutput.output_source_address  + '</td>\
                                                 <td>' +  txnOutput.output_value + '</td>\
                                            </tr>');
                            }

                            $(this).click().off('click').selection();
                        }).find(".editable")
                })
            .on("dblclick", function(e)
            {
				$('#block-info-modal').appendTo('body').modal('show');

                //$(this).leanModal({ top : 10, overlay : 0.5, closeButton: "#block-info-modal .modal_close" });

                selectedBlock = bridge.blockDetails($(this).attr("data-value").trim()) ;

                if(selectedBlock)
                {
                     $("#blk-hash").html(selectedBlock.block_hash);
                     $("#blk-numtx").html(selectedBlock.block_transactions);
                     $("#blk-height").html(selectedBlock.block_height);
                     $("#blk-type").html(selectedBlock.block_type);
                     $("#blk-reward").html(selectedBlock.block_reward);
                     $("#blk-timestamp").html(selectedBlock.block_timestamp);
                     $("#blk-merkleroot").html(selectedBlock.block_merkle_root);
                     $("#blk-prevblock").html(selectedBlock.block_prev_block);
                     $("#blk-nextblock").html(selectedBlock.block_next_block);
                     $("#blk-difficulty").html(selectedBlock.block_difficulty);
                     $("#blk-bits").html(selectedBlock.block_bits);
                     $("#blk-size").html(selectedBlock.block_size);
                     $("#blk-version").html(selectedBlock.block_version);
                     $("#blk-nonce").html(selectedBlock.block_nonce);
                }

                // $("#block-info").html();
                $(this).click()
                  .off('click')
                  .selection();
            }).find(".editable")
    }
}

var keyManagementPage = {
    init: function() {
        setupWizard('new-key-wizard');
        setupWizard('recover-key-wizard');
        setupWizard('open-key-wizard');
    },

    newMnemonic: function () {
        var result = bridge.getNewMnemonic( $("#new-account-passphrase").val(), $("#new-account-language").val() );
        var error  = result.error_msg;
        var mnemonic = result.mnemonic;

        if(error != "")
        {
            alert(error);
        }
        else
        {
            $("#new-key-mnemonic").val(mnemonic);
        }
    },
    compareMnemonics: function () {
        var original = $("#new-key-mnemonic").val().trim();
        var typed    = $("#validate-key-mnemonic").val().trim();

        if (original == typed) {
            $("#validate-key-mnemonic").removeClass("red");
            $("#validate-key-mnemonic").val("");
            return true;
        }
        else
        {
            $("#validate-key-mnemonic").addClass("red");
            alert("The mnemonic you provided does not match the mnemonic that was generated eariler - please go back and check to make sure you've copied it down correctly.")
            return false;
        }
    },
    gotoPage: function(page) {
        $("#navitems a[href='#" + page + "']").trigger('click');
    },
    prepareAccountTable: function()
    {
        //asd
        $("#extkey-account-table  > tbody tr")
            .selection()
            .on('click', function()
            {
                var otherTableRows = $('#extkey-table > tbody > tr');
                otherTableRows.removeClass("selected");
            })
    },
    updateAccountList: function() {
        keyManagementPage.accountList = bridge.extKeyAccList();

        var tbody = $('#extkey-account-table  > tbody');
        tbody.html('');
        for (value in keyManagementPage.accountList) {

            var acc = keyManagementPage.accountList[value];

            tbody.append('<tr data-value='+acc.id+' active-flag=' + acc.active + '>\
                         <td>' +  acc.id   + '</td>\
                         <td>' +  acc.label + '</td>\
                         <td>' +  acc.created_at + '</td>\
                         <td class="center-margin"><i style="font-size: 1.2em; margin: auto;" ' + ((acc.active == 'true') ? 'class="fa fa-circle green-circle"' : 'class="fa fa-circle red-circle"') + ' ></i></td>\
                         <td style="font-size: 1em; margin-bottom: 6px;">' +  ((acc.default_account != undefined ? "<i class='center fa fa-check'></i>" : "")) + '</td>\
                         </tr>');
        }
        keyManagementPage.prepareAccountTable();
    },
    prepareKeyTable: function()
    {
        //asd
        $("#extkey-table  > tbody tr")
            .selection()
            .on('click', function()
            {
                var otherTableRows = $('#extkey-account-table > tbody > tr');
                otherTableRows.removeClass("selected");
            })
    },
    updateKeyList: function() {
        keyManagementPage.keyList = bridge.extKeyList();

        var tbody = $('#extkey-table  > tbody');
        tbody.html('');
        for (value in keyManagementPage.keyList) {

            var key = keyManagementPage.keyList[value];
            tbody.append('<tr data-value='+key.id+' active-flag=' + key.active + '>\
                         <td>' +  key.id   + '</td>\
                         <td>' +  key.label + '</td>\
                         <td>' +  key.path + '</td>\
                         <td><i style="font-size: 1.2em; margin: auto;" ' + ((key.active == 'true') ? 'class="fa fa-circle green-circle"' : 'class="fa fa-circle red-circle"') + ' ></i></td>\
                         <td style="font-size: 1em; margin-bottom: 6px;">' +  ((key.current_master != undefined ? "<i class='center fa fa-check'></i>" : "")) + '</td>\
                         </tr>');
        }
        keyManagementPage.prepareKeyTable();
    },
    newKey: function()
    {
        result = bridge.importFromMnemonic($('#new-key-mnemonic').val().trim(),
                                           $('#new-account-passphrase').val().trim(),
                                           $('#new-account-label').val().trim(),
                                           $('#new-account-bip44').prop("checked"));

        if(result.error_msg != '' )
        {
            alert(result.error_msg);
            return false;
        }
    },
    recoverKey: function()
    {
        result = bridge.importFromMnemonic($("#recover-key-mnemonic").val().trim(),
                                           $("#recover-passphrase").val().trim(),
                                           $("#recover-account-label").val().trim(),
                                           $("#recover-bip44").prop("checked"),
                                           1443657600);

        if(result.error_msg != '' )
        {
            alert(result.error_msg);
            return false;
        }
        else return true;
    },
    setMaster: function()
    {
        var keySelector = $("#extkey-table tr.selected");
        if( !keySelector.length )
        {
            alert("Please select a key to set it as master.");
            return false;
        }

        selected = $("#extkey-table tr.selected").attr("data-value").trim();
        if(selected != undefined && selected != "")
        {
            result = bridge.extKeySetMaster(selected);
            if(result.error_msg != '' )
            {
                alert(result.error_msg);
                return false;
            }
            else
            {
                keyManagementPage.updateKeyList();
            }
        }
        else
        {
            alert("Select a key from the table to set a Master.");
            return false;
        }
    },
    setDefault: function()
    {
        var accSelector = $("#extkey-account-table tr.selected");

        if( !accSelector.length )
        {
            alert("Please select an account to set it as default.");
            return false;
        }

        selected = $("#extkey-account-table tr.selected").attr("data-value").trim();
        if(selected != undefined && selected != "")
        {
            result = bridge.extKeySetDefault(selected);
            if(result.error_msg != '' )
            {
                alert(result.error_msg);
                return false;
            }
            else
            {
                keyManagementPage.updateAccountList();
            }
        }
        else
        {
            alert("Select an account from the table to set a default.");
            return false;
        }
    },
    changeActiveFlag: function()
    {
        var forAcc = false;

        //Check whats selected - if anything.
        var accSelector = $("#extkey-account-table tr.selected");
        var keySelector = $("#extkey-table tr.selected");
        if( !accSelector.length && !keySelector.length )
        {
            alert("Please select an account or key to change the active status.");
            return false;
        }

        if( accSelector.length )
        {
            selected = accSelector.attr("data-value").trim();
            active   = accSelector.attr("active-flag").trim();
            forAcc   = true;
        }
        else
        {
            selected = keySelector.attr("data-value").trim();
            active   = keySelector.attr("active-flag").trim();
        }

        if(selected != undefined && selected != "")
        {
            result = bridge.extKeySetActive(selected, active);
            if(result.error_msg != '' )
            {
                alert(result.error_msg);
                return false;
            }
            else
            {
                if(forAcc)
                {
                    keyManagementPage.updateAccountList();
                }
                else
                {
                    keyManagementPage.updateKeyList();
                }
            }
        }
        else
        {
            alert("Please select an account or key to change the active status.");
            return false;
        }
    }
}

function setupWizard(section) {

    var steps = $("#" + section + " > div");

    // I just did this to make using 's and "s easier in the below prepend and append.
    backbtnjs = '$("#key-options").show(); $("#wizards").hide();';
    fwdbtnjs  = 'gotoWizard("new-key-wizard", 1);';
    //$("#" + section).prepend("<div id='backWiz'  class='btn btn-default btn-cons wizardback' onclick='" + backbtnjs + "' >Back</div>")
    //$("#" + section).prepend("<div id='fwdWiz'   class='btn btn-default btn-cons wizardfwd'  onclick='" + fwdbtnjs  + "' >Next Step</div>")
    $("#" + section).prepend("<div id='backWiz' style='display:none;' class='btn btn-default btn-cons wizardback' onclick='" + backbtnjs + "' >Back</div>")
    $("#" + section).prepend("<div id='fwdWiz'  style='display:none;' class='btn btn-default btn-cons wizardfwd'  onclick='" + fwdbtnjs  + "' >Next Step</div>")
    steps.each(function (i) {
            $(this).addClass("step" + i)
            $(this).hide();
			$("#backWiz").hide();
        }
    );
}

function gotoWizard(section, step, runStepJS) {
    // Hide all wizards
    var sections = $("#wizards > div");

    // Run validation on the wizard step - any error messages can be set there as well
    // TODO:  enhance these wizard functions to cater for validation fields etc.
    validateJS = $("#" + section + " .step" + (step - 1) ).attr("validateJS");

    // We check runStepJS because we must only validate when moving forward in the wizard
    if(runStepJS && validateJS != undefined)
    {
        var valid = eval(validateJS);
        if(!valid) {return false;}
    }

    sections.each(function (i) {
        $(this).hide();
    })

    var steps = $("#" + section + " > div[class^=step]");
    var gotoStep = step;
    if (gotoStep == null) { gotoStep = 0;
	}

    if(gotoStep == 0) {
        $("#" + section + " #backWiz").attr( 'onclick', '$(".wizardback").hide(); $("#wizards").show();' )
        $("#" + section + " #fwdWiz").attr( 'onclick', '$(".wizardback").hide(); gotoWizard("' + section + '", 1, true);' )
		// $("#" + section + " #fwdWiz").attr( 'onclick', '$(".wizardback").show(); gotoWizard("' + section + '", 1, true);' )
		$("#backWiz").hide();
    }
    else
    {
        $("#" + section + " #backWiz").attr( 'onclick', 'gotoWizard("' + section + '", ' + (gotoStep - 1) + ' , false);' )
        $("#" + section + " #fwdWiz").attr( 'onclick',  'gotoWizard("' + section + '", ' + (gotoStep + 1) + ' , true);' )
    }

    // If we're at the end of the wizard then change the forward button to do whatever
    endWiz = $("#" + section + " .step" + (step) ).attr("endWiz");
    if(endWiz != undefined && endWiz != "")
    {
      $("#" + section + " #fwdWiz").attr( 'onclick',  endWiz );
    }

    // Hide all wizard steps - if we want cross wizards/steps etc.
    steps.each(function (i) {
        $(this).hide();
    });

    //Show the correct section and the step.
    $("#" + section).show();
    stepJS = $("#" + section + " .step" + gotoStep ).attr("stepJS");

    // Run the JS we want for this step we're about to start -
    if(runStepJS && stepJS != undefined)
    {
        eval(stepJS);
    }
    $("#" + section + " .step" + gotoStep ).fadeIn(0);
	//$("#" + section + " .step" + gotoStep ).fadeIn(500);
}
