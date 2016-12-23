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
            params.queryValue.push(d);
            params.data.push(d);
            process(d, params);
            layout(params);
            callback();
        };

        var removeRank = function(cluid, params, callback) {
            var removeIndex = params.data.map(function(d) {
                return d.cluid;
            }).indexOf(cluid);
            var deletedData = params.data.splice(removeIndex, 1);
            console.log(deleteBrushedData(params.brushedData, deletedData));
            params.cluID.splice(params.cluID.indexOf(cluid), 1);
            process(cluid, params);
            layout(params);
            callback();
        };

        var histoCount = function(data, params) {
            params.count = {
                origin: {},
                scaled: {}
            }
            data.forEach(function(d) {
                var nodes = d.nodes;
                var origin = params.count.origin;
                var scaled = params.count.scaled;
                var ranges = params.ranges;
                var maxRank = d3.max(Object.values(ranges));
                for (var i = 0; i < nodes.length; i++) {
                    var data = nodes[i].data;
                    for (var j = 0; j < data.length; j++) {
                        var time = data[j].time;
                        var ranks = data[j].ranks;
                        //without scale
                        if (origin[time] == undefined) {
                            origin[time] = {};
                        }
                        for (var k = 0; k < ranks.length; k++) {
                            if (origin[time][ranks[k]] == undefined) {
                                origin[time][ranks[k]] = {
                                    objects: [],
                                    count: 0
                                };
                            }
                            origin[time][ranks[k]].count += 1;
                            origin[time][ranks[k]].objects.push(nodes[i].name);
                        }
                        //with scale
                        if (scaled[time] == undefined) {
                            scaled[time] = {};
                        }
                        for (var k = 0; k < ranks.length; k++) {
                            var scaledRank = Math.floor(ranks[k] / ranges[time] * maxRank);
                            if (scaled[time][scaledRank] == undefined) {
                                scaled[time][scaledRank] = {
                                    objects: [],
                                    count: 0
                                };
                            }
                            scaled[time][scaledRank].count += 1;
                            scaled[time][scaledRank].objects.push(nodes[i].name);
                        }
                    }
                }
            });


        };

        var process = function(d, params) {
            processHisto(params.data, params);
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
            var bar = Object.values(params.histoData.scaled)[0];
            if(bar != undefined) {
                var maxBarCount = Object.keys(Object.values(params.histoData.scaled)[0]).length;
                params.unitHeight = Math.floor((height - margin[2] - margin[3] - 50) / maxBarCount);
            } else {
                params.unitHeight = 0;
            }
            
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
                        res.origin[time][j] = {
                            count: 0,
                            objects: []
                        };
                    }
                    for (var k = j; k < j + interval; k++) {
                        var c = count.origin[time][k];
                        if (c != undefined) {
                            res.origin[time][j].count += c.count;
                            c.objects.forEach(function(d) {
                                if (res.origin[time][j].objects.indexOf(d) < 0) {
                                    res.origin[time][j].objects.push(d);
                                }
                            });
                        }
                    }
                }
                if (res.scaled[time] == undefined) {
                    res.scaled[time] = {};
                }
                for (var j = 0; j < maxRank; j += interval) {
                    if (res.scaled[time][j] == undefined) {
                        res.scaled[time][j] = {
                            count: 0,
                            objects: []
                        };
                    }
                    for (var k = j; k < j + interval; k++) {
                        var c = count.scaled[time][k];
                        if (c != undefined) {
                            res.scaled[time][j].count += c.count;
                            c.objects.forEach(function(d) {
                                if (res.scaled[time][j].objects.indexOf(d) < 0) {
                                    res.scaled[time][j].objects.push(d);
                                }
                            });
                        }
                    }
                }
            }
            return res;
        };

        var render = function(svg, params) {
            renderHistogram(svg, params);

            console.log('rank view render finished');
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
                return d3.max(Object.values(histoData[key]).map(function(d) {
                    return d.count;
                }));
            });
            min = d3.min(keys, function(key) {
                return d3.min(Object.values(histoData[key]).map(function(d) {
                    return d.count;
                }));
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
            var bindHisto = svg.selectAll('.histogram')
                .data(data, function(d) {
                    return d.time;
                });
            bindHisto.enter()
                .append('g')
                .attr('class', 'histogram');
            bindHisto.exit()
                .remove();
            var histograms = d3.selectAll('.histogram');
            histograms.transition()
                .duration(500)
                .attr('transform', function(d, i) {
                    return 'translate(' + i * params.unitWidth + ',' + 50 + ')';
                });
            histograms.call(drawHistogram, params);


            var bindText = svg.selectAll('.histoTimeText')
                .data(data, function(d) {
                    return d.time;
                });
            bindText.enter()
                .append('text')
                .attr('class', 'histoTimeText')
                .text(function(d) {
                    return d.time;
                });
            bindText.exit()
                .remove();
            var texts = d3.selectAll('.histoTimeText')
                .transition()
                .duration(500)
                .attr('transform', function(d, i) {
                    return 'translate(' + i * params.unitWidth + ',' + 30 + ')';
                });
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
                        return scale(d.value.count) * params.unitWidth / 2;
                    })
                    .attr('height', params.unitHeight)
                    .attr('y', function(d, i) {
                        return (params.unitHeight + 2) * i;
                    })
                    .attr('x', 0)
                    .attr('fill', 'steelblue')
                    .attr('opacity', 0.6);
                var brushed = function() {
                    if (!d3.event.sourceEvent) return; // Only transition after input.
                    if (!d3.event.selection) return; // Ignore empty selections.
                    var bandHeight = params.unitHeight + 2;
                    var brushPos = d3.event.selection.map(function(d) {
                        return Math.round(d / bandHeight) * bandHeight;
                    })

                    d3.select(this).transition().duration(500).call(d3.event.target.move, brushPos);
                    setTimeout(function() {
                        //check hit
                        var histoData = Object.values(d.data);
                        var hitNames = [];
                        for (var st = brushPos[0] / bandHeight, ed = brushPos[1] / bandHeight; st < ed; st++) {
                            var objects = histoData[st].objects;
                            objects.forEach(function(d) {
                                if (hitNames.indexOf(d) < 0) {
                                    hitNames.push(d);
                                }
                            });
                        }
                        var hitData = [];
                        params.data.forEach(function(rankData) {
                            var tmp = rankData.nodes.filter(function(d) {
                                var res = false;
                                if (hitNames.indexOf(d.name) >= 0) {
                                    res = true;
                                }
                                return res;
                            });
                            hitData = hitData.concat(tmp);
                        });
                        //intersect with exist hit
                        var map = {};
                        var intersect = [];
                        if (params.brushedData.length == 0) {
                            intersect = hitData;
                        } else {
                            for (var i = 0; i < params.brushedData.length; i++) {
                                map[params.brushedData[i].name] = true;
                            }
                            for (var i = 0; i < hitData.length; i++) {
                                if (map[hitData[i].name]) {
                                    intersect.push(hitData[i]);
                                }
                            }
                        }
                        params.brushedData = intersect;
                        render(params.svg, params);
                    }, 500);

                };
                var brush = d3.brushY()
                    .extent([
                        [0, 0],
                        [params.unitWidth / 2, 22 * data.length]
                    ])
                    .on('end', brushed);
                g.call(brush);

            });
        };

        var deleteBrushedData = function(brushed, deleted) {
            deleted.forEach(function(d) {
                var nodes = d.nodes;
                brushed = brushed.filter(function(d) {
                    var res = false;
                    if(nodes.indexOf(d.name) < 0) {
                        res = true;
                    }
                    return res;
                })
            });
            return brushed;
        }

        return {
            init: init,
            render: render,
            addRank: addRank,
            removeRank: removeRank,
            bindDrag: bindDrag
        }
    }]);
}());