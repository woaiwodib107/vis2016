/**
 * Created by xyx on 2016/1/3.
 */
'use strict';
(function() {
    angular.module('shvis.topk.controller', [])
        .controller("topkController", function($scope) {
            $scope.metricModel = 'effective_size';
            $scope.hovername = '';
            $scope.open1 = function() {
                $scope.popup1.opened = true;
            };
            $scope.popup1 = {
                opened: false
            };

        })
})();