/**
 * Created by Fangzhou on 2016/2/13.
 */
'use strict';
(function() {
    angular.module('shvis.rank.controller', [])
        .controller('rankController', function($scope, PipService) {
            $scope.clusters = [];
            $scope.queries = [];
            $scope.tableName = "";
            $scope.expandChangeYear = {flag:true, year:""};
            $scope.click = function() {
                $scope.clusters.push(1);
            };
            PipService.onAddCluster($scope, function(msg){
                var id = Number(msg);
                //console.log($scope.clusters);
                if($scope.clusters.indexOf(id) < 0) {

                    $scope.$apply(function() {
                        $scope.clusters.push(id);
                    })
                }
            });
            PipService.onDelCluster($scope, function(msg){
                var id = Number(msg);
                //console.log($scope.clusters);
                if($scope.clusters.indexOf(id) >= 0) {
                    $scope.$apply(function() {
                        $scope.clusters.splice($scope.clusters.indexOf(id), 1);
                    })
                }
            });
            PipService.onQueryResult($scope, function(msg) {
                $scope.queries.push(msg);
            });
            PipService.onMouseover($scope, function (msg) {
                //$scope.$apply(function() {
                    $scope.tableName = msg;
                //})
            });
            PipService.onDetailExpand($scope, function(msg) {
                $scope.$apply(function() {
                    console.log("pip receive::" + msg);
                    $scope.expandChangeYear.year = msg;
                    $scope.expandChangeYear.flag = !$scope.expandChangeYear.flag;
                })
            });
        });
})();