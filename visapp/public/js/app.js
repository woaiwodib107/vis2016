/**
 * Created by xyx on 2015/12/2.
 */
'use strict';

(function() {
    var app = angular.module('core', ['ui.bootstrap', 'shvis', 'ngRoute', 'multipleSelect']);
    app.config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/network', {
                templateUrl: 'js/shvis/partials/test.view.html',
                controller: 'testController'
            })
            .when('/topk', {
                templateUrl: 'js/shvis/partials/topk.view.html',
                controller: 'topkController'
            })
            .when('/cluster', {
                templateUrl: 'js/shvis/partials/cluster.view.html',
                controller: 'clusterController'
            })
            .when('/rank', {
                templateUrl: 'js/shvis/partials/rank.view.html',
                controller: 'rankController'
            })
            .when('/detail', {
                templateUrl: 'js/shvis/partials/detail.view.html',
                controller: 'detailController'
            })
            .when('/information', {
                templateUrl: 'js/shvis/partials/information.view.html',
                controller: 'informationController'
            })
            .when('/system', {
                templateUrl: 'js/shvis/partials/system.view.html',
                controller: 'rankController'
            })
            .otherwise({
                redirectTo: '/'
            });
    }])
})();