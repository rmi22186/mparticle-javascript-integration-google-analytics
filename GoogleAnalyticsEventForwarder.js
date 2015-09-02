(function (window) {
    var MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6
    },
    isInitialized = false,
    isEcommerceLoaded = false,
    forwarderSettings,
    reportingService,
    name = 'GoogleAnalyticsEventForwarder',
    id = null;

    function getEventTypeName(eventType) {
        switch (eventType) {
            case window.mParticle.EventType.Navigation:
                return 'Navigation';
            case window.mParticle.EventType.Location:
                return 'Location';
            case window.mParticle.EventType.Search:
                return 'Search';
            case window.mParticle.EventType.Transaction:
                return 'Transaction';
            case window.mParticle.EventType.UserContent:
                return 'User Content';
            case window.mParticle.EventType.UserPreference:
                return 'User Preference';
            case window.mParticle.EventType.Social:
                return 'Social';
            default:
                return 'Other';
        }
    }

    function processEvent(event) {
        if (isInitialized) {
            event.eec = 0;

            try {
                if (event.dt == MessageType.PageView) {
                    logPageView(event);
                }
                else if (event.dt == MessageType.PageEvent) {
                    if (event.et == window.mParticle.EventType.Transaction) {
                        logTransaction(event);
                    }
                    else {
                        logEvent(event);
                    }
                }

                if (reportingService) {
                    reportingService(id, event);
                }

                return 'Successfully sent to ' + name;
            }
            catch (e) {
                return 'Failed to send to: ' + name + ' ' + e;
            }
        }

        return 'Can\'t send to forwarder ' + name + ', not initialized';
    }

    function setUserIdentity(id, type) {
        if (isInitialized) {
            if (forwarderSettings.useCustomerId == 'True' && type == window.mParticle.IdentityType.CustomerId) {
                if (forwarderSettings.classicMode == 'True') {
                    

                } else {
                    ga('set', 'userId', window.mParticle.generateHash(id));
                    ga('send', 'pageview');
                }
            }
        } else {
            return 'Can\'t call setUserIdentity on forwarder ' + name + ', not initialized';
        }
    }

    function logPageView(data) {
        if (forwarderSettings.classicMode == 'True') {
            _gaq.push(['_trackPageview']);
        }
        else {
            ga('send', 'pageview');
        }
    }

    function logEvent(data) {
        var label = '',
            category = getEventTypeName(data.et),
            value;

        if (data.attrs) {
            if (data.attrs.label) {
                label = data.attrs.label;
            }

            if (data.attrs.value) {
                value = parseInt(data.attrs.value, 10);

                // Test for NaN
                if (value != value) {
                    value = null;
                }
            }

            if (data.attrs.category) {
                category = data.attrs.category
            }
        }

        if (forwarderSettings.classicMode == 'True') {
            _gaq.push(['_trackEvent',
                category,
                data.n,
                label,
                value]);
        }
        else {
            ga('send',
                'event',
                category,
                data.n,
                label,
                value);
        }
    }

    function logTransaction(data) {
        if (!data.attrs || !data.attrs.$MethodName || !data.attrs.$MethodName === 'LogEcommerceTransaction') {
            // User didn't use logTransaction method, so just log normally
            logEvent(data);
            return;
        }

        if (forwarderSettings.classicMode == 'True') {
            if (data.attrs.CurrencyCode) {
                _gaq.push(['_set', 'currencyCode', data.attrs.CurrencyCode]);
            }

            _gaq.push(['_addTrans',
                data.attrs.TransactionID,
                data.attrs.TransactionAffiliation.toString(),
                data.attrs.RevenueAmount.toString(),
                data.attrs.TaxAmount.toString(),
                data.attrs.ShippingAmount.toString()
            ]);

            if (data.attrs.ProductName) {
                _gaq.push(['_addItem',
                  data.attrs.TransactionID,
                  data.attrs.ProductSKU.toString(),
                  data.attrs.ProductName.toString(),
                  data.attrs.ProductCategory.toString(),
                  data.attrs.ProductUnitPrice.toString(),
                  data.attrs.ProductQuantity.toString()
                ]);
            }
            _gaq.push(['_trackTrans']);
        }
        else {
            if (!isEcommerceLoaded) {
                ga('require', 'ecommerce', 'ecommerce.js');
                isEcommerceLoaded = true;
            }

            ga('ecommerce:addTransaction', {
                'id': data.attrs.TransactionID,
                'affiliation': data.attrs.TransactionAffiliation.toString(),
                'revenue': data.attrs.RevenueAmount.toString(),
                'shipping': data.attrs.ShippingAmount.toString(),
                'tax': data.attrs.TaxAmount.toString(),
                'currency': data.attrs.CurrencyCode.toString()
            });

            if (data.attrs.ProductName) {
                ga('ecommerce:addItem', {
                    'id': data.attrs.TransactionID,
                    'name': data.attrs.ProductName.toString(),
                    'sku': data.attrs.ProductSKU.toString(),
                    'category': data.attrs.ProductCategory.toString(),
                    'price': data.attrs.ProductUnitPrice.toString(),
                    'quantity': data.attrs.ProductQuantity.toString(),
                    'currency': data.attrs.CurrencyCode.toString()
                });
            }

            ga('ecommerce:send');
        }
    }

    function initForwarder(settings, service, moduleId) {
        try {
            forwarderSettings = settings;
            reportingService = service;
            id = moduleId;

            if (forwarderSettings.classicMode == 'True') {
                window._gaq = window._gaq || [];
                window._gaq.push(['_setAccount', forwarderSettings.apiKey]);

                if (forwarderSettings.useLocalhostCookie == 'True') {
                    window._gaq.push(['_setDomainName', 'none']);
                }

                (function () {
                    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
                    if (forwarderSettings.useDisplayFeatures == 'True') {
                        ga.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'stats.g.doubleclick.net/dc.js';
                    } else {
                        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                    }
                    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
                })();
            }
            else {
                (function (i, s, o, g, r, a, m) {
                    i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
                        (i[r].q = i[r].q || []).push(arguments)
                    }, i[r].l = 1 * new Date(); a = s.createElement(o),
                    m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
                })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

                if (forwarderSettings.useLocalhostCookie == 'True') {
                    ga('create', forwarderSettings.apiKey, {
                        'cookieDomain': 'none'
                    });
                }
                else {
                    ga('create', forwarderSettings.apiKey, 'auto');
                }

                if (forwarderSettings.useDisplayFeatures == 'True') {
                    ga('require', 'displayfeatures');
                }

                if (forwarderSettings.useSecure == 'True') {
                    ga('set', 'forceSSL', true);
                }                
            }

            isInitialized = true;

            return 'Successfully initialized: ' + name;
        }
        catch (e) {
            return 'Failed to initialize: ' + name;
        }
    }

    if (!window || !window.mParticle || !window.mParticle.addForwarder) {
        return;
    }

    window.mParticle.addForwarder({
        name: name,
        init: initForwarder,
        process: processEvent,
        setUserIdentity: setUserIdentity
    });

})(window);