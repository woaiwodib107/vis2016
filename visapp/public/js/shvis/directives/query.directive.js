/**
 * Created by xyx on 2016/3/10.
 */
'use strict';
(function() {
    angular.module('shvis.query.directive', [])
        .directive('queryView', ['$http', 'LoadService',
            function($http, informationServ, loadServ) {
                return {
                    restrict: 'E',
                    templateUrl: 'js/shvis/partials/query.view.html',
                    replace: true
                }
            }
        ]);
})();