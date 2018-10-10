/* eslint-disable no-undef*/

describe('Google Analytics Forwarder', function () {
    var MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
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
            getName: function () {
                return 'blahblah';
            }
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
            RemoveFromWishlist: 10
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
            getName: function () {return 'CustomerID';}
        },
        PromotionActionType = {
            Unknown: 0,
            PromotionView: 1,
            PromotionClick: 2
        },
        ReportingService = function () {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function (forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function () {
                this.id = null;
                this.event = null;
            };
        },
        reportService = new ReportingService();

    before(function () {
        mParticle.init('testAPI');
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
                return name.split('').reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
            }

            if (name.length === 0) {
                return hash;
            }

            for (i = 0; i < name.length; i++) {
                character = name.charCodeAt(i);
                hash = ((hash << 5) - hash) + character;
                hash = hash & hash;
            }

            return hash;
        };

        mParticle.forwarder.init({
            useCustomerId: 'True',
            customDimensions:'[{ \
                &quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 1&quot;,&quot;map&quot;:&quot;color&quot;},{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 2&quot;,&quot;map&quot;:&quot;gender&quot;},{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 3&quot;,&quot;map&quot;:&quot;size&quot;}, \
                {&quot;maptype&quot;:&quot;ProductAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 1&quot;,&quot;map&quot;:&quot;color&quot;},{&quot;maptype&quot;:&quot;ProductAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 2&quot;,&quot;map&quot;:&quot;gender&quot;},{&quot;maptype&quot;:&quot;ProductAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 3&quot;,&quot;map&quot;:&quot;size&quot;}, \
                {&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 1&quot;,&quot;map&quot;:&quot;color&quot;},{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 2&quot;,&quot;map&quot;:&quot;gender&quot;},{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Dimension 3&quot;,&quot;map&quot;:&quot;size&quot;}]',

            customMetrics:'[{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 1&quot;,&quot;map&quot;:&quot;levels&quot;},{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 2&quot;,&quot;map&quot;:&quot;shots&quot;},{&quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 3&quot;,&quot;map&quot;:&quot;players&quot;}, \
                {&quot;maptype&quot;:&quot;ProductAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 1&quot;,&quot;map&quot;:&quot;levels&quot;},{&quot;maptype&quot;:&quot;ProductAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 2&quot;,&quot;map&quot;:&quot;shots&quot;},{&quot;maptype&quot;:&quot;ProductAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 3&quot;,&quot;map&quot;:&quot;players&quot;}, \
                {&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 1&quot;,&quot;map&quot;:&quot;levels&quot;},{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 2&quot;,&quot;map&quot;:&quot;shots&quot;},{&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;Metric 3&quot;,&quot;map&quot;:&quot;players&quot;}]'
        }, reportService.cb, true, 'tracker-name');
    });

    beforeEach(function() {
        window.googleanalytics.reset();
        window._gaq = [];
    });

    it('should change page name for custom flag', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'Test Page Event',
            EventAttributes: {
                anything: 'foo'
            },
            CustomFlags: {
                'Google.Page': 'foo page'
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.set');
        window.googleanalytics.args[0][1].should.equal('page');
        window.googleanalytics.args[0][2].should.equal('foo page');

        done();
    });

    it('should log custom dimensions and custom event with an event log', function(done) {
        mParticle.forwarder.process({
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
                players: 3
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.send');
        window.googleanalytics.args[0][1].should.equal('event');
        window.googleanalytics.args[0][2].should.equal('category');
        window.googleanalytics.args[0][3].should.equal('Test Event');
        window.googleanalytics.args[0][4].should.equal('label');
        window.googleanalytics.args[0][5].should.equal(200);
        window.googleanalytics.args[0][6].should.have.property('dimension1', 'blue');
        window.googleanalytics.args[0][6].should.have.property('dimension2', 'female');
        window.googleanalytics.args[0][6].should.have.property('dimension3', 'large');
        window.googleanalytics.args[0][6].should.have.property('metric1', 1);
        window.googleanalytics.args[0][6].should.have.property('metric2', 15);
        window.googleanalytics.args[0][6].should.have.property('metric3', 3);

        done();
    });

    it('should log custom dimensions and metrics with a product purchase', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
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
                            players: 3
                        }
                    }
                ],
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 450,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null
            }
        });

        window.googleanalytics.args[1][0].should.equal('tracker-name.ec:addProduct');
        window.googleanalytics.args[1][1].should.have.property('id', '12345');
        window.googleanalytics.args[1][1].should.have.property('name', 'iPhone 6');
        window.googleanalytics.args[1][1].should.have.property('category', 'Phones');
        window.googleanalytics.args[1][1].should.have.property('brand', 'iPhone');
        window.googleanalytics.args[1][1].should.have.property('variant', '6');
        window.googleanalytics.args[1][1].should.have.property('price', 400);
        window.googleanalytics.args[1][1].should.have.property('coupon', null);
        window.googleanalytics.args[1][1].should.have.property('quantity', 1);
        window.googleanalytics.args[1][1].should.have.property('dimension1', 'blue');
        window.googleanalytics.args[1][1].should.have.property('dimension2', 'female');
        window.googleanalytics.args[1][1].should.have.property('dimension3', 'large');
        window.googleanalytics.args[1][1].should.have.property('metric1', 1);
        window.googleanalytics.args[1][1].should.have.property('metric2', 15);
        window.googleanalytics.args[1][1].should.have.property('metric3', 3);

        window.googleanalytics.args[2][0].should.equal('tracker-name.ec:setAction');
        window.googleanalytics.args[2][1].should.equal('purchase');
        window.googleanalytics.args[2][2].should.have.property('id', 123);
        window.googleanalytics.args[2][2].should.have.property('affiliation', 'my-affiliation');
        window.googleanalytics.args[2][2].should.have.property('revenue', 450);
        window.googleanalytics.args[2][2].should.have.property('tax', 40);
        window.googleanalytics.args[2][2].should.have.property('shipping', 10);
        window.googleanalytics.args[2][2].should.have.property('coupon', null);

        window.googleanalytics.args[3][0].should.equal('tracker-name.send');
        window.googleanalytics.args[3][1].should.equal('event');
        window.googleanalytics.args[3][2].should.equal('eCommerce');
        window.googleanalytics.args[3][3].should.equal('blahblah');


        done();
    });

    it('should log custom dimensions and metrics based on user attribute', function(done) {
        mParticle.setUserAttribute('foo', 'bar');
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionView,
                PromotionList: [
                    {
                        Id: 12345,
                        Creative: 'my creative',
                        Name: 'Test promotion',
                        Position: 3
                    }
                ]
            },
            UserAttributes: {
                gender: 'female',
                color: 'blue',
                size: 'large',
                levels: 1,
                shots: 15,
                players: 3
            }
        });

        window.googleanalytics.args[1][4].should.have.property('dimension1', 'blue');
        window.googleanalytics.args[1][4].should.have.property('dimension2', 'female');
        window.googleanalytics.args[1][4].should.have.property('dimension3', 'large');
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
                        Position: 3
                    }
                ]
            },
            CustomFlags: {
                'Google.NonInteraction': true
            }
        });

        window.googleanalytics.args[1][4].should.have.property('nonInteraction', true);

        done();
    });

    it('should log event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventName: 'Test Event',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            }
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
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.send');
        window.googleanalytics.args[0][1].should.equal('pageview');

        done();
    });

    it('should log commerce event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
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
                        Quantity: 1
                    }
                ],
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 450,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addProduct');
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('name', 'iPhone 6');
        window.googleanalytics.args[0][1].should.have.property('category', 'Phones');
        window.googleanalytics.args[0][1].should.have.property('brand', 'iPhone');
        window.googleanalytics.args[0][1].should.have.property('variant', '6');
        window.googleanalytics.args[0][1].should.have.property('price', 400);
        window.googleanalytics.args[0][1].should.have.property('coupon', null);
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal('tracker-name.ec:setAction');
        window.googleanalytics.args[1][1].should.equal('purchase');
        window.googleanalytics.args[1][2].should.have.property('id', 123);
        window.googleanalytics.args[1][2].should.have.property('affiliation', 'my-affiliation');
        window.googleanalytics.args[1][2].should.have.property('revenue', 450);
        window.googleanalytics.args[1][2].should.have.property('tax', 40);
        window.googleanalytics.args[1][2].should.have.property('shipping', 10);
        window.googleanalytics.args[1][2].should.have.property('coupon', null);

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('blahblah');

        done();
    });

    it('should log refund', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.Refund,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1
                    }
                ],
                TransactionId: 123
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addProduct');
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal('tracker-name.ec:setAction');
        window.googleanalytics.args[1][1].should.equal('refund');
        window.googleanalytics.args[1][2].should.have.property('id', 123);

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('blahblah');

        done();
    });

    it('should log add to cart', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.AddToCart,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1
                    }
                ]
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addProduct');
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal('tracker-name.ec:setAction');
        window.googleanalytics.args[1][1].should.equal('add');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('blahblah');

        done();
    });

    it('should log remove from cart', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.RemoveFromCart,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1
                    }
                ]
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addProduct');
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal('tracker-name.ec:setAction');
        window.googleanalytics.args[1][1].should.equal('remove');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('blahblah');

        done();
    });

    it('should log checkout', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.Checkout,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1
                    }
                ],
                CheckoutStep: 1,
                CheckoutOptions: 'Visa'
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addProduct');
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal('tracker-name.ec:setAction');
        window.googleanalytics.args[1][1].should.equal('checkout');
        window.googleanalytics.args[1][2].should.have.property('step', 1);
        window.googleanalytics.args[1][2].should.have.property('option', 'Visa');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('blahblah');

        done();
    });

    it('should log product click', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.Click,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1
                    }
                ]
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addProduct');
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal('tracker-name.ec:setAction');
        window.googleanalytics.args[1][1].should.equal('click');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('blahblah');

        done();
    });

    it('it should log product view detail', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.ViewDetail,
                ProductList: [
                    {
                        Sku: '12345',
                        Quantity: 1
                    }
                ]
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addProduct');
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('quantity', 1);

        window.googleanalytics.args[1][0].should.equal('tracker-name.ec:setAction');
        window.googleanalytics.args[1][1].should.equal('detail');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('blahblah');

        done();
    });

    it('it should log product impressions', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductImpressions: [
                {
                    ProductImpressionList: 'Test',
                    ProductList: [{
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: 'S'
                    }]
                }
            ]
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addImpression');
        window.googleanalytics.args[0][1].should.have.property('id', '12345');
        window.googleanalytics.args[0][1].should.have.property('name', 'iPhone 6');
        window.googleanalytics.args[0][1].should.have.property('category', 'Phones');
        window.googleanalytics.args[0][1].should.have.property('brand', 'iPhone');
        window.googleanalytics.args[0][1].should.have.property('variant', 'S');

        window.googleanalytics.args[1][0].should.equal('tracker-name.send');
        window.googleanalytics.args[1][1].should.equal('event');
        window.googleanalytics.args[1][2].should.equal('eCommerce');
        window.googleanalytics.args[1][3].should.equal('blahblah');

        done();
    });

    it('it should set user identity', function(done) {
        mParticle.forwarder.setUserIdentity('tbreffni@mparticle.com', IdentityType.CustomerId);

        window.googleanalytics.args[0][0].should.equal('tracker-name.set');
        window.googleanalytics.args[0][1].should.equal('userId');
        window.googleanalytics.args[0][2].should.equal(mParticle.generateHash('tbreffni@mparticle.com'));

        done();
    });

    it('should log promotion view', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionView,
                PromotionList: [
                    {
                        Id: 12345,
                        Creative: 'my creative',
                        Name: 'Test promotion',
                        Position: 3
                    }
                ]
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addPromo');
        window.googleanalytics.args[0][1].should.have.property('id', 12345);
        window.googleanalytics.args[0][1].should.have.property('name', 'Test promotion');
        window.googleanalytics.args[0][1].should.have.property('creative', 'my creative');
        window.googleanalytics.args[0][1].should.have.property('position', 3);

        window.googleanalytics.args[1][0].should.equal('tracker-name.send');
        window.googleanalytics.args[1][1].should.equal('event');
        window.googleanalytics.args[1][2].should.equal('eCommerce');
        window.googleanalytics.args[1][3].should.equal('blahblah');

        done();
    });

    it('should log promotion click', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionClick,
                PromotionList: [
                    {
                        Id: 12345,
                        Creative: 'my creative',
                        Name: 'Test promotion',
                        Position: 3
                    }
                ]
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.ec:addPromo');
        window.googleanalytics.args[0][1].should.have.property('id', 12345);
        window.googleanalytics.args[0][1].should.have.property('name', 'Test promotion');
        window.googleanalytics.args[0][1].should.have.property('creative', 'my creative');
        window.googleanalytics.args[0][1].should.have.property('position', 3);

        window.googleanalytics.args[1][0].should.equal('tracker-name.ec:setAction');
        window.googleanalytics.args[1][1].should.equal('promo_click');

        window.googleanalytics.args[2][0].should.equal('tracker-name.send');
        window.googleanalytics.args[2][1].should.equal('event');
        window.googleanalytics.args[2][2].should.equal('eCommerce');
        window.googleanalytics.args[2][3].should.equal('blahblah');

        done();
    });

    it('should log transaction', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventCategory: EventType.Transaction,
            EventAttributes: {
                $MethodName: 'LogEcommerceTransaction',
                ProductName: 'iPhone',
                ProductSKU: '12345',
                ProductUnitPrice: 400,
                ProductQuantity: 1,
                ProductCategory: 'Phones',
                RevenueAmount: 500,
                TaxAmount: 40,
                ShippingAmount: 60,
                CurrencyCode: 'USD',
                TransactionAffiliation: 'affiliation',
                TransactionID: 1234567
            }
        });

        window.googleanalytics.args[0][0].should.equal('tracker-name.require');
        window.googleanalytics.args[0][1].should.equal('ecommerce');

        window.googleanalytics.args[1][0].should.equal('tracker-name.ecommerce:addTransaction');
        window.googleanalytics.args[1][1].should.have.property('id', 1234567);
        window.googleanalytics.args[1][1].should.have.property('affiliation', 'affiliation');
        window.googleanalytics.args[1][1].should.have.property('revenue', '500');
        window.googleanalytics.args[1][1].should.have.property('shipping', '60');
        window.googleanalytics.args[1][1].should.have.property('tax', '40');
        window.googleanalytics.args[1][1].should.have.property('currency', 'USD');

        window.googleanalytics.args[2][0].should.equal('tracker-name.ecommerce:addItem');
        window.googleanalytics.args[2][1].should.have.property('id', 1234567);
        window.googleanalytics.args[2][1].should.have.property('name', 'iPhone');
        window.googleanalytics.args[2][1].should.have.property('sku', '12345');
        window.googleanalytics.args[2][1].should.have.property('category', 'Phones');
        window.googleanalytics.args[2][1].should.have.property('price', '400');
        window.googleanalytics.args[2][1].should.have.property('quantity', '1');
        window.googleanalytics.args[2][1].should.have.property('currency', 'USD');

        window.googleanalytics.args[3][0].should.equal('tracker-name.ecommerce:send');

        done();
    });

    it('should log transaction in classic mode', function(done) {
        mParticle.forwarder.init({
            useCustomerId: 'True',
            classicMode: 'True'
        }, reportService.cb, true);

        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventCategory: EventType.Transaction,
            EventAttributes: {
                $MethodName: 'LogEcommerceTransaction',
                ProductName: 'iPhone',
                ProductSKU: '12345',
                ProductUnitPrice: 400,
                ProductQuantity: 1,
                ProductCategory: 'Phones',
                RevenueAmount: 500,
                TaxAmount: 40,
                ShippingAmount: 60,
                CurrencyCode: 'USD',
                TransactionAffiliation: 'affiliation',
                TransactionID: 1234567
            }
        });

        window._gaq[0][0].should.equal('_set');
        window._gaq[0][1].should.equal('currencyCode');
        window._gaq[0][2].should.equal('USD');

        window._gaq[1][0].should.equal('_addTrans');

        window._gaq[2][0].should.equal('_addItem');

        done();
    });
});
