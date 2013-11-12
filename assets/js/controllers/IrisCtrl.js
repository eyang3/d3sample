/**
 * IrisCtrl
 *
 * @return {object}
 */

define(['d3', 'backbone-mvc', 'js/views/IrisView', 'js/models/IrisModel', 'js/models/IrisCollection'], function(d3, BackboneMVC, IrisView, IrisModel, IrisCollection) {
    var IrisCtrl = BackboneMVC.Controller.extend({
        name: 'IrisCtrl',
        /* the only mandatory field */

        // model and view here are M and V in MVC architect.
        model: null,
        view: null,

        initialize: function() {
            var self = this;

            d3.json('/iris/find/', function(error, data) {
                self.model = new IrisCollection(data[0].iris, { model: IrisModel });
                self.view = new IrisView({
                    model: self.model.toJSON(),
                    el: $('#iris')
                });
                self.view.render();
            });

        },

        /**
         * This is a standard action method, it is invoked
         * automatically if url matches
         */
        hello: function() {
            this._privateMethod();
        },

        /**
         * This function will remain untouched, the router cannot see
         * this method
         */
        _privateMethod: function() {
            alert('You just use view to shoot a target and trigger the action of controller.');
        }
    });
    return IrisCtrl;
});
