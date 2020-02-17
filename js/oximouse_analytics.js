/**
 * The Oximouse website is licensed under the CC BY 4.0 license: https://creativecommons.org/licenses/by/4.0/
 * @author Devin Schweppe <devin_schweppe@hms.harvard.edu>
 */

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

/**
 * Get cookie to keep track of user consent
 * @returns
 */
function GetCookie(cookName = "EU_COOKIE_LAW_CONSENT"){
	var cookies = document.cookie.split(";").filter(b=>b.includes(cookName));
	if(cookies.length > 0){
		return cookies[0].replace(cookName +"=","").replace(" ","");
	} else{
		return "";
	}
}

/**
 * Send new event to GA
 * @param eventValue
 * @param eventName
 * @returns
 */
function SendGaEvent(eventValue, eventName = 'User Gene Input'){
	if(GetCookie()){
		ga('oximouse.send','event',eventName,eventValue);
	}
}

/**
 * Send new Pageview to GA
 * @returns
 */
function SendGaPageView(){
	if(GetCookie()){
		ga('oximouse.send', 'pageview');
	}
}

/**
 * Give cookie to keep track of user consent, 30 day expiration
 * @returns
 */
function GiveCookie(cookVal,cookName = "EU_COOKIE_LAW_CONSENT",expDays = 30){
	var date = new Date();
	date.setTime(date.getTime() + (expDays*24*60*60*1000));
	var expires = "expires=" + date.toUTCString();
	document.cookie = cookName + "=" + cookVal + ";" + expires + ";path=/";
}



/**
*
* JQUERY EU COOKIE LAW POPUPS
* version 1.1.1
*
* Code on Github:
* https://github.com/wimagguc/jquery-eu-cookie-law-popup
*
* To see a live demo, go to:
* http://www.wimagguc.com/2018/05/gdpr-compliance-with-the-jquery-eu-cookie-law-plugin/
*
* by Richard Dancsi
* http://www.wimagguc.com/
*
*/

(function($) {
	
	//for ie9 doesn't support debug console >>>
	if (!window.console) window.console = {};
	if (!window.console.log) window.console.log = function () { };
	//^^^
	
	$.fn.euCookieLawPopup = (function() {
	
		var _self = this;
	
		///////////////////////////////////////////////////////////////////////////////////////////////
		// PARAMETERS (MODIFY THIS PART) //////////////////////////////////////////////////////////////
		_self.params = {
			cookiePolicyUrl : '../help.html#cookieHeader',
			popupPosition : 'top',
			colorStyle : 'default',
			compactStyle : false,
			popupTitle : 'This website is using cookies',
			popupText : 'We use cookies to ensure that we give you the best experience on our website. If you continue without changing your settings, we\'ll assume that you are happy to receive all cookies on this website.',
			buttonContinueTitle : 'Continue',
			buttonLearnmoreTitle : 'Learn&nbsp;more',
			buttonLearnmoreOpenInNewWindow : true,
			agreementExpiresInDays : 30,
			autoAcceptCookiePolicy : false,
			htmlMarkup : null
		};
	
		///////////////////////////////////////////////////////////////////////////////////////////////
		// VARIABLES USED BY THE FUNCTION (DON'T MODIFY THIS PART) ////////////////////////////////////
		_self.vars = {
			INITIALISED : false,
			HTML_MARKUP : null,
			COOKIE_NAME : 'EU_COOKIE_LAW_CONSENT'
		};
	
		///////////////////////////////////////////////////////////////////////////////////////////////
		// PRIVATE FUNCTIONS FOR MANIPULATING DATA ////////////////////////////////////////////////////
	
		// Overwrite default parameters if any of those is present
		var parseParameters = function(object, markup, settings) {
	
			if (object) {
				var className = $(object).attr('class') ? $(object).attr('class') : '';
				if (className.indexOf('eupopup-top') > -1) {
					_self.params.popupPosition = 'top';
				}
				else if (className.indexOf('eupopup-fixedtop') > -1) {
					_self.params.popupPosition = 'fixedtop';
				}
				else if (className.indexOf('eupopup-bottomright') > -1) {
					_self.params.popupPosition = 'bottomright';
				}
				else if (className.indexOf('eupopup-bottomleft') > -1) {
					_self.params.popupPosition = 'bottomleft';
				}
				else if (className.indexOf('eupopup-bottom') > -1) {
					_self.params.popupPosition = 'bottom';
				}
				else if (className.indexOf('eupopup-block') > -1) {
					_self.params.popupPosition = 'block';
				}
				if (className.indexOf('eupopup-color-default') > -1) {
					_self.params.colorStyle = 'default';
				}
				else if (className.indexOf('eupopup-color-inverse') > -1) {
					_self.params.colorStyle = 'inverse';
				}
				if (className.indexOf('eupopup-style-compact') > -1) {
					_self.params.compactStyle = true;
				}
			}
	
			if (markup) {
				_self.params.htmlMarkup = markup;
			}
	
			if (settings) {
				if (typeof settings.cookiePolicyUrl !== 'undefined') {
					_self.params.cookiePolicyUrl = settings.cookiePolicyUrl;
				}
				if (typeof settings.popupPosition !== 'undefined') {
					_self.params.popupPosition = settings.popupPosition;
				}
				if (typeof settings.colorStyle !== 'undefined') {
					_self.params.colorStyle = settings.colorStyle;
				}
				if (typeof settings.popupTitle !== 'undefined') {
					_self.params.popupTitle = settings.popupTitle;
				}
				if (typeof settings.popupText !== 'undefined') {
					_self.params.popupText = settings.popupText;
				}
				if (typeof settings.buttonContinueTitle !== 'undefined') {
					_self.params.buttonContinueTitle = settings.buttonContinueTitle;
				}
				if (typeof settings.buttonLearnmoreTitle !== 'undefined') {
					_self.params.buttonLearnmoreTitle = settings.buttonLearnmoreTitle;
				}
				if (typeof settings.buttonLearnmoreOpenInNewWindow !== 'undefined') {
					_self.params.buttonLearnmoreOpenInNewWindow = settings.buttonLearnmoreOpenInNewWindow;
				}
				if (typeof settings.agreementExpiresInDays !== 'undefined') {
					_self.params.agreementExpiresInDays = settings.agreementExpiresInDays;
				}
				if (typeof settings.autoAcceptCookiePolicy !== 'undefined') {
					_self.params.autoAcceptCookiePolicy = settings.autoAcceptCookiePolicy;
				}
				if (typeof settings.htmlMarkup !== 'undefined') {
					_self.params.htmlMarkup = settings.htmlMarkup;
				}
			}
	
		};
	
		var createHtmlMarkup = function() {
	
			if (_self.params.htmlMarkup) {
				return _self.params.htmlMarkup;
			}
	
			var html =
				'<div class="eupopup-container' +
				    ' eupopup-container-' + _self.params.popupPosition +
				    (_self.params.compactStyle ? ' eupopup-style-compact' : '') +
					' eupopup-color-' + _self.params.colorStyle + '">' +
					'<div class="eupopup-head">' + _self.params.popupTitle + '</div>' +
					'<div class="eupopup-body">' + _self.params.popupText + '</div>' +
					'<div class="eupopup-buttons">' +
					  '<a href="#" class="eupopup-button eupopup-button_1">' + _self.params.buttonContinueTitle + '</a>' +
					  '<a href="' + _self.params.cookiePolicyUrl + '"' +
					 	(_self.params.buttonLearnmoreOpenInNewWindow ? ' target=_blank ' : '') +
						' class="eupopup-button eupopup-button_2">' + _self.params.buttonLearnmoreTitle + '</a>' +
					  '<div class="clearfix"></div>' +
					'</div>' +
					'<a href="#" class="eupopup-closebutton">x</a>' +
				'</div>';
	
			return html;
		};
	
		// Storing the consent in a cookie
		var setUserAcceptsCookies = function(consent) {
			var d = new Date();
			var expiresInDays = _self.params.agreementExpiresInDays * 24 * 60 * 60 * 1000;
			d.setTime( d.getTime() + expiresInDays );
			var expires = "expires=" + d.toGMTString();
			document.cookie = _self.vars.COOKIE_NAME + '=' + consent + "; " + expires + ";path=/";
	
			$(document).trigger("user_cookie_consent_changed", {'consent' : consent});
		};
	
		// Let's see if we have a consent cookie already
		var userAlreadyAcceptedCookies = function() {
			var userAcceptedCookies = false;
			var cookies = document.cookie.split(";");
			for (var i = 0; i < cookies.length; i++) {
				var c = cookies[i].trim();
				if (c.indexOf(_self.vars.COOKIE_NAME) == 0) {
					userAcceptedCookies = c.substring(_self.vars.COOKIE_NAME.length + 1, c.length);
				}
			}
	
			return userAcceptedCookies;
		};
	
		var hideContainer = function() {
			// $('.eupopup-container').slideUp(200);
			$('.eupopup-container').animate({
				opacity: 0,
				height: 0
			}, 200, function() {
				$('.eupopup-container').hide(0);
			});
		};
	
		///////////////////////////////////////////////////////////////////////////////////////////////
		// PUBLIC FUNCTIONS  //////////////////////////////////////////////////////////////////////////
		var publicfunc = {
	
			// INITIALIZE EU COOKIE LAW POPUP /////////////////////////////////////////////////////////
			init : function(settings) {
	
				parseParameters(
					$(".eupopup").first(),
					$(".eupopup-markup").html(),
					settings);
	
				// No need to display this if user already accepted the policy
				if (userAlreadyAcceptedCookies()) {
					$(document).trigger("user_cookie_already_accepted", {'consent': true});
					return;
				}
	
				// We should initialise only once
				if (_self.vars.INITIALISED) {
					return;
				}
				_self.vars.INITIALISED = true;
	
				// Markup and event listeners >>>
				_self.vars.HTML_MARKUP = createHtmlMarkup();
	
				if ($('.eupopup-block').length > 0) {
					$('.eupopup-block').append(_self.vars.HTML_MARKUP);
				} else {
					$('BODY').append(_self.vars.HTML_MARKUP);
				}
	
				$('.eupopup-button_1').click(function() {
					setUserAcceptsCookies(true);
					hideContainer();
					return false;
				});
				$('.eupopup-closebutton').click(function() {
					setUserAcceptsCookies(true);
					hideContainer();
					return false;
				});
				// ^^^ Markup and event listeners
	
				// Ready to start!
				$('.eupopup-container').show();
	
				// In case it's alright to just display the message once
				if (_self.params.autoAcceptCookiePolicy) {
					setUserAcceptsCookies(true);
				}
	
			}
	
		};
	
		return publicfunc;
	});
	
	/**
	 * Create the GA connection
	 * @returns
	 */
	function CreateGa(){
		if(GetCookie()){
			ga('create', 'UA-144896065-1', 'auto', 'oximouse');
		}
	}
	/**
	 * Send GA analytics for page
	 * @returns
	 */
	function InitiateAnalytics(){
		CreateGa();
		SendGaPageView();
	}

	$(document).ready( function() {
		if ($(".eupopup").length > 0) {
			$(document).euCookieLawPopup().init({
				'info' : 'YOU_CAN_ADD_MORE_SETTINGS_HERE',
				'popupTitle' : ' The OxiMouse Website is using cookies.',
				'popupText' : 'We use them to monitor site security. If you continue using our website, we\'ll assume that you are happy to receive all cookies on this website.'
			});
		}
	});
	
	$(document).bind("user_cookie_consent_changed", function(event, object) {
		//console.log("User cookie consent changed: " + $(object).attr('consent') );
		if($(object).attr('consent')){
			InitiateAnalytics();
		}
	});	
}(jQuery));

