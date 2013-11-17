/**
 * IrisCtrl
 *
 * IrisCtrl is the controller in client side.
 *
 * @class IrisCtrl
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

            // Fatch data by ajax.

            d3.json('/iris/find/', function(error, data) {
                // Just for making demo easier, but storing all data in one object is not good.
                self.model = new IrisCollection(data[0].iris, { model: IrisModel });
                self.view = new IrisView({
                    model: self.model.toJSON(),
                    el: $('#iris')
                });
                self.view.render();
            });
        }
    });
    return IrisCtrl;
});
