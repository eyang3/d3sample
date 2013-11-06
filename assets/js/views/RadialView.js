/**
 * RadialView
 *
 * @return {object}
 */

define(['backbone', 'templates/kicks', 'css!styles/app.css'], function(Backbone, Templates) {
    var RadialView = Backbone.View.extend({
        template: Templates.kicks,
        render: function() {
            this.$el.html(this.template(this.model.attributes));
            return this;
        }
    });
    return RadialView;
});
