/**
 * RadialCtrl
 *
 * Usage: var appCtrl = new RadialCtrl();
 * @return {object}
 */

define(['backbone-mvc', 'js/models/RadialModel', 'js/views/RadialView'], function(BackboneMVC, RadialModel, RadialView) {
    var RadialCtrl = BackboneMVC.Controller.extend({
        name: 'RadialCtrl',
        /* the only mandatory field */

        initialize: function() {
            var radialModel = new RadialModel({html: 'Hello kicks'});
            var radialView = new RadialView({
                model: radialModel,
                el: $('#kicks')
            });
            radialView.render();
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
    return RadialCtrl;
});
