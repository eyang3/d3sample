/**
 * RadialCtrl
 *
 * Usage: var appCtrl = new RadialCtrl();
 * @return {object}
 */

define(['backbone-mvc', 'figue', 'js/models/RadialModel', 'js/views/RadialView'], function(BackboneMVC, figue, RadialModel, RadialView) {
    var RadialCtrl = BackboneMVC.Controller.extend({
        name: 'RadialCtrl',
        /* the only mandatory field */
        model: null,
        view: null,

        initialize: function() {
            var self = this;
            $.ajax('/iris/find').done(function(data) {
                var irisData = data[0].iris;
                // Create the labels and the vectors describing the data

                var labels = new Array;
                var vectors = new Array;
                for (var i = 0; i < irisData.length; i++) {
                    labels[i] = irisData[i]['label'];
                    vectors[i] = [irisData[i]['x'], irisData[i]['y']];
                }

                var root = figue.agglomerate(labels, vectors, figue.EUCLIDIAN_DISTANCE, figue.SINGLE_LINKAGE);

                self.model = new RadialModel(root);
                /*self.view = new RadialView({
                    model: this.model,
                    el: $('#kicks')
                });
                self.view.render();
                */

                // Render the dendogram in the page (note: pre is handled differently by IE and the rest of the browsers)
                var pre = $('#mypre');
                pre.html('dendogram');
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
    return RadialCtrl;
});
