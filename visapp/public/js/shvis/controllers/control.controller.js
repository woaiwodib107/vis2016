/**
 * Created by xyx on 2016/3/14.
 */
'use strict';
(function() {
    angular.module('shvis.control.controller', [])
        .controller('controlController', function($scope, $timeout, PipService) {
            $scope.nodeData = [];
            PipService.onStandardDev($scope, function(msg){
                $timeout(function() {
                    // the code you want to run in the next digest
                    $scope.$apply(function() {
                        $scope.nodeData = msg;
                    });
                });

            })
        });
})();