/**
 * Created by xyx on 2015/12/2.
 */
(function() {
    angular.module('shvis.test.controller', [])
        .controller("testController", function($scope) {
            $scope.metricModel = 'aggre_constraint';
            $scope.year = 2010;
        })
})();