// Set up module management
requirejs.config({
    //By default load any component from assets
    baseUrl: '/',
    //except, if the component starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        'jquery': 'js/lib/jquery-1.7.2.min',
        'underscore': 'js/lib/underscore-min',
        'backbone': 'js/lib/backbone-min',
        'backbone-mvc': 'js/lib/backbone-mvc',
        'handlebars': 'js/lib/handlebars.runtime',

        'd3': 'js/lib/d3.v3.min',
        'figue': 'js/lib/figue',

        // Plugins
        'text': 'js/lib/text',
        'css': 'js/lib/css'
    },
    shim: {
        'underscore': {
            exports: '_'
        },
        'jquery': {
            exports: '$'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'backbone-mvc': {
            deps: ['backbone'],
            exports: 'BackboneMVC'
        },
        'handlebars': {
            exports: 'Handlebars'
        },

        'd3': {
            exports: 'd3'
        },
        'figue': {
            exports: 'figue'
        }
    }
});

require(['backbone', 'backbone-mvc', 'js/controllers/IrisCtrl'], function(Backbone, BackboneMVC, IrisCtrl) {
    $(document).ready(function() {
        // Start the new automatic router and Backbone.history.
        var router = new BackboneMVC.Router();
        Backbone.history.start();
        // Just invoke controllers to create whole app.
        var irisCtrl = new IrisCtrl();
    });
});
