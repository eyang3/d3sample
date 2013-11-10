/**
 * TrellisCtrl
 *
 * @return {object}
 */

define(['d3', 'backbone-mvc', 'js/views/TrellisView', 'js/models/IrisModel'], function(d3, BackboneMVC, TrellisView, IrisModel) {
    var TrellisCtrl = BackboneMVC.Controller.extend({
        name: 'TrellisCtrl',
        /* the only mandatory field */

        model: null,
        view: null,

        initialize: function() {
            var self = this;

            d3.json('/iris/find/', function(error, data) {
                self.model = new IrisModel(data[0].iris);
                self.view = new TrellisView({
                    model: self.model,
                    el: $('#trellis')
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
    return TrellisCtrl;
});
