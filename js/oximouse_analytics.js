/**
 * Send GA analytics for page
 * @returns
 */
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-144896065-1', 'auto', 'oximouse');
ga('oximouse.send', 'pageview');

/**
 * Send new event to GA
 * @param eventValue
 * @param eventName
 * @returns
 */
function SendGaEvent(eventValue, eventName = 'User Gene Input'){
	ga('send','event',eventName,eventValue);
}
