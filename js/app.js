(function(){
    //initiate the client
    var oh = Ohmage("/app", "campaign-manager")

    //refresh the page when the hash changes
    window.onhashchange = function(){
        window.location.reload();
    }

    var class_names = {};

    //debugging
    window.oh = oh;

    //global data table
    var table;

    //attach global callbacks
    oh.callback("done", function(x, status, req){
        //for debugging only
        //console.log(x);
    })

    //global error handler. In ohmage 200 means unauthenticated
    oh.callback("error", function(msg, code, req){
        (code == 200) ? window.location.replace("/#login") : message("<strong>Error! </strong>" + msg);
    });

    //prevent timeout
    oh.keepalive();

    //hide stuff for mobilize
    oh.config.read().done(function(config){
        if(config.application_name == "mobilize"){
            $(".nomobilize").hide();
        }
    });

    //get data
    oh.user.info().done(function(userdata){
        var username = Object.keys(userdata)[0];
        var user_is_admin = userdata[username].permissions.is_admin;
        class_names = userdata[username].classes;
        $.each( Object.keys(class_names).sort(), function( i, class_urn ) {
            $("#class_select").append($("<option />").text(class_names[class_urn]).val(class_urn));
        });
        updateProgress(10)
        oh.campaign.readall({"output_format" : "long"}).done(function(data){
            updateProgress(15)
            $("#progressdiv").removeClass("hidden");
            var urns = Object.keys(data);
            var progress = 0;
            $.map(urns.sort(), function(urn, i){
                data[urn].urn = urn;
                var roles = data[urn]["user_roles"];
                var response_count = data[urn]["survey_response_count"] || {};
                var count = response_count.shared + response_count.private;
                var tr = $("<tr>").appendTo("#campaigntablebody").data("campaigndata", data[urn]);
                var td1 = $("<td>").appendTo(tr).text(data[urn].name);
                var td2 = $("<td>").appendTo(tr).text(data[urn].creation_timestamp);

                $("<td>").appendTo(tr).text(data[urn].author_list.join(", "));

                var td3 = $("<td>").appendTo(tr).text(data[urn].running_state);
                var td4 = $("<td>").appendTo(tr).text(response_count.shared)
                var td_total_count = $("<td>").appendTo(tr).text(count);

                var td5 = $("<td>").addClass("buttontd").appendTo(tr);
                var td6 = $("<td>").appendTo(tr).text("" + data[urn].classes)

                var btn = $("<div />").addClass("btn-group").append('\
                    <button type="button" class="btn btn-default btn-sm" data-toggle="dropdown"> \
                    <span class="caret"></span></button>').appendTo(td5);

                var ul = $("<ul />").addClass("dropdown-menu").attr("role", "menu").appendTo(btn);

                var a2 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-th-list"></span> Edit Campaign').attr("href", '../author/#' + urn).click(function(e){
                    /*** We now allow for read-only use of the author tool
                    else if(!user_is_admin && $.inArray("author", roles) < 0 && $.inArray("supervisor", roles) < 0) {
                        e.preventDefault()
                        message("You do not have permission to modify campaign <strong>" + urn + "</strong>.")
                    } else if(count > 0){
                        e.preventDefault();
                        message("Campaign <strong>" + urn + "</strong> has existing responses and can therefore not be modified.")
                    }
                    */
                });

                var a4 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-floppy-save"></span> Download XML').attr("href", "#").click(function(e){
                    e.preventDefault();
                    $("#hiddenurn").val(urn)
                    $("#hiddenform").submit()
                });

                ul.append($("<li >").addClass('divider'))

                var responselink = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-share"></span> Responses').attr("href", '../responses/#' + urn).click(function(e){
                    if(count === 0){
                        e.preventDefault();
                        message("Campaign <b>" + urn + "</b> has no existing responses.")
                    }
                });

                var a3 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-picture"></span> Dashboard').attr("href", '../dashboard/#' + urn).click(function(e){
                    if(count === 0){
                        e.preventDefault();
                        message("Campaign <b>" + urn + "</b> has no existing responses. Nothing to visualize.")
                    }
                });

                var a7 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-blackboard"></span> PlotApp').attr("href", '../plotapp/#' + urn).click(function(e){
                    if(!count === 0){
                        e.preventDefault();
                        message("Campaign <b>" + urn + "</b> has no existing responses. Nothing to plot.")
                    }
                });

                var a5 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-file"></span> Export Data')
                    .attr("href", "../../app/survey_response/read?campaign_urn=" + urn + "&privacy_state=shared&client=manager&user_list=urn:ohmage:special:all&prompt_id_list=urn:ohmage:special:all&output_format=csv&sort_oder=timestamp&column_list=urn:ohmage:user:id,urn:ohmage:context:timestamp,urn:ohmage:prompt:response,urn:ohmage:context:location:latitude,urn:ohmage:context:location:longitude&suppress_metadata=true")

                ul.append($("<li >").addClass('divider'));

                var a6 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-eye-open"></span> Monitor').attr("href", "../monitor/#" + urn);

                var a1 = $("<a />").appendTo($("<li />").appendTo(ul)).append('<span class="glyphicon glyphicon-cog"></span> Settings').attr("href", "#").click(function(e){
                    e.preventDefault();
                    populateModal();
                });

                //maps the url hash to a default app
                var appmap = {
                    settings : a1,
                    edit : a2,
                    dashboard : a3,
                    download : a4,
                    export : a5,
                    monitor: a6,
                    plotapp : a7,
                    responses : responselink
                }

                //add a default action
                var hashval = window.location.hash.replace(/^[#]/, "");
                var link = appmap[hashval] || responselink;
                var defaultbtn = $('<button type="button" class="btn btn-default btn-sm" />').html(link.html()).click(function(e){
                    link[0].click();
                }).prependTo(btn);
                $("#subtitle").text(hashval)

                function populateModal(){
                    oh.campaign.readall({
                        campaign_urn_list : urn,
                        output_format:"long"
                    }).done(function(x){
                        var longdata = x[urn];
                        $("#campaign_name").val(longdata.name);
                        $("#campaign_description").val(longdata.description);
                        $("#campaign_urn").val(urn);

                        //$("#campaign_running")[0].checked = (data["running_state"] == "running");
                        //$("#campaign_privacy")[0].checked = (data["privacy_state"] == "shared");

                        $("#campaign_running").bootstrapSwitch({size: "small", onColor: "success", offColor: "danger", onText:"running", offText:"stopped"})
                        $("#campaign_privacy").bootstrapSwitch({size: "small", onColor: "success", offColor: "danger", onText:"enabled", offText:"disabled"})
                        $("#campaign_editable").bootstrapSwitch({size: "small", onColor: "success", offColor: "danger", onText:"enabled", offText:"disabled"})

                        //populate state
                        $("#campaign_running").bootstrapSwitch("state", longdata["running_state"] == "running");
                        $("#campaign_privacy").bootstrapSwitch("state", longdata["privacy_state"] == "shared");
                        $("#campaign_editable").bootstrapSwitch("state", longdata["editable"]);

                        $("#campaign_class option").each(function(i){
                            $(this).prop("selected", $.inArray($(this).attr("value"), longdata.classes) > -1);
                        });
                        $("#campaign_class").trigger("chosen:updated");

                        if(count){
                            $(".xml-upload-form").hide();
                        }

                        $('#myModal').modal("show").on("shown.bs.modal", function(){
                            $("#campaign_class").chosen({search_contains:true, no_results_text: "Class not found."});
                            $(".xml-upload-form").fileinput();
                        });

                        var xmldata;
                        $("input.xml-file-input").on("change", function(){
                            var f = this.files[0];
                            if(f){
                                var r = new FileReader();
                                r.onload = function(e) {
                                    xmldata = r.result;
                                }
                                r.readAsText(f);
                            } else {
                                xmldata = null;
                            }
                        })

                        $("#campaign_delete_button").unbind("click").click(function(e){
                            e.preventDefault();

                            // test for existing responses
                            if(count && !confirm("This campaign has " + count + " responses. Are you sure?")){
                                return;
                            }

                            var btn = $(this).attr("disabled", "disabled");
                            oh.campaign.delete({campaign_urn:urn}).done(function(){
                                $('#myModal').modal("hide");
                                tr.hide("slow", function(){
                                    alert("Campaign " + urn + " deleted!")
                                });
                            }).always(function(){
                                btn.removeAttr("disabled");
                            });
                        });

                        $("#campaign_save_button").unbind("click").click(function(e){
                            e.preventDefault();
                            var btn = $(this).attr("disabled", "disabled");
                            var running_state = $("#campaign_running")[0].checked ? "running" : "stopped";
                            var privacy_state = $("#campaign_privacy")[0].checked ? "shared" : "private";
                            var editable = $("#campaign_editable")[0].checked
                            var args = {
                                campaign_urn : urn,
                                running_state : running_state,
                                privacy_state : privacy_state,
                                editable : editable,
                                description : $("#campaign_description").val(),
                                class_list_remove : longdata.classes,
                                class_list_add : $("#campaign_class").val()
                            }

                            //update xml only if selected
                            if(xmldata){
                                args.xml = fixxml(xmldata, longdata.name ,urn);
                            }

                            oh.campaign.update(args).done(function(){
                                td3.text(running_state);
                                $('#myModal').modal("hide")
                            }).always(function(){
                                btn.removeAttr("disabled");
                            });
                        });
                    });
                }
            });

            //data tables widget
            function initTable(){
                table = $('#campaigntable').DataTable( {
                    "dom" : '<"pull-right"l><"pull-left"f>tip',
                    "lengthMenu": [[25, 50, 100, -1], [25, 50, 100, "All"]],
                    "aoColumnDefs": [
                       { 'bSortable': false, 'aTargets' : [ 2, 6, 7 ] },
                       { 'bSearchable': false, 'aTargets': [ 4, 5, 6 ] },
                       { 'bVisible' : false, 'aTargets' : [ 2, 7 ] }
                    ]
                });

                /* Custom filtering by date range */
                $.fn.dataTable.ext.search.push(
                    function( settings, data, dataIndex ) {
                        var time = Date.parse(data[1].replace(" ", "T"));
                        if(!time) return true;

                        var min = Date.parse($("#mindate").val());
                        if (min && time < min) return false;

                        var maxtxt = $("#maxdate").val();
                        var max = Date.parse(maxtxt + "T23:55");
                        if (maxtxt && max && time > max) return false;

                        return true;
                    }
                );

                /* Custom filtering by class */
                $.fn.dataTable.ext.search.push(
                    function( settings, data, dataIndex ) {
                        var selected_class = $("#class_select").val();
                        if(!selected_class) return true;
                        var classes = data[7].split(",");
                        return (classes.indexOf(selected_class) >= 0)
                    }
                );

                $('.datepicker').text("").datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true,
                    clearBtn: true
                }).change( function() {
                    table.draw();
                });

                $("#class_select").change(function(){
                    table.draw();
                })
            }

            //init datatable
            $("#progressdiv").addClass("hidden");
            initTable();

            //resetters
            $("#myModal").on("hidden.bs.modal", function(){
                $(".xml-upload-form").show();
                //$(".fileinput").fileinput("clear");
            })

            //expand function
            $('#campaigntable').on('click', "tbody td:not('.buttontd')", function () {
                var tr = $(this).parent()
                var row = table.row(tr);
                if(tr.attr("role") != "row") return;

                if ( row.child.isShown() ) {
                    // This row is already open - close it
                    row.child.hide();
                    tr.removeClass('shown');
                } else {
                    // Open this row
                    row.child( makerow(row.data(), tr.data("campaigndata"))).show();
                    tr.addClass('shown');
                }
            });
        });

        //get users
        oh.user.read().done(function(x){
            $.each(Object.keys(x).sort(), function( i, name ) {
                //$("#campaign_author").append($("<option />").text(name));
            });
        });

        //get classes
        oh.class.read().done(function(x){
            $.each(Object.keys(x).sort(), function( i, urn ) {
                $("#campaign_class").append($("<option />").text(x[urn].name || urn).attr("value", urn));
            });
        });
    });

    updateProgress = _.throttle(function(pct){
        $(".progress-bar").css("width", + pct + "%");
    }, 300);

    function message(msg, type){
        // type must be one of success, info, warning, danger
        type = type || "danger"
        $("#errordiv").empty().append('<div class="alert alert-' + type + '"><a href="#" class="close" data-dismiss="alert">&times;</a>' + msg + '</div>');
        $('html, body').animate({
           scrollTop: 100
        }, 200);
    }

    //XML parser for mixed case tag names (HTML only supports lowercase tags)
    var parse = (function(parser, jQuery){
        return function(str) {
            return jQuery(parser.parseFromString(str, "text/xml").documentElement)
        }
    })(new DOMParser(), jQuery)

    function fixxml(input, name, urn){
        var xml = $.parseXML(input);
        var campaign = $("campaign", xml);
        campaign.children("campaignName").remove();
        campaign.children("campaignUrn").remove();
        campaign.prepend(parse("<campaignName/>").text(name))
        campaign.prepend(parse("<campaignUrn/>").text(urn))
        return (new XMLSerializer()).serializeToString(xml);
    }

    function makerow(rowdata, campaign) {
        var row = $('<div/>').addClass('row').addClass("response-row");
        var col1 = $("<div />").addClass("col-md-6").appendTo(row);
        var col2 = $("<div />").addClass("col-md-6").appendTo(row);
        makep("ID", campaign.urn).appendTo(col1);
        makep("Name", campaign.name).appendTo(col1);
        makep("Description", campaign.description || "No description.").appendTo(col1);
        makep("Classes", $.map(campaign.classes, function(x){return class_names[x] || x;}).join(", ") || "No Classes.").appendTo(col1);
        makep("Authors", campaign.author_list).appendTo(col2);
        makep("Running", campaign.running_state).appendTo(col2);
        makep("Privacy", campaign.privacy_state).appendTo(col2);
        makep("Editable", campaign.editable).appendTo(col2);
        return row;
    }

    function makep(type, content){
        var p = $("<p/>")
        $("<strong/>").text(type + ": ").appendTo(p);
        $("<i/>").text(content).appendTo(p);
        return p;
    }

})();
