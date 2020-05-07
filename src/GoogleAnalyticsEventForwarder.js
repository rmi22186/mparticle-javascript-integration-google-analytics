/* eslint-disable no-undef*/
//
//  Copyright 2019 mParticle, Inc.
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

    var name = 'GoogleAnalyticsEventForwarder',
        moduleId = 6,
        version = '2.0.4',
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        },
        trackerCount = 1,
        NON_INTERACTION_FLAG = 'Google.NonInteraction',
        CATEGORY = 'Google.Category',
        LABEL = 'Google.Label',
        TITLE = 'Google.Title'
        PAGE = 'Google.Page',
        VALUE = 'Google.Value',
        USERTIMING = 'Google.UserTiming',
        HITTYPE = 'Google.HitType';

    var constructor = function() {
        var self = this,
            isInitialized = false,
            isEnhancedEcommerceLoaded = false,
            forwarderSettings,
            reportingService,
            trackerId = null,
            eventLevelMap = {
                customDimensions: {},
                customMetrics: {}
            },
            userLevelMap = {
                customDimensions: {},
                customMetrics: {}
            },
            productLevelMap = {
                customDimensions: {},
                customMetrics: {}
            };

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

        function formatDimensionOrMetric(attr) {
            return attr.replace(/ /g, '').toLowerCase();
        }

        function applyCustomDimensionsAndMetrics(event, outputDimensionsAndMetrics) {
            // apply custom dimensions and metrics to each event, product, or user if respective attributes exist
            if (event.EventAttributes && Object.keys(event.EventAttributes).length) {
                applyCustomDimensionsMetricsForSourceAttributes(event.EventAttributes, outputDimensionsAndMetrics, eventLevelMap);
            }

            if (event.UserAttributes && Object.keys(event.UserAttributes).length) {
                applyCustomDimensionsMetricsForSourceAttributes(event.UserAttributes, outputDimensionsAndMetrics, userLevelMap);
            }
        }

        function applyCustomDimensionsMetricsForSourceAttributes(attributes, targetDimensionsAndMetrics, mapLevel) {
            for (var customDimension in mapLevel.customDimensions) {
                for (attrName in attributes) {
                    if (customDimension === attrName) {
                        mapLevel.customDimensions[customDimension].forEach(function(cd) {
                            if (!targetDimensionsAndMetrics[cd]) {
                                targetDimensionsAndMetrics[cd] = attributes[attrName];
                            }
                        })
                    }
                }
            }

            for (var customMetric in mapLevel.customMetrics) {
                for (attrName in attributes) {
                    if (customMetric === attrName) {
                        mapLevel.customMetrics[customMetric].forEach(function(cm) {
                            if (!targetDimensionsAndMetrics[cm]) {
                                targetDimensionsAndMetrics[cm] = attributes[attrName];
                            }
                        })
                    }
                }
            }
        }

        function applyCustomFlags(flags, outputDimensionsAndMetrics) {
            if (flags.hasOwnProperty(NON_INTERACTION_FLAG)) {
                outputDimensionsAndMetrics['nonInteraction'] = flags[NON_INTERACTION_FLAG];
            }
        }

        function processEvent(event) {
            var outputDimensionsAndMetrics = {};
            var reportEvent = false;

            if (isInitialized) {
                event.ExpandedEventCount = 0;

                applyCustomDimensionsAndMetrics(event, outputDimensionsAndMetrics);

                if (event.CustomFlags && Object.keys(event.CustomFlags).length) {
                    applyCustomFlags(event.CustomFlags, outputDimensionsAndMetrics);
                }

                try {
                    if (event.EventDataType == MessageType.PageView) {
                        logPageView(event, outputDimensionsAndMetrics, event.CustomFlags);
                        reportEvent = true;
                    }
                    else if (event.EventDataType == MessageType.Commerce) {
                        logCommerce(event, outputDimensionsAndMetrics, event.CustomFlags);
                        reportEvent = true;
                    }
                    else if (event.EventDataType == MessageType.PageEvent) {
                        reportEvent = true;

                        logEvent(event, outputDimensionsAndMetrics, event.CustomFlags);
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
            if (window.mParticle.getVersion().split('.')[0] === '1') {
                if (isInitialized) {
                    if (forwarderSettings.useCustomerId == 'True' && type == window.mParticle.IdentityType.CustomerId) {
                        if (forwarderSettings.classicMode == 'True') {
                            // ga.js not supported currently
                        }
                        else {
                            ga(createCmd('set'), 'userId', window.mParticle.generateHash(id));
                        }
                    }
                }
                else {
                    return 'Can\'t call setUserIdentity on forwarder ' + name + ', not initialized';
                }
            }
        }

        function onUserIdentified(user) {
            var userIdentities = user.getUserIdentities().userIdentities;
            if (isInitialized) {
                if (forwarderSettings.useCustomerId == 'True' && userIdentities.customerid) {
                    if (forwarderSettings.classicMode !== 'True') {
                        ga(createCmd('set'), 'userId', window.mParticle.generateHash(userIdentities.customerid));
                    }
                }
            }
        }

        function addEcommerceProduct(product, updatedProductDimentionAndMetrics) {
            var productAttrs = {
                id: product.Sku,
                name: product.Name,
                category: product.Category,
                brand: product.Brand,
                variant: product.Variant,
                price: product.Price,
                coupon: product.CouponCode,
                quantity: product.Quantity
            };

            for (var attr in updatedProductDimentionAndMetrics) {
                if (updatedProductDimentionAndMetrics.hasOwnProperty(attr)) {
                    productAttrs[attr] = updatedProductDimentionAndMetrics[attr];
                }
            }

            ga(createCmd('ec:addProduct'), productAttrs);
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

        function sendEcommerceEvent(type, outputDimensionsAndMetrics, customFlags) {
            ga(createCmd('send'), customFlags && customFlags[HITTYPE] ? customFlags[HITTYPE] : 'event', 'eCommerce', getEventTypeName(type), outputDimensionsAndMetrics);
        }

        function logCommerce(event, outputDimensionsAndMetrics, customFlags) {
            if (!isEnhancedEcommerceLoaded) {
                ga(createCmd('require'), 'ec');
                isEnhancedEcommerceLoaded = true;
            }

            if (event.CurrencyCode) {
                // Set currency code if present
                ga(createCmd('set'), '&cu', event.CurrencyCode);
            }

            if (event.ProductImpressions) {
                // Impression event
                event.ProductImpressions.forEach(function(impression) {
                    impression.ProductList.forEach(function(product) {
                        addEcommerceProductImpression(product);
                    });
                });

                sendEcommerceEvent(event.EventCategory, outputDimensionsAndMetrics, customFlags);
            }
            else if (event.PromotionAction) {
                // Promotion event
                event.PromotionAction.PromotionList.forEach(function(promotion) {
                    ga(createCmd('ec:addPromo'), {
                        id: promotion.Id,
                        name: promotion.Name,
                        creative: promotion.Creative,
                        position: promotion.Position
                    });
                });

                if (event.PromotionAction.PromotionActionType == mParticle.PromotionType.PromotionClick) {
                    ga(createCmd('ec:setAction'), 'promo_click');
                }

                sendEcommerceEvent(event.EventCategory, outputDimensionsAndMetrics, customFlags);
            }
            else if (event.ProductAction) {
                if (event.ProductAction.ProductActionType == mParticle.ProductActionType.Purchase) {
                    event.ProductAction.ProductList.forEach(function(product) {
                        var updatedProductDimentionAndMetrics = {};
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product, updatedProductDimentionAndMetrics);
                    });

                    ga(createCmd('ec:setAction'), 'purchase', {
                        id: event.ProductAction.TransactionId,
                        affiliation: event.ProductAction.Affiliation,
                        revenue: event.ProductAction.TotalAmount,
                        tax: event.ProductAction.TaxAmount,
                        shipping: event.ProductAction.ShippingAmount,
                        coupon: event.ProductAction.CouponCode
                    });

                    sendEcommerceEvent(event.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (event.ProductAction.ProductActionType == mParticle.ProductActionType.Refund) {
                    if (event.ProductAction.ProductList.length) {
                        event.ProductAction.ProductList.forEach(function(product) {
                            var productAttrs = {
                                id: product.Sku,
                                quantity: product.Quantity
                            };
                            applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, productAttrs, productLevelMap);
                            ga(createCmd('ec:addProduct'), productAttrs);
                        });
                    }

                    ga(createCmd('ec:setAction'), 'refund', {
                        id: event.ProductAction.TransactionId
                    });

                    sendEcommerceEvent(event.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (event.ProductAction.ProductActionType == mParticle.ProductActionType.AddToCart ||
                    event.ProductAction.ProductActionType == mParticle.ProductActionType.RemoveFromCart) {
                    var updatedProductDimentionAndMetrics = {};
                    event.ProductAction.ProductList.forEach(function(product) {
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product, updatedProductDimentionAndMetrics);
                    });

                    ga(createCmd('ec:setAction'),
                        event.ProductAction.ProductActionType == mParticle.ProductActionType.AddToCart ? 'add' : 'remove');

                    sendEcommerceEvent(event.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (event.ProductAction.ProductActionType == mParticle.ProductActionType.Checkout) {
                    event.ProductAction.ProductList.forEach(function(product) {
                        var updatedProductDimentionAndMetrics = {};
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product, updatedProductDimentionAndMetrics);
                    });

                    ga(createCmd('ec:setAction'), 'checkout', {
                        step: event.ProductAction.CheckoutStep,
                        option: event.ProductAction.CheckoutOptions
                    });

                    sendEcommerceEvent(event.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (event.ProductAction.ProductActionType == mParticle.ProductActionType.Click) {
                    event.ProductAction.ProductList.forEach(function(product) {
                        var updatedProductDimentionAndMetrics = {};
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product, updatedProductDimentionAndMetrics);
                    });

                    ga(createCmd('ec:setAction'), 'click');
                    sendEcommerceEvent(event.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (event.ProductAction.ProductActionType == mParticle.ProductActionType.ViewDetail) {
                    event.ProductAction.ProductList.forEach(function(product) {
                        var updatedProductDimentionAndMetrics = {};
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product );
                    });

                    ga(createCmd('ec:setAction'), 'detail');
                    ga(createCmd('send'), customFlags && customFlags[HITTYPE] ? customFlags[HITTYPE] : 'event', 'eCommerce', getEventTypeName(event.EventCategory), outputDimensionsAndMetrics);
                }

                sendOptionalUserTimingMessage(event, outputDimensionsAndMetrics);
            }
        }

        function logPageView(event, outputDimensionsAndMetrics, customFlags) {
            if (forwarderSettings.classicMode == 'True') {
                _gaq.push(['_trackPageview']);
            }
            else {
                if (event.CustomFlags && event.CustomFlags[PAGE]) {
                    ga(createCmd('set'), 'page', event.CustomFlags[PAGE]);
                }
                if (event.CustomFlags && event.CustomFlags[TITLE]){
                    ga(createCmd('set'), 'title', event.CustomFlags[TITLE]);
                }
                ga(createCmd('send'), customFlags && customFlags[HITTYPE] ? customFlags[HITTYPE] : 'pageview', outputDimensionsAndMetrics);
                sendOptionalUserTimingMessage(event, outputDimensionsAndMetrics);
            }
        }

        function logEvent(event, outputDimensionsAndMetrics, customFlags) {
            var label = '',
                category = getEventTypeName(event.EventCategory),
                value;

            if (event.EventAttributes) {
                if (event.EventAttributes.label) {
                    label = event.EventAttributes.label;
                }

                if (event.EventAttributes.value) {
                    value = parseInt(event.EventAttributes.value, 10);

                    // Test for NaN
                    if (value != value) {
                        value = null;
                    }
                }

                if (event.EventAttributes.category) {
                    category = event.EventAttributes.category;
                }
            }

            if (event.CustomFlags) {
                var googleCategory = event.CustomFlags[CATEGORY],
                    googleLabel = event.CustomFlags[LABEL],
                    googleValue = parseInt(event.CustomFlags[VALUE], 10);

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
                    event.EventName,
                    label,
                    value]);
            }
            else {
                ga(createCmd('send'),
                    customFlags && customFlags[HITTYPE] ? customFlags[HITTYPE] : 'event',
                    category,
                    event.EventName,
                    label,
                    value,
                    outputDimensionsAndMetrics
                );

                sendOptionalUserTimingMessage(event, outputDimensionsAndMetrics);
            }
        }

        function sendOptionalUserTimingMessage(event, outputDimensionsAndMetrics) {
            // only if there is a custom flag of Google.UserTiming should a user timing message be sent
            if (event.CustomFlags && event.CustomFlags[USERTIMING] && typeof(event.CustomFlags[USERTIMING]) === 'number') {
                var userTimingObject = {
                    hitType: 'timing',
                    timingVar: event.EventName,
                    timingValue: event.CustomFlags[USERTIMING],
                    timingCategory: event.CustomFlags[CATEGORY] || getEventTypeName(event.EventCategory),
                    timingLabel: event.CustomFlags[LABEL] || null,
                };

                for (var key in outputDimensionsAndMetrics) {
                    if (outputDimensionsAndMetrics.hasOwnProperty(key)) {
                        userTimingObject[key] = outputDimensionsAndMetrics[key];
                    }
                }

                ga(createCmd('send'), userTimingObject);
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

                        (function() {
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
                        (function(i, s, o, g, r, a, m) {
                            i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function() {
                                (i[r].q = i[r].q || []).push(arguments);
                            }, i[r].l = 1 * new Date(); a = s.createElement(o),
                            m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m);
                        })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
                    }

                    var fieldsObject = {
                        trackingId:forwarderSettings.apiKey,
                        name: trackerId
                    };

                    if (forwarderSettings.useLocalhostCookie == 'True') {
                        fieldsObject.cookieDomain = 'none';
                    }

                    if (forwarderSettings.clientIdentificationType === 'AMP') {
                        fieldsObject.useAmpClientId = true;
                    }

                    ga('create', fieldsObject);

                    if (forwarderSettings.useDisplayFeatures == 'True') {
                        ga(createCmd('require'), 'displayfeatures');
                    }

                    if (forwarderSettings.useSecure == 'True') {
                        ga(createCmd('set'), 'forceSSL', true);
                    }

                    if (forwarderSettings.customDimensions) {
                        var customDimensions = JSON.parse(forwarderSettings.customDimensions.replace(/&quot;/g, '\"'));
                        customDimensions.forEach(function(dimension) {
                            if (dimension.maptype === 'EventAttributeClass.Name') {
                                addTypeToMapping(eventLevelMap, 'customDimensions', dimension);
                            } else if (dimension.maptype === 'UserAttributeClass.Name') {
                                addTypeToMapping(userLevelMap, 'customDimensions', dimension);
                            } else if (dimension.maptype === 'ProductAttributeSelector.Name') {
                                addTypeToMapping(productLevelMap, 'customDimensions', dimension);
                            }
                        });
                    }

                    if (forwarderSettings.customMetrics) {
                        var customMetrics = JSON.parse(forwarderSettings.customMetrics.replace(/&quot;/g, '\"'));
                        customMetrics.forEach(function(metric) {
                            if (metric.maptype === 'EventAttributeClass.Name') {
                                addTypeToMapping(eventLevelMap, 'customMetrics', metric);
                            } else if (metric.maptype === 'UserAttributeClass.Name') {
                                addTypeToMapping(userLevelMap, 'customMetrics', metric);
                            } else if (metric.maptype === 'ProductAttributeSelector.Name') {
                                addTypeToMapping(productLevelMap, 'customMetrics', metric);
                            }
                        });
                    }
                }

                isInitialized = true;
                
                if (window.mParticle.getVersion().split('.')[0] === '2') {
                    onUserIdentified(mParticle.Identity.getCurrentUser());
                }

                return 'Successfully initialized: ' + name;
            }
            catch (e) {
                return 'Failed to initialize: ' + name;
            }
        }

        function addTypeToMapping(map, type, mapVal) {
            var formattedMapVal = formatDimensionOrMetric(mapVal.value);
            if (!map[type][mapVal.map]) {
                map[type][mapVal.map] = [formattedMapVal]
                return;
            }

            if (!map[type][mapVal.map].indexOf(mapVal.value) >= 0) {
                map[type][mapVal.map].push(formattedMapVal)
            }
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.setUserIdentity = setUserIdentity;
        this.onUserIdentified = onUserIdentified;
    };

    function getId() {
        return moduleId;
    }

    function isObject(val) {
        return val != null && typeof val === 'object' && Array.isArray(val) === false;
    }

    function register(config) {
        if (!config) {
            window.console.log('You must pass a config object to register the kit ' + name);
            return;
        }

        if (!isObject(config)) {
            window.console.log('\'config\' must be an object. You passed in a ' + typeof config);
            return;
        }

        if (isObject(config.kits)) {
            config.kits[name] = {
                constructor: constructor
            };
        } else {
            config.kits = {};
            config.kits[name] = {
                constructor: constructor
            };
        }
        window.console.log('Successfully registered ' + name + ' to your mParticle configuration');
    }

    if (window && window.mParticle && window.mParticle.addForwarder) {
        window.mParticle.addForwarder({
            name: name,
            constructor: constructor,
            getId: getId
        });
    }

    module.exports = {
        register: register,
        getVersion: function() {
            return version;
        }
    };
