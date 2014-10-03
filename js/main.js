// Shadow HTML5 main.js
$("[href='#qrcode-modal']").leanModal({top : 10, overlay : 0.5, closeButton: "#qrcode-modal .modal_close"});
$("#start-conversation").leanModal({top : 200, overlay : 0.5, closeButton: "#new-contact-modal .modal_close"});

var qrcode = new QRCode("qrcode", {colorDark:'#E51C39', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H, width: 220, height: 220,});

function showQRCode(address, label) {

    if(address!=undefined)
        $("#qraddress").val(address);

    if(label!=undefined)
        $("#qrlabel").val(label);

    qrcode.clear();

    var textarea = $("#qrcode-data"),
        data = "shadowcoin:";

    data += $("#qraddress").val()
          + "?label="     + $("#qrlabel").val()
          + "&narration=" + $("#qrnarration").val()
          + "&amount=" + unit.parse($("#qramount").val(), $("#qrunit").val());

    textarea.text(data);

    qrcode.makeCode(data);
}

var breakpoint = 906, // 56.625em
    footer = $("#footer");

function resizeFooter() {
    $(".ui-buttons").each(function() {
        $(this).css("margin-top", Math.max($("body").height() - ($(this).offset().top + $(this).height()) -65 + parseInt($(this).css("margin-top")), 10) + "px");
    });

    footer.height(Math.max($("body").height() - footer.offset().top, 35) + "px");
};

function updateValue(element) {
    var curhtml = element.html(),
        value   = (element.parent("td").attr("data-label") != undefined ? element.parent("td").attr("data-label") :
                  (element.parent("td").attr("data-value") != undefined ? element.parent("td").attr("data-value") :
                  (element             .attr("data-label") != undefined ? element             .attr("data-label") :
                  (element             .attr("data-value") != undefined ? element             .attr("data-value") : element.text()))));

    var address = element.parents(".selected").find(".address");

    address = address.attr("data-value") ? address.attr("data-value") : address.text();

    element.html('<input class="newval" type="text" onchange="bridge.updateAddressLabel(\'' + address + '\', this.value);" value="' + value + '" size=60 />');

    $(".newval").focus();
    $(".newval").on("contextmenu", function(e) {
        e.stopPropagation();
    });
    $(".newval").keyup(function (event) {
        if (event.keyCode == 13)
            element.html(curhtml.replace(value, $(".newval").val().trim()))
    });

    $(document).on('click', function () {
        element.html(curhtml.replace(value, $(".newval").val().trim()));
        $(document).off('click');
    });
}

$(function() {
    // Menu icon onclick
    $("#navlink").on("click", function() {
        $("#layout").toggleClass('active');
    });


    $('.footable').footable({breakpoints:{phone:480, tablet:700}, delay: 50})
    .on({'footable_breakpoint': function() {
            //$('table').trigger('footable_expand_first_row'); uncomment if we want the first row to auto-expand
        },
        'footable_redrawn':  resizeFooter,
        'footable_resized':  resizeFooter,
        'footable_filtered': resizeFooter,
        'footable_row_expanded': function(event) {
        var editable = $(this).find(".editable");

        editable.off("dblclick");
        editable.on("dblclick", function (event) {
           event.stopPropagation();
           updateValue($(this));
        }).attr("title", "Double click to edit").on('mouseenter', tooltip);
    }});

    $(".editable").on("dblclick", function (event) {
       event.stopPropagation();
       updateValue($(this));
    }).attr("title", "Double click to edit %column%");

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

    //connectSlots();

    // Change page handler
    $("#navitems a").on("click", function(event) {
        var toPage = $($(this).attr('href'));

        $("#navitems li").removeClass("selected");
        $(this).parent("li").addClass("selected");

        if(toPage.length == 1 && toPage[0].tagName.toLowerCase() == "article") {
            event.preventDefault();
            $(window).scrollTop(0);
            $("article").hide();
            toPage.show();
            $(document).resize();
        }
    });

    if(shadowgui)
        $("[href='#about']").on("click", shadowgui.aboutClicked);

    overviewPage.init();
    sendPageInit();
    receivePageInit();
    transactionPageInit();
    addressBookInit();
    shadowchatInit();

    // Tooltip
    $('[title]').on('mouseenter', tooltip);

    $(".footable tr").on('click', function() {
        $(this).addClass("selected").siblings("tr").removeClass("selected");
    });
});

function tooltip (event) {
    var target  = false,
        tooltip = false,
        tip     = false;

    if($("input, textarea").is(':focus') || $('.iw-contextMenu').css('display') == 'inline-block')
        return;

    event.stopPropagation();

    $("#tooltip").click();

    target  = $(this);
    tip     = target.attr('title');
    tooltip = $('<div id="tooltip"></div>');

    if(!tip || tip == '')
        return false;

    tip = tip.replace(/&#013;|\n/g, '<br />')
    .replace(/%column%/g, function() {
        return $(target.parents("table").find("thead tr th")[target[0].cellIndex]).text();
    }).replace(/%([.\w\-]+),([.\w\-]+)%/g, function($0, $1, $2){
        return target.children($1).attr($2);
    }).replace(/%([.\w\-]+)%/g, function($0, $1){
        return target.children($1).text();
    });

    target.removeAttr('title');
    tooltip.css('opacity', 0)
           .html(tip)
           .appendTo('body');

    if(target.css('cursor') != "pointer" && target.prop("tagName") != "A")
        target.css('cursor', 'help');

    var init_tooltip = function() {
        if($(window).width() < tooltip.outerWidth() * 1.5)
            tooltip.css('max-width', $(window).width() / 2);
        else
            tooltip.css('max-width', 340);

        var pos_left = target.offset().left + (target.outerWidth() / 2) - (tooltip.outerWidth() / 2),
            pos_top  = target.offset().top - tooltip.outerHeight() - 20;

        if(pos_left < 0)
        {
            pos_left = target.offset().left + target.outerWidth() / 2 - 20;
            tooltip.addClass('left');
        }
        else
            tooltip.removeClass('left');

        if(pos_left + tooltip.outerWidth() > $(document).width())
        {
            pos_left = target.offset().left - tooltip.outerWidth() + target.outerWidth() / 2 + 20;
            tooltip.addClass('right');
        }
        else
            tooltip.removeClass('right');

        if(pos_left + target.outerWidth() > $(document).width())
        {
            pos_left = event.pageX;
            tooltip.removeClass('left right');
        }

        if(pos_top < 0)
        {
            var pos_top = target.offset().top + target.outerHeight();
            tooltip.addClass('top');
        }
        else
            tooltip.removeClass('top');

        tooltip.css({left: pos_left, top: pos_top})
               .animate({top: '+=10', opacity: 1}, 100);
    };

    init_tooltip();
    $(window).resize(init_tooltip);

    var remove_tooltip = function()
    {
        target.attr('title', tip);

        tooltip.animate({top: '-=10', opacity: 0}, 100, function() {
            $(this).remove();
        });
    };

    target.on('mouseleave', remove_tooltip);
    target.on('contextmenu', remove_tooltip);
    tooltip.on('click', remove_tooltip);
}


function connectSlots() {
    bridge.emitPaste.connect(this, pasteValue);

    bridge.emitTransactions.connect(this, appendTransactions);
    bridge.emitAddresses.connect(this, appendAddresses);
    bridge.emitMessages.connect(this, appendMessages);
    bridge.emitMessage.connect(this,  appendMessage);

    bridge.emitCoinControlUpdate.connect(this, updateCoinControlInfo);

    bridge.emitAddressBookReturn.connect(this, addressBookReturn);

    shadowgui.emitReceipient.connect(this, addRecipientDetail);
    shadowgui.emitAlert.connect(this, newAlert);

    optionsModel.displayUnitChanged.connect(unit, "setType");
    optionsModel.reserveBalanceChanged.connect(overviewPage, "updateReserved");
    walletModel.balanceChanged.connect(overviewPage, "updateBalance");

    $("#version").text("Shadow " + shadowgui.getVersion().split('-')[0]);
    //void transactionFeeChanged(qint64);
    //void coinControlFeaturesChanged(bool);
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
    console.log(value);
}

function newAlert(alert) {
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
        value = parseInt(el   == undefined ? value     : (el.data('value') == undefined ? el.val() : el.data('value')));

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
        this.reserved = $("#reserved"),
        this.stake = $("#stake"),
        this.unconfirmed = $("#unconfirmed"),
        this.immature = $("#immature"),
        this.total = $("#total");

        // Announcement feed
        $.ajax({
            url:"https://ajax.googleapis.com/ajax/services/feed/load?v=2.0&q=http://shadowhangout.com/category/18.rss",
            dataType: 'jsonp'
        }).success(function(rss) {
            rss.responseData.feed.entries = rss.responseData.feed.entries.sort(function(a,b){
                return new Date(b.publishedDate) - new Date(a.publishedDate);
            });
            for(i=0;i<rss.responseData.feed.entries.length;i++) {
                $('#announcements').append("<h4><a href='" + rss.responseData.feed.entries[i].link  + "'>" + rss.responseData.feed.entries[i].title + "</a></h4>"
                                         + "<span>"
                                             +      new Date(rss.responseData.feed.entries[i].publishedDate).toDateString()
                                         + "</span>");
            }
        });

        var menu = [{
                name: 'Backup&nbsp;Wallet...',
                fa: 'fa-save red fa-fw',
                fun: function () {
                    shadowgui.backupWallet();
                }
                }, /*
                {
                    name: 'Export...',
                    img: 'icons/editcopy.png',
                    fun: function () {
                        copy('#addressbook .footable .selected .label');
                    }
                }, */
                {
                    name: 'Sign&nbsp;Message...',
                    fa: 'fa-pencil-square-o red fa-fw',
                    fun: function () {
                        shadowgui.gotoSignMessageTab()
                    }
                },
                {
                    name: 'Verify&nbsp;Message...',
                    fa: 'fa-check red fa-fw',
                    fun: function () {
                        shadowgui.gotoVerifyMessageTab()
                    }
                },
                {
                    name: 'Exit',
                    fa: 'fa-times red fa-fw',
                    fun: function () {
                        shadowgui.close();
                    }
                }];

         $('#file').contextMenu(menu, {onOpen:function(data,e){openContextMenu(data.menu);}, onClose:function(data,e){data.menu.isOpen = 0;}, triggerOn: 'click', displayAround: 'trigger', position: 'bottom', mouseClick: 'left', sizeStyle: 'content'});

         menu = [{
                     name: 'Encrypt&nbsp;Wallet...',
                     fa: 'fa-lock red fa-fw',
                     fun: function () {
                        shadowgui.encryptWallet(true);
                     }
                 },
                 {
                     name: 'Change&nbsp;Passphrase...',
                     fa: 'fa-key red fa-fw',
                     fun: function () {
                        shadowgui.changePassphrase()
                     }
                 },
                 {
                     name: '(Un)Lock&nbsp;Wallet...',
                     fa: 'fa-unlock red pad fa-fw',
                     fun: function () {
                        shadowgui.toggleLock()
                     }
                 },
                 {
                     name: 'Options',
                     fa: 'fa-wrench red fa-fw',
                     fun: function () {
                        shadowgui.optionsClicked();
                     }
                 }];

         $('#settings').contextMenu(menu, {onOpen:function(data,e){openContextMenu(data.menu);}, onClose:function(data,e){data.menu.isOpen = 0;}, triggerOn: 'click', displayAround: 'trigger', position: 'bottom', mouseClick: 'left', sizeStyle: 'content'});

         menu = [{
                     name: 'Debug&nbsp;Window...',
                     fa: 'fa-bug red fa-fw',
                     fun: function () {
                        shadowgui.debugClicked();
                     }
                 },
                 {
                     name: 'Developer&nbsp;Tools...',
                     fa: 'fa-edit red fa-fw',
                     fun: function () {
                        shadowgui.showDeveloperConsole();
                     }
                 },
                 {
                     name: ' About&nbsp;Shadow...',
                     img: 'icons/shadowcoin.png',
                     fun: function () {
                        shadowgui.aboutClicked()
                     }
                 },
                 {
                     name: 'About&nbsp;Qt...',
                     fa: 'fa-question red fa-fw',
                     fun: function () {
                        shadowgui.aboutQtClicked();
                     }
                 }];

         $('#help').contextMenu(menu, {onOpen:function(data,e){openContextMenu(data.menu);}, onClose:function(data,e){data.menu.isOpen = 0;}, triggerOn: 'click', displayAround: 'trigger', position: 'bottom', mouseClick: 'left', sizeStyle: 'content'});

    },

    updateBalance: function(balance, stake, unconfirmed, immature) {
        if(balance == undefined)
            balance     = this.balance    .data("orig"),
            stake       = this.stake      .data("orig"),
            unconfirmed = this.unconfirmed.data("orig"),
            immature    = this.immature   .data("orig");
        else
            this.balance    .data("orig", balance),
            this.stake      .data("orig", stake),
            this.unconfirmed.data("orig", unconfirmed),
            this.immature   .data("orig", immature);

        this.formatValue("balance",     balance);
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
            overviewPage.updateTransaction(transactions[i], transactions.length > 1);

        $("#recenttxns [title]").off("mouseenter").on("mouseenter", tooltip)
    },
    updateTransaction: function(txn, initial) {
        var format = function(tx) {

            return "<a id='"+tx.txid.substring(0,17)+"' title='"+tx.tooltip+"' class='transaction-overview' href='#' onclick='$(\"#navitems [href=#transactions]\").click();$(\"#"+tx.txid+"\").click();'>\
                                                <span class='"+(tx.type == 'input' ? 'received' : (tx.type == 'output' ? 'sent' : (tx.type == 'inout' ? 'self' : 'stake')))+" icon no-padding'>\
                                                  <i class='fa fa-"+(tx.type == 'input' ? 'angle-left' : (tx.type == 'output' ? 'angle-right' : (tx.type == 'inout' ? 'angle-down' : 'money')))+" font-26px margin-right-10'></i>"
                                                +unit.format(tx.amount)+" </span> <span> "+unit.display+" </span> <span class='overview_date' data-value='"+tx.date+"'>"+tx.date_s+"</span></a>";

        }

        var sid = txn.txid.substring(0,17);

        if($("#"+sid).attr("title", txn.tooltip).length==0)
        {
            var set = $('#recenttxns a');

            if(initial==true)
                $("#recenttxns").append(format(txn));

            if(!initial) {
                var appended = false;
                set.each(function(index) {
                    var el = $(this);
                    if (txn.date > parseInt(el.find('.overview_date').attr("data-value")))
                    {
                        el.before(format(txn));
                        appended = true;
                        return;
                    }
                });

                if(!appended)
                    $("#recenttxns").prepend(format(txn));
            }

            while(set.length > 7)
            {
                $("#recenttxns a:last").remove();

                set = $('#recenttxns a');
            }
        }

        /*
        if (set.length == 0)
        {
            $("#recenttxns").append(format(txn));

            //return;
        }

        var sid = txn.txid.substring(0,17);

        set.each(function(index) {
            var el = $(this);
            console.log(index);
            if (txn.date > el.find('.overview_date').attr("data-value"))
                el.before(format(txn));
            else
                el.after(format(txn));

            if (set.length >= 7)
                $("#recenttxns a:last").remove();

            return;
        });*/
    }

}

/* Send Page */
function sendPageInit() {
    toggleCoinControl(); // TODO: Send correct option value...
    addRecipient();
}

var recipients = 0;

function addRecipient() {

    $("#recipients").append((
           (recipients == 0 || $("div.recipient").length == 0 ? '' : '<hr />')
        +  '<div id="recipient[count]" class="recipient">'
        +  '<div class="flex-right"> \
                <label for="pay_to[count]" class="recipient">Pay To:</label> \
                <input id="pay_to[count]" class="pay_to input_box" placeholder="Enter a Shadow address (e.g. SXywGBZBowrppUwwNUo1GCRDTibzJi7g2M)" maxlength="128" oninput="base58.check(this);"/> \
                <a class="button is-inverse has-fixed-icon"  style="margin-right:10px; margin-left:10px; height:43px; width:43px;" onclick="openAddressBook(\'#pay_to[count]\', \'#label[count]\', true)"><i class="fa fa-book"></i></a> \
                <a class="button is-inverse has-fixed-icon"  style="margin-right:10px; height:43px; width:43px;" onclick="paste(\'#pay_to[count]\')"><i class="fa fa-files-o"></i></a> \
                <a class="button is-inverse has-fixed-icon"  style="height:43px; width:43px;" onclick="if($(\'div.recipient\').length == 1) clearRecipients(); else {var recipient=$(\'#recipient[count]\');if(recipient.next(\'hr\').remove().length==0)recipient.prev(\'hr\').remove();$(\'#recipient[count]\').remove();resizeFooter();}"><i class="fa fa-times"></i></a> \
            </div> \
            <div class="flex-right"> \
                <label for="label[count]" class="recipient">Label:</label> \
                <input id="label[count]" class="label input_box" placeholder="Enter a label for this address to add it to your address book" maxlength="128"/> \
            </div> \
            <div class="flex-right"> \
                <label for="narration[count]" class="recipient">Narration:</label> \
                <input id="narration[count]" class="narration input_box" placeholder="Enter a short note to send with a payment (max 24 characters)" maxlength="24" /> \
            </div> \
            <div class="flex-left"> \
                <label for="amount[count]" class="recipient">Amount:</label> \
                <input id="amount[count]" class="amount input_box" type="number" placeholder="0.00000000" step="0.01" value="0.00000000" onfocus="invalid($(this), true);" onchange="unit.parse(this, $(\'#unit[count]\').val());updateCoinControl();"  /> \
                <select id="unit[count]" class="unit button is-inverse has-fixed-icon"  style="margin-left:10px; height:43px; width:100px;" onchange="unit.format(\'#amount[count]\', $(this).val());"> \
                    <option value="0" title="Shadow"                    ' + (unit.type == 0 ? "selected" : "") + '>SDC</option> \
                    <option value="1" title="Milli-Shadow (1 / 1000)"   ' + (unit.type == 1 ? "selected" : "") + '>mSDC</option> \
                    <option value="2" title="Micro-Shadow (1 / 1000000)"' + (unit.type == 2 ? "selected" : "") + '>&micro;SDC</option> \
                    <option value="3" title="Shadowshi (1 / 100000000)" ' + (unit.type == 3 ? "selected" : "") + '>Shadowshi</option> \
                </select> \
            </div> \
        </div>').replace(/\[count\]/g, recipients++));
        resizeFooter();


        // Don't allow characters in numeric fields
        $("#amount"+(recipients-1).toString()).on("keydown", function(e) {
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
        }).on("paste",  function(e) {
            var data = e.originalEvent.clipboardData.getData("text/plain");
            if(!($.isNumeric(data)) || (this.value.indexOf('.') != -1 && document.getSelection().type != "Range"))
                e.preventDefault();
        });

        // Addressbook Modal
        $("#addressbook"+(recipients-1).toString()).leanModal({ top : 10, left: 5, overlay : 0.5, closeButton: ".modal_close" });
}

function clearRecipients() {
    $("#recipients").html("");
    recipients = 0;
    addRecipient();
    resizeFooter();
}

function addRecipientDetail(address, label, narration, amount) {
    var recipient = recipients - 1;

    $("#pay_to"+recipient).val(address).change();
    $("#label"+recipient).val(label).change();
    $("#narration"+recipient).val(narration).change();
    $("#amount"+recipient).val(amount).change();
}

function toggleCoinControl(enable) {
    if(enable==undefined && $("#coincontrol_enabled")  .css("display") == "block" || enable == false)
    {
        $("#coincontrol_enabled") .css("display", "none");
        $("#coincontrol_disabled").css("display", "block");
    }
    else
    {
        $("#coincontrol_enabled") .css("display", "block");
        $("#coincontrol_disabled").css("display", "none");
    }
    resizeFooter();
}

function updateCoinControl() {
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
    bridge.clearRecipients();

    for(var i=0;i<recipients;i++) {
        var el = $("#pay_to"+i);
        var valid = true;

        valid = invalid(el, bridge.validateAddress(el.val()));

        el = $("#amount"+i);

        if(unit.parse(el.val()) == 0 && !invalid(el))
            valid = false;

        if(!valid || !bridge.addRecipient($("#pay_to"+i).val(), $("#label"+i).val(), $("#narration"+i).val(), unit.parse($("#amount"+i).val(), $("#unit"+i).val())))
            return false;
    }

    if(bridge.sendCoins($("#coincontrol_enabled").css("display") != "none", $("#change_address").val()))
        clearRecipients();
}

function receivePageInit() {
    var menu = [{
            name: 'Copy&nbsp;Address',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#receive .footable .selected .address');
            }
        },
        {
            name: 'Copy&nbsp;Label',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#receive .footable .selected .label');
            }
        },
        {
            name: 'Copy&nbsp;Public&nbsp;Key',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#receive .footable .selected .pubkey');
            }
        },
        {
            name: 'Edit',
            img: 'icons/edit.png',
            fun: function () {
                $("#receive .footable .selected .label.editable").dblclick();
            }
        },
        {
            name: 'Show&nbsp;QR&nbsp;Code',
            img: 'icons/qrcode.png',
            fun: function () {
                $("#receive [href='#qrcode-modal']").click();
            }
        },
        {
            name: 'Sign&nbsp;Message',
            img: 'icons/edit.png',
            fun: function () {
                shadowgui.gotoSignMessageTab($('#receive .footable .selected .address').text());
            }
        }];

    //Calling context menu
     $('#receive .footable tbody').on('contextmenu', function(e) {
        $(e.target).closest('tr').click();
     }).contextMenu(menu, {triggerOn:'contextmenu', sizeStyle: 'content'});
}


function addressBookInit() {
    var menu = [{
            name: 'Copy&nbsp;Address',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#addressbook .footable .selected .address');
            }
        },
        {
            name: 'Copy&nbsp;Public&nbsp;Key',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#addressbook .footable .selected .pubkey');
            }
        },
        {
            name: 'Copy&nbsp;Label',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#addressbook .footable .selected .label');
            }
        },
        {
            name: 'Edit',
            img: 'icons/edit.png',
            fun: function () {
                $("#addressbook .footable .selected .label.editable").dblclick();
            }
        },
        {
            name: 'Delete',
            img: 'icons/delete.png',
            fun: function () {
                var addr=$('#addressbook .footable .selected .address');
                if(bridge.deleteAddress(addr.text()))
                    addr.closest('tr').remove();

                resizeFooter();
            }
        },
        {
            name: 'Show&nbsp;QR&nbsp;Code',
            img: 'icons/qrcode.png',
            fun: function () {
                $("#addressbook [href='#qrcode-modal']").click();
            }
        },
        {
            name: 'Verify&nbsp;Message',
            img: 'icons/edit.png',
            fun: function () {
                shadowgui.gotoVerifyMessageTab($('#addressbook .footable .selected .address').text());
            }
        }];

    //Calling context menu
     $('#addressbook .footable tbody').on('contextmenu', function(e) {
        $(e.target).closest('tr').click();
     }).contextMenu(menu, {triggerOn:'contextmenu', sizeStyle: 'content'});
}


var Name = 'Me';
var initialAddress = true;

function appendAddresses(addresses) {

    if(addresses == "[]")
        return;

    addresses = JSON.parse(addresses.replace(/,\]$/, "]"));

    for(var i=0; i< addresses.length;i++)
    {
        var address = addresses[i];
        var addrRow = $("#"+address.address);
        var page = (address.type == "S" ? "#addressbook" : "#receive");

        if(address.type == "R" && address.address.length == 34) {
            $("#message-from-address").append("<option title='"+address.address+"' value='"+address.address+"'>"+address.label+"</option>");

            if(initialAddress){
                $("#message-from-address").prepend("<option title='Anonymous' value='anon' selected>Anonymous</option>");

                $(".user-name")   .text(Name);
                $(".user-address").text(address.address);
                initialAddress = false;
            }
        }

        if(addrRow.length==0)
        {
            $(page + " .footable tbody").append("<tr id='"+address.address+"'>\
                                                   <td class='label editable' data-value='"+address.label_value+"'>"+address.label+"</td>\
                                                   <td class='address'>"+address.address+"</td>\
                                                   <td class='pubkey'>"+address.pubkey+"</td></tr>");

            $("#"+address.address)

            .on('click', function() {
                $(this).addClass("selected").siblings("tr").removeClass("selected");
            }).find(".editable").on("dblclick", function (event) {
                event.stopPropagation();
                updateValue($(this));
            }).attr("title", "Double click to edit").on('mouseenter', tooltip);
        }
        else
            $("#"+address.address+" .label").attr("data-value", address.label_value).text(address.label);

    }

    var table = $('#addressbook .footable,#receive .footable').data("footable").redraw();
}

function transactionPageInit() {
    var menu = [{
            name: 'Copy&nbsp;Address',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#transactions .footable .selected .address', "data-value");
            }
        },
        {
            name: 'Copy&nbsp;Label',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#transactions .footable .selected .address', "data-label");
            }
        },
        {
            name: 'Copy&nbsp;Amount',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#transactions .footable .selected .amount');
            }
        },
        {
            name: 'Copy&nbsp;transaction&nbsp;ID',
            img: 'icons/editcopy.png',
            fun: function () {
                copy('#transactions .footable .selected', "id");
            }
        },
        {
            name: 'Edit&nbsp;label',
            img: 'icons/edit.png',
            fun: function () {
                $("#transactions .footable .selected .address .editable").dblclick();
            }
        },
        {
            name: 'Show&nbsp;transaction&nbsp;details',
            img: 'icons/history.png',
            fun: function () {
                $("#transactions .footable .selected").dblclick();
            }
        }];

    //Calling context menu
     $('#transactions .footable tbody').on('contextmenu', function(e) {
        $(e.target).closest('tr').click();
     }).contextMenu(menu, {triggerOn:'contextmenu', sizeStyle: 'content'});
}

var connected = false;

function appendTransactions(transactions) {
    if(transactions == "[]")
    {
        if(!connected)
            window.setTimeout(bridge.connectSignals, 100);

        connected = true;

        return;
    }

    transactions = JSON.parse(transactions.replace(/,\]$/, "]"));

    if(transactions.length==1 && transactions[0].id==-1)
        return;

    if(connected == false)
        transactions = transactions.sort(function (a, b) {
            a.date = parseInt(a.date);
            b.date = parseInt(b.date);

            return b.date - a.date;
        });

    var isNew = false;

    for(var i=0; i< transactions.length;i++)
    {
        var transaction = transactions[i];
        var txRow = $("#"+transaction.txid);

        if(txRow.length==0) {
            isNew = true;
            $("#transactions .footable tbody").append("<tr id='"+transaction.txid+"' title='"+transaction.tooltip+"' rowid='"+transaction.id+"'>\
                                                            <td data-value='"+transaction.confirmations+"'><i class='fa fa-lg "+transaction.status+" margin-right-10'></td>\
                                                            <td data-value='"+transaction.date+"'>"+transaction.date_s+"</td>\
                                                            <td>"+transaction.type_label+"</td>\
                                                            <td class='address' style='color:"+transaction.address_color+";' data-value='"+transaction.address+"' data-label='"+transaction.label+"'><img src='icons/tx_"+transaction.type+".png' /><span class='editable'>"+transaction.address_display+"</span></td>\
                                                            <td>"+transaction.narration+"</td>\
                                                            <td class='amount' style='color:"+transaction.amount_color+";' data-value='"+transaction.amount+"'>"+transaction.amount_display+"</td>\
                                                       </tr>");

            $("#"+transaction.txid)
            .on('mouseenter', tooltip)

            .on('click', function() {
                $(this).addClass("selected").siblings("tr").removeClass("selected");
            })

            .on("dblclick", function(e) {
                $(this).attr("href", "#transaction-info-modal");

                $(this).leanModal({ top : 10, overlay : 0.5, closeButton: "#transaction-info-modal .modal_close" });
                $("#transaction-info").html(bridge.transactionDetails($(this).attr("rowid")));
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
           }).attr("title", "Double click to edit").on('mouseenter', tooltip);

        } else
        {
            txRow.attr("title", transaction.tooltip);

            // Overview Page
            $("#"+transaction.txid.substring(0,17)).attr("title", transaction.tooltip);

            var status = txRow.children("td:first-child").attr("data-value", transaction.confirmations).find("i");

            if(!status.hasClass("fa-check-circle")) {
                status.removeClass("fa-question-circle fa-clock-o a-exclamation-triange red orange yellow lightgreen grey");
                status.addClass(transaction.status);
            }

            txRow.children("td.amount").text(transaction.amount_display);
            txRow.children("td.address").html("<img src='icons/tx_"+transaction.type+".png' /><span class='editable'>"+transaction.address_display+"</span>")
            .find(".editable")
            .on("dblclick", function (event) {
                event.stopPropagation();
                event.preventDefault();
                updateValue($(this));
            }).attr("title", "Double click to edit").on('mouseenter', tooltip);;
        }
    }

    if(isNew) {
        overviewPage.recent(transactions.slice(0,7));

        $('#transactions .footable').data("footable").redraw();

        if(!connected)
            window.setTimeout(bridge.connectSignals, 100);

        connected = true;
    }

    transactions = null;
}

function shadowchatInit() {
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
            img: 'icons/editcopy.png',
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

                console.log(id);

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
}

var contacts = {};
var contact_list;

function appendMessages(messages, reset) {
    contact_list = $("#contact-list ul");

    if(reset)
    {
        contacts = null;
        contacts = {};
        contact_list.html("");
        $("#contact-list").removeClass("in-conversation");
        $(".contact-discussion ul").html("");
        $(".user-notifications").hide();
        $("#message-count").text(0);
        messagesScroller.scrollTo(0, 0);
        contactScroll   .scrollTo(0, 0);
    }

    if(messages == "[]")
        return;

    messages = JSON.parse(messages.replace(/,\]$/, "]"));

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
                      message.to_address,
                      message.from_address,
                      message.message,
                      true);
    }

    for (key in contacts) {
        appendContact(key);
    }

    contact_list.find("li:first-child").click();

}

function appendMessage(id, type, sent_date, received_date, label_value, label, to_address, from_address, message, initial) {
    $(".user-notifications").show();

    if(type=="R")
        $("#message-count").text(parseInt($("#message-count").text())+1);

    var them = type == "S" ? to_address   : from_address;
    var self = type == "S" ? from_address : to_address;

    var key = (label_value == "" ? them : label_value).replace(/\s/g, '');

    var contact = contacts[key];

    if(contacts[key] == undefined)
        contacts[key] = {},
        contact = contacts[key],
        contact.key = key,
        contact.label = label,
        contact.avatar = (false ? '' : 'images/avatars/default.png'), // TODO: Avatars!!
        contact.messages  = new Array();

    if($.grep(contact.messages, function(a){ return a.id == id; }).length == 0)
    {
        contact.messages.push({id:id, them: them, self: self, message: message, type: type, sent: sent_date, received: received_date});

        if(!initial)
            appendContact(key, true);
    }
}

function appendContact (key, newcontact) {
    var contact_el = $("#contact-"+key);
    var contact = contacts[key];

    if(contact_el.length == 0) {
        contact_list.append("<li id='contact-"+ key +"' class='contact' title='"+contact.label+"'>\
                                        <img src='"+ contact.avatar +"' />\
                                        <span class='contact-info'>\
                                            <span class='contact-name'>"+contact.label+"</span>\
                                            <span class='contact-address'>"+contact.messages[0].them+"</span>\
                                        </span>\
                                        <span class='contact-options'>\
                                                <span class='message-notifications'>"+$.grep(contact.messages, function(a){return a.type=="R"}).length+"</span>\
                                                <span class='delete' onclick='deleteMessages(\""+key+"\")'></span>\
                                                " //<span class='favorite favorited'></span>\ //TODO: Favourites
                                     + "</span>\
                                      </li>");

        contact_el = $("#contact-"+key).on('click', function(e) {
            $(this).addClass("selected").siblings("li").removeClass("selected");
            $("#contact-list").addClass("in-conversation");
            var discussion = $(".contact-discussion ul");
            var contact = contacts[e.delegateTarget.id.replace(/^contact\-/, '')];

            discussion.html("");

            contact.messages.sort(function (a, b) {
              return a.received - b.received;
            });

            var message;

            for(var i=0;i<contact.messages.length;i++)
            {
                message = contact.messages[i];
                //title='"+(message.type=='S'? message.self : message.them)+"' taken out below.. titles getting in the way..
                discussion.append("<li id='"+message.id+"' class='"+(message.type=='S'?'user-message':'other-message')+"' contact-key='"+contact.key+"'>\
                                    <span class='info'>\
                                        <img src='"+contact.avatar+"' />\
                                        <span class='user-name'>"
                                            +(message.type=='S'? (message.self == 'anon' ? 'anon' : Name) : contact.label)+"\
                                        </span>\
                                    </span>\
                                    <span class='message-content'>\
                                        <span class='timestamp'>"+(new Date(message.received*1000).toLocaleString())+"</span>\
                                        <span class='message-text'>"+micromarkdown.parse(message.message)+"</span>\
                                        <span class='delete' onclick='deleteMessages(\""+contact.key+"\", \""+message.id+"\");'></span>\
                                    </span></li>");

            }


            messagesScroller.refresh();

            messagesScroller.scrollTo(0, messagesScroller.maxScrollY, 600);

            var scrollerBottom = function() {

                var max = messagesScroller.maxScrollY;

                messagesScroller.refresh();

                if(max != messagesScroller.maxScrollY)
                    messagesScroller.scrollTo(0, messagesScroller.maxScrollY, 100);
            };

            setTimeout(scrollerBottom, 605);
            setTimeout(scrollerBottom, 1000);
            setTimeout(scrollerBottom, 1300);
            setTimeout(scrollerBottom, 1600);
            setTimeout(scrollerBottom, 1900);
            setTimeout(scrollerBottom, 2200);
            setTimeout(scrollerBottom, 2500);
            setTimeout(scrollerBottom, 5000);

            //discussion.children("[title]").on("mouseenter", tooltip);

            $("#message-from-address").val(message.self);
            $("#message-to-address").val(message.them);

        }).on("mouseenter", tooltip);

        contact_el.find(".delete").on("click", function(e) {e.stopPropagation()});

    } else {
        if(contact.messages[contact.messages.length-1].type=="R") {
            var notifications = contact_el.find(".message-notifications");
            notifications.text(parseInt(notifications.text())+1);
        }
    }

    if(newcontact || contact_el.hasClass("selected"))
        contact_el.click();
}

function newConversation() {
    $("#new-contact-modal .modal_close").click();
    $("#message-to-address").val($("#new-contact-address").val());
    $("#message-text").focus();
    $(".contact-discussion ul").html("<li id='remove-on-send'>Starting Conversation with "+$("#new-contact-address").val()+" - "+$("#new-contact-name").val()+"</li>");

    $("#new-contact-address").val("");
    $("#new-contact-name").val("");
    $("#new-contact-pubkey").val("");
    $("#contact-list ul li").removeClass("selected");
    $("#contact-list").addClass("in-conversation");
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

    for(var i=0;i<contact.messages.length;i++) {

        if(messageid == undefined) {
            if(bridge.deleteMessage(contact.messages[i].id))
            {
                $("#"+contact.messages[i].id).remove();

                if(contact.messages[i].type=="R")
                    $("#message-count").text(parseInt($("#message-count").text())-1);

                contact.messages.splice(i, 1);
                i--;
            }
            else
                return false;
        }
        else
            if(contact.messages[i].id == messageid)
                if(bridge.deleteMessage(messageid)) {
                    $("#"+messageid).remove();

                    if(contact.messages[i].type=="R")
                        $("#message-count").text(parseInt($("#message-count").text())-1);

                    contact.messages.splice(i, 1);
                    i--;
                    var notifications = $("#contact-"+ key).find(".message-notifications");
                    notifications.text(parseInt(notifications.text())-1);
                    break;
                }
                else
                    return false;
    }

    if(contact.messages.length == 0)
    {
        $("#contact-"+ key).remove();
        $("#contact-list").removeClass("in-conversation");
    }
    else
        iscrollReload();
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

$( document ).ready(function() {
  	
	$( "#overview" ).on( "click tap", ".wallet.contracted i", function() {
		
		$( "#overview h2" ).addClass("expanded");
		$( "#overview .wallet" ).addClass("expanded");


	});

	$( "#overview" ).on( "click tap", ".wallet.expanded i", function() {
		$( "#overview h2" ).removeClass("expanded");
		$( "#overview .wallet" ).removeClass("expanded");





	});



});
