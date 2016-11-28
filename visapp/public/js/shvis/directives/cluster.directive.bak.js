/**
 * Created by anakin on 16/3/23.
 */
/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    angular.module('shvis.cluster.directive', [])
        .directive('clusterView', ['$http', 'ClusterService', 'LoadService',
            function($http, clusterServ, loadServ) {
                return {
                    restrict: 'A',
                    link: function(scope, element, attrs) {
                        var d3 = window.d3;
                        var configCluster = window.config.cluster;
                        var widthCluster = configCluster.width,
                            heightCluster = configCluster.height;
                        var marginCluster = configCluster.margin;
                        var heatmap = clusterServ.addHeatmap("cluster-heatmap", widthCluster, heightCluster);
                        var svg = clusterServ.init(element[0], widthCluster, heightCluster);
                        var tree = d3.layout.cluster()
                            .size([configCluster.treeHeight - marginCluster[0] - marginCluster[2], configCluster.treeWidth - marginCluster[1] - marginCluster[3]]);

                        var dataCluster;
                        var params = {
                            tranX:0,
                            tranY:0,
                            tree:tree,
                            width:widthCluster,
                            height:heightCluster,
                            treeWidth:configCluster.treeWidth,
                            treeHeight:configCluster.treeHeight,
                            onSelect:false,
                            expandedNodes: [],
                            doiDist:1,
                            clickedNodes:[]
                        };
                        scope.$watch("onSelect", function(newValue, oldValue) {
                            if(newValue !== oldValue) {
                                if(newValue){
                                    params.onSelect = true;
                                } else {
                                    params.onSelect = false;
                                }
                            }
                        });
                        clusterServ.bindDrag(svg, params);
                        loadServ.loadCluster(0, function(d) {
                            dataCluster = d;
                            params["root"] = dataCluster;
                            params["heat"] = $("#cluster-heatmap canvas")[0].getContext("2d");
//                            clusterServ.update(cluGroup, tree, data, heatmap);
                            clusterServ.preprocess(tree, params);
                            clusterServ.update(svg, params);
                        });

                        scope.$watch("updateEncompass", function(newValue, oldValue){
                            if(newValue === oldValue) {
                                return;
                            }
                            if(newValue !== oldValue) {
                                //clusterServ.update(svg, params);
                                //clusterServ.drawEncompass(svg, params);
                            }

                        });

                    }
                }
            }
        ]);
})();