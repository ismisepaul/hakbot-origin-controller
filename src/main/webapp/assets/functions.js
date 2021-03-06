/*
 * This file is part of Hakbot Origin Controller.
 *
 * Hakbot Origin Controller is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * Hakbot Origin Controller is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Hakbot Origin Controller. If not, see http://www.gnu.org/licenses/.
 */

/**
 * Constants
 */
const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_TEXT = 'text/plain';
const DATA_TYPE = "json";
const METHOD_GET = "GET";
const METHOD_POST = "POST";
const METHOD_PUT = "PUT";
const METHOD_DELETE = "DELETE";
const URL_ABOUT = "/version";
const URL_LOGIN = "/v1/user/login";
const URL_PROVIDERS = "/v1/providers";
const URL_PUBLISHERS = "/v1/publishers";
const URL_HAKMASTER = "/v1/user/hakmaster";
const URL_JOB = "/v1/job";
const URL_CONSOLE_JOB = "/v1/console/job";
const URL_TEAM = "/v1/team";
const URL_USER = "/v1/user";
const STATE_CREATED = "CREATED";
const STATE_IN_QUEUE = "IN_QUEUE";
const STATE_IN_PROGRESS = "IN_PROGRESS";
const STATE_COMPLETED = "COMPLETED";
const STATE_PUBLISHED = "PUBLISHED";
const STATE_CANCELED = "CANCELED";
const STATE_UNAVAILABLE = "UNAVAILABLE";
const STATE_FAILED = "FAILED";
const PLUGIN_PROVIDER = "provider";
const PLUGIN_PUBLISHER = "publisher";

/**
 * Variables
 */
var initialized = false;
var about;
var providers;
var publishers;
var selectedJob;
var isHakmaster = false;


function contextPath() {
    return $('meta[name=api-path]').attr("content");
}

/**
 * Retrieve a listing of all providers & publishers and stores JSON response in variables
 */
$(document).ready(function () {
    /* Prevents focus loss on login modal */
    $('#modal-login').modal({
        backdrop: 'static',
        keyboard: false
    });
    /* Initializes page */
    initialize();
});

/**
 * Initializes page by looking up about info, providers and publishers configured
 */
function initialize() {
    var successAbout=false, successProviders=false, successPublishers=false, successHakmaster=false;
    $.ajax({
        url: contextPath() + URL_ABOUT,
        contentType: CONTENT_TYPE_JSON,
        dataType: DATA_TYPE,
        type: METHOD_GET,
        async: false,
        success: function (data) {
            about = data;
            successAbout = true;
        }
    });
    $.ajax({
        url: contextPath() + URL_PROVIDERS,
        contentType: CONTENT_TYPE_JSON,
        dataType: DATA_TYPE,
        type: METHOD_GET,
        async: false,
        success: function (data) {
            providers = data;
            successProviders = true;
        }
    });
    $.ajax({
        url: contextPath() + URL_PUBLISHERS,
        contentType: CONTENT_TYPE_JSON,
        dataType: DATA_TYPE,
        type: METHOD_GET,
        async: false,
        success: function (data) {
            publishers = data;
            successPublishers = true;
        }
    });
    $.ajax({
        url: contextPath() + URL_HAKMASTER,
        contentType: CONTENT_TYPE_JSON,
        dataType: DATA_TYPE,
        type: METHOD_GET,
        async: false,
        success: function (data) {
            isHakmaster = data;
            successHakmaster = true;
        }
    });

    // If the page was successfully initialized, populate the system modal and refresh the jobs table
    if (successAbout && successProviders && successPublishers && successHakmaster) {
        $('#loader').css('display', 'none');
        $('#navbar-container').css('display', 'block');
        $('#main').css('display', 'block');
        initialized = true;
        populateSystemModal();
        $('#jobsTable').bootstrapTable('refresh');
        if (!$.sessionStorage.isSet("token")) {
            $('#nav-logout').css('display', "none");
        }
        if (!isHakmaster) {
            $('#nav-admin').css('display', "none");
        }
    }
}

/**
 * Generic handler for all AJAX requests
 */
$.ajaxSetup({
    beforeSend: function(xhr) {
        var jwt = $.sessionStorage.get("token");
        if (jwt != null) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + jwt);
        }
    },
    statusCode: {
        200: function(){
            $('#modal-login').modal('hide');
        },
        401: function(){
            $('#navbar-container').css('display', 'none');
            $('#main').css('display', 'none');
            $('#modal-login').modal('show');
            $("#username").focus();
        }
    }
});

/**
 * Executed when the login button is clicked. Prevent the form from actually being
 * submitted and uses javascript to submit the form info.
 */
$("#login-form").submit(function(event){
    event.preventDefault();
    submitLogin();
});

/**
 * Submits the actual login form data, retrieves jwt token (if successful) and places it
 * in html5 session storage.
 */
function submitLogin() {
    var username = $("#username").val();
    var password = $("#password").val();
    $.ajax({
        type: METHOD_POST,
        url: contextPath() + URL_LOGIN,
        data: ({username: username, password: password}),
        success: function (data) {
            $.sessionStorage.set("token", data);
        },
        statusCode: {
            200: function(){
                $('#navbar-container').css('display', 'block');
                $('#main').css('display', 'block');
                $('#modal-login').modal('hide');
                $('#invalid-credentials').css('display', 'none');
                initialize();
            },
            401: function(){
                $("#username").val("");
                $("#password").val("");
                $('#invalid-credentials').css('display', 'block');
            }
        }
    });
}

/**
 * Logout function removes the stored jwt token and reloads the page, which will
 * force the login modal to display
 */
function logout() {
    $.sessionStorage.remove("token");
    location.reload();
}

/**
 * Resolves the name of the plugin by it's class. Used whenever the name should be
 * used rather than the class, but name isn't available. This function performs the
 * lookup.
 */
function resolvePluginByClass(pluginType, className) {
    if (PLUGIN_PROVIDER == pluginType) {
        for (var i=0; i<providers.length; i++) {
            if (providers[i].class == className) {
                return providers[i];
            }
        }
    }
    if (PLUGIN_PUBLISHER == pluginType) {
        for (i=0; i<publishers.length; i++) {
            if (publishers[i].class == className) {
                return publishers[i];
            }
        }
    }
    return null;
}

/**
 * Resolves the name of the plugin by it's class. Used whenever the name should be
 * used rather than the class, but name isn't available. This function performs the
 * lookup.
 */
function doesPluginHaveConsole(pluginType, className) {
    if (PLUGIN_PROVIDER == pluginType) {
        for (var i=0; i<providers.length; i++) {
            if (providers[i].class == className) {
                return providers[i].console;
            }
        }
    }
    if (PLUGIN_PUBLISHER == pluginType) {
        for (i=0; i<publishers.length; i++) {
            if (publishers[i].class == className) {
                return providers[i].console;
            }
        }
    }
    return false;
}

function getAppName() {
    return about.application;
}

function getAppVersion() {
    return about.version;
}

/**
 * Called by bootstrap table to format the data in the table.
 */
function formatJobTable(res) {
    for (var i=0; i<res.length; i++) {

        const resolvedProvider = resolvePluginByClass(PLUGIN_PROVIDER, res[i].provider);
        if (resolvedProvider) {
            res[i].providerName = resolvedProvider.name;
        } else if (res[i].provider != null) {
            res[i].providerName = "INVALID";
        }

        const resolvedPublisher = resolvePluginByClass(PLUGIN_PUBLISHER, res[i].publisher);
        if (resolvedPublisher) {
            res[i].publisherName = resolvedPublisher.name;
        } else if (res[i].publisher != null) {
            res[i].publisherName = "INVALID";
        }

        res[i].duration = getDuration(res[i].created, res[i].completed);
        res[i].created = timeConverter(res[i].created);
        res[i].started = timeConverter(res[i].started);
        res[i].completed = timeConverter(res[i].completed);
        res[i].successIcon = getSuccessIcon(res[i].state);
        res[i].consoleIcon = getConsoleIcon(res[i].provider, res[i].uuid);
        res[i].successLabel = getSuccessLabel(res[i].state);
        res[i].stateLabel = getPrettyState(res[i].state);
    }
    return res;
}

/**
 * Converts a timestamp into a more user friendly format for display
 */
function timeConverter(timestamp) {
    if (timestamp == null || timestamp == "" || timestamp == 0) {
        return;
    }
    // Check to see if timestamp include milliseconds or not and if not, add them
    if (timestamp.toString().length <= 10) {
        timestamp = (timestamp * 1000);
    }
    var a = new Date(timestamp);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = ("0" + a.getDate()).slice(-2);
    var hour = ("0" + a.getHours()).slice(-2);
    var min = ("0" + a.getMinutes()).slice(-2);
    var sec = ("0" + a.getSeconds()).slice(-2);
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

/**
 * Calculates the duration of an event based on the time the event started and ended.
 * Returns the value is minutes or hours in human readable format.
 */
function getDuration(startTimestamp, endTimestamp) {
    if (startTimestamp == null || startTimestamp == "" || startTimestamp == 0 || endTimestamp == null || endTimestamp == "" || endTimestamp == 0) {
        return;
    }
    var durationInMinutes = Math.ceil(((endTimestamp - startTimestamp) /1000) /60);
    if (durationInMinutes < 60)  {
        return durationInMinutes + " min";
    } else {
        return Math.floor(durationInMinutes / 60) + " hrs";
    }
}

/**
 * Creates HTML based on the state of a job.
 */
function getSuccessIcon(state) {
    if (state == STATE_COMPLETED || state == STATE_PUBLISHED){
        return '<span class="glyphicon glyphicon glyphicon-ok-circle" style="color:seagreen" aria-hidden="true"></span>';
    } else if (state == STATE_CREATED || state == STATE_IN_QUEUE || state == STATE_IN_PROGRESS) {
        return '<span class="glyphicon glyphicon-hourglass" style="color:dimgrey" aria-hidden="true"></span>';
    } else if (state == STATE_UNAVAILABLE ){
        return '<span class="glyphicon glyphicon-time" style="color:lightslategrey" aria-hidden="true"></span>';
    } else if (state == STATE_CANCELED ){
        return '<span class="glyphicon glyphicon-ban-circle" style="color:lightslategrey" aria-hidden="true"></span>';
    } else if (state == STATE_FAILED ){
        return '<span class="glyphicon glyphicon-alert" style="color:firebrick" aria-hidden="true"></span>';
    }
}

/**
 * Creates HTML based on whether the job has a console
 */
function getConsoleIcon(provider, uuid) {
    if (doesPluginHaveConsole(PLUGIN_PROVIDER, provider)) {
        return '<a href="console/'+uuid+'" title="View Console"><span class="glyphicon glyphicon-console" style="color:blue" aria-hidden="true"></span></a>';
    }
}

/**
 * Creates TML based on the state of a job.
 */
function getSuccessLabel(state) {
    if (state == STATE_COMPLETED || state == STATE_PUBLISHED) {
        return '<span class="label label-success">' + getPrettyState(state) + '</span>';
    } else if (state == STATE_CREATED || state == STATE_IN_QUEUE || state == STATE_IN_PROGRESS) {
        return '<span class="label label-info">' + getPrettyState(state) + '</span>';
    } else if (state == STATE_UNAVAILABLE ){
        return '<span class="label label-warning">' + getPrettyState(state) + '</span>';
    } else if (state == STATE_CANCELED ){
        return '<span class="label label-default">' + getPrettyState(state) + '</span>';
    } else if (state == STATE_FAILED ){
        return '<span class="label label-danger">' + getPrettyState(state) + '</span>';
    }
}

/**
 * Returns the word(s) of the state based on its value.
 */
function getPrettyState(state) {
    if (state == STATE_CANCELED) {
        return "Canceled";
    } else if (state == STATE_COMPLETED) {
        return "Completed"
    } else if (state == STATE_CREATED) {
        return "Created";
    } else if (state == STATE_IN_PROGRESS) {
        return "In Progress";
    } else if (state == STATE_IN_QUEUE) {
        return "In Queue";
    } else if (state == STATE_PUBLISHED) {
        return "Published";
    } else if (state == STATE_UNAVAILABLE) {
        return "Unavailable";
    } else if (state == STATE_FAILED) {
        return "Failed";
    }
}

/**
 * Event that's fired whenever a row in the jobs table is clicked. This function
 * will populate and display the details and reposition the jobs table to make
 * room for the details.
 */
$('#jobsTable').on('click-row.bs.table', function (e, job, $element) {
    selectedJob = job;
    $('#main').removeClass("col-sm-12");
    $('#main').removeClass("col-md-12");
    $('#main').addClass("col-sm-9");
    $('#sidebar').css("display", "block");
    $('#jobsTable').bootstrapTable('resetView');
    $('#details-uuid').html(job.uuid);
    $('#details-name').html(job.name);
    $('#details-providerName').html(job.providerName);
    $('#details-publisherName').html(job.publisherName);
    $('#details-created').html(job.created);
    $('#details-started').html(job.started);
    $('#details-completed').html(job.completed);
    $('#details-duration').html(job.duration);
    $('#details-stateLabel').html(getPrettyState(job.state));
    $('#details-successLabel').html(job.successLabel);
    if (doesPluginHaveConsole(PLUGIN_PROVIDER, job.provider)) {
        $('#job-console').css('display', 'block');
        $('#job-console-label').css('display', 'block');
        $('#job-console-button').html('<span class="glyphicon glyphicon-console" style="color:white" aria-hidden="true"></span>&nbsp;&nbsp;' + job.providerName + ' Console');
        $('#job-console-button').attr('href', "console/" + job.uuid);
    } else {
        $('#job-console').css('display', 'none');
        $('#job-console-label').css('display', 'none');
    }
});

/**
 * Adds a highlight to a row in the jobs table when clicked
 */
$('#jobsTable').on('click', 'tbody tr', function(event) {
    $(this).addClass('highlight').siblings().removeClass('highlight');
});

/**
 * Event thats fired whenever the text detail modal is displayed.
 * This function is utilized for all job details where a modal is used.
 */
$('#modalTextDetail').on('show.bs.modal', function(e) {
    $('.modal-content').css('height',$( window ).height()*0.8);
    var title = $(e.relatedTarget).data('modal-title');
    $(e.currentTarget).find('h4[id="modalTitle"]').html(title);
    var height = $('.modal-content').height() - 170;

    var textarea = $('#details-result');
    textarea.height(height);
    textarea.val(null);

    var api = $(e.relatedTarget).data('api');
    var url = contextPath() + URL_JOB + "/" + selectedJob.uuid + api;
    populateModalTextarea(url);
});

/**
 * Performs an AJAX request and populates the textual response in the details-result
 * form field
 */
function populateModalTextarea(url) {
    $.ajax({
        url: url,
        contentType: CONTENT_TYPE_TEXT,
        type: METHOD_GET,
        success: function (data) {
            $('#details-result').val(data);
        }
    });
}

/**
 * Called when user requests to download an artifact.
 */
function downloadJobArtifact(api) {
    window.location = contextPath() + URL_JOB + "/" + selectedJob.uuid + api;
}

/**
 * Populates the system modal with about, providers, and publishers info
 * obtained from the page initialization.
 */
function populateSystemModal() {
    $('#systemAppName').html(about.application);
    $('#systemAppVersion').html(about.version);
    $('#systemAppTimestamp').html(about.timestamp);

    for (var i = 0; i < providers.length; i++) {
        $('#providersTab').append('<div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title">' + providers[i].name + '</h3></div><div class="panel-body">' + providers[i].description + '<br/>Class: <strong>' + providers[i].class + '</strong></div></div>');
    }

    for (i = 0; i < publishers.length; i++) {
        $('#publishersTab').append('<div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title">' + publishers[i].name + '</h3></div><div class="panel-body">' + publishers[i].description + '<br/>Class: <strong>' + publishers[i].class + '</strong></div></div>');
    }
}

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * https://davidwalsh.name/javascript-debounce-function
 */
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Defines JSON characters that need to be escaped when data is used in HTML
 */
const __entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

/**
 * Perform client-side JSON escaping
 */

function toHtml(string) {
    if(typeof string === 'string') {
        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return __entityMap[s];
        });
    } else {
        return string;
    }
}
