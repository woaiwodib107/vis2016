/**
 * Created by xyx on 2015/12/2.
 */
(function() {
    angular.module('shvis.test.directive', [])
        .directive('testVis', ['$http',
            function ($http) {
                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        var d3 = window.d3;
                        var mode = scope.metricModel;
                        scope.$watch('metricModel', function(newValue, oldValue){
                            if(newValue === undefined) {
                                return;
                            }
                            mode = newValue;
                            refresh();
                        });
                        scope.$watch('year', function(newValue, oldValue) {
                            if(newValue !== oldValue) {
//                                init();
                                refresh();
                            }
                        })
                        var width = 1920,
                            height = 1080;
                        var svg = d3.select(element[0])
                            .append('svg')
                            .attr("width", width)
                            .attr("height", height);

                        var color = d3.scale.category20();

                        var force = d3.layout.force()
                            .charge(-120)
                            .linkDistance(5)
                            .size([width, height]);
                        var allGraph;
                        $http.get('/testData')
                            .success(function(d) {
                                allGraph = JSON.parse(d);
                                init();

                            });
                        var init = function() {
                            var graph = allGraph[2016];
                            force
                                .nodes(graph.nodes)
                                .links(graph.links)
                                .start();

                            var link = svg.selectAll(".link")
                                .data(graph.links, function(d) {
                                    return [d.source.id, d.target.id].sort().join(',');
                                });
                                link.enter().append("line")
                                .attr("class", "link")
                                .style("stroke-width", function(d) { return Math.sqrt(d.value); });
                            link.exit().remove();
                            var max = d3.max(graph.nodes, function(d) {
                                return d[mode];
                            });
                            var min = d3.min(graph.nodes, function(d) {
                                return d[mode];
                            });
                            var colorScale = d3.scale.linear().domain([min, max]).range(['#f1eef6', '#045a8d']);
                            var node = svg.selectAll(".node")
                                .data(graph.nodes, function(d) {
                                    return d.id;
                                });
                                node.enter().append("circle")
                                .attr("class", "node")
                                .attr("r", 5)
                                .style("fill", function(d) {
                                    return colorScale(d[mode]);
                                })
                                .attr("id", function(d) {
                                    return d['id'];
                                })
                                .call(force.drag);
                                node.exit().remove();
                            node.append("title")
                                .text(function(d) { return d.id; });

                            force.on("tick", function() {
                                link.attr("x1", function(d) { return d.source.x; })
                                    .attr("y1", function(d) { return d.source.y; })
                                    .attr("x2", function(d) { return d.target.x; })
                                    .attr("y2", function(d) { return d.target.y; });

                                node.attr("cx", function(d) { return d.x; })
                                    .attr("cy", function(d) { return d.y; });
                            });
                        }
                        var refresh = function() {
                            var mode = scope.metricModel;

                            if(allGraph === undefined) {
                                return;
                            }
                            var graph = allGraph[scope.year];
                            var max = d3.max(graph.nodes, function(d) {
                                return d[mode];
                            });
                            var min = d3.min(graph.nodes, function(d) {
                                return d[mode];
                            });
                            var colorScale;
                            if(mode == 'cid') {
                                colorScale = d3.scale.category20();
                            } else if(mode == 'effective_size') {
                                colorScale = d3.scale.linear().domain([min, max]).range(['#f1eef6', '#045a8d']);
                            } else {
                                colorScale = d3.scale.linear().domain([min, max]).range(['#f1eef6', '#045a8d']);
                            }
                            svg.selectAll('.node')
                                .style('fill', function(d) {
                                    return colorScale(d[mode]);
                                })
                                .attr('opacity', function() {

                                })
                            svg.selectAll('.link')
                        }

                    }
                };
            }]);
})();