/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    angular.module('shvis.cluster.controller', [])
        .controller('clusterController', function($scope, $timeout, PipService) {
            $scope.onSelect = 0;
            $scope.updateEncompass = "";
            $scope.highlight = [];
            PipService.onRenderConn($scope, function(msg){
                $timeout(function() {
                    // the code you want to run in the next digest
                    $scope.$apply(function() {
                        $scope.updateEncompass = msg;
                    });
                });

            });
            PipService.onHighlight($scope, function(msg) {
                $scope.highlight = msg;
            })
        });
})();