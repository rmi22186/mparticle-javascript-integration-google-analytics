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
        version = '2.0.2',
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
        PAGE = 'Google.Page',
        VALUE = 'Google.Value',
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
                        targetDimensionsAndMetrics[mapLevel.customDimensions[customDimension]] = attributes[attrName];
                    }
                }
            }

            for (var customMetric in mapLevel.customMetrics) {
                for (attrName in attributes) {
                    if (customMetric === attrName) {
                        targetDimensionsAndMetrics[mapLevel.customMetrics[customMetric]] = attributes[attrName];
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

        function logCommerce(data, outputDimensionsAndMetrics, customFlags) {
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
                data.ProductImpressions.forEach(function(impression) {
                    impression.ProductList.forEach(function(product) {
                        addEcommerceProductImpression(product);
                    });
                });

                sendEcommerceEvent(data.EventCategory, outputDimensionsAndMetrics, customFlags);
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

                sendEcommerceEvent(data.EventCategory, outputDimensionsAndMetrics, customFlags);
            }
            else if (data.ProductAction) {
                if (data.ProductAction.ProductActionType == mParticle.ProductActionType.Purchase) {
                    data.ProductAction.ProductList.forEach(function(product) {
                        var updatedProductDimentionAndMetrics = {};
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product, updatedProductDimentionAndMetrics);
                    });

                    ga(createCmd('ec:setAction'), 'purchase', {
                        id: data.ProductAction.TransactionId,
                        affiliation: data.ProductAction.Affiliation,
                        revenue: data.ProductAction.TotalAmount,
                        tax: data.ProductAction.TaxAmount,
                        shipping: data.ProductAction.ShippingAmount,
                        coupon: data.ProductAction.CouponCode
                    });

                    sendEcommerceEvent(data.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.Refund) {
                    if (data.ProductAction.ProductList.length) {
                        data.ProductAction.ProductList.forEach(function(product) {
                            var productAttrs = {
                                id: product.Sku,
                                quantity: product.Quantity
                            };
                            applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, productAttrs, productLevelMap);
                            ga(createCmd('ec:addProduct'), productAttrs);
                        });
                    }

                    ga(createCmd('ec:setAction'), 'refund', {
                        id: data.ProductAction.TransactionId
                    });

                    sendEcommerceEvent(data.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.AddToCart ||
                    data.ProductAction.ProductActionType == mParticle.ProductActionType.RemoveFromCart) {
                    var updatedProductDimentionAndMetrics = {};
                    data.ProductAction.ProductList.forEach(function(product) {
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product, updatedProductDimentionAndMetrics);
                    });

                    ga(createCmd('ec:setAction'),
                        data.ProductAction.ProductActionType == mParticle.ProductActionType.AddToCart ? 'add' : 'remove');

                    sendEcommerceEvent(data.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.Checkout) {
                    data.ProductAction.ProductList.forEach(function(product) {
                        var updatedProductDimentionAndMetrics = {};
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product, updatedProductDimentionAndMetrics);
                    });

                    ga(createCmd('ec:setAction'), 'checkout', {
                        step: data.ProductAction.CheckoutStep,
                        option: data.ProductAction.CheckoutOptions
                    });

                    sendEcommerceEvent(data.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.Click) {
                    data.ProductAction.ProductList.forEach(function(product) {
                        var updatedProductDimentionAndMetrics = {};
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product, updatedProductDimentionAndMetrics);
                    });

                    ga(createCmd('ec:setAction'), 'click');
                    sendEcommerceEvent(data.EventCategory, outputDimensionsAndMetrics, customFlags);
                }
                else if (data.ProductAction.ProductActionType == mParticle.ProductActionType.ViewDetail) {
                    data.ProductAction.ProductList.forEach(function(product) {
                        var updatedProductDimentionAndMetrics = {};
                        applyCustomDimensionsMetricsForSourceAttributes(product.Attributes, updatedProductDimentionAndMetrics, productLevelMap);
                        addEcommerceProduct(product );
                    });

                    ga(createCmd('ec:setAction'), 'detail');
                    ga(createCmd('send'), customFlags && customFlags[HITTYPE] ? customFlags[HITTYPE] : 'event', 'eCommerce', getEventTypeName(data.EventCategory), outputDimensionsAndMetrics);
                }
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
                ga(createCmd('send'), customFlags && customFlags[HITTYPE] ? customFlags[HITTYPE] : 'pageview', outputDimensionsAndMetrics);
            }
        }

        function logEvent(data, outputDimensionsAndMetrics, customFlags) {
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
                    category = data.EventAttributes.category;
                }
            }

            if(data.CustomFlags) {
                var googleCategory = data.CustomFlags[CATEGORY],
                    googleLabel = data.CustomFlags[LABEL],
                    googleValue = parseInt(data.CustomFlags[VALUE], 10);

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
                    customFlags && customFlags[HITTYPE] ? customFlags[HITTYPE] : 'event',
                    category,
                    data.EventName,
                    label,
                    value,
                    outputDimensionsAndMetrics);
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
                                eventLevelMap['customDimensions'][dimension.map] = formatDimensionOrMetric(dimension.value);
                            } else if (dimension.maptype === 'UserAttributeClass.Name') {
                                userLevelMap['customDimensions'][dimension.map] = formatDimensionOrMetric(dimension.value);
                            } else if (dimension.maptype === 'ProductAttributeSelector.Name') {
                                productLevelMap['customDimensions'][dimension.map] = formatDimensionOrMetric(dimension.value);
                            }
                        });
                    }

                    if (forwarderSettings.customMetrics) {
                        var customMetrics = JSON.parse(forwarderSettings.customMetrics.replace(/&quot;/g, '\"'));
                        customMetrics.forEach(function(metric) {
                            if (metric.maptype === 'EventAttributeClass.Name') {
                                eventLevelMap['customMetrics'][metric.map] = formatDimensionOrMetric(metric.value);
                            } else if (metric.maptype === 'UserAttributeClass.Name') {
                                userLevelMap['customMetrics'][metric.map] = formatDimensionOrMetric(metric.value);
                            } else if (metric.maptype === 'ProductAttributeSelector.Name') {
                                productLevelMap['customMetrics'][metric.map] = formatDimensionOrMetric(metric.value);
                            }
                        });
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
