/**
 * Created by xyx on 2016/3/1.
 */
'use strict';
(function() {
    angular.module('shvis.detail.controller', [])
        .controller('detailController', function($scope, $timeout, PipService) {
            $scope.translateDetail = true;//[40,0]; /*!*/
            $scope.updateDetail = ""; /*!*/
            $scope.selectedNodes = [];
            PipService.onAddDetail($scope, function(msg) {
                var newNodes = msg.filter(function(d) {
                    var res = false;
                    if($scope.selectedNodes.indexOf(d) < 0) {
                        res = true;
                    }
                    return res;
                });
                $scope.$apply(function() {
                    //console.log(msg);
                    $scope.selectedNodes = $scope.selectedNodes.concat(newNodes);
                });
            })

            PipService.onRankMove($scope, function(msg){
                $timeout(function() {
                    // the code you want to run in the next digest
                    $scope.$apply(function() {
                        //$scope.translateDetail = [msg.tranX, msg.tranY];
                        $scope.translateDetail = !$scope.translateDetail;
                    });
                });

            });
            PipService.onRankExpand($scope, function(msg){
                $timeout(function() {
                    // the code you want to run in the next digest
                    $scope.$apply(function() {
                        //console.log(msg);
                        $scope.updateDetail = msg;

                    });
                });

            })
        });
})();