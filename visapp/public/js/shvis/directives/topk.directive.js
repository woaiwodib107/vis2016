/**
 * Created by xyx on 2016/1/3.
 */
(function(){
    var topk = angular.module('shvis.topk.directive', [])
        .directive('topk', ["$http",
            function($http) {
                return {
                    restrict: 'A',
                    scope: '=',
                    link: function (scope, element, attrs) {
                        console.log(scope);
                        var d3 = window.d3;
                        var data;
                        $http.get('/testData')
                            .success(function(d) {
                                data = JSON.parse(d);
                                init();

                            });
                        scope.$watch('metricModel', function(newValue, oldValue){
                            if(newValue === undefined) {
                                return;
                            }
                            if(data) {
                                draw(topk());
                            }

                        });
                        var svg;
                        var init = function() {
                            var width = 1920,
                                height = 1080;
                            svg = d3.select(element[0])
                                .append('svg')
                                .attr('width', width)
                                .attr('height', height);
                            draw(topk());

                        };
                        var topk = function() {
                            var metric = scope.metricModel;
                            return Object.keys(data).map(function(d, i) {
                                return data[d].nodes.sort(function(a, b) {
                                    return b[metric] - a[metric];
                                });
                            });
                        }
                        var draw = function(data) {
                            var max, min;
                            var metric = scope.metricModel;
                            svg.selectAll('g').remove();
                            max = Math.abs(d3.max(data, function(d) {
                                return d[0][metric];
                            }));
                            min = Math.abs(d3.min(data, function(d) {
                                return d[d.length - 1][metric];
                            }));
                            console.log(max + "," + min);
                            var color = d3.scale.linear().domain([min, max]).range(['#f1eef6','#045a8d']);
                            svg.selectAll('g')
                                .data(data)
                                .enter()
                                .append('g')
                                .attr('transform', function(d, i) {
                                    return "translate(" + i * (30 + 10) + ",0)";
                                })
                                .call(drawYear,color);
                            $('.metricRect').hover(
                                function() {
//                                    console.log($(this).attr('auth_name'));
                                    var name = $(this).attr('auth_name');
                                    scope.hovername = name;
                                    scope.$apply();
//                                    $(".metricRect[auth_name='"+ name + "']").addClass('hover');
                                    d3.selectAll(".metricRect[auth_name='"+ name + "']").classed('hover', true);
                                }, function() {
                                    var name = $(this).attr('auth_name');
                                    scope.hovername = "";
                                    scope.$apply();
//                                    $(".metricRect[auth_name='"+ name + "']").removeClass('hover');
                                    d3.selectAll(".metricRect[auth_name='"+ name + "']").classed('hover', false);
                                })
                        }
                        var drawYear = function(g, color) {
                            var metric = scope.metricModel;
                            this.each(function(d) {

                                d3.select(this).selectAll('rect')
                                    .data(d)
                                    .enter()
                                    .append('rect')
                                    .attr('width', 30)
                                    .attr('height', 5)
                                    .attr('y', function(d, i) {
                                        return i * 9;
                                    })
                                    .attr('x', 0)
                                    .attr('fill', function(d) {
                                        return color(Math.abs(d[metric]));
                                    })
                                    .attr('class', 'metricRect')
                                    .attr('auth_name', function(d) {
                                        return d.id;
                                    });

                            })
                        }
                    }
                }
            }])
})()