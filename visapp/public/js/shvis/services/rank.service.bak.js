/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    var cluster = angular.module('shvis.rank.service', []);
    cluster.factory('RankService', ['LoadService', function (loadServ) {
        var d3 = window.d3;
        var heatmap = window.h337;
        var diagonal = d3.svg.diagonal()
            .projection(function(d) {
                return [d.y, d.x];
            });
        var colorbrewer = window.colorbrewer;
        var timeScale = window.config.timeScale;
        var init = function(dom, width, height) {
            //svg for global time axis
            d3.select(dom)
                .select("#rank-view")
                .insert("svg")
                .attr("width", 1200)
                .attr("height", 100)
                .attr("id", "rankAxis");
            //svg for cluster
            d3.select("#cluster-svg")
                .append("svg")
                .attr("width", 200)
                .attr("height", 500)
                .style("float", "left")
                .attr("id", "rankCluster");

            d3.select(dom).select("#rank-view").append('svg')
                .attr("width", width - window.config.cluster.width)
                .attr("height", height)
                .style("float", "left")
                .attr("id", "rankView");
        };
        var preprocess = function(d) {
            var res = {};
            var nodes = [];
            var links = [];
            var weight = window.config.rank.weight;
            var partition = window.config.rank.partition;
            var timeScale = window.config.timeScale;
            for(var i = 0; i < d.length; i++) {
                var data = d[i].data;
                for(var j = 0, len = data.length; j < len; j++) {
                    var ranks = data[j].ranks;
                    var dev = deviation(ranks);
                    data[j]["dev"] = dev;
                    var year = data[j].year;
                    if(timeScale.indexOf(year) < 0) {
                        continue;
                    }
                    var keys = Object.keys(ranks);
                    var weightRank = d3.sum(keys, function(d) {
                        return ranks[d] * weight[d];
                    });
                    data[j]['weightRank'] = weightRank;
                    for(var k = 0; k < partition.length; k++) {
                        if(weightRank < partition[k]) {
                            if(nodes[k] == undefined) {
                                nodes[k] = {};
                            }
                            if(nodes[k][year] ==  undefined) {
                                nodes[k][year] = [];
                            }
                            data[j]["name"] = d[i].name;
                            nodes[k][year].push(data[j]);
                            break;
                        }
                    }
                }
                var sorted = data.sort(function(a, b) {
                    var res;
                    if(Number(a.year) > Number(b.year)){
                        res = -1;
                    } else if(Number(a.year) < Number(b.year)) {
                        res = 1;
                    } else {
                        res = 0;
                    }
                    return res;

//                    return Number(b['year']) - Number(a['year']);
                });
                for(var j = 0, len = sorted.length - 1; j < len; j++) {
                    if(timeScale.indexOf(sorted[j].year) < 0 || timeScale.indexOf(sorted[j + 1].year) < 0 ) {
                        continue;
                    }
                    links.push({
                        source:sorted[j],
                        target:sorted[j+1]
                    })
                }
            }

            res["nodes"] = nodes.map(function(d) {
                var keys = Object.keys(d);
                var res = keys.map(function(key) {
                    return d[key].sort(function(a,b) {
                        return a["weightRank"] > b["weightRank"];
                    })
                });
                return res;
            });
            var maxDev = d3.max(nodes, function(d) {
                var keys = Object.keys(d);
                return d3.max(keys, function(key) {
                    return d3.max(d[key], function(x) {
                        return x["dev"];
                    })
                })
            });
            var minDev = d3.min(nodes, function(d) {
                var keys = Object.keys(d);
                return d3.min(keys, function(key) {
                    return d3.min(d[key], function(x) {
                        return x["dev"];
                    });
                })
            });
            var devColorScale = d3.scale.linear().domain([minDev, (minDev + maxDev) / 2, maxDev]).range(colorbrewer["Reds"][3].reverse());
            for(var i = 0, len = nodes.length; i < len; i++) {
                var keys = Object.keys(nodes[i]);
                for(var j = 0, timeLen = keys.length; j < timeLen; j++) {
                    var timeNodes = nodes[i][keys[j]];
                    for(var k = 0, nodeLen = timeNodes.length; k < nodeLen; k++) {
                        timeNodes[k]["devColor"] = devColorScale(timeNodes[k]["dev"]);
                    }
                }
            }
            res["links"] = links;
            return res;

        };
        var data_;
        var layers, links, nodes;
        var testLink = [
            {"source":{"x":150, "y":60}, "target":{"x":180, "y":90}}
        ];

        var addRank = function(g, cluID, callback) {
            var rankHeight;
            loadServ.loadRank(cluID, function(d) {
                data_ = preprocess(d);
                links = data_.links;
                rankHeight = layoutRank();
                layers = drawFlows(g);
                nodes = drawNodes(g);
                drawLinks(g);
                drawAxis();

                callback(rankHeight);
            });
        };
        var layoutRank = function() {
            var nodes = data_.nodes;
            var config = window.config.rank;
            var nodeWidth = config.glyph.ringOuterRadius * 2;
            var maxNodes = nodes.map(function(d) {
                var keys = Object.keys(d);
                return d3.max(keys, function(key) {
                    return d[key].length;
                })
            });
            var totalHeight = d3.sum(maxNodes) * (nodeWidth + 2) + 5 * (maxNodes.length - 1);
            var totalWidth = config.unitWidth * (timeScale.length - 1);
            var xScale = d3.scale.ordinal().domain(timeScale).rangePoints([0, totalWidth]);

            var basePos = [];
            var pos = 0;
            for(var i = 0, len = maxNodes.length; i < len; i++) {
                var areaHeight = maxNodes[i] * (nodeWidth + 2);
                basePos.push(pos + areaHeight / 2);
                pos += areaHeight + 5;
            }
            var layerBounds = [];
            for(var i = 0, len = nodes.length; i < len; i++) {
                var cluster = nodes[i];
                var bounds = {}
                for(var j = 0, yearLen = cluster.length; j < yearLen; j++) {
                    var count = cluster[j].length;
                    var range = [basePos[i] - count * (nodeWidth + 2) / 2, basePos[i] + count * (nodeWidth + 2) / 2];
                    var yScale = d3.scale.linear().domain([0, count]).range(range);

                    cluster[j].forEach(function(n, index) {
                        var y = yScale(index);
                        n['x'] = xScale(n['year']);
                        n['y'] = y;
                        if(bounds[n['year']] === undefined) {
                            bounds[n['year']] = [];
                        }
                        bounds[n['year']].push(y);
                    })

                }
                layerBounds.push(bounds);
            }
            var distBetweenLayers = [];
            for(var i = 0, len = nodes.length - 1; i < len; i++) {
                var cluster1 = nodes[i],
                    cluster2 = nodes[i + 1];
                var bound1 = layerBounds[i],
                    bound2 = layerBounds[i + 1];
                var times = Object.keys(bound1);
                var dists = [];
                for(var j = 0, timeLen = times.length; j < timeLen; j++) {
                    var t = times[j];
                    if(bound2[t] !== undefined) {
                        dists.push(d3.min(bound2[t]) - d3.max(bound1[t]));
                    }
                }
                var minDist = d3.min(dists);
                distBetweenLayers.push(minDist - 50);
                var yOffset = d3.sum(distBetweenLayers);
                cluster2.forEach(function(nodesAtTime) {
                    nodesAtTime.forEach(function(node) {
                        node['y'] -= yOffset;
                    })
                })

            }
            return totalHeight;

        };
        var drawNodes = function(g) {
            var nodes = data_.nodes;
            var data = [];
            for(var i = 0, len = nodes.length; i < len; i++) {
                var cluster = nodes[i];
                for(var j = 0, yearLen = cluster.length; j < yearLen; j++) {
                    cluster[j].forEach(function(n) {
                        data.push(n);
                    })
                }
            }
            g.selectAll(".rankNode")
                .data(data, function(d) {
                    return d.year + "," +d.name;
                })
                .enter()
                .append("g")
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
                .attr("class", "rankNode")
                .attr("year", function(d){
                    return d.year;
                })
                .call(glyph);
            //nodes.exit()
            //    .remove();
            return data;
        };
        var bezLine = function(d) {
            var x1 = d.source.x,
                x2 = d.target.x,
                y1 = d.source.y,
                y2 = d.target.y;
            if(expandFlags[divideYear - timeScale[0]] && d.target.year == divideYear)
                x2 -= 2*interval;
            var cx = (x1 + x2) / 2;
            return "M " + x1 + "," + y1 + " C " + [cx, y1, cx, y2, x2, y2].join(" ");
        };
        var drawLinks = function(g) {
            g.selectAll(".rankLink")
                .data(links)
                .enter()
                .append("path")
                .attr("d",bezLine)
                .attr("stroke-opacity", expandFlags[0]?0.2:1)
                .attr("class", "rankLink");
            return links;

        };
        var expandFlags = [];
        var drawnPCFlags = [];
        for(var i = 0; i < timeScale.length; i++)
        {
            expandFlags[i] = false;
            drawnPCFlags[i] = false;
        }

        var drawAxis = function(){
            var g = d3.select("#rankAxis")
                    .append("g")
                    .attr("transform", function(d) {
                        return "translate(" + (40) + "," + 40 + ")";
                    })
                    .attr("id", "rankAxisGroup");
            var xMin = d3.min(data_.nodes, function(d) {
                var keys = Object.keys(d);
                return d3.min(keys, function(key) {
                    return d3.min(d[key], function(x) {
                        return x["x"];
                    });
                })
            });
            var xMax = d3.max(data_.nodes, function(d) {
                var keys = Object.keys(d);
                return d3.max(keys, function(key) {
                    return d3.max(d[key], function(x) {
                        return x["x"];
                    });
                })
            });
            var yMin = d3.min(data_.nodes, function(d) {
                var keys = Object.keys(d);
                return d3.min(keys, function(key) {
                    return d3.min(d[key], function(y) {
                        return y["y"];
                    });
                })
            });
            var yMax = d3.max(data_.nodes, function(d) {
                var keys = Object.keys(d);
                return d3.max(keys, function(key) {
                    return d3.max(d[key], function(y) {
                        return y["y"];
                    });
                })
            });
            var axisData = [], tickData = [], tmp = {};
            nodes.forEach(function (n) {
                tmp[n.x] = 1;
            });
            tickData = Object.keys(tmp);
            axisData = tickData.slice(1, Object.keys(tmp).length);

            var yearTmp = timeScale[0];
            tickData.forEach(function (d, i) {
                tickData[i] = {x:parseInt(d), year:yearTmp++};
            });
            yearTmp = timeScale[0];
            axisData.forEach(function (d, i) {
                axisData[i] = {x:parseInt(d), year:yearTmp++};
            });

            g.selectAll(".globalAxis")
                .data(axisData)
                .enter()
                .append("line")
                .attr("x1", function (d, i) {
                    return (i==0)?0:axisData[i-1].x;
                })
                .attr("x2", function (d) {
                    return d.x;
                })
                .attr("y1", yMin)
                .attr("y2", yMin)
                .attr("fill", "grey")
                .attr("stroke", "grey")
                .attr("class", "globalAxis");

            g.selectAll(".globalAxisTick")
                .data(tickData)
                .enter()
                .append("line")
                .attr("x1", function (d) {
                    return d.x;
                })
                .attr("x2", function (d) {
                    return d.x;
                })
                .attr("y1", yMin-10)
                .attr("y2", yMin)
                .attr("fill", "red")
                .attr("stroke", "grey")
                .attr("class", "globalAxisTick");


            var xScale = d3.scale.linear()
                .domain([2000, 2015])
                .range([xMin, xMax]);
            var ctrlCircles = [];
            for(var i = 2000; i <= 2015; ++i)
                ctrlCircles.push(i);
            ctrlCircles.forEach(function (d, i) {
                var x = xScale(d), y = yMin;
                ctrlCircles[i] = {x:x, y:y, year:d};
            });

            g.selectAll(".ctrlCircles")
                .data(ctrlCircles)
                .enter()
                .append("circle")
                .attr("cx", function(d) {
                    return d.x;
                })
                .attr("cy", function(d) {
                    return d.y;
                })
                .attr("r", function(d) {
                    return 10;
                })
                .attr("fill", function(d){
                    return "green";
                })
                .attr("opacity", 0.4)
                .attr("class", "ctrlCircles")
                .on("click", function (d, i) {
                    if (d3.event.defaultPrevented) return;
                    expandFlags[i] = !expandFlags[i];
                    divideYear = d.year;
                    flowsAnimation(ctrlCircles, axisData, tickData, nodes, d.year, i);
                    //expandFlags[0] = !expandFlags[0];
                });
            //test drag...
            d3.select("#rankAxisGroup")
                .call(d3.behavior.drag()
                    .on("drag", function(d) {
                        d3.select(".rankOfClu")
                            .attr("transform", function(d) {
                                var t = d3.transform(d3.select(".rankOfClu").attr("transform")),
                                    x = t.translate[0],
                                    y = t.translate[1];
                                return "translate(" + (x + d3.event.dx) + "," + y + ")";
                            });

                        d3.select("#rankAxisGroup")
                            .attr("transform", function(d) {
                                var t = d3.transform(d3.select("#rankAxisGroup").attr("transform")),
                                    x = t.translate[0],
                                    y = t.translate[1];
                                return "translate(" + (x + d3.event.dx) + "," + y + ")";
                            });

                    })
                );

        };
        var divideYearDataUp = [], divideYearDataDown = [];
        for(i = 0; i < timeScale.length; i++)
        {
            divideYearDataUp[i] = {};
            divideYearDataDown[i] = {};
        }
        var scaleRight, scaleBackRight;
        var scaleAxisRight, scaleAxisBackRight;
        var interval = 200;
        var timeDuration = 1000;
        var divideYear = 2010;
        var drawFlows = function(g) {
            var nodes = data_.nodes;
            var links = data_.links;

            var minYear = timeScale[0];
            var maxYear = timeScale[timeScale.length-1];
            var flowMargin = 15;

            //draw each layer of the stream
            var layerNum = 0; // number of layers
            for(var l = 0; l < data_.nodes.length; ++l)
                layerNum += getMinMaxYear(l)[1] - getMinMaxYear(l)[0] + 2;

            var sampleNum = 2,
                stack = d3.layout.stack().offset("wiggle"),
                layers = stack(d3.range(layerNum).map(function() { return getLayer(); }));

            var index = 0;
            for(l = 0; l < data_.nodes.length; ++l)
            {
                minYear = getMinMaxYear(l)[0];
                maxYear = getMinMaxYear(l)[1];
                var resUp = trick(nodes, l, minYear, true);
                var resDown = trick(nodes, l, minYear, false);
                //var index = l * (maxYear - minYear + 2);
                layers[index][0].x = resUp.x - flowMargin * 2;
                layers[index][0].y0 = (resUp.y == resDown.y)? resUp.y : (resUp.y + resDown.y) / 2;
                layers[index][0].y1 = (resDown.y == resUp.y)? resDown.y : (resUp.y + resDown.y) / 2;
                layers[index][1].x = resUp.x;
                layers[index][1].y0 = resUp.y - flowMargin;
                layers[index++][1].y1 = resDown.y + flowMargin;
                for(var y = 1; y <= maxYear - minYear; ++y)
                {
                    //index = l * (maxYear - minYear + 2) + y;
                    resUp = trick(nodes, l, minYear + y - 1, true);
                    resDown = trick(nodes, l, minYear + y - 1, false);
                    layers[index][0].x = resUp.x;
                    layers[index][0].y0 = resUp.y - flowMargin;
                    layers[index][0].y1 = resDown.y + flowMargin;

                    resUp = trick(nodes, l, minYear + y, true);
                    resDown = trick(nodes, l, minYear + y, false);
                    layers[index][1].x = resUp.x;
                    layers[index][1].y0 = resUp.y - flowMargin;
                    layers[index++][1].y1 = resDown.y + flowMargin;
                }
                resUp = trick(nodes, l, maxYear, true);
                resDown = trick(nodes, l, maxYear, false);
                //index = (l + 1) * (maxYear - minYear + 2) - 1;
                layers[index][0].x = resUp.x;
                layers[index][0].y0 = resUp.y - flowMargin;
                layers[index][0].y1 = resDown.y + flowMargin;
                layers[index][1].x = resUp.x + flowMargin * 2;
                layers[index][1].y0 = (resUp.y == resDown.y)? resUp.y : (resUp.y + resDown.y) / 2;
                layers[index++][1].y1 = (resDown.y == resUp.y)? resDown.y : (resUp.y + resDown.y) / 2;
            }
            var color = d3.scale.ordinal()
                .range(colorbrewer["Greens"][3]);

            var area = function(d, i) {
                var x1 = d[0].x,
                    x2 = d[1].x,
                    y1d = d[0].y1,
                    y2d = d[1].y1,
                    y1u = d[0].y0,
                    y2u = d[1].y0;
                var cx = (x1 + x2) / 2;
                return "M " + x1 + "," + y1d + " C " + [cx, y1d, cx, y2d, x2, y2d].join(" ") + "L " + x2 + "," + y2u + " C " + [cx, y2u, cx, y1u, x1, y1u].join(" ") + " Z";
            };

            g.selectAll(".flows")
                .data(layers)
                .enter().append("path")
                .attr("d", area)
                .style("stroke", "none")
                .style("fill", function(d, i) {
                    var l = 0, count = 0;
                    minYear = getMinMaxYear(l)[0];
                    maxYear = getMinMaxYear(l)[1];
                    i -= (maxYear - minYear + 2);
                    while(i >= 0)
                    {
                        ++l;
                        minYear = getMinMaxYear(l)[0];
                        maxYear = getMinMaxYear(l)[1];
                        i -= (maxYear - minYear + 2);
                        ++count;
                    }
                    return color(count); })
                .attr("opacity", 0.5)
                .attr("class", "flows");




            return layers;

            function getLayer()
            {
                var n = sampleNum;
                var a = [], i;
                for (i = 0; i < n; ++i) a[i] = 0;
                return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
            }
        };
        var addDragRect = function(width, height) {

            //test links
            d3.select("#rankCluster")
                .selectAll(".testLink")
                .data(testLink)
                .enter()
                .append("path")
                .attr("d", bezLine)
                .attr("stroke", "blue")
                .attr("fill", "none")
                .attr("class", "testLink");

            //for drag on stream graph
            d3.select("#rankView").append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "white")
                .attr("opacity", 1)
                .call(d3.behavior.drag()
                    .on("drag", function(d) {
                        var t = d3.transform(d3.select(".rankOfClu").attr("transform")),
                            x = t.translate[0],
                            y = t.translate[1];
                        var expandNum = 0;
                        expandFlags.forEach(function(f)
                        {
                            if(f)
                                expandNum++;
                        });
                        console.log(expandNum);
                        // x limit
                        if(x <= 30)
                        {
                            d3.select(".rankOfClu")
                                .attr("transform", function(d) {
                                    return "translate(" + (x + d3.event.dx) + "," + (y + d3.event.dy) + ")";
                                });
                        }
                        else
                        {
                            d3.select(".rankOfClu")
                                .transition()
                                .duration(100)
                                .attr("transform", function(d) {
                                    return "translate(" + 30 + "," + y + ")";
                                });
                        }
                        if(x >= (-150-interval*2*expandNum))
                        {
                            d3.select(".rankOfClu")
                                .attr("transform", function(d) {
                                    return "translate(" + (x + d3.event.dx) + "," + (y + d3.event.dy) + ")";
                                });
                        }
                        else
                        {
                            d3.select(".rankOfClu")
                                .transition()
                                .duration(100)
                                .attr("transform", function(d) {
                                    return "translate(" + (-150-interval*2*expandNum) + "," + y + ")";
                                });
                        }
                        // y limit
                        if(y <= 120)
                        {
                            d3.select(".rankOfClu")
                                .attr("transform", function(d) {
                                    return "translate(" + (x + d3.event.dx) + "," + (y + d3.event.dy) + ")";
                                });
                        }
                        else
                        {
                            d3.select(".rankOfClu")
                                .transition()
                                .duration(100)
                                .attr("transform", function(d) {
                                    return "translate(" + x + "," + 120 + ")";
                                });
                        }
                        if(y >= -50)
                        {
                            d3.select(".rankOfClu")
                                .attr("transform", function(d) {
                                    return "translate(" + (x + d3.event.dx) + "," + (y + d3.event.dy) + ")";
                                });
                        }
                        else
                        {
                            d3.select(".rankOfClu")
                                .transition()
                                .duration(100)
                                .attr("transform", function(d) {
                                    return "translate(" + x + "," + (-50) + ")";
                                });
                        }
                        if(x >= (-150-interval*2*expandNum) && x <= 30 && y >= -50 && y <= 120)
                            testLink[0].target.y += d3.event.dy;

                        t = d3.transform(d3.select("#rankAxisGroup").attr("transform"));
                        x = t.translate[0];
                        y = t.translate[1];
                        if(x <= 270)
                        {
                            d3.select("#rankAxisGroup")
                                .attr("transform", function(d) {
                                    return "translate(" + (x + d3.event.dx) + "," + y + ")";
                                });
                        }
                        else
                        {
                            d3.select("#rankAxisGroup")
                                .transition()
                                .duration(100)
                                .attr("transform", function(d) {
                                    return "translate(" + (270) + "," + y + ")";
                                });
                        }
                        if(x >= (90-interval*2*expandNum))
                        {
                            d3.select("#rankAxisGroup")
                                .attr("transform", function(d) {
                                    return "translate(" + (x + d3.event.dx) + "," + y + ")";
                                });
                        }
                        else
                        {
                            d3.select("#rankAxisGroup")
                                .transition()
                                .duration(100)
                                .attr("transform", function(d) {
                                    return "translate(" + (90-interval*2*expandNum) + "," + y + ")";
                                });
                        }

                        d3.select(".testLink")
                            .transition()
                            .duration(0)
                            .attr("d", bezLine);

                    })
                );

        };
        var flowsAnimation = function(ctrlCircles, axisData, tickData, nodesDrawn, year, expandIndex) {
            //divideYear = year;
            console.log(getFlowSize());
            var nodes = data_.nodes,
                minYear = timeScale[0],
                maxYear = timeScale[timeScale.length-1];
            //draw each layer of the stream
            var layerNum = data_.nodes.length * (maxYear - minYear + 2); // number of layers
            var tryUp = 0, tryDown = data_.nodes.length-1;
            divideYearDataUp[year-minYear] = trick(nodes, tryUp, year, true);
            divideYearDataDown[year-minYear] = trick(nodes, tryDown, year, false);
            while(!divideYearDataUp[year-minYear].valid)
                divideYearDataUp[year-minYear] = trick(nodes, ++tryUp, year, true);
            while(!divideYearDataDown[year-minYear].valid)
                divideYearDataDown[year-minYear] = trick(nodes, --tryDown, year, false);

            var lmin = trick(nodes, 2, minYear, true).x;
            var lmax, rmin;
                rmin = lmax = trick(nodes, 2, year, true).x;
            var rmax = trick(nodes, 2, maxYear, true).x + interval;

            if(expandFlags[expandIndex])
            {
                scaleRight = d3.scale.linear().domain([rmin, rmax]).range([rmin+2*interval, rmax+2*interval]);
                scaleBackRight = d3.scale.linear().domain([rmin+2*interval, rmax+2*interval]).range([rmin, rmax]);

                scaleAxisRight = d3.scale.linear().domain([rmin+100, rmax]).range([rmin+2*interval+100, rmax+2*interval]);
                scaleAxisBackRight = d3.scale.linear().domain([rmin+2*interval+100, rmax+2*interval]).range([rmin+100, rmax]);
            }
            for(var i = 0; i < ctrlCircles.length; ++i)
            {
                if (ctrlCircles[i].year == year)
                {
                    if(expandFlags[expandIndex])
                        ctrlCircles[i].x = (scaleAxisRight(ctrlCircles[i].x) + ctrlCircles[i].x) / 2;
                    else
                        ctrlCircles[i].x = (scaleAxisBackRight(ctrlCircles[i].x) + ctrlCircles[i].x) / 2;

                }
                if (ctrlCircles[i].year > year)
                {
                    if(expandFlags[expandIndex])
                        ctrlCircles[i].x = scaleAxisRight(ctrlCircles[i].x);
                    else
                        ctrlCircles[i].x = scaleAxisBackRight(ctrlCircles[i].x);
                }
            }
            for(i = 0; i < tickData.length; ++i)
            {
                if (tickData[i].year == year)
                {
                    if(expandFlags[expandIndex])
                        tickData[i].x = (scaleAxisRight(tickData[i].x) + tickData[i].x) / 2;
                    else
                        tickData[i].x = (scaleAxisBackRight(tickData[i].x) + tickData[i].x) / 2;
                }
                if (tickData[i].year > year)
                {
                    if(expandFlags[expandIndex])
                        tickData[i].x = scaleAxisRight(tickData[i].x);
                    else
                        tickData[i].x = scaleAxisBackRight(tickData[i].x);
                }
            }
            for(i = 0; i < axisData.length; ++i)
            {
                if (axisData[i].year == year)
                {
                    if(expandFlags[expandIndex])
                        axisData[i].x = (scaleAxisRight(axisData[i].x) + axisData[i].x) / 2;
                    else
                        axisData[i].x = (scaleAxisBackRight(axisData[i].x) + axisData[i].x) / 2;
                }

                if (axisData[i].year > year)
                {
                    if(expandFlags[expandIndex])
                        axisData[i].x = scaleAxisRight(axisData[i].x);
                    else
                        axisData[i].x = scaleAxisBackRight(axisData[i].x);
                }
            }

            var index = 0;
            for(var l = 0; l < data_.nodes.length; ++l)
            {
                minYear = getMinMaxYear(l)[0];
                maxYear = getMinMaxYear(l)[1];
                if(minYear > year)
                {
                    if(expandFlags[expandIndex])
                    {
                        layers[index][0].x = scaleRight(layers[index][0].x);
                        layers[index][1].x = scaleRight(layers[index][1].x);
                    }
                    else{
                        layers[index][0].x = scaleBackRight(layers[index][0].x);
                        layers[index][1].x = scaleBackRight(layers[index][1].x);
                    }

                }
                ++index;
                for(var y = 1; y <= maxYear - minYear; ++y)
                {
                    if(y > year-minYear)
                    {
                        if(expandFlags[expandIndex])
                        {
                            layers[index][0].x = scaleRight(layers[index][0].x);
                            layers[index][1].x = scaleRight(layers[index][1].x);
                        }
                        else{
                            layers[index][0].x = scaleBackRight(layers[index][0].x);
                            layers[index][1].x = scaleBackRight(layers[index][1].x);
                        }

                    }
                    ++index;

                }
                if(expandFlags[expandIndex])
                {
                    layers[index][0].x = scaleRight(layers[index][0].x);
                    layers[index][1].x = scaleRight(layers[index][1].x);
                }
                else{
                    layers[index][0].x = scaleBackRight(layers[index][0].x);
                    layers[index][1].x = scaleBackRight(layers[index][1].x);
                }
                ++index;
            }
            for(i = 0; i < nodesDrawn.length; ++i)
            {
                if(nodesDrawn[i].year >= year)
                {
                    if(expandFlags[expandIndex])
                        nodesDrawn[i].x = scaleRight(nodesDrawn[i].x);
                    else
                        nodesDrawn[i].x = scaleBackRight(nodesDrawn[i].x);
                }
            }

            var color = d3.scale.ordinal()
                .range(colorbrewer["Greens"][3]);

            var area = function(d, i) {
                var x1 = d[0].x,
                    x2 = d[1].x,
                    y1d = d[0].y1,
                    y2d = d[1].y1,
                    y1u = d[0].y0,
                    y2u = d[1].y0;
                var cx = (x1 + x2) / 2;
                return "M " + x1 + "," + y1d + " C " + [cx, y1d, cx, y2d, x2, y2d].join(" ") + "L " + x2 + "," + y2u + " C " + [cx, y2u, cx, y1u, x1, y1u].join(" ") + " Z";
            };

            g = d3.select("#rankAxis");
            g.selectAll(".ctrlCircles")
                //.data(ctrlCircles)
                .transition()
                .duration(1000)
                .attr("cx", function(d) {
                    return d.x;
                })
                .attr("cy", function(d) {
                    return d.y;
                });

            g.selectAll(".globalAxisTick")
                .data(tickData)
                .transition()
                .duration(1000)
                .attr("x1", function(d) {
                    return d.x;
                })
                .attr("x2", function(d) {
                    return d.x;
                });

            g.selectAll(".globalAxis")
                .data(axisData)
                .transition()
                .duration(1000)
                .attr("x1", function (d, i) {
                    return (i==0)?0:axisData[i-1].x;
                })
                .attr("x2", function (d) {
                    return d.x;
                });


            var g = d3.select(".rankOfClu");
            g.selectAll(".flows")
                //.data(layers)
                .transition()
                .duration(timeDuration)
                .attr("d", area);

            g.selectAll(".rankNode")
                .transition()
                .duration(timeDuration)
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
                .call(glyph);

            g.selectAll(".rankLink")
                .transition()
                .duration(timeDuration)
                .attr("d",bezLine)
                .attr("stroke-opacity", expandFlags[expandIndex]?0.2:1);




            //**********PC animation******************
            var margin = {top: 0, right: 7, bottom: 0, left: 7},
                width = interval * 2;

            for(var iter = 0; iter < divideYearDataUp.length; ++iter)
            {
                if(iter > year - minYear)
                {
                    if(expandFlags[expandIndex])
                    {
                        divideYearDataUp[iter].x = scaleAxisRight(divideYearDataUp[iter].x);
                        divideYearDataDown[iter].x = scaleAxisRight(divideYearDataDown[iter].x);
                    }
                    else
                    {
                        divideYearDataUp[iter].x = scaleAxisBackRight(divideYearDataUp[iter].x);
                        divideYearDataDown[iter].x = scaleAxisBackRight(divideYearDataDown[iter].x);
                    }

                    //x scale
                    var x = d3.scale.ordinal().rangePoints([divideYearDataUp[iter].x-margin.left, divideYearDataUp[iter].x + width + margin.right], 1),
                        y = {};

                    var line = d3.svg.line(),
                        axis = d3.svg.axis().orient("left"),
                        background,
                        foreground;

                    var svg = d3.select(".rankOfClu");

                    var rankData = [];
                    for(var i = 0; i < data_.nodes.length; ++i)
                    {
                        for(var j = 0; j < data_.nodes[i].length; ++j)
                        {
                            for(var k = 0; k < data_.nodes[i][j].length; ++k)
                            {
                                if(data_.nodes[i][j][k].year == minYear+iter)
                                {
                                    var ranks = data_.nodes[i][j][k].ranks;
                                    rankData.push({m0:data_.nodes[i][j][k].y ,m1:ranks[0], m2:ranks[1], m3:ranks[2], m4:ranks[3],m5:ranks[4],m6:ranks[5],m7:ranks[6],m8:ranks[7],m9:ranks[8],m10:ranks[9],mEnd: data_.nodes[i][j][k].y});
                                }
                            }
                        }
                    }

                    var dimensions;
                    // Extract the list of dimensions and create a scale for each.
                    x.domain(dimensions = d3.keys(rankData[0]).filter(function(d) {
                        return d != "name" && (y[d] = d3.scale.linear()
                                .domain(d3.extent(rankData, function(p) {return +p[d]; }))
                                .range([divideYearDataUp[iter].y, divideYearDataDown[iter].y]));
                    }));

                    //for(i = expandIndex; i < maxYear; ++i)
                    //{
                    g.select("#PC"+iter).selectAll(".dimension")
                        .data(dimensions)
                        .transition()
                        .duration(1000)
                        .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

                    g.select("#PC"+iter).selectAll(".background")
                        .selectAll("path")
                        .data(rankData)
                        .transition()
                        .duration(1000)
                        .attr("d", path);

                    g.select("#PC"+iter).selectAll(".foreground")
                        .selectAll("path")
                        .data(rankData)
                        .transition()
                        .duration(1000)
                        .attr("d", path);

                    g.select("#PC"+iter).selectAll(".axis")
                        .each(function(d, i) { if(i!=0&&i!=11) d3.select(this).call(axis.scale(y[d])); })
                        .transition()
                        .duration(1000);

                    g.select("#PC"+iter).selectAll(".brush")
                        .each(function(d) {
                            d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
                        })
                        .transition()
                        .duration(1000);
                    //}
                }
            }

            function transition(g) {
                return g.transition().duration(500);
            }

            // Returns the path for a given data point.
            function path(d) {
                return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
            }

            function brushstart() {
                d3.event.sourceEvent.stopPropagation();
            }

            // Handles a brush event, toggling the display of foreground lines.
            function brush() {
                var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
                    extents = actives.map(function(p) { return y[p].brush.extent(); });
                foreground.style("display", function(d) {
                    return actives.every(function(p, i) {
                        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
                    }) ? null : "none";
                });
            }
            //********************

        };
        var getMinMaxYear = function(l){
            var nodesLayer = data_.nodes[l];
            var minYear = 9999, maxYear = 0;
            nodesLayer.forEach(function(y){
                y.forEach(function (d) {
                    if(d.year < minYear)
                        minYear = d.year;
                    if(d.year > maxYear)
                        maxYear = d.year;
                });
            });
            return [minYear, maxYear];
        };
        var getFlowSize = function () {
            var minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;
            console.log(nodes);
            for(var i = 0; i < nodes.length; ++i)
            {
                if(nodes[i].x < minX)
                    minX = nodes[i].x;
                if(nodes[i].x > maxX)
                    maxX = nodes[i].x;
                if(nodes[i].y < minY)
                    minY = nodes[i].y;
                if(nodes[i].y > maxY)
                    maxY = nodes[i].y;
            }
            return {"minX": minX, "maxX":maxX, "minY":minY, "maxY":maxY};

        };
        //get upside "y" and downside "y" position of a specific year in a layer
        function trick(nodes, layer, year, upper) {
            var res = {x:0, y:0, valid:true};
            var nodesYear = nodes[layer];
            for(var i = 0; i < nodesYear.length; ++i)
            {
                if(nodesYear[i][0].year == year)
                {
                    if(nodesYear[i].length == 1)
                    {
                        res.x = nodesYear[i][0].x;
                        res.y = nodesYear[i][0].y;
                        return res;
                    }
                    var maxY = -9999, minY = 9999;
                    for(var j = 0; j < nodesYear[i].length; ++j)
                    {
                        if(nodesYear[i][j].y > maxY)
                            maxY = nodesYear[i][j].y;
                        if(nodesYear[i][j].y < minY)
                            minY = nodesYear[i][j].y;
                    }
                    if(upper)
                    {
                        res.x = nodesYear[i][0].x;
                        res.y = minY;
                        return res;
                    }
                    else {
                        res.x = nodesYear[i][0].x;
                        res.y = maxY;
                        return res;
                    }

                }
            }
            res = trick(nodes, layer, year+1, upper);
            res.valid = false;
            res.x -= 70;
            return res;
        }
        var deviation = function(d) {
            var mean = d3.sum(d) / d.length;
            var count = d3.sum(d.map(function(x) {
                return (x -mean) * (x-mean);
            }));
            return Math.sqrt(count / d.length);
        };
        var drawPC = function(yearIndex) {
            var margin = {top: 0, right: 7, bottom: 0, left: 7},
                width = interval * 2,
                height = (divideYearDataDown[yearIndex].y - divideYearDataUp[yearIndex].y) - margin.top - margin.bottom;

            //x scale
            var x = d3.scale.ordinal().rangePoints([divideYearDataUp[yearIndex].x-margin.left, divideYearDataUp[yearIndex].x + width + margin.right], 1),
                y = {},
                dragging = {};

            var line = d3.svg.line(),
                axis = d3.svg.axis().orient("left"),
                background,
                foreground;

            var svg = d3.select(".rankOfClu");

            var rankData = [];
            for(var i = 0; i < data_.nodes.length; ++i)
            {
                for(var j = 0; j < data_.nodes[i].length; ++j)
                {
                    for(var k = 0; k < data_.nodes[i][j].length; ++k)
                    {
                        if(data_.nodes[i][j][k].year == divideYear)
                        {
                            var ranks = data_.nodes[i][j][k].ranks;
                            rankData.push({m0:data_.nodes[i][j][k].y ,m1:ranks[0], m2:ranks[1], m3:ranks[2], m4:ranks[3],m5:ranks[4],m6:ranks[5],m7:ranks[6],m8:ranks[7],m9:ranks[8],m10:ranks[9],mEnd: data_.nodes[i][j][k].y});
                        }
                    }
                }
            }

            var dimensions;
                // Extract the list of dimensions and create a scale for each.
                x.domain(dimensions = d3.keys(rankData[0]).filter(function(d) {
                    return d != "name" && (y[d] = d3.scale.linear()
                            .domain(d3.extent(rankData, function(p) {return +p[d]; }))
                            .range([divideYearDataUp[yearIndex].y, divideYearDataDown[yearIndex].y]));
                }));
            svg.append("g")
                .attr("id", "PC"+yearIndex);
            svg = d3.select("#PC"+yearIndex);
                // Add grey background lines for context.
                background = svg.append("g")
                    .attr("class", "background")
                    .selectAll("path")
                    .data(rankData)
                    .enter().append("path")
                    .attr("d", path);

                // Add blue foreground lines for focus.
                foreground = svg.append("g")
                    .attr("class", "foreground")
                    .selectAll("path")
                    .data(rankData)
                    .enter().append("path")
                    .attr("d", path);

                // Add a group element for each dimension.
                var g = svg.selectAll(".dimension")
                    .data(dimensions)
                    .enter().append("g")
                    .attr("class", "dimension")
                    .attr("transform", function(d) { return "translate(" + x(d) + ")"; });
                    //.call(d3.behavior.drag()
                    //    .origin(function(d) { return {x: x(d)}; })
                    //    .on("dragstart", function(d) {
                    //        dragging[d] = x(d);
                    //        background.attr("visibility", "hidden");
                    //    })
                    //    .on("drag", function(d) {
                    //        dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                    //        foreground.attr("d", path);
                    //        dimensions.sort(function(a, b) { return position(a) - position(b); });
                    //        x.domain(dimensions);
                    //        g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                    //    })
                    //    .on("dragend", function(d) {
                    //        delete dragging[d];
                    //        transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                    //        transition(foreground).attr("d", path);
                    //        background
                    //            .attr("d", path)
                    //            .transition()
                    //            .delay(500)
                    //            .duration(0)
                    //            .attr("visibility", null);
                    //    })
                    //);

                // Add an axis and title.
                g.append("g")
                    .attr("class", "axis")
                    .each(function(d, i) { if(i!=0&&i!=11) d3.select(this).call(axis.scale(y[d])); })
                    .append("text")
                    .style("text-anchor", "middle")
                    .attr("y", -9)
                    .text(function(d, i) { if(i!=0&&i!=11) return d; });

                // Add and store a brush for each axis.
                g.append("g")
                    .attr("class", "brush")
                    .each(function(d) {
                        d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
                    })
                    .selectAll("rect")
                    .attr("x", -8)
                    .attr("width", 16);

            //function position(d) {
            //    var v = dragging[d];
            //    return v == null ? x(d) : v;
            //}

            function transition(g) {
                return g.transition().duration(500);
            }

            // Returns the path for a given data point.
            function path(d) {
                return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
            }

            function brushstart() {
                d3.event.sourceEvent.stopPropagation();
            }

            // Handles a brush event, toggling the display of foreground lines.
            function brush() {
                var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
                    extents = actives.map(function(p) { return y[p].brush.extent(); });
                foreground.style("display", function(d) {
                    return actives.every(function(p, i) {
                        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
                    }) ? null : "none";
                });
            }
        };
        var glyph = function(g){
            var config = window.config.rank;
            var angleScale = d3.scale.linear().domain(config.rankRange).range([0, Math.PI * 2]);
            expandFlags.forEach(function (flag, i) {
                if(flag && !drawnPCFlags[i])
                {
                    drawPC(i);
                    drawnPCFlags[i] = true;
                }
                if(!flag && drawnPCFlags[i])
                {
                    d3.select("#PC"+i)
                        .remove();
                    drawnPCFlags[i] = false;
                }
            });
            g.each(function(d, i) {

                var container = d3.select(this);
                var tmpData = [{x:0, y:0, r:10}];
                var expandIndex = d.year - timeScale[0];
                if(expandFlags[expandIndex] /*&& d.year == divideYear*/)
                {
                    container
                        .selectAll("expandCircle"+ d.year)
                        .data(tmpData)
                        .enter()
                        .append("circle")
                        .attr("cx", function(d){return d.x;})
                        .attr("cy", function(d){return d.y;})
                        .attr("r", function(d){return d.r;})
                        .attr("fill", "grey")
                        .attr("class", "expandCircle"+ d.year);

                    container
                        .selectAll("expandCircleR"+ d.year)
                        .data(tmpData)
                        .enter()
                        .append("circle")
                        .attr("cx", function(d){return d.x;})
                        .attr("cy", function(d){return d.y;})
                        .attr("r", function(d){return d.r;})
                        .attr("fill", "grey")
                        .attr("class", "expandCircleR"+ d.year);

                    container.selectAll(".expandCircleR"+ d.year)
                        .data(tmpData)
                        .transition()
                        .duration(timeDuration)
                        .attr("cx", -2*interval)
                        .attr("cy", 0)
                        .attr("r", 10);

                    //container.append("circle")
                    //    .attr("cx", 0)
                    //    .attr("cy", 0)
                    //    .attr("r", 10)
                    //    .attr("fill", "grey")
                    //    .attr("class", "expandCircle");
                    //
                    //container.append("circle")
                    //    .attr("cx", -200)
                    //    .attr("cy", 0)
                    //    .attr("r", 10)
                    //    .attr("fill", "grey")
                    //    .attr("class", "expandCircle");
                }
                else
                {
                    container.selectAll(".expandCircleR"+ d.year)
                        .data(tmpData)
                        .transition()
                        .duration(timeDuration)
                        .attr("cx", 0)
                        .attr("cy", 0)
                        .attr("r", 10);
                    tmpData = [];
                    container.selectAll(".expandCircle"+ d.year)
                        .data(tmpData)
                        .exit()
                        .transition()
                        .duration(timeDuration)
                        .remove();
                    container.selectAll(".expandCircleR"+ d.year)
                        .data(tmpData)
                        .exit()
                        .transition()
                        .duration(timeDuration)
                        .remove();

                    var ranks = d.ranks;
                    var outerRadius = config.glyph.ringOuterRadius,
                        innerRadius = config.glyph.ringInnerRadius;
                    var color = d3.scale.category20();
                    var arc = d3.svg.arc();
                    var pie = d3.layout.pie()
                        .sort(null);

                    container.selectAll(".arc")
                        .data(myarc(ranks))
                        .enter().append("g")
                        .attr("class", "arc")
                        .append("path")
                        .attr("fill", function(d, i) { return color(i); })
                        .attr("d", arc);

                    tmpData = [{x:0, y:0, r:innerRadius - 2}];
                    container.selectAll("glyphCircle")
                        .data(tmpData)
                        .enter()
                        .append("circle")
                        .attr("cx", function(d){return d.x;})
                        .attr("cy", function(d){return d.y;})
                        .attr("r", function(d){return d.r;})
                        .attr("fill", d["devColor"])
                        .attr("class", "glyphCircle");
                    //container.selectAll(".glyphCircle")
                    //    .data(tmpData)
                    //    .transition()
                    //    .duration(timeDuration)
                    //    .attr("fill", d["devColor"]);
                }


                function myarc(input) {
                    var arcs0 = pie(input);
                    arcs0[0].innerRadius = innerRadius;
                    arcs0[0].outerRadius = outerRadius;
                    arcs0[0].startAngle = angleScale(d3.min(input));
                    arcs0[0].endAngle = angleScale(d3.max(input));
                    return arcs0;
                }
            });
        };

        var addHeatmap = function(id, width, height) {
            console.log(id);
            $("#" + id).append("<canvas></canvas>");
            var canvas = $("#" + id + " canvas")[0];
            canvas.width = width;
            canvas.height = height;
            canvas.style.cssText = "position:fixed";
            canvas.id = "heatmap-canvas";
            return $("#cluster-heatmap canvas")[0];
        };
        var preprocessForCluster = function(tree, root) {
            var nodes = tree.nodes(root).reverse();
            var config = window.config.cluster;
            for(var i = 0, len = nodes.length; i < len; i++) {
                var node = nodes[i];
                var data = {};

                var expand = []
                var innerRadius = config.innerRadius;
                var outerRadius = config.middleRadius;
                expand.push({
                    id: "expand",
                    data:[
                        {
                            r: outerRadius,
                            fill: "none",
                            stroke: "#000"
                        },
                        {
                            r: innerRadius,
                            fill: "#fff",
                            stroke: "#000"
                        }
                    ]
                });
                expand.push({
                    id: "trend",
                    data: node.data
                });
                data["expand"] = expand;
                var unexpand = [];
                var innerRadius = Math.random() * 10 + 5;
                var outerRadius = innerRadius + 5;
                unexpand.push({
                    id: "unexpand",
                    data:[
                        {
                            r: outerRadius,
                            fill: "none",
                            stroke: "#000"
                        },
                        {
                            r: innerRadius,
                            fill: colorbrewer['Reds'][9][Math.floor(Math.random() * 8)],
                            stroke: "#000"
                        }
                    ]
                });
                data["unexpand"] = unexpand;

                node.visual = data;
            }
        };
        var update = function(container, tree, root, heat) {
//            heat.setData({
//                data:[]
//            });
//            heat.repaint();
//            container = d3.select("#rankCluster");
            heat.clearRect(0, 0, heat.canvas.width, heat.canvas.height);
            var nodes = tree.nodes(root).reverse();
            var links = tree.links(nodes);
            for(var i = 0, len = nodes.length; i < len; i++) {
//                drawHeatRing(heat, nodes[i]);
                drawKDERing(heat, nodes[i]);
            }
//            heat.repaint();
            var node = container.selectAll(".clusterNode")
                .data(nodes, function(d) {
                    return d.data.id;
                });
            var nodeEnter = node.enter()
                .append("g")
                .attr("class", "clusterNode")
                .attr("transform", function(d) {
                    return "translate(" + d.y + "," + d.x + ")";
                })
                .on("click", function(d) {
                    toggle(d);
                    update(container, tree, root, heat);
                })
                .on("mouseenter", function(d) {
                    d.expand = true;
                    update(container, tree, root, heat);
                })
                .on("mouseleave", function(d) {
                    d.expand = undefined;
                    update(container, tree, root, heat);
                });
            node.call(drawNode);
            var nodeExit = node.exit().remove();

            var link = container.selectAll(".clusterLink")
                .data(links, function(d) {
                    return [d.source.data.id, d.target.data.id].join(",");
                });
            link.enter().insert("path", "g")
                .attr("class", "clusterLink")
                .attr("d", diagonal)
                .attr("fill", "none")
                .attr("stroke", "#000");
            link.exit().remove();
        };
        var drawKDERing = function(canvas, d) {
            var config = window.config.cluster;
            var rankRange = window.config.rankRange;
            var margin = config.margin;
            if(d.children !== undefined) {

            } else {
                var angScale = d3.scale.linear().domain(rankRange).range([-Math.PI / 2, Math.PI * 3 / 2]);
                var unitAngle = Math.PI * 2 / (rankRange[1] - rankRange[0] + 1);
                var rankDist = [];
                d.data.dist.forEach(function(d) {
                    for(var i = 0; i < d.count; i++) {
                        rankDist.push(d.pos);
                    }
                });
                var kde = loadServ.kde(loadServ.kernel(2), angScale.ticks(200))(rankDist);
                var min = d3.min(kde, function(d) {
                    return d[1];
                });
                var max = d3.max(kde, function(d) {
                    return d[1];
                })
                var unit = (max - min) / 9
//                console.log(kde);
                var color = d3.scale.linear().domain(d3.range(min, max, unit)).range(colorbrewer["PuBu"][9]);
                var mode;
                if(d.expand) {
                    mode = "expand";
                } else {
                    mode = "unexpand";
                }
                var visual = d.visual[mode].filter(function(d) {
                    var res = false;
                    if(d.id === mode) {
                        res = true;
                    }
                    return res;
                })[0];
                var innerRadius = visual.data[1].r;
                var outerRadius = visual.data[0].r;
                var r = (innerRadius + outerRadius) / 2 ;
                for(var i = 0, len = kde.length; i < len; i++) {
                    var ang = angScale(kde[i][0]);
                    var c = color(kde[i][1]);

                    canvas.lineWidth = (outerRadius - innerRadius);
                    canvas.strokeStyle = c;
                    canvas.beginPath();
                    canvas.arc(d.y + margin[0], d.x, r, ang, ang + unitAngle);
                    canvas.closePath();
                    canvas.stroke();
                }
            }

        };
        var drawHeatRing = function(heat, d) {
            var config = window.config.cluster;
            var margin = config.margin;
            var rankRange = window.config.rankRange;
            var config = window.config.cluster;

            var angScale = d3.scale.linear().domain(rankRange).range([-Math.PI / 2, Math.PI * 3 / 2]);
            if(d.children !== undefined) {

            } else if(d.expand) {
                var dist = d.data.dist;
                var innerRadius = config.innerRadius;
                var outerRadius = config.middleRadius;
                var r = (innerRadius + outerRadius) / 2;
                for(var i = 0, len = dist.length; i < len; i++) {
                    var ang = angScale(dist[i].pos);
                    var x = d.y + r * Math.cos(ang) + margin[0],
                        y = d.x + r * Math.sin(ang);
                    heat.addData({
                        x: x,
                        y: y,
                        value: dist[i].count
                    })
                }
            } else {
                var dist = d.data.dist;
                var innerRadius = config.innerRadius;
                var outerRadius = config.middleRadius;
                var r = (innerRadius + outerRadius) / 2;
                for(var i = 0, len = dist.length; i < len; i++) {
                    var ang = angScale(dist[i].pos);
                    var x = d.y + r * Math.cos(ang) + margin[0],
                        y = d.x + r * Math.sin(ang);
                    heat.addData({
                        x: x,
                        y: y,
                        value: dist[i].count
                    })
                }
            }
        };
        //for cluster view
        var drawNode = function(g) {
            var config = window.config.cluster;
            g.each(function(d) {
                var g = d3.select(this);
                if(d.children !== undefined) {
                    g.append("circle")
                        .attr("r", 5)
                        .attr("fill", "#000")
                        .attr("stroke", "#000");

                } else {
                    var data;
                    if(d.expand) {
                        data = d.visual["expand"];
                    } else {
                        data = d.visual["unexpand"];
                    }
                    var groups = g.selectAll("g")
                        .data(data, function(d) {
                            return d.id;
                        })
                    var gEnter = groups.enter()
                        .append("g")
                        .each(function(d) {

                            switch(d.id) {
                                case "expand":
                                case "unexpand":
                                    d3.select(this).call(drawCircles, d.data);
                                    break;
                                case "trend":
                                    d3.select(this).call(drawArea, d.data);
                                    break;
                                default:
                                    break;
                            }
                        });
                    var gExit = groups.exit().remove();
                }
            })
        };
        var drawCircles = function(g, d) {
            g.selectAll("circle")
                .data(d)
                .enter()
                .append("circle")
                .attr("r", function(d) {
                    return d.r;
                })
                .attr("fill", function(d) {
                    return d.fill;
                })
                .attr("stroke", function(d) {
                    return d.stroke;
                })
        };

        var drawArea = function(g, d) {
            var trend = d.trend;
            var max = d3.max(d.lower),
                min = d3.min(d.upper);
            var box = config.cluster.trendBox;
            var scaleY = d3.scale.linear().domain([min, max]).range([-box.height * 0.5, box.height * 0.5]),
                scaleX = d3.scale.linear().domain([0, trend.length - 1]).range([-box.width * 0.5, box.width * 0.5]);


            var areaData = [];
            for(var i = d.lower.length - 1; i >= 0; i--) {
                areaData[i] = {
                    y0: scaleY(d.upper[i]),
                    y1: scaleY(d.lower[i]),
                    x: scaleX(i)
                }
            }
            var area = d3.svg.area()
                .x(function(d) {
                    return d.x;
                })
                .y0(function(d) {
                    return d.y0;
                })
                .y1(function(d) {
                    return d.y1;
                });
            g.selectAll(".uncerArea")
                .data([areaData])
                .enter()
                .append("path")
                .attr("class", ".uncerArea")
                .attr("d", area)
                .attr("stroke", "none")
                .attr("fill", colorbrewer["Oranges"][3][2]);

            var line = d3.svg.line()
                .x(function(d, i) {
                    return scaleX(i);
                })
                .y(function(d) {
                    return scaleY(d);
                });
            g.selectAll(".trendLine")
                .data([trend])
                .enter()
                .append("path")
                .attr("class", "trendLine")
                .attr("d", line)
                .attr("stroke", "#000")
                .attr("fill", "none");

        };

        function toggle(d) {
            if (d.children) {
                d._children = d.children;
                d.children = undefined;
            } else {
                d.children = d._children;
                d._children = undefined;
            }
        }
        return {
            'init':init,
            'addRank':addRank,
            'update':update,
            'addHeatmap':addHeatmap,
            'preprocess':preprocess,
            'preprocessForCluster' : preprocessForCluster,
            'bezLine' : bezLine,
            'getFlowSize' : getFlowSize,
            'addDragRect' : addDragRect
        };

    }])
})();