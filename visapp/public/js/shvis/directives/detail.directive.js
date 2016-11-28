/**
 * Created by xyx on 2016/3/1.
 */
/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    angular.module('shvis.detail.directive', [])
        .directive('detailView', ['$http', 'DetailService', 'LoadService',
            function($http, detailServ, loadServ) {
                return {
                    restrict: 'A',
                    link: function(scope, element, attrs) {
                        var d3 = window.d3;
                        var config = window.config.detail;
                        var width = /*config.width*/ element[0].clientWidth,
                            height = config.height;
                        var margin = config.margin;

                        var id = "Xuexiang Xie";
                        var params = {
                            data:[],
                            rawData:[],
                            tranY:0,
                            tranX:0,
                            clickName: "",
                            flagRec: 0
                        };
                        var svg = detailServ.init(element[0], width, config.svgHeight, params);
                        var timeScale = window.config.timeScale;
                        var expandFlag = timeScale.map(function(d) {
                            return {
                                time: d,
                                expand: false
                            }
                        });
                        params["expandFlag"] = expandFlag;
                        scope.$watch("selectedNodes", function(newValue, oldValue) {
                            if(newValue === oldValue) {
                                return;
                            }
                            var nodes = newValue.filter(function(d) {
                                var res = false;
                                if(oldValue.indexOf(d) < 0) {
                                    res = true;
                                }
                                return res;
                            });
                            for(var i = 0; i < nodes.length; i++) {
                                loadServ.loadDetail(nodes[i], function(data) {
                                    detailServ.addDetail(svg, data, width, height, nodes[i], params, function() {
                                        detailServ.render(svg, params);
                                    });
                                });
                            }
                            //detailServ.render(svg, params);
                        });

                        scope.$watch("translateDetail", function(newValue, oldValue){
                            //if(newValue !== oldValue) {
                            //    var changed = false;
                            //    newValue.forEach(function(item, index) {
                            //        if(item !== oldValue[index]) {
                            //            changed = true;
                            //        }
                            //    })
                            //    if(changed) {
                            //        //console.log(params.tranX);
                            //        params.tranX = newValue[0];
                            //        svg.selectAll(".detailGroup")
                            //            .attr("transform", function(d, i) {
                            //                console.log(params.data.length);
                            //                return "translate(" + newValue[0] + "," + i *  (params.data.length == 1?config.height:config.groupHeight) + ")";
                            //            });
                            //    }
                            //}
                            if(newValue !== oldValue) {
                                var yPos = d3.transform(svg.selectAll("#canvas").attr("transform")).translate[1];
                                var xPos = d3.transform(d3.selectAll("#rankAxis").attr("transform")).translate[0];

                                //params.tranX = xPos-45;
                                //svg.selectAll(".detailGroup")
                                //    .attr("transform", function(d, i) {
                                //        return "translate(" + params.tranX + "," + i *  (params.data.length == 1?config.height:config.groupHeight) + ")";
                                //    });
                                console.log(xPos);
                                params.tranX = xPos - 40 + 45;

                                svg.selectAll("#canvas")
                                    .attr("transform", function(d, i) {
                                        return "translate(" + params.tranX + "," + yPos + ")";
                                    });
                            }
                        });
                        scope.$watch("updateDetail", function(newValue, oldValue){
                            if(newValue !== oldValue) {
                                params.expandFlag = newValue["expandFlag"];
                                detailServ.render(svg, params);
                                //clusterServ.update(svg, params);
//                                detailServ.layout(params.data[0], params);
//                                detailServ.render(svg, params);
                            }
                        });
                    }
                }
            }
        ]);
})();