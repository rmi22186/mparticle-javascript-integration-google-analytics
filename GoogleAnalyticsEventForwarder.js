//
//  Copyright 2015 mParticle, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

(function (window) {
    var name = 'GoogleAnalyticsEventForwarder',
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        },
        trackerCount = 1;

    var constructor = function () {
        var self = this,
            isInitialized = false,
            isEcommerceLoaded = false,
            isEnhancedEcommerceLoaded = false,
            forwarderSettings,
            reportingService,
            trackerId = null,
            isTesting = false;

        self.name = name;

        function createTrackerId() {
            return 'mpgaTracker' + trackerCount++;
        }

        function createCmd(cmd) {
            // Prepends the specified command with the tracker id
            return trackerId + '.' + cmd;
        }

        function getEventTypeName(eventType) {
            return mParticle.EventType.getName(eventType);
        }

        function processEvent(event) {
            var reportEvent = false;

            if (isInitialized) {
                event.ExpandedEventCount = 0;

                try {
                    if (event.EventDataType == MessageType.PageView) {
                        logPageView(event);
                        reportEvent = true;
                    }
                    else if (event.EventDataType == MessageType.Commerce) {
                        logCommerce(event);
                        reportEvent = true;
                    }
                    else if (event.EventDataType == MessageType.PageEvent) {
                        reportEvent = true;

                        if (event.EventCategory == window.mParticle.EventType.Transaction) {
                            logTransaction(event);
                        }
                        else {
                            logEvent(event);
                        }
                    }

                    if (reportEvent && reportingService) {
                        reportingService(self, event);
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
                        // ga.js not supported currently
                    }
                    else {
                        ga(createCmd('set'), 'userId', window.mParticle.generateHash(id));
                        ga(createCmd('send'), 'pageview');
                    }
                }
            }
            else {
                return 'Can\'t call setUserIdentity on forwarder ' + name + ', not initialized';
            }
        }

        function addEcommerceProduct(product) {
            ga(createCmd('ec:addProduct'), {
                id: product.Sku,
                name: product.Name,
                category: product.Category,
                brand: product.Brand,
                variant: product.Variant,
                price: product.Price,
                coupon: product.CouponCode,
                quantity: product.Quantity
            });
        }

        function addEcommerceProductImpression(product) {
            ga(createCmd('ec:addImpression'), {
                id: product.Sku,
                name: product.Name,
                type: 'view',
                category: product.Category,
                brand: product.Brand,
                variant: product.Variant
            });
        }

        function sendEcommerceEvent(type) {
            ga(createCmd('send'), 'event', 'eCommerce', getEventTypeName(type));
        }

        function logCommerce(data) {
            if (!isEnhancedEcommerceLoaded) {
                ga(createCmd('require'), 'ec');
                isEnhancedEcommerceLoaded = true;
            }

            if (data.CurrencyCode) {
                // Set currency code if present
                ga(createCmd('set'), '&cu', data.CurrencyCode);
            }

            if (data.ProductImpressions) {
                // Impression event

                data.ProductImpressions.forEach(function (impression) {
                    impression.ProductList.forEach(function (product) {
                        addEcommerceProductImpression(product);
                    });
                });

                sendEcommerceEvent(data.EventDataType);
            }
            else if (data.PromotionAction) {
                // Promotion event
                data.PromotionAction.PromotionList.forEach(function(promotion) {
                    ga(createCmd('ec:addPromo'), {
                        id: promotion.Id,
                        name: promotion.Name,
                        creative: promotion.Creative,
                        position: promotion.Position
                    });
                });

                if (data.PromotionAction.PromotionActionType == mParticle.PromotionType.PromotionClick) {
                    ga(createCmd('ec:setAction'), 'promo_click');
                }

                sendEcommerceEvent(data.EventDataType);
            }
            else if (data.ProductAction) {
                if (data.ProductAction.ProductActionType == mParticle.ProductActionType.Purchase) {
                    data.ProductAction.ProductList.forEach(function (product) {
                        addEcommerceProduct(product);
                    });

                    ga(createCmd('ec:setAction'), 'purchase', {
                        id: data.ProductAction.TransactionId,
                        affiliation: data.ProductAction.Affiliation,
                        revenue: data.ProductAction.TotalAmount,
                        tax: data.ProductAction.TaxAmount,
                        shipping: data.ProductAction.ShippingAmount,
                        coupon: data.ProductAction.CouponCode
                    });

                    sendEcommerceEvent(data.EventDataType);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.Refund) {
                    if(data.ProductAction.ProductList.length > 0) {
                        data.ProductAction.ProductList.forEach(function (product) {
                            ga(createCmd('ec:addProduct'), {
                                id: product.Sku,
                                quantity: product.Quantity
                            });
                        });
                    }

                    ga(createCmd('ec:setAction'), 'refund', {
                        id: data.ProductAction.TransactionId
                    });

                    sendEcommerceEvent(data.EventDataType);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.AddToCart ||
                    data.ProductAction.ProductActionType == mParticle.ProductActionType.RemoveFromCart) {

                    data.ProductAction.ProductList.forEach(function (product) {
                        addEcommerceProduct(product);
                    });

                    ga(createCmd('ec:setAction'),
                        data.ProductAction.ProductActionType == mParticle.ProductActionType.AddToCart ? 'add' : 'remove');

                    sendEcommerceEvent(data.EventDataType);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.Checkout) {
                    data.ProductAction.ProductList.forEach(function (product) {
                        addEcommerceProduct(product);
                    });

                    ga(createCmd('ec:setAction'), 'checkout', {
                        'step': data.ProductAction.CheckoutStep,
                        'option': data.ProductAction.CheckoutOptions
                    });

                    sendEcommerceEvent(data.EventDataType);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.Click) {
                    data.ProductAction.ProductList.forEach(function (product) {
                        addEcommerceProduct(product);
                    });

                    ga(createCmd('ec:setAction'), 'click');
                    sendEcommerceEvent(data.EventDataType);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.ViewDetail) {

                    data.ProductAction.ProductList.forEach(function (product) {
                        addEcommerceProduct(product);
                    });

                    ga(createCmd('ec:setAction'), 'detail');
                    ga(createCmd('send'), 'event', 'eCommerce', getEventTypeName(data.EventCategory));
                }
            }
        }

        function logPageView(data) {
            if (forwarderSettings.classicMode == 'True') {
                _gaq.push(['_trackPageview']);
            }
            else {
                ga(createCmd('send'), 'pageview');
            }
        }

        function logEvent(data) {
            var label = '',
                category = getEventTypeName(data.EventCategory),
                value;

            if (data.EventAttributes) {
                if (data.EventAttributes.label) {
                    label = data.EventAttributes.label;
                }

                if (data.EventAttributes.value) {
                    value = parseInt(data.EventAttributes.value, 10);

                    // Test for NaN
                    if (value != value) {
                        value = null;
                    }
                }

                if (data.EventAttributes.category) {
                    category = data.EventAttributes.category
                }
            }

            if(data.CustomFlags) {
                var googleCategory = data.CustomFlags["Google.Category"],
                    googleLabel = data.CustomFlags["Google.Label"],
                    googleValue = parseInt(data.CustomFlags["Google.Value"], 10);

                if (googleCategory) {
                    category = googleCategory;
                }

                if (googleLabel) {
                    label = googleLabel;
                }

                // Ensure not NaN
                if (googleValue == googleValue) {
                    value = googleValue;
                }
            }

            if (forwarderSettings.classicMode == 'True') {
                _gaq.push(['_trackEvent',
                    category,
                    data.EventName,
                    label,
                    value]);
            }
            else {
                ga(createCmd('send'),
                    'event',
                    category,
                    data.EventName,
                    label,
                    value);
            }
        }

        function logTransaction(data) {
            if (!data.EventAttributes ||
                !data.EventAttributes.$MethodName ||
                !data.EventAttributes.$MethodName === 'LogEcommerceTransaction') {
                // User didn't use logTransaction method, so just log normally
                logEvent(data);
                return;
            }

            if (forwarderSettings.classicMode == 'True') {
                if (data.EventAttributes.CurrencyCode) {
                    _gaq.push(['_set', 'currencyCode', data.EventAttributes.CurrencyCode]);
                }

                _gaq.push(['_addTrans',
                    data.EventAttributes.TransactionID,
                    data.EventAttributes.TransactionAffiliation.toString(),
                    data.EventAttributes.RevenueAmount.toString(),
                    data.EventAttributes.TaxAmount.toString(),
                    data.EventAttributes.ShippingAmount.toString()
                ]);

                if (data.EventAttributes.ProductName) {
                    _gaq.push(['_addItem',
                      data.EventAttributes.TransactionID,
                      data.EventAttributes.ProductSKU.toString(),
                      data.EventAttributes.ProductName.toString(),
                      data.EventAttributes.ProductCategory.toString(),
                      data.EventAttributes.ProductUnitPrice.toString(),
                      data.EventAttributes.ProductQuantity.toString()
                    ]);
                }

                _gaq.push(['_trackTrans']);
            }
            else {
                if (!isEcommerceLoaded) {
                    ga(createCmd('require'), 'ecommerce', 'ecommerce.js');
                    isEcommerceLoaded = true;
                }

                ga(createCmd('ecommerce:addTransaction'), {
                    'id': data.EventAttributes.TransactionID,
                    'affiliation': data.EventAttributes.TransactionAffiliation.toString(),
                    'revenue': data.EventAttributes.RevenueAmount.toString(),
                    'shipping': data.EventAttributes.ShippingAmount.toString(),
                    'tax': data.EventAttributes.TaxAmount.toString(),
                    'currency': data.EventAttributes.CurrencyCode.toString()
                });

                if (data.EventAttributes.ProductName) {
                    ga(createCmd('ecommerce:addItem'), {
                        'id': data.EventAttributes.TransactionID,
                        'name': data.EventAttributes.ProductName.toString(),
                        'sku': data.EventAttributes.ProductSKU.toString(),
                        'category': data.EventAttributes.ProductCategory.toString(),
                        'price': data.EventAttributes.ProductUnitPrice.toString(),
                        'quantity': data.EventAttributes.ProductQuantity.toString(),
                        'currency': data.EventAttributes.CurrencyCode.toString()
                    });
                }

                ga(createCmd('ecommerce:send'));
            }
        }

        function initForwarder(settings, service, testMode, tid) {
            try {
                forwarderSettings = settings;
                reportingService = service;
                isTesting = testMode;

                if (!tid) {
                    trackerId = createTrackerId();
                }
                else {
                    trackerId = tid;
                }

                if (forwarderSettings.classicMode == 'True') {
                    window._gaq = window._gaq || [];

                    if(testMode !== true) {
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
                }
                else {
                    if(testMode !== true) {
                        (function (i, s, o, g, r, a, m) {
                            i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
                                (i[r].q = i[r].q || []).push(arguments)
                            }, i[r].l = 1 * new Date(); a = s.createElement(o),
                            m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
                        })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
                    }

                    if (forwarderSettings.useLocalhostCookie == 'True') {
                        ga('create', {
                            'trackingId': forwarderSettings.apiKey,
                            'cookieDomain': 'none',
                            'name': trackerId
                        });
                    }
                    else {
                        ga('create', forwarderSettings.apiKey, 'auto', trackerId);
                    }

                    if (forwarderSettings.useDisplayFeatures == 'True') {
                        ga(createCmd('require'), 'displayfeatures');
                    }

                    if (forwarderSettings.useSecure == 'True') {
                        ga(createCmd('set'), 'forceSSL', true);
                    }
                }

                isInitialized = true;

                return 'Successfully initialized: ' + name;
            }
            catch (e) {
                return 'Failed to initialize: ' + name;
            }
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.setUserIdentity = setUserIdentity;
    };

    if (!window || !window.mParticle || !window.mParticle.addForwarder) {
        return;
    }

    window.mParticle.addForwarder({
        name: name,
        constructor: constructor
    });

})(window);
