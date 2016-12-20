/**
 * Created by xyx on 2016/3/14.
 */
'use strict';
(function() {
    angular.module('shvis.control.directive', [])
        .directive('controlView', ['$http', 'LoadService', '$timeout',
            function($http, loadServ, $timeout) {
                return {
                    restrict: 'E',
                    templateUrl: 'js/shvis/partials/control.view.html',
                    replace: true,
                    link: function(scope, element, attrs) {
                        // $timeout(function() {
                        //     var d3 = window.d3;
                        //     var variance = [{
                        //         'value': 1,
                        //         'number': 0
                        //     }, {
                        //         'value': 2,
                        //         'number': 0
                        //     }, {
                        //         'value': 3,
                        //         'number': 0
                        //     }, {
                        //         'value': 4,
                        //         'number': 0
                        //     }, {
                        //         'value': 5,
                        //         'number': 0
                        //     }, {
                        //         'value': 6,
                        //         'number': 0
                        //     }, {
                        //         'value': 7,
                        //         'number': 0
                        //     }];
                        //     var varianceNum = 7;
                        //     var devMax = 0,
                        //         devMin = 0,
                        //         highest = 0;


                        //     var margin = {
                        //             top: 10,
                        //             right: 10,
                        //             bottom: 15,
                        //             left: 20
                        //         },
                        //         width = $('#barchart_svg').width() - margin.left - margin.right,
                        //         height = 180 - margin.top - margin.bottom;

                        //     var x = d3.scaleOrdinal()
                        //         .rangeRoundBands([0, width], .1);

                        //     var y = d3.scaleLinear()
                        //         .range([height, 0]);

                        //     var brush = d3.svg.brush()
                        //         .x(x)
                        //         .on("brush", brushed)
                        //         .on('brushend', brushend);


                        //     var xAxis = d3.svg.axis()
                        //         .scale(x)
                        //         .orient("bottom");

                        //     var yAxis = d3.svg.axis()
                        //         .scale(y)
                        //         .orient("left");

                        //     var svg = d3.select(element[0]).select("#barchart_svg").append("svg")
                        //         .attr("width", width + margin.left + margin.right)
                        //         .attr("height", height + margin.top + margin.bottom)
                        //         .append("g")
                        //         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        //     x.domain(variance.map(function(d) {
                        //         return d.value;
                        //     }));
                        //     y.domain([0, d3.max(variance, function(d) {
                        //         return d.number;
                        //     })]);

                        //     svg.append("g")
                        //         .attr("class", "x axis")
                        //         .attr("transform", "translate(0," + height + ")")
                        //         .call(xAxis);

                        //     svg.append("g")
                        //         .attr("class", "y axis")
                        //         .call(yAxis)
                        //         .append("text")
                        //         .attr("transform", "rotate(-90)")
                        //         .attr("y", 6)
                        //         .attr("dy", ".71em")
                        //         .style("text-anchor", "end")
                        //         .text("Distribution");

                        //     svg.selectAll(".bar")
                        //         .data(variance)
                        //         .enter().append("rect")
                        //         .attr("class", "bar")
                        //         .attr("fill", "grey")
                        //         .attr("opacity", "0.7")
                        //         .attr("stroke", "none")
                        //         .attr("x", function(d) {
                        //             return x(d.value);
                        //         })
                        //         .attr("width", x.rangeBand())
                        //         .attr("y", function(d) {
                        //             return y(d.number);
                        //         })
                        //         .attr("height", function(d) {
                        //             return height - y(d.number);
                        //         });

                        //     svg.append("g")
                        //         .attr("class", "x brush")
                        //         .call(brush)
                        //         .selectAll("rect")
                        //         .attr("y", 0)
                        //         .attr("height", height);

                        //     svg.append("text")
                        //         .attr("x", -margin.left / 2)
                        //         .attr("y", 0)
                        //         //.attr("transform", "rotate(-90)")
                        //         .attr("id", "yText")
                        //         .text(highest);

                        //     svg.append("text")
                        //         .attr("x", 0)
                        //         .attr("y", height + margin.bottom)
                        //         .attr("id", "xTextMin")
                        //         .text(devMin);
                        //     svg.append("text")
                        //         .attr("x", width - margin.right * 2)
                        //         .attr("y", height + margin.bottom)
                        //         .attr("id", "xTextMax")
                        //         .text(devMax);

                        //     $('#clear').on('click', function() {
                        //         $('#node_number_input').val('');
                        //         $('#variance_start').val('');
                        //         $('#variance_end').val('');
                        //         $('.extent').hide();
                        //     });

                        //     $('#save').on('click', function() {
                        //         var nodeNumber = $('#node_number_input').val(),
                        //             variance_start = $('#variance_start').val(),
                        //             variance_end = $('#variance_end').val();
                        //         if (variance_start >= variance[0].value && variance_end <= variance[variance.length - 1].value) {
                        //             console.log(nodeNumber, variance_start, variance_end);
                        //         } else {
                        //             alert('Wrong variance value!')
                        //         }
                        //     });



                        //     function brushed() {
                        //         $('.extent').show();
                        //         x.domain(brush.empty() ? x.domain() : brush.extent());
                        //     }

                        //     function brushend() {
                        //         var start = brush.extent()[0],
                        //             end = brush.extent()[1];
                        //         var length = variance.length;
                        //         var barwidth = width / length;
                        //         var start = parseInt(start / barwidth),
                        //             end = parseInt(end / barwidth);
                        //         $('#variance_start').val(variance[start].value);
                        //         $('#variance_end').val(variance[end].value);
                        //     }
                        //     scope.$watchCollection("nodeData", function(newValue, oldValue) {

                        //         if (newValue !== oldValue) {
                        //             var dev = [];
                        //             newValue.forEach(function(cluster) {
                        //                 cluster.nodes.forEach(function(layer) {
                        //                     layer.forEach(function(year) {
                        //                         year.forEach(function(node) {
                        //                             dev.push(node.dev);
                        //                         });
                        //                     });
                        //                 });
                        //             });
                        //             dev.sort();
                        //             var devMax = d3.max(dev) == undefined ? 0 : d3.max(dev),
                        //                 devMin = d3.min(dev) == undefined ? 0 : d3.min(dev);
                        //             var step = (devMax - devMin) / varianceNum;
                        //             for (var i = devMin, j = 0; i < devMax - 1; i += step, ++j) {
                        //                 variance[j]['value'] = i;
                        //                 variance[j]['number'] = 0;
                        //             }
                        //             dev.forEach(function(d, i) {
                        //                 for (var j = 0; j < variance.length; ++j) {
                        //                     if (j == variance.length - 1) {
                        //                         if (d >= variance[j]['value']) {
                        //                             ++variance[j]['number'];
                        //                             break;
                        //                         }
                        //                     }
                        //                     if (d >= variance[j]['value'] && d < variance[j + 1]['value']) {
                        //                         ++variance[j]['number'];
                        //                         break;
                        //                     }
                        //                 }
                        //             });
                        //             highest = d3.max(variance, function(d, i) {
                        //                 return d['number'];
                        //             });

                        //             x.domain(variance.map(function(d) {
                        //                 return d.value;
                        //             }));
                        //             y.domain([0, d3.max(variance, function(d) {
                        //                 return d.number;
                        //             })]);

                        //             svg.selectAll(".bar")
                        //                 .transition()
                        //                 .duration(1000)
                        //                 .attr("x", function(d) {
                        //                     return x(d.value);
                        //                 })
                        //                 .attr("width", x.rangeBand())
                        //                 .attr("y", function(d) {
                        //                     return y(d.number);
                        //                 })
                        //                 .attr("height", function(d) {
                        //                     return height - y(d.number);
                        //                 });

                        //             svg.selectAll("#yText")
                        //                 .transition()
                        //                 .duration(1000)
                        //                 .text(highest);

                        //             svg.selectAll("#xTextMin")
                        //                 .transition()
                        //                 .duration(1000)
                        //                 .text(devMin.toFixed(1));

                        //             svg.selectAll("#xTextMax")
                        //                 .transition()
                        //                 .duration(1000)
                        //                 .text(devMax.toFixed(1));
                        //         }
                        //     });
                        // }, 0);
                    }

                }
            }
        ]);
})();