/* eslint-disable no-undef*/

describe('Google Analytics Forwarder', function() {
    var MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16,
        },
        CommerceEventType = {
            ProductAddToCart: 10,
            ProductRemoveFromCart: 11,
            ProductCheckout: 12,
            ProductCheckoutOption: 13,
            ProductClick: 14,
            ProductViewDetail: 15,
            ProductPurchase: 16,
            ProductRefund: 17,
            PromotionView: 18,
            PromotionClick: 19,
            ProductAddToWishlist: 20,
            ProductRemoveFromWishlist: 21,
            ProductImpression: 22,
        },
        EventType = {
            Unknown: 0,
            Navigation: 1,
            Location: 2,
            Search: 3,
            Transaction: 4,
            UserContent: 5,
            UserPreference: 6,
            Social: 7,
            Other: 8,
            Media: 9,
            getName: function(id) {
                switch (id) {
                    case EventType.Navigation:
                        return 'Navigation';
                    case EventType.Location:
                        return 'Location';
                    case EventType.Search:
                        return 'Search';
                    case EventType.Transaction:
                        return 'Transaction';
                    case EventType.UserContent:
                        return 'User Content';
                    case EventType.UserPreference:
                        return 'User Preference';
                    case EventType.Social:
                        return 'Social';
                    case CommerceEventType.ProductAddToCart:
                        return 'Product Added to Cart';
                    case CommerceEventType.ProductAddToWishlist:
                        return 'Product Added to Wishlist';
                    case CommerceEventType.ProductCheckout:
                        return 'Product Checkout';
                    case CommerceEventType.ProductCheckoutOption:
                        return 'Product Checkout Options';
                    case CommerceEventType.ProductClick:
                        return 'Product Click';
                    case CommerceEventType.ProductImpression:
                        return 'Product Impression';
                    case CommerceEventType.ProductPurchase:
                        return 'Product Purchased';
                    case CommerceEventType.ProductRefund:
                        return 'Product Refunded';
                    case CommerceEventType.ProductRemoveFromCart:
                        return 'Product Removed From Cart';
                    case CommerceEventType.ProductRemoveFromWishlist:
                        return 'Product Removed from Wishlist';
                    case CommerceEventType.ProductViewDetail:
                        return 'Product View Details';
                    case CommerceEventType.PromotionClick:
                        return 'Promotion Click';
                    case CommerceEventType.PromotionView:
                        return 'Promotion View';
                    default:
                        return 'Other';
                }
            },
        },
        ProductActionType = {
            Unknown: 0,
            AddToCart: 1,
            RemoveFromCart: 2,
            Checkout: 3,
            CheckoutOption: 4,
            Click: 5,
            ViewDetail: 6,
            Purchase: 7,
            Refund: 8,
            AddToWishlist: 9,
            RemoveFromWishlist: 10,
        },
        IdentityType = {
            Other: 0,
            CustomerId: 1,
            Facebook: 2,
            Twitter: 3,
            Google: 4,
            Microsoft: 5,
            Yahoo: 6,
            Email: 7,
            Alias: 8,
            FacebookCustomAudienceId: 9,
            getName: function() {
                return 'CustomerID';
            },
        },
        PromotionActionType = {
            Unknown: 0,
            PromotionView: 1,
            PromotionClick: 2,
        },
        ReportingService = function() {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function(forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function() {
                this.id = null;
                this.event = null;
            };
        },
        reportService = new ReportingService();

    before(function() {
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.PromotionType = PromotionActionType;
        mParticle.IdentityType = IdentityType;
        mParticle.generateHash = function(name) {
            var hash = 0,
                i = 0,
                character;

            if (!name) {
                return null;
            }

            name = name.toString().toLowerCase();

            if (Array.prototype.reduce) {
                return name.split('').reduce(function(a, b) {
                    a = (a << 5) - a + b.charCodeAt(0);
                    return a & a;
                }, 0);
            }

            if (name.length === 0) {
                return hash;
            }

            for (i = 0; i < name.length; i++) {
                character = name.charCodeAt(i);
                hash = (hash << 5) - hash + character;
                hash = hash & hash;
            }

            return hash;
        };
    });

    beforeEach(function() {
        mParticle.forwarder.init(
            {
                useCustomerId: 'True',
                customDimensions:
                    '[{ \
                &quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 1&quot;,&quot;map&quot;:&quot;color&quot;},{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 2&quot;,&quot;map&quot;:&quot;gender&quot;},{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 3&quot;,&quot;map&quot;:&quot;size&quot;}, \
                {&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;Dimension 1&quot;,&quot;map&quot;:&quot;color&quot;},{&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;Dimension 2&quot;,&quot;map&quot;:&quot;gender&quot;},{&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;Dimension 3&quot;,&quot;map&quot;:&quot;size&quot;}, \
                {&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 1&quot;,&quot;map&quot;:&quot;color&quot;},{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 2&quot;,&quot;map&quot;:&quot;gender&quot;},{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 3&quot;,&quot;map&quot;:&quot;size&quot;}]',

                customMetrics:
                    '[{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 1&quot;,&quot;map&quot;:&quot;levels&quot;},{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 2&quot;,&quot;map&quot;:&quot;shots&quot;},{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 3&quot;,&quot;map&quot;:&quot;players&quot;}, \
                {&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;Metric 1&quot;,&quot;map&quot;:&quot;levels&quot;},{&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;Metric 2&quot;,&quot;map&quot;:&quot;shots&quot;},{&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;Metric 3&quot;,&quot;map&quot;:&quot;players&quot;}, \
                {&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 1&quot;,&quot;map&quot;:&quot;levels&quot;},{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 2&quot;,&quot;map&quot;:&quot;shots&quot;},{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 3&quot;,&quot;map&quot;:&quot;players&quot;}]',
            },
            reportService.cb,
            true,
            'tracker-name'
        );
        window.googleanalytics.reset();
        window._gaq = [];
    });

    it('should initialize with ampClientId if clientIdentificationType is AMP', function(done) {
        window.googleanalytics.reset();

        mParticle.forwarder.init(
            {
                clientIdentificationType: 'AMP',
            },
            reportService.cb,
            true,
            'tracker-name'
        );

        window.googleanalytics.args[0][0].should.equal('create');
        window.googleanalytics.args[0][1].should.have.properties(
            'name',
            'trackingId',
            'useAmpClientId'
        );
        window.googleanalytics.args[0][1].should.have.property(
            'useAmpClientId',
            true
        );

        done();
    });

    it('should change page name for custom flag', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'Test Page Event',
            EventAttributes: {
                anything: 'foo',
            },
            CustomFlags: {
                'Google.Page': 'foo page',
            },
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.set');
        window.googleanalytics.args[0][1].should.equal('page');
        window.googleanalytics.args[0][2].should.equal('foo page');

        done();
    });

    it('should log custom dimensions and custom event with an event log and custom flag', function(done) {
        var event = {
            EventDataType: MessageType.PageEvent,
            EventName: 'Test Event',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category',
                gender: 'female',
                color: 'blue',
                size: 'large',
                levels: 1,
                shots: 15,
                players: 3,
            },
        };

        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal('tracker-name.send');
        window.googleanalytics.args[0][1].should.equal('event');
        window.googleanalytics.args[0][2].should.equal('category');
        window.googleanalytics.args[0][3].should.equal('Test Event');
        window.googleanalytics.args[0][4].should.equal('label');
        window.googleanalytics.args[0][5].should.equal(200);
        window.googleanalytics.args[0][6].should.have.property(
            'dimension1',
            'blue'
        );
        window.googleanalytics.args[0][6].should.have.property(
            'dimension2',
            'female'
        );
        window.googleanalytics.args[0][6].should.have.property(
            'dimension3',
            'large'
        );
        window.googleanalytics.args[0][6].should.have.property('metric1', 1);
        window.googleanalytics.args[0][6].should.have.property('metric2', 15);
        window.googleanalytics.args[0][6].should.have.property('metric3', 3);

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };

        mParticle.forwarder.process(event);
        window.googleanalytics.args[0][1].should.equal('abcdef');

        done();
    });

    it('should log custom dimensions and metrics with a product purchase', function(done) {
        var event = {
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductPurchase,
            ProductAction: {
                ProductActionType: ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        CouponCode: null,
                        Quantity: 1,
                        Attributes: {
                            gender: 'female',
                            color: 'blue',
                            size: 'large',
                            levels: 1,
                            shots: 15,
                            players: 3,
                        },
                    },
                ],
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 450,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null,
            },
        };
        mParticle.forwarder.process(event);

        window.googleanalytics.args[1][0].should.equal(
            'tracker-name.ec:addProduct'
        );
        window.googleanalytics.args[1][1].should.have.property('id', '12345');
        window.googleanalytics.args[1][1].should.have.property(
            'name',
            'iPhone 6'
        );
        window.googleanalytics.args[1][1].should.have.property(
            'category',
            'Phones'
        );
        window.googleanalytics.args[1][1].should.have.property(
            'brand',
            'iPhone'
        );
        window.googleanalytics.args[1][1].should.have.property('variant', '6');
        window.googleanalytics.args[1][1].should.have.property('price', 400);
        window.googleanalytics.args[1][1].should.have.property('coupon', null);
        window.googleanalytics.args[1][1].should.have.property('quantity', 1);
        window.googleanalytics.args[1][1].should.have.property(
            'dimension1',
            'blue'
        );
        window.googleanalytics.args[1][1].should.have.property(
            'dimension2',
            'female'
        );
        window.googleanalytics.args[1][1].should.have.property(
            'dimension3',
            'large'
        );
        window.googleanalytics.args[1][1].should.have.property('metric1', 1);
        window.googleanalytics.args[1][1].should.have.property('metric2', 15);
        window.googleanalytics.args[1][1].should.have.property('metric3', 3);

        window.googleanalytics.args[2][0].should.equal(
            'tracker-name.ec:setAction'
        );
        window.googleanalytics.args[2][1].should.equal('purchase');
        window.googleanalytics.args[2][2].should.have.property('id', 123);
        window.googleanalytics.args[2][2].should.have.property(
            'affiliation',
            'my-affiliation'
        );
        window.googleanalytics.args[2][2].should.have.property('revenue', 450);
        window.googleanalytics.args[2][2].should.have.property('tax', 40);
        window.googleanalytics.args[2][2].should.have.property('shipping', 10);
        window.googleanalytics.args[2][2].should.have.property('coupon', null);

        window.googleanalytics.args[3][0].should.equal('tracker-name.send');
        window.googleanalytics.args[3][1].should.equal('event');
        window.googleanalytics.args[3][2].should.equal('eCommerce');
        window.googleanalytics.args[3][3].should.equal('Product Purchased');

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[2][1].should.equal('abcdef');

        done();
    });

    it('should log custom dimensions and metrics based on user attribute', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionView,
                PromotionList: [
                    {
                        Id: 12345,
                        Creative: 'my creative',
                        Name: 'Test promotion',
                        Position: 3,
                    },
                ],
            },
            UserAttributes: {
                gender: 'female',
                color: 'blue',
                size: 'large',
                levels: 1,
                shots: 15,
                players: 3,
            },
        });

        window.googleanalytics.args[1][4].should.have.property(
            'dimension1',
            'blue'
        );
        window.googleanalytics.args[1][4].should.have.property(
            'dimension2',
            'female'
        );
        window.googleanalytics.args[1][4].should.have.property(
            'dimension3',
            'large'
        );
        window.googleanalytics.args[1][4].should.have.property('metric1', 1);
        window.googleanalytics.args[1][4].should.have.property('metric2', 15);
        window.googleanalytics.args[1][4].should.have.property('metric3', 3);
        done();
    });

    it('should log events as non-interaction or interaction when provided with flag', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionView,
                PromotionList: [
                    {
                        Id: 12345,
                        Creative: 'my creative',
                        Name: 'Test promotion',
                        Position: 3,
                    },
                ],
            },
            CustomFlags: {
                'Google.NonInteraction': true,
            },
        });

        window.googleanalytics.args[1][4].should.have.property(
            'nonInteraction',
            true
        );

        done();
    });

    it('should log event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventName: 'Test Event',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category',
            },
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.send');
        window.googleanalytics.args[0][1].should.equal('event');
        window.googleanalytics.args[0][2].should.equal('category');
        window.googleanalytics.args[0][3].should.equal('Test Event');
        window.googleanalytics.args[0][4].should.equal('label');
        window.googleanalytics.args[0][5].should.equal(200);

        done();
    });

    it('should log page view', function(done) {
        var event = {
            EventDataType: MessageType.PageView,
        };
        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal('tracker-name.send');
        window.googleanalytics.args[0][1].should.equal('pageview');

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[0][1].should.equal('abcdef');

        done();
    });

    it('should log commerce event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductPurchase,
            ProductAction: {
                ProductActionType: ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        CouponCode: null,
                        Quantity: 1,
                    },
                ],
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 450,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null,
            },
        });

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addProduct'
        );
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property(
            'name',
            'iPhone 6'
        );
        window.googleanalytics.args[0][1].should.have.property(
            'category',
            'Phones'
        );
        window.googleanalytics.args[0][1].should.have.property(
            'brand',
            'iPhone'
        );
        window.googleanalytics.args[0][1].should.have.property('variant', '6');
        window.googleanalytics.args[0][1].should.have.property('price', 400);
        window.googleanalytics.args[0][1].should.have.property('coupon', null);
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal(
            'tracker-name.ec:setAction'
        );
        window.googleanalytics.args[1][1].should.equal('purchase');
        window.googleanalytics.args[1][2].should.have.property('id', 123);
        window.googleanalytics.args[1][2].should.have.property(
            'affiliation',
            'my-affiliation'
        );
        window.googleanalytics.args[1][2].should.have.property('revenue', 450);
        window.googleanalytics.args[1][2].should.have.property('tax', 40);
        window.googleanalytics.args[1][2].should.have.property('shipping', 10);
        window.googleanalytics.args[1][2].should.have.property('coupon', null);

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('Product Purchased');

        done();
    });

    it('should log refund', function(done) {
        var event = {
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductRefund,
            ProductAction: {
                ProductActionType: ProductActionType.Refund,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1,
                    },
                ],
                TransactionId: 123,
            },
        };
        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addProduct'
        );
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal(
            'tracker-name.ec:setAction'
        );
        window.googleanalytics.args[1][1].should.equal('refund');
        window.googleanalytics.args[1][2].should.have.property('id', 123);

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('Product Refunded');

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[2][1].should.equal('abcdef');

        done();
    });

    it('should log add to cart', function(done) {
        var event = {
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductAddToCart,
            ProductAction: {
                ProductActionType: ProductActionType.AddToCart,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1,
                    },
                ],
            },
        };
        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addProduct'
        );
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal(
            'tracker-name.ec:setAction'
        );
        window.googleanalytics.args[1][1].should.equal('add');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('Product Added to Cart');

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[2][1].should.equal('abcdef');

        done();
    });

    it('should log remove from cart', function(done) {
        var event = {
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductRemoveFromCart,
            ProductAction: {
                ProductActionType: ProductActionType.RemoveFromCart,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1,
                    },
                ],
            },
        };

        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addProduct'
        );
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal(
            'tracker-name.ec:setAction'
        );
        window.googleanalytics.args[1][1].should.equal('remove');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal(
            'Product Removed From Cart'
        );

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[2][1].should.equal('abcdef');

        done();
    });

    it('should log checkout', function(done) {
        var event = {
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductCheckout,
            ProductAction: {
                ProductActionType: ProductActionType.Checkout,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1,
                    },
                ],
                CheckoutStep: 1,
                CheckoutOptions: 'Visa',
            },
        };
        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addProduct'
        );
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal(
            'tracker-name.ec:setAction'
        );
        window.googleanalytics.args[1][1].should.equal('checkout');
        window.googleanalytics.args[1][2].should.have.property('step', 1);
        window.googleanalytics.args[1][2].should.have.property(
            'option',
            'Visa'
        );

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('Product Checkout');

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[2][1].should.equal('abcdef');

        done();
    });

    it('should log product click', function(done) {
        var event = {
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductClick,
            ProductAction: {
                ProductActionType: ProductActionType.Click,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1,
                    },
                ],
            },
        };
        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addProduct'
        );
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal(
            'tracker-name.ec:setAction'
        );
        window.googleanalytics.args[1][1].should.equal('click');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('Product Click');

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[2][1].should.equal('abcdef');

        done();
    });

    it('it should log product view detail', function(done) {
        var event = {
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductViewDetail,
            ProductAction: {
                ProductActionType: ProductActionType.ViewDetail,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1,
                    },
                ],
            },
        };

        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addProduct'
        );
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal(
            'tracker-name.ec:setAction'
        );
        window.googleanalytics.args[1][1].should.equal('detail');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('Product View Details');

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[2][1].should.equal('abcdef');

        done();
    });

    it('it should log product impressions', function(done) {
        var event = {
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductImpression,
            ProductImpressions: [
                {
                    ProductImpressionList: 'Test',
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: 'S',
                        },
                    ],
                },
            ],
        };
        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addImpression'
        );
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property(
            'name',
            'iPhone 6'
        );
        window.googleanalytics.args[0][1].should.have.property(
            'category',
            'Phones'
        );
        window.googleanalytics.args[0][1].should.have.property(
            'brand',
            'iPhone'
        );
        window.googleanalytics.args[0][1].should.have.property('variant', 'S');

        window.googleanalytics.args[1][0].should.equal('tracker-name.send');
        window.googleanalytics.args[1][1].should.equal('event');
        window.googleanalytics.args[1][2].should.equal('eCommerce');
        window.googleanalytics.args[1][3].should.equal('Product Impression');

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[1][1].should.equal('abcdef');

        done();
    });

    it('it should set user identity', function(done) {
        mParticle.forwarder.setUserIdentity(
            'tbreffni@mparticle.com',
            IdentityType.CustomerId
        );

        window.googleanalytics.args[0][0].should.equal('tracker-name.set');
        window.googleanalytics.args[0][1].should.equal('userId');
        window.googleanalytics.args[0][2].should.equal(
            mParticle.generateHash('tbreffni@mparticle.com')
        );

        done();
    });

    it('should log promotion view', function(done) {
        var event = {
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.PromotionView,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionView,
                PromotionList: [
                    {
                        Id: 12345,
                        Creative: 'my creative',
                        Name: 'Test promotion',
                        Position: 3,
                    },
                ],
            },
        };
        mParticle.forwarder.process(event);

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addPromo'
        );
        window.googleanalytics.args[0][1].should.have.property('id', 12345);
        window.googleanalytics.args[0][1].should.have.property(
            'name',
            'Test promotion'
        );
        window.googleanalytics.args[0][1].should.have.property(
            'creative',
            'my creative'
        );
        window.googleanalytics.args[0][1].should.have.property('position', 3);

        window.googleanalytics.args[1][0].should.equal('tracker-name.send');
        window.googleanalytics.args[1][1].should.equal('event');
        window.googleanalytics.args[1][2].should.equal('eCommerce');
        window.googleanalytics.args[1][3].should.equal('Promotion View');

        window.googleanalytics.args = [];

        event.CustomFlags = { 'Google.HitType': 'abcdef' };
        mParticle.forwarder.process(event);
        window.googleanalytics.args[1][1].should.equal('abcdef');

        done();
    });

    it('should log promotion click', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.PromotionClick,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionClick,
                PromotionList: [
                    {
                        Id: 12345,
                        Creative: 'my creative',
                        Name: 'Test promotion',
                        Position: 3,
                    },
                ],
            },
        });

        window.googleanalytics.args[0][0].should.equal(
            'tracker-name.ec:addPromo'
        );
        window.googleanalytics.args[0][1].should.have.property('id', 12345);
        window.googleanalytics.args[0][1].should.have.property(
            'name',
            'Test promotion'
        );
        window.googleanalytics.args[0][1].should.have.property(
            'creative',
            'my creative'
        );
        window.googleanalytics.args[0][1].should.have.property('position', 3);

        window.googleanalytics.args[1][0].should.equal(
            'tracker-name.ec:setAction'
        );
        window.googleanalytics.args[1][1].should.equal('promo_click');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('Promotion Click');

        done();
    });
});
