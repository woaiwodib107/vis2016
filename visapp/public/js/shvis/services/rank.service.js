/**
 * Created by xyx on 2016/3/6.
 * PC group, compress, flow bug!!, timeAxis,
 * glyph white, rect don't move, PC bug, PC->10,,add flow group, encompass,information tip,
 * expand rect.. PC right limit
 */
(function() {
    var cluster = angular.module('shvis.rank.service', []);
    cluster.factory('RankService', ['LoadService', 'PipService', function(loadServ, pipServ) {
        var config = window.config.rank;
        var margin = config.margin;
        var init = function(dom, width, height, params) {
            //svg for global time axis
            var svg = d3.select(dom)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("id", "rankView");

            //append axis group
            var group = svg.append("g")
                .attr("id", "canvas");

            //append rank group
            group.append("g")
                .attr("id", "rankGroup")
                .attr("transform", "translate(" + (margin[0]) + "," + (margin[1] + 90) + ")");

            //axis
            svg.append("rect")
                .attr("width", width)
                .attr("height", 80)
                .attr("fill", "white")
                .attr("opacity", 1);


            var axis = svg.append("g")
                .attr("id", "rankAxis")
                .attr("transform", "translate(" + (margin[0]) + "," + (margin[1]) + ")");

            //append drag box
            svg.append("rect")
                .attr("width", 41)
                .attr("height", height)
                .attr("x", width - 40)
                .attr("y", 0) //100
                .attr("fill", "white")
                .attr("opacity", 1);

            svg.append("rect")
                .attr("width", 20)
                .attr("height", 100)
                .attr("x", width - 20)
                .attr("y", 100)
                .attr("rx", 3)
                .attr("ry", 3)
                .attr("id", "dragBox")
                .attr("fill", "grey")
                .attr("opacity", 0.4)
                .attr("transform", "translate(" + 0 + "," + /*(yBox < 0?0:(yBox > 370)?370:yBox+d3.event.dy/2)*/ 0 + ")");
            // white for separate rects
            svg.append("g")
                .attr("transform", "translate(" + (0) + "," + (margin[1] + 100) + ")")
                .append("g")
                .attr("class", "separateRects");

            return svg;
        };

        var addRank = function(d, params, callback) {
            process(d, params);
            layout(params);


            // histoCount(d, params);
            // params.histoData = merge(params.count, params.ranges, params.interval);
            // layoutHisto(params.histoData, params);
            callback();
        };

        var histoCount = function(d, params) {
            var nodes = d.nodes;
            var orgin = params.count.origin;
            var scaled = params.count.scaled;
            var ranges = params.ranges;
            var maxRank = d3.max(Object.values(ranges));
            for (var i = 0; i < nodes.length; i++) {
                var data = nodes[i].data;
                for (var j = 0; j < data.length; j++) {
                    var time = data[j].time;
                    var ranks = data[j].ranks;
                    //without scale
                    if (orgin[time] == undefined) {
                        orgin[time] = {};
                    }
                    for (var k = 0; k < ranks.length; k++) {
                        if (orgin[time][ranks[k]] == undefined) {
                            orgin[time][ranks[k]] = 0;
                        }
                        orgin[time][ranks[k]] += 1;
                    }
                    //with scale
                    if (scaled[time] == undefined) {
                        scaled[time] = {};
                    }
                    for (var k = 0; k < ranks.length; k++) {
                        var scaledRank = Math.floor(ranks[k] / ranges[time] * maxRank);
                        if (scaled[time][scaledRank] == undefined) {
                            scaled[time][scaledRank] = 0;
                        }
                        scaled[time][scaledRank] += 1;
                    }
                }
            }

        };

        var process = function(d, params) {
            processHisto(d, params);
            processSankey();
            processNodes();
        };

        var processHisto = function(d, params) {
            histoCount(d, params);
            params.histoData = merge(params.count, params.ranges, params.interval);
        };

        var processSankey = function() {

        };

        var processNodes = function() {

        };

        var layout = function(params) {
            layoutHisto(params.histoData, params);
            layoutSankey();
            layoutNodes();
        };

        var layoutHisto = function(histoData, params) {
            var height = params.height;
            var width = params.width;
            var timeCount = Object.keys(histoData.origin).length;
            var margin = window.config.rank.margin;
            params.unitWidth = (width - margin[0] - margin[1]) / timeCount;
        };

        var layoutSankey = function() {

        };

        var layoutNodes = function() {

        };

        var merge = function(count, ranges, interval) {
            var times = Object.keys(count.origin);
            var res = {
                origin: {},
                scaled: {}
            };
            var maxRank = d3.max(Object.values(ranges));
            for (var i = 0; i < times.length; i++) {
                var time = times[i];
                if (res.origin[time] == undefined) {
                    res.origin[time] = {};
                }
                var range = ranges[time];
                for (var j = 0; j < range; j += interval) {
                    if (res.origin[time][j] == undefined) {
                        res.origin[time][j] = 0;
                    }
                    for (var k = j; k < j + interval; k++) {
                        var c = count.origin[time][k];
                        if (c != undefined) {
                            res.origin[time][j] += c;
                        }
                    }
                }
                if (res.scaled[time] == undefined) {
                    res.scaled[time] = {};
                }
                for (var j = 0; j < maxRank; j += interval) {
                    if (res.scaled[time][j] == undefined) {
                        res.scaled[time][j] = 0;
                    }
                    for (var k = j; k < j + interval; k++) {
                        var c = count.scaled[time][k];
                        if (c != undefined) {
                            res.scaled[time][j] += c;
                        }
                    }
                }
            }
            return res;
        };

        var render = function(svg, params) {
            renderHistogram(svg, params);
        };

        var renderHistogram = function(svg, params) {
            var max, min;
            var histoData;
            if (params.mode == "origin") {
                histoData = params.histoData.origin;
            } else {
                histoData = params.histoData.scaled;
            }
            var keys = Object.keys(histoData);
            max = d3.max(keys, function(key) {
                return d3.max(Object.values(histoData[key]));
            });
            min = d3.min(keys, function(key) {
                return d3.min(Object.values(histoData[key]));
            });
            console.log(max + ',' + min);
            var scale = d3.scaleLinear().domain([min, max]).range([0, 1]);

            var data = Object.keys(histoData)
                .map(function(key) {
                    return {
                        time: key,
                        data: histoData[key],
                        scale: scale
                    }
                })
                .sort(function(a, b) {
                    return a.time - b.time;
                });
            var histograms = svg.selectAll('.histogram')
                .data(data, function(d) {
                    return d.time;
                });
            console.log(params.unitWidth);
            histograms.enter()
                .append('g')
                .attr('class', 'histogram');
            svg.selectAll('.histogram')
                .transition()
                .duration(500)
                .attr('transform', function(d, i) {
                    return 'translate(' + i * params.unitWidth + ',' + 50 + ')';
                });
            svg.selectAll('.histogram').call(drawHistogram, params);
        };

        var renderSankey = function(svg, params) {

        };

        var renderNodes = function(svg, params) {

        };

        var bindDrag = function(svg, params) {

        };

        var drawHistogram = function(g, params) {
            g.each(function(d) {
                var g = d3.select(this);
                var data = Object.keys(d.data)
                    .sort(function(a, b) {
                        return a.time - b.time;
                    })
                    .map(function(key) {
                        return {
                            value: d.data[key],
                            key: key
                        };
                    });
                var scale = d.scale;
                var histoRects = g.selectAll('.histoRect')
                    .data(data, function(d) {
                        return d.key;
                    });
                histoRects.enter()
                    .append('rect')
                    .attr('class', 'histoRect');
                histoRects.exit()
                    .remove();
                g.selectAll('.histoRect').transition()
                    .duration(500)
                    .attr('width', function(d) {
                        return scale(d.value) * params.unitWidth / 2;
                    })
                    .attr('height', 20)
                    .attr('y', function(d, i) {
                        return 22 * i;
                    })
                    .attr('x', 0)
                    .attr('fill', 'steelblue')
                    .attr('opacity', 0.6);

            })
        }


        return {
            init: init,
            render: render,
            addRank: addRank,
            bindDrag: bindDrag
        }
    }]);
}());