/**
 * Created by xyx on 2016/3/10.
 */
'use strict';
(function() {
    angular.module('shvis.query.controller', [])
        .controller('queryController', function($scope, LoadService, PipService) {
            $scope.results = [];
            $scope.queryNames = [];
            $scope.queryRankRanges = [];
            $scope.queryTime = [];

            $scope.inputName = "";
            $scope.inputRankRange = [];
            $scope.inputTime = "";
            $scope.dt1 = new Date(2004, 1, 1);
            $scope.dt2 = new Date(2016, 1, 1);
            $scope.rankRange1;
            $scope.rankRange2;
            LoadService.loadNames(function(names) {
                names.sort();
                $scope.names = names;
            });
            $scope.search = function() {
//                var time = $("#search_condition_time-select").find("option:selected").val(),
//                    name = $('#search_condition_name').val(),
//                    rank1 = $('#search_condition_rank1').val(),
//                    rank2 = $('#search_condition_rank2').val();
                var startTime = $scope.dt1.getFullYear();
                var endTime = $scope.dt2.getFullYear();
                var startRange = $scope.rankRange1;
                var endRange = $scope.rankRange2;
                var name = $scope.inputName;
                PipService.emitHighlight(name);
                $scope.results.length = 0;
                $scope.rankRange1 = undefined;
                $scope.rankRange2 = undefined;
//                LoadService.loadRankByNames([$scope.inputName], function(d) {
//                    if(d instanceof Array) {
//                        for(var i = 0; i < d.length; i++) {
//                            $scope.results.push(d[i]);
//                        }
//
//                    } else {
//                        $scope.results.push(d);
//                    }
//                    PipService.emitQueryResult(d);
//                });
                if(window.config.mode === "MMO") {
                    LoadService.loadQuery({
                        startRank:startRange,
                        endRank:endRange,
                        names:name
                    }, function(d) {
                        var nodes = d["nodes"];
//                    if(nodes instanceof Array) {
//                        for(var i = 0; i < nodes.length; i++) {
//                            $scope.results.push(nodes[i]);
//                        }
//
//                    } else {
//                        $scope.results.push(nodes);
//                    }
                        if(nodes instanceof Array) {
                            for(var i = 0; i < nodes.length; i++) {
                                nodes[i].data.sort(function(a,b){
                                    return parseInt(a.time) - parseInt(b.time);
                                });
                                $scope.results.push(nodes[i]);
                            }
                        } else {
                            $scope.results.push(nodes);
                        }
                        PipService.emitQueryResult(d);

                    });
                } else {
                    LoadService.loadQuery({
                        startTime:startTime,
                        endTime:endTime,
                        startRank:startRange,
                        endRank:endRange,
                        names:name
                    }, function(d) {
                        var nodes = d["nodes"];
//                    if(nodes instanceof Array) {
//                        for(var i = 0; i < nodes.length; i++) {
//                            $scope.results.push(nodes[i]);
//                        }
//
//                    } else {
//                        $scope.results.push(nodes);
//                    }
                        if(nodes instanceof Array) {
                            for(var i = 0; i < nodes.length; i++) {
                                nodes[i].data.sort(function(a,b){
                                    return parseInt(a.time) - parseInt(b.time);
                                });
                                $scope.results.push(nodes[i]);
                            }
                        } else {
                            $scope.results.push(nodes);
                        }
                        PipService.emitQueryResult(d);

                    });
                }

                //ToDo get search result

//                var resultDisplay = document.getElementById('search_result');
//                for(var i in search_result){
//                    if(i < 10){
//                        var div = document.getElementById('result' + i);
//                        div.innerHTML = i + ':' + search_result[i].name;
//                        div.setAttribute('attr1',search_result[i].attribute1);
//                    }else{
//                        var div = document.createElement('div');
//                        div.setAttribute('class','result_list');
//                        div.setAttribute('id','result' + i);
//                        div.innerHTML = i + ':' + search_result[i].name;
//                        div.setAttribute('attr1',search_result[i].attribute1);
//                        resultDisplay.appendChild(div);
//                    }
//                }
            };
            $scope.format = "yyyy";
            $scope.dateOptions = {
//                dateDisabled: true,
                formatYear: 'yyyy',
                maxDate: new Date(2016,1,1),
                minDate: new Date(2004,1,1),
                startingDay: 1,
                datepickerMode:'year',
                minMode:'year'
            };
            $scope.range1 = {
                opened: false
            };

            $scope.range2 = {
                opened: false
            };
            $scope.open1 = function() {
                $scope.range1.opened = true;
            };
            $scope.open2 = function() {
                $scope.range2.opened = true;
            };
            $scope.mouseOver = function (e) {
                PipService.emitMouseover(e);
            };
        });
})();