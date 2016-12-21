/**
 * Created by Fangzhou on 2016/2/13.
 */
'use strict';
(function() {
    angular.module('shvis.rank.directive', [])
        .directive('rankView', ['$http', 'RankService', 'LoadService',
            function($http, rankServ, loadServ) {
                return {
                    restrict: 'A',
                    scope: '=',
                    link: function(scope, element, attrs) {
                        var d3 = window.d3;
                        var config = window.config.rank;
                        var width = /*config.width*/ element[0].clientWidth, //1776
                            height = config.height;
                        var margin = config.margin;
                        var timeScale = window.config.timeScale;
                        var params = {
                            tranX: 0,
                            tranY: 0,
                            width: width,
                            height: height,
                            rankWidth: 0, //
                            rankHeight: 0, //
                            data: [], //
                            transitionFlag: false,
                            cluID: [], //
                            flowHeights: {}, //
                            tip: 0,
                            compressFlags: [], //
                            highLights: [], //
                            reLayout: {
                                flag: false,
                                factor: 1.0
                            }, //
                            isQuery: [],
                            queryValue: [],
                            count: {
                                origin: {},
                                scaled: {}
                            },
                            interval: 50,
                            mode: 'scaled',
                            brushedData: []
                        };

                        loadServ.loadRankRange(function(d) {
                            params.ranges = d;
                        });

                        var svg = rankServ.init(element[0], width, height, params);
                        params['svg'] = svg;
                        var expandFlag = timeScale.map(function(d) {
                            return {
                                time: d,
                                expand: false
                            }
                        });
                        params["expandFlag"] = expandFlag;
                        rankServ.bindDrag(svg, params);

                        var flowSize;

                        //                        rankServ.addDragRect(width, height);

                        var rankGroup = svg.select("#rankGroup");
                        //                            .attr("transform", "translate(" + (margin[0]) + "," + margin[1] + ")");
                        //                        var rankHeights = [config.glyph.outerRadius];
                        scope.$watchCollection("clusters", function(newValue, oldValue) {
                            if (newValue === oldValue) {
                                return;
                            }
                            //add new clusters
                            var clus = newValue.filter(function(d) {
                                var res = false;
                                if (oldValue.indexOf(d) < 0) {
                                    res = true;
                                }
                                return res;
                            });
                            for (var i = 0; i < clus.length; i++) {
                                params.cluID.push(clus[i]);
                                loadServ.loadRank(clus[i], function(d) {
                                    rankServ.addRank(d, params, function() {
                                        rankServ.render(svg, params);
                                    })
                                });
                            }
                            //delete old clusters:
                            var delClus = oldValue.filter(function(d) {
                                var res = false;
                                if (newValue.indexOf(d) < 0) {
                                    res = true;
                                }
                                return res;
                            })[0];

                            if (newValue.length < oldValue.length) {
                                rankServ.removeRank(delClus, params, function() {
                                    rankServ.render(svg, params);
                                });
                                //params.rankWidth = 0;
                                //params.rankHeight = 0;
                                //params.data = [];
                                //params.cluID = [];
                                // params.flowHeights = {};
                                // params.compressFlags = [];
                                // params.highLights = [];
                                // params.reLayout = {
                                //     flag: false,
                                //     factor: 1.0
                                // };

                                //delete cluster id
                                // params.cluID.splice(params.cluID.indexOf(delClus), 1);
                                //delete data
                                //var deleteIndex = [];
                                //params.data.forEach(function (d, i) {
                                //    if(d.cluid >= 0)
                                //        deleteIndex.push(i);
                                //});
                                //deleteIndex.forEach(function (d, i) {
                                //    params.data.splice(d, 1);
                                //});
                                //rankServ.getflowHeights(params);
                                // console.log(params);

                                // if (newValue.length == 0) {
                                //     d3.select(element[0])
                                //         .select("svg")
                                //         .remove();
                                //     svg = rankServ.init(element[0], width, height, params);
                                //     rankServ.bindDrag(svg, params);
                                // }
                                // var queryValueNum = 0;
                                // for (var j = 0; j < params.cluID.length; ++j) {
                                //     // params.cluID.push(newValue[j]);

                                //     if (params.cluID[j] < 0) {
                                //         console.log(params.queryValue);
                                //         rankServ.addRank(params.queryValue[queryValueNum++], params, function() {
                                //             rankServ.render(svg, params);
                                //         });
                                //         continue;
                                //     }
                                //     loadServ.loadRank(params.cluID[j], function(d) {
                                //         rankServ.addRank(d, params, function() {
                                //             if (params.data.length === params.cluID.length) {
                                //                 rankServ.render(svg, params);
                                //             }

                                //         })
                                //     });
                                // }
                            }

                        });
                        var queryCluID = -1;
                        scope.$watchCollection("queries", function(newValue, oldValue) {
                            if (newValue === oldValue) {
                                return;
                            };
                            params.queryValue = newValue;
                            params.cluID.push(queryCluID);
                            newValue[newValue.length - 1].cluid = queryCluID--;
                            rankServ.addRank(newValue[newValue.length - 1], params, function() {
                                rankServ.render(svg, params);
                            });

                        });
                        scope.$watch("tableName", function(newValue, oldValue) {
                            if (newValue === oldValue) {
                                return;
                            }
                            params.highLights.splice(params.highLights.indexOf(oldValue), 1);
                            if (params.highLights.indexOf(newValue) < 0) {
                                params.highLights.push(newValue);
                                rankServ.render(svg, params);
                            }
                        });

                        scope.$watchCollection("expandChangeYear", function(newValue, oldValue) {
                            var id = "#ctrlCircle-" + newValue.year;

                            params.expandFlag.forEach(function(d, i) {
                                if (d.time === newValue)
                                    d.expand = !d.expand;
                            })
                            jQuery.fn.d3Click = function() {
                                console.log(this);
                                this.each(function(i, e) {
                                    var evt = new MouseEvent("click");
                                    e.dispatchEvent(evt);
                                });
                            };

                            $(id).d3Click();

                        });
                    }
                }
            }
        ]);
})();