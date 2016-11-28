/**
 * Created by anakin on 16/3/6.
 */
'use strict';
(function() {
    angular.module('shvis.information.controller', [])
        .controller('informationController', function($scope, PipService) {
            //PipService.onAddDetail($scope, function(msg) {
            //    var newNodes = msg.filter(function(d) {
            //        var res = false;
            //        if($scope.selectedNodes.indexOf(d) < 0) {
            //            res = true;
            //        }
            //        return res;
            //    });
            //    $scope.$apply(function() {
            //        //console.log(msg);
            //        $scope.selectedNodes = $scope.selectedNodes.concat(newNodes);
            //    });
            //})
        });
})();