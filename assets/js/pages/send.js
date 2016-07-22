/* Send Page */
var sendPage = (function($) {
    var recipientTemplate = $("#recipient-template")[0].outerHTML;
    $("#recipient-template").remove(); // No point in keeping it in the DOM....

    function toggleCoinControl(enable) {
        if(enable==undefined && $("#coincontrol_enabled").css("display") == "block" || enable == false)
        {
            $("#coincontrol_enabled") .css("display", "none");
            $("#coincontrol_disabled").css("display", "block");
        } else
        {
            $("#coincontrol_enabled") .css("display", "block");
            $("#coincontrol_disabled").css("display", "none");
        }
    }

    function addRecipient() {
        $("#recipients").append(((recipients == 0 || $("div.recipient").length == 0 ? '' : '<hr />') + recipientTemplate.replace("recipient-template", 'recipient[count]')).replace(/\[count\]/g, recipients++));

        $("#recipient"+(recipients-1).toString()+" [data-title]").tooltip();

        // Don't allow characters in numeric fields
        $("#amount"+(recipients-1).toString()).on("keydown", unit.keydown).on("paste",  unit.paste);

        $('#address-lookup-modal'+(recipients-1)).modal('hide');

        bridge.userAction(['clearRecipients']);
    }

    function addRecipientDetail(address, label, narration, amount) {
        var recipient = recipients - 1;

        $("#pay_to"+recipient).val(address).change();
        $("#label"+recipient).val(label).change();
        $("#amount"+recipient).val(amount).change();
    }

    function clearRecipients() {
        $("#recipients").html("");
        recipients = 0;
        addRecipient();
        $('#recipients [data-title]').tooltip();
    }

    function removeRecipient(recipient) {
        if($('div.recipient').length == 1)
            clearRecipients();
        else {
            recipient=$(recipient);

            if(recipient.next('hr').remove().length==0)
                recipient.prev('hr').remove();

            removeRecipient.remove()
            $('#tooltip').remove();
        }
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

    return {
        toggleCoinControl: toggleCoinControl,
        addRecipient:addRecipient,
        addRecipientDetail: addRecipientDetail,
        clearRecipients: clearRecipients,
        suggestRingSize: suggestRingSize,
        sendCoins: sendCoins,
    }

})(jQuery)

function sendPageInit() {
    sendPage.toggleCoinControl(); // TODO: Send correct option value...
    sendPage.addRecipient();
    changeTxnType();
}

$(sendPageInit);

function changeTxnType()
{
    var type=$("#txn_type").val();

    if (type > 1)
    {
        $("#tx_ringsize,#suggest_ring_size")[bridge.info.options.AutoRingSize == true ? 'hide' : 'show']();
        $("#coincontrol,#spend_sdc,#suggest_ring_size,#tx_ringsize").hide();
        $("#spend_shadow").show();
        sendPage.toggleCoinControl(false);
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
}

//rarw


function toggleADVControl(enable) {
   if( $('#txn_type').val() == "2")
      $('#tx_ringsize,#suggest_ring_size').toggle();
   else
      $('#tx_ringsize,#suggest_ring_size').hide();
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
