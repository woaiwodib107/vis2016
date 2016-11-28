/**
 * Created by anakin on 16/3/6.
 */
'use strict';
(function() {
    angular.module('shvis.information.directive', [])
        .directive('informationView', ['$http', 'informationService', 'LoadService',
            function($http, informationServ, loadServ) {
                return {
                    restrict: 'A',
                    link: function(scope, element, attrs) {
                        var d3 = window.d3;
                        var config = window.config.information;
                        var width = config.width,
                            height = config.height;
                        informationServ.addInformation();
//                        var svg = informationServ.init(element[0], width, height);
//
//                        var cluGroup = svg.append("g")
//                            .attr("transform", "translate(" + marginCluster[0] + ")");
//                        var dataCluster;
//                        loadServ.loadCluster(function(d) {
//                            dataCluster = JSON.parse(d);
////                            clusterServ.update(cluGroup, tree, data, heatmap);
//                            clusterServ.preprocess(tree, dataCluster);
//                            clusterServ.update(cluGroup, tree, dataCluster, $("#cluster-heatmap canvas")[0].getContext("2d"));
//                        });
                    }
                }
            }
        ]);
})();