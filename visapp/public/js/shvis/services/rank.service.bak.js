/**
 * Created by xyx on 2016/3/6.
 * PC group, compress, flow bug!!, timeAxis,
 * glyph white, rect don't move, PC bug, PC->10,,add flow group, encompass,information tip,
 * expand rect.. PC right limit
 */
(function() {
    var cluster = angular.module('shvis.rank.service', []);
    cluster.factory('RankService', ['LoadService','PipService', function (loadServ, pipServ) {
        var d3 = window.d3;
        var heatmap = window.h337;
        var diagonal = d3.svg.diagonal()
            .projection(function(d) {
                return [d.y, d.x];
            });
        var colorbrewer = window.colorbrewer;
        var timeScale = window.config.timeScale;
        var config = window.config.rank;
        var margin = config.margin;
        var signalCluster = true,
            signalDetailMove = true;
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) {
                return '<span>' + d.name + '</span>'})
            .offset([-12, 0]);
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

            //append group for PC
            svg.append("g")
                .attr("id", "PCGroup")
                .attr("transform", "translate(" + (0) + "," + (0) + ")");



            //defs.append("circle")
            //    .attr("class","axisCirle")
            //    .attr("cx", "100")
            //    .attr("cy","15")
            //    .attr("r", "8");

            //var page1 = axis.append("g")
            //    .attr("id","Page-1")
            //    .attr("stroke","none")
            //    .attr("stroke-width","1")
            //    .attr("fill","none")
            //    .attr("fill-rule", "evenodd")
            //    .attr("sketch:type","MSPage");
            //var Artboard = page1.append("g")
            //    .attr("id","Artboard-2")
            //    .attr("sketch:type", "MSArtboardGroup")
            //    //.attr("transform","translate(-41.000000, -6.000000)")
            //    .attr("filter","url(#filter-normal)");
            //var oval1 = Artboard.append("g")
            //    .attr("id", "Oval-1");
            //oval1.append("use")
            //    .attr("stroke","none")
            //    .attr("fill","#5BC689")
            //    .attr("fill-rule", "evenodd")
            //    .attr("sketch:type", "MSShapeGroup")
            //    .attr("xlink:href","#ctrlCircle-2005");
            //oval1.append("use")
            //    .attr("stroke","#FFFFFF")
            //    .attr("stroke-width","1")
            //    .attr("fill","none")
            //    .attr("xlink:href","#ctrlCircle-2005");
            //************* end circle style *****************

            //axis
            svg.append("rect")
                .attr("width", width)
                .attr("height", 80)
                .attr("fill", "white")
                .attr("opacity", 1);


            var axis = svg.append("g")
                .attr("id", "rankAxis")
                .attr("transform", "translate(" + (margin[0]) + "," + (margin[1]) + ")");

            //
            //*********** the styles for circles *************
            var defs = axis.append("defs");
            var filter = defs.append("filter")
                .attr("x", "-50%")
                .attr("y", "-50%")
                .attr("width", "200%")
                .attr("height", "200%")
                .attr("filterUnits", "objectBoundingBox")
                .attr("id", "filter-normal");
            filter.append("feOffset")
                .attr("dx", 0)
                .attr("dy", 1)
                .attr("in", "SourceAlpha")
                .attr("result", "shadowOffsetOuter1");
            filter.append("feGaussianBlur")
                .attr("stdDeviation", 0)
                .attr("in", "shadowOffsetOuter1")
                .attr("result", "shadowBlurOuter1");
            filter.append("feColorMatrix")
                .attr("values", "0 0 0 0 0.0756885846   0 0 0 0 0.484162415   0 0 0 0 0.251294157  0 0 0 0.7 0")
                .attr("in","shadowBlurOuter1")
                .attr("type", "matrix")
                .attr("result", "shadowMatrixOuter1");
            var feMerge = filter.append("feMerge");
            feMerge.append("feMergeNode")
                .attr("in", "shadowMatrixOuter1");
            feMerge.append("feMergeNode")
                .attr("in","SourceGraphic");


            var filterActive = defs.append("filter")
                .attr("x", "-50%")
                .attr("y", "-50%")
                .attr("width", "200%")
                .attr("height","200%")
                .attr("filterUnits","objectBoundingBox")
                .attr("id","filter-active");
            filterActive.append("feOffset")
                .attr("dx", 0)
                .attr("dy", 1)
                .attr("in", "SourceAlpha")
                .attr("result", "shadowOffsetInner1");
            filterActive.append("feGaussianBlur")
                .attr("stdDeviation", 1.5)
                .attr("in", "shadowOffsetInner1")
                .attr("result", "shadowBlurInner1");
            filterActive.append("feComposite")
                .attr("in","shadowBlurInner1")
                .attr("in2","SourceAlpha")
                .attr("operator","arithmetic")
                .attr("k2","-1")
                .attr("k3","1")
                .attr("result","shadowInnerInner1");
            filterActive.append("feColorMatrix")
                .attr("values", "0 0 0 0 0.0479431928   0 0 0 0 0.248990221   0 0 0 0 0.134934695  0 0 0 0.7 0")
                .attr("in","shadowInnerInner1")
                .attr("type", "matrix")
                .attr("result", "shadowMatrixInner1");

            var feMergeActive = filterActive.append("feMerge");
            feMergeActive.append("feMergeNode")
                .attr("in", "SourceGraphic");
            feMergeActive.append("feMergeNode")
                .attr("in","shadowMatrixInner1");



            //append drag box
            svg.append("rect")
                .attr("width", 41)
                .attr("height", height)
                .attr("x", width-40)
                .attr("y", 0) //100
                .attr("fill", "white")
                .attr("opacity", 1);

            svg.append("rect")
                .attr("width", 20)
                .attr("height",100)
                .attr("x", width-20)
                .attr("y", 100)
                .attr("rx", 3)
                .attr("ry", 3)
                .attr("id", "dragBox")
                .attr("fill", "grey")
                .attr("opacity", 0.4)
                .attr("transform", "translate(" + 0 + "," + /*(yBox < 0?0:(yBox > 370)?370:yBox+d3.event.dy/2)*/0 + ")");
            // white for separate rects
            svg.append("g")
                .attr("transform", "translate(" + (0) + "," + (margin[1] + 100) + ")")
                .append("g")
                .attr("class", "separateRects");

            params.tip = d3.tip()
                .attr('class', 'd3-tip')
                .html(function(d) {
                    return '<span>' + d.name + '</span>'})
                .offset([-12, 0]);
            svg.call(params.tip);

            return svg;
        };
        var bindDrag = function(svg, params) {
            var drag = d3.behavior.drag();
            var dragAxis = d3.behavior.drag();
            var mx, my;
            drag.on('dragstart', function() {
                mx = undefined;
                my = undefined;
            });
            dragAxis.on('dragstart', function() {
                mx = undefined;
                my = undefined;
            });
            drag.on('drag', function() {
                var tBox = d3.transform(svg.select("#dragBox").attr("transform")),
                    yBox = tBox.translate[1];
                var transY = yBox+d3.event.dy/2;
                if(transY < 0)
                    transY = 0;
                else if(transY > 370)
                    transY = 370;
                svg.selectAll("#dragBox")
                    //.transition()
                    //.duration(0)
                    .attr("transform", "translate(" + 0 + "," + transY + ")");

                if(mx === undefined || my === undefined) {
                    mx = d3.event.x;
                    my = d3.event.y;
                }
                //params.tranX -= (d3.event.x - mx);
                params.tranY -= (d3.event.y - my);
                if(params.tranX > 0) params.tranX = 0;
                if(params.tranY > 0) params.tranY = 0;
                if(params.rankWidth < params.width) {
                    params.tranX = 0;
                } else if(params.tranX < params.width - params.rankWidth - margin[0]) {
                    params.tranX = params.width - params.rankWidth - margin[0];
                }
                if(params.rankHeight < params.height) {
                    params.tranY = 0;
                } else if(params.tranY < params.height - params.rankHeight) {
                    params.tranY = params.height - params.rankHeight;
                }

                mx = d3.event.x;
                my = d3.event.y;
                getflowHeights(params);
                render(svg, params);
            });
            dragAxis.on('drag', function() {
                //pipServ.emitRankMove({tranX: params.tranX, tranY: params.tranY, expandFlag: params.expandFlag});
                pipServ.emitRankMove(signalDetailMove = !signalDetailMove);
                if(mx === undefined || my === undefined) {
                    mx = d3.event.x;
                    my = d3.event.y;
                }
                params.tranX += (d3.event.x - mx);
                //params.tranY += (d3.event.y - my);
                if(params.tranX > 0) params.tranX = 0;
                if(params.tranY > 0) params.tranY = 0;
                if(params.rankWidth < params.width) {
                    params.tranX = 0;
                } else if(params.tranX < params.width - params.rankWidth - margin[0]) {
                    params.tranX = params.width - params.rankWidth - margin[0];
                }
                if(params.rankHeight < params.height) {
                    params.tranY = 0;
                } else if(params.tranY < params.height - params.rankHeight) {
                    params.tranY = params.height - params.rankHeight;
                }

                mx = d3.event.x;
                my = d3.event.y;
                getflowHeights(params);
                render(svg, params);
//                svg.select("#canvas")
//                    .attr("transform", "translate(" + params.tranX + "," + params.tranY + ")");

            });
            drag.on('dragend', function() {

            });
            dragAxis.on('dragend', function() {

            });
            svg.select("#dragBox").call(drag);
            svg.select("#rankAxis").call(dragAxis);

        };
        var deviation = function(d) {
            var mean = d3.sum(d) / d.length;
            var count = d3.sum(d.map(function(x) {
                return (x -mean) * (x-mean);
            }));
            return Math.sqrt(count / d.length);
        };
        var parseData = function(data, countByTime, params, isCompress) {
            var res = {};
            var nodes = [];
            var links = [];
            var weight = window.config.rank.weight;
            var partition = window.config.rank.partition;
            var timeScale = window.config.timeScale;
            var allRanks = {};
            var countAtTime = {};
            var d = data;
            d.forEach(function(n){
                n.data.forEach(function(data) {
                    if(countAtTime[data.time] === undefined) {
                        countAtTime[data.time] = 0;
                    }
                    countAtTime[data.time] += 1;
                });
            });
            res["count"] = countAtTime;
            for(var i = 0; i < d.length; i++) {
                var data = d[i].data;
                for(var j = 0, len = data.length; j < len; j++) {
                    var ranks = data[j].ranks;
                    var dev = deviation(ranks);
                    data[j]["dev"] = dev;
                    var time = data[j].time;
                    if(timeScale.indexOf(time) < 0) {
                        continue;
                    }
                    if(allRanks[time] === undefined) {
                        allRanks[time] = [];
                        for(var k = 0; k < ranks.length; k++) {
                            allRanks[time][k] = [];
                        }
                    }
                    for(var k = 0; k < ranks.length; k++) {
                        allRanks[time][k].push(ranks[k]);
                    }
                    var keys = Object.keys(ranks);
                    var weightRank = d3.sum(keys, function(d) {
                        return ranks[d] * weight[d];
                    });
                    data[j]['weightRank'] = weightRank;
                    for(var k = 0; k < partition.length; k++) {
                        if(weightRank < partition[k] * countByTime[time]) {
                            if(nodes[k] == undefined) {
                                nodes[k] = {};
                            }
                            if(nodes[k][time] ==  undefined) {
                                nodes[k][time] = [];
                            }
                            data[j]["layerNum"] = k;
                            data[j]["name"] = d[i].name;
                            nodes[k][time].push(data[j]);
                            break;
                        }
                    }
                }
                var sorted = data.sort(function(a, b) {
                    var res;
                    if(Number(a.time) > Number(b.time)){
                        res = -1;
                    } else if(Number(a.time) < Number(b.time)) {
                        res = 1;
                    } else {
                        res = 0;
                    }
                    return res;

//                    return Number(b['year']) - Number(a['year']);
                });
                for(var j = 0, len = sorted.length - 1; j < len; j++) {
                    if(timeScale.indexOf(sorted[j].time) < 0 || timeScale.indexOf(sorted[j + 1].time) < 0 ) {
                        continue;
                    }
                    links.push({
                        source:sorted[j],
                        target:sorted[j+1]
                    });
                }
            }

            var tmp = [];
            for(var i = 0; i < nodes.length; i++) {
                if(nodes[i]) {
                    tmp.push(nodes[i]);
                }
            }
            nodes = tmp;
            res["nodes"] = nodes.map(function(d) {
                var keys = Object.keys(d);
                var res = keys.map(function(key) {
                    return d[key].sort(function(a,b) {
                        return a["weightRank"] > b["weightRank"];
                    })
                });
                return res;
            });
            var tmpForDev = [];
            for(i = 0; i < tmp.length; ++i)
            {
                for(j in tmp[i])
                {
                    for(k = 0; k < tmp[i][j].length; ++k)
                    {
                        tmpForDev.push(tmp[i][j][k])
                    }
                }
            }
            for(i = 0; i < params.data.length; ++i)
            {
                var pNodes = params.data[i].nodes;
                pNodes.forEach(function (d, i) {
                    d.forEach(function (dd, ii) {
                        dd.forEach(function (ddd, iii) {
                            tmpForDev.push(ddd);
                        });
                    });
                });
                pNodes = params.data[i].compress.nodes;
                pNodes.forEach(function (d, i) {
                    d.forEach(function (dd, ii) {
                        dd.forEach(function (ddd, iii) {
                            tmpForDev.push(ddd);
                        });
                    });
                });
            }
            var maxDev = d3.max(tmpForDev, function (d) {
                return d["dev"];
            })
            var minDev = d3.min(tmpForDev, function (d) {
                return d["dev"]
            });

            console.log("max::" + maxDev);
            console.log("min::" + minDev);
            //var maxDev = d3.max(nodes, function(d) {
            //    var keys = Object.keys(d);
            //    return d3.max(keys, function(key) {
            //        return d3.max(d[key], function(x) {
            //            return x["dev"];
            //        })
            //    })
            //});
            //var minDev = d3.min(nodes, function(d) {
            //    var keys = Object.keys(d);
            //    return d3.min(keys, function(key) {
            //        return d3.min(d[key], function(x) {
            //            return x["dev"];
            //        });
            //    })
            //});
//            var devColorScale = d3.scale.linear().domain([minDev, (minDev + maxDev) / 2, maxDev]).range(colorbrewer["Reds"][3].reverse());
            var devColorScale = d3.scale.linear().domain([minDev, (minDev + maxDev) / 2, maxDev]).range(colorbrewer["Reds"][3]);
            for(var i = 0, len = nodes.length; i < len; i++) {
                var keys = Object.keys(nodes[i]);
                for(var j = 0, timeLen = keys.length; j < timeLen; j++) {
                    var timeNodes = nodes[i][keys[j]];
                    for(var k = 0, nodeLen = timeNodes.length; k < nodeLen; k++) {
                        timeNodes[k]["devColor"] = devColorScale(timeNodes[k]["dev"]);
                    }
                }
            }
            if(!isCompress)
            {
                for(var i = 0; i < params.data.length; ++i)
                {
                    var fNodes = params.data[i].nodes;
                    fNodes.forEach(function (d) {
                        d.forEach(function (dd) {
                            dd.forEach(function (ddd) {
                                ddd["devColor"] = devColorScale(ddd["dev"]);
                            });
                        });
                    });
                }
                for(var i = 0; i < params.data.length; ++i)
                {
                    var fNodes2 = params.data[i].compress.nodes;
                    fNodes2.forEach(function (d) {
                        d.forEach(function (dd) {
                            dd.forEach(function (ddd) {
                                ddd["devColor"] = devColorScale(ddd["dev"]);
                            });
                        });
                    });
                }
            }

            res["links"] = links;
            var keys = Object.keys(allRanks);
            var rankDist = {};
            for(var i = 0; i < keys.length; i++) {
                var key = keys[i];
                rankDist[key] = allRanks[key].map(function(d) {
                    return {
                        maxRank: d3.max(d),
                        minRank: d3.min(d),
                        scale: d3.scale.linear().domain([d3.min(d), d3.max(d)]).range([0,1])
                    }
                });
            }
            res["rankDist"] = rankDist;
            return res;

        }
        var preprocess = function(rawData, params) {
            var countByTime = rawData["countByTime"];
            var res = parseData(rawData["nodes"], countByTime, params, false);
            res["cluid"] = rawData.cluid;
            var compress = rawData["compress"].map(function(cluster) {
                var nodes = cluster["nodes"];
                var result = {
                    name:cluster["id"],
                    isAggregated:true
                }
                if(nodes.length === 1) {
                    result["time"] = nodes[0].time;
                    result["data"] = nodes[0].data;
                    result["name"] = nodes[0].name;
                } else {
                    var databyTime = {};
                    for(var i = 0; i < nodes.length; i++) {
                        var n = nodes[i];
                        for(var step = 0; step < n.data.length; step++) {
                            var time = n.data[step]["time"];
                            if(databyTime[time] === undefined) {
                                databyTime[time] = [];
                            }
                            databyTime[time].push(n.data[step]["ranks"]);
                        }
                    }
                    var times = Object.keys(databyTime);
                    //here...
                    var data = [];
                    for(var i = 0; i < times.length; i++) {
                        var nodeCount = databyTime[times[i]].length;
                        var aggregated = databyTime[times[i]].reduce(function(a, b) {
                            var c = [];
                            for(var j = 0; j < a.length; j++) {
                                c.push(a[j] + b[j]);
                            }
                            return c;
                        }).map(function(d) {
                            return d/nodeCount;
                        });
                        //add the rank distributions.
                        var compressRank = [];
                        databyTime[times[i]].forEach(function (d) {
                            d.forEach(function (dd) {
                                compressRank.push(dd);
                            });
                        });
                        compressRank.sort(function (i, j) {
                            return parseInt(i) - parseInt(j);
                        });

                        data.push({
                            compressRank:compressRank,
                            ranks:aggregated,
                            time:times[i]
                        });
                    }
                    result["data"] = data;
                }
                    //
                return result;
            });

            res["compress"] = parseData(compress, countByTime, params, true);

            //var rankCompress =
            //if there is no data in compress..
            if(res["compress"].nodes.length == 0)
            {
                res["compress"].nodes = res["nodes"];
                res["compress"].links = res["links"];
                res["compress"].count = res["count"];
                res["compress"].rankDist = res["rankDist"];
            }
            return res;

        };
        var scaleOnX = function(params, sx) {
            var config = window.config.rank;
            var flags = params.expandFlag;
            var pos = {};
            var x = sx;
            flags = flags.sort(function(a, b) {
                return a.time - b.time;
            });
            for(var i = 0, len = flags.length; i < len; i++) {
                var time = flags[i]['time'],
                    e = flags[i]['expand'];
                if(e) {
                    pos[time] = x + config.interval;
                    x += config.interval * 2 + config.unitWidth;
                } else {
                    pos[time] = x;
                    x += config.unitWidth;

                }
            }
            return function(time) {
                return pos[time];
            }
        };
        var fitMinHeight = function(params) {
            var keys = Object.keys(params.flowHeights);
            keys.sort(function (a, b) {
                return parseInt(a)-parseInt(b);
            });
            var heights = keys;  //***
            var minHeight = config.minRankHeight;
            if(heights[heights.length-1] * params.reLayout.factor < minHeight)
            {
                params.reLayout.flag = true;
                params.reLayout.factor = minHeight / heights[heights.length-1];
                return true;
            }
            params.reLayout.flag = false;
            params.reLayout.factor = 1;
            return false;
        };
        //var getTotalHeight
        var layoutRank = function(data, params) {
            var nodes = data.nodes;
            var config = window.config.rank;
            var nodeWidth = config.glyph.ringOuterRadius * 2;
            var maxNodes = nodes.map(function(d) {
                var keys = Object.keys(d);
                return d3.max(keys, function(key) {
                    return d[key].length;
                })
            });
            var rankDist = data.rankDist;
            var totalHeight = d3.sum(maxNodes) * (nodeWidth + 2) + 5 * (maxNodes.length - 1);
            var minHeight = 250;
            //console.log("totalHeight::"+totalHeight);
            //console.log("maxNodes::"+maxNodes);
            var totalWidth = config.unitWidth * (timeScale.length - 1);
//            var xScale = d3.scale.ordinal().domain(timeScale).rangePoints([0, totalWidth]);
            var xScale = scaleOnX(params, 0);
            var basePos = [];
            var pos = 0;
            for(var i = 0, len = maxNodes.length; i < len; i++) {
                var areaHeight = maxNodes[i] * (nodeWidth + 2);
                basePos.push(pos + areaHeight / 2);
                pos += areaHeight + 5;
            }
            var layerBounds = [];
            var expandTime = params.expandFlag.filter(function(d) {
                var res = false;
                if(d.expand) {
                    res = true;
                }
                return res;
            }).map(function(d) {
                return d.time;
            });
            var rankWidth = -1;
            var rankHeight = -1;


            for(var i = 0, len = nodes.length; i < len; i++) {
                var cluster = nodes[i];
                var maxNodeSize = d3.max(cluster, function (d) {
                    return d.length;
                });
                var bounds = {}
                for(var j = 0, yearLen = cluster.length; j < yearLen; j++) {
                    var count = cluster[j].length;
                    var rangeMin = basePos[i] - count * (nodeWidth + 2) / 2;
                    var rangeMax = basePos[i] + count * (nodeWidth + 2) / 2;
                    var rangeNodeMin = basePos[i] - count * (nodeWidth + 2) / 4;
                    var rangeNodeMax = basePos[i] + count * (nodeWidth + 2) / 4;
                    //console.log("rangeMin::" + rangeMin);
                    //console.log("rangeMax::" + rangeMax);
                    var range = [rangeMin, rangeMax];
                    var rangeNode = [rangeNodeMin, rangeNodeMax];
                    if(params.reLayout.flag)
                        count /= params.reLayout.factor;
                    var yScale = d3.scale.linear().domain([0, count]).range(range);
                    var yScaleNode = d3.scale.linear().domain([0, count]).range(rangeNode);
                    var difference = yScale((cluster[j].length-1)/2) - yScaleNode((cluster[j].length-1)/2);
                    cluster[j].forEach(function(n, index) {
                        var time = n['time'];
                        var y = yScale(index);
                        var x = xScale(time);

                        //console.log(difference);
                        n['x'] = x;

                        if(params.data.length <= 2 && nodes.length < 2 && maxNodeSize <= 2 && params.reLayout.flag && difference >= 0)
                            n['y'] = yScaleNode(index) + difference;
                        else
                            n['y'] = y;
                        rankWidth = rankWidth < x ? x : rankWidth;
                        rankHeight = rankHeight < y ? y : rankHeight;
                        if(bounds[time] === undefined) {
                            bounds[time] = {};
                            bounds[time]["y"] = [];
                            bounds[time]["x"] = x;
                        }
                        bounds[time]['layerNum'] = n['layerNum'];

                        if(expandTime.indexOf(time) < 0) {
                            n['expand'] = false;
                        } else {
                            n['expand'] = true;
                            n['pc'] = n['ranks'].map(function(r, i) {
                                return rankDist[n['time']][i].scale(r);
                            })
                        }
                        bounds[time]["y"].push(y);
                    })

                }
                layerBounds.push(bounds);
            }
            params.rankWidth = rankWidth + config.unitWidth;
            params.rankHeight += rankHeight + config.unitWidth + 3 * config.flowMargin;
            for(var i = 0, len = layerBounds.length; i < len; i++) {
                var bound = layerBounds[i];
                var times = Object.keys(bound);
                for(var j = 0, timeLen = times.length; j < timeLen; j++) {
                    var t = times[j];
                    bound[t]["uy"] = d3.min(bound[t]["y"]);
                    bound[t]["ly"] = d3.max(bound[t]["y"]);
                }
            }
            //layerBounds.forEach(function (d, i) {
            //    var min = d3.min(Object.keys(d));
            //    var max = d3.max(Object.keys(d));
            //    while(++min < max)
            //    {
            //        layerBounds[i][min] = {};
            //        layerBounds[i][min].x = layerBounds[i][min-1].x + config.unitWidth;
            //        layerBounds[i][min].ly = 0;
            //        layerBounds[i][min].uy = 0;
            //    }
            //});


            data["bounds"] = layerBounds;

            var distBetweenLayers = [];
            var offSets = [];
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
                        dists.push(bound2[t]["uy"] - bound1[t]["ly"]);
                    }
                }
                var minDist = d3.min(dists);
                distBetweenLayers.push(minDist - 50);
                var yOffset = d3.sum(distBetweenLayers);
                offSets.push(yOffset);
                cluster2.forEach(function(nodesAtTime) {
                    nodesAtTime.forEach(function(node) {
                        node['y'] -= yOffset;
                    })
                })

            }
            for(var i = 1, len = layerBounds.length; i < len; i++) {
                var time = Object.keys(layerBounds[i]);
                for(var j = 0, timeLen = time.length; j < timeLen; j++) {
                    layerBounds[i][time[j]]['ly'] -= offSets[i - 1];
                    layerBounds[i][time[j]]['uy'] -= offSets[i - 1];
                }
            }



            //layers
            var minYear = timeScale[0];
            var maxYear = timeScale[timeScale.length-1];
            var years = [];
            params.expandFlag.forEach(function (d, i) {
                years.push(parseInt(d.time));
            });

            var flowMargin = config.flowMargin;
            //draw each layer of the stream
            var layerNum = 0; // number of layers
            layerBounds.forEach(function (l) {
                var keys = Object.keys(l);
                layerNum += (parseInt(years.indexOf(parseInt(keys[keys.length-1]))) - parseInt(years.indexOf(parseInt(keys[0])))) + 2;
            });

            var stack = d3.layout.stack().offset("wiggle"),
                layers = stack(d3.range(layerNum).map(function() {
                    var a = [], i;
                    for (i = 0; i < 2; ++i) a[i] = 0;
                    return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
                }));

            var index = 0;
            for(l = 0; l < nodes.length; ++l)
            {

                minYear = parseInt(Object.keys(layerBounds[l])[0]);
                maxYear = parseInt(Object.keys(layerBounds[l])[Object.keys(layerBounds[l]).length-1]);

                var yUp = layerBounds[l][minYear].uy;//trick(nodes, l, minYear, true);
                var yDown = layerBounds[l][minYear].ly;//trick(nodes, l, minYear, false);
                var x = layerBounds[l][minYear].x;
                var valid = true;
                var ln = layerBounds[l][minYear].layerNum;

                layers[index][0].x = x - config.unitWidth/2;
                layers[index][0].y0 = (yUp == yDown)? yUp : (yUp + yDown) / 2;
                layers[index][0].y1 = (yDown == yUp)? yDown : (yUp + yDown) / 2;
                layers[index][0].year = -1;
                layers[index][0].valid = valid;
                layers[index][0].layerNum = ln;

                layers[index][1].x = x;
                layers[index][1].y0 = yUp - flowMargin;
                layers[index][1].y1 = yDown + flowMargin;
                layers[index][1].year = minYear;
                layers[index][1].valid = valid;
                layers[index][1].layerNum = ln;
                ++index;

                var yearNum = years.indexOf(maxYear) - years.indexOf(minYear);
                for(var y = 1; y <= yearNum; ++y)
                {
                    var yearIndex = years[years.indexOf(minYear)+y-1];
                    if(layerBounds[l][yearIndex] == undefined)
                    {
                        //x = layerBounds[l][minYear+y-2].x;
                        //yDown = yUp = (layerBounds[l][minYear+y-2].y0 + layerBounds[l][minYear+y-2].y1) / 2;
                        x = layers[index-1][0].x + config.unitWidth;
                        yDown = (layers[index-1][0].y1 + layers[index-1][0].y0) / 2 - 10;
                        yUp = (layers[index-1][0].y0 + layers[index-1][0].y1) / 2 + 10;
                        valid = false;
                    }
                    else
                    {
                        yUp = layerBounds[l][yearIndex].uy;//trick(nodes, l, minYear + y - 1, true);
                        yDown = layerBounds[l][yearIndex].ly;//trick(nodes, l, minYear + y - 1, false);
                        x = layerBounds[l][yearIndex].x;
                        valid = true;
                    }

                    layers[index][0].x = x;
                    layers[index][0].y0 = yUp - flowMargin;
                    layers[index][0].y1 = yDown + flowMargin;
                    layers[index][0].year = yearIndex;
                    layers[index][0].valid = valid;
                    layers[index][0].layerNum = ln;

                    yearIndex = years[years.indexOf(minYear)+y];
                    if(layerBounds[l][yearIndex] == undefined)
                    {
                        //x = layerBounds[l][minYear+y-1].x;
                        //yDown = yUp = (layerBounds[l][minYear+y-1].y0 + layerBounds[l][minYear+y-1].y1) / 2;
                        x = layers[index-1][1].x + config.unitWidth;
                        yDown = (layers[index-1][1].y1 + layers[index-1][1].y0) / 2 - 10;
                        yUp = (layers[index-1][1].y0 + layers[index-1][1].y1) / 2 + 10;
                        valid = false;
                    }
                    else
                    {
                        yUp = layerBounds[l][yearIndex].uy;//trick(nodes, l, minYear + y, true);
                        yDown = layerBounds[l][yearIndex].ly;//trick(nodes, l, minYear + y, false);
                        x = layerBounds[l][yearIndex].x;
                        valid = true;
                    }

                    layers[index][1].x = x;
                    layers[index][1].y0 = yUp - flowMargin;
                    layers[index][1].y1 = yDown + flowMargin;
                    layers[index][1].year = yearIndex;
                    layers[index][1].valid = valid;
                    layers[index][1].layerNum = ln;

                    ++index;
                }
                yUp = layerBounds[l][maxYear].uy;//trick(nodes, l, maxYear, true);
                yDown = layerBounds[l][maxYear].ly;//trick(nodes, l, maxYear, false);
                x = layerBounds[l][maxYear].x;
                valid = true;

                layers[index][0].x = x;
                layers[index][0].y0 = yUp - flowMargin;
                layers[index][0].y1 = yDown + flowMargin;
                layers[index][0].year = maxYear;
                layers[index][0].valid = valid;
                layers[index][0].layerNum = ln;

                layers[index][1].x = x + config.unitWidth/2;
                layers[index][1].y0 = (yUp == yDown)? yUp : (yUp + yDown) / 2;
                layers[index][1].y1 = (yDown == yUp)? yDown : (yUp + yDown) / 2;
                layers[index][1].year = -1;
                layers[index][1].valid = valid;
                layers[index][1].layerNum = ln;
                ++index;
            }
            data["layers"] = layers;

            return totalHeight;

        };
//        var addRank = function(cluID, params, callback) {
//            loadServ.loadRank(cluID, function(d) {
//                var data_ = preprocess(d, params);
//                layoutRank(data_, params);
//                layoutRank(data_.compress, params);
//                params.data.push(data_);
//                params.cluID.push(cluID);
//                callback();
//            });
//        };

        var addRank = function(d, params, callback) {
            var data_ = preprocess(d, params);
            params.data.push(data_);

            params.data.sort(function(a,b) {
                return params.cluID.indexOf(a.cluid) - params.cluID.indexOf(b.cluid);
            });
            layoutRank(data_, params);
            layoutRank(data_.compress, params);

            getflowHeights(params);
            //console.log(fitMinHeight(params));
            params.reLayout.flag = true;
            params.reLayout.factor = 1.0;
            for(i in params.data)
            {
                layoutRank(params.data[i], params);
                layoutRank(params.data[i].compress, params);
                getflowHeights(params);
            }
            var flag = fitMinHeight(params);
            if(flag)
            {
                for(i in params.data)
                {
                    layoutRank(params.data[i], params);
                    layoutRank(params.data[i].compress, params);
                    getflowHeights(params);
                }
            }
            else
            {
                for(i in params.data)
                {
                    layoutRank(params.data[i], params);
                    layoutRank(params.data[i].compress, params);
                    getflowHeights(params);
                }
            }
            pipServ.emitStandardDev(params.data);
            callback();
        };

        var getflowHeights = function (params) {
            if(params.data.length > params.compressFlags.length)
                params.compressFlags.push(true);

            params.flowHeights = {};
            params.flowHeights[0] = params.cluID[0];
            params.data.forEach(function (dataOld, i) {
                var data = params.compressFlags[i]?dataOld.compress : dataOld;
                if(i != params.data.length-1)
                {
                    var minH = 9999, maxH = -9999;
                    data.bounds.forEach(function (l) {
                        for(y in l)
                        {
                            if(l[y].uy < minH)
                                minH = l[y].uy;
                            if(l[y].ly > maxH)
                                maxH = l[y].ly;
                        }
                    });
                    var keys = Object.keys(params.flowHeights);
                    keys.sort(function (a, b) {
                        return parseInt(a)-parseInt(b);
                    });
                    var h = parseInt(keys[keys.length-1]);   //YES

                    if(maxH == minH)
                        h+=1;
                    else
                        h += maxH - minH;
                    params.flowHeights[h] =  params.cluID[i];
                    h += config.flowInterval;
                    params.flowHeights[h] =  params.cluID[i+1];
                    //flowHeight += (maxH - minH);
                    //flowHeight += config.flowMargin * 3;
                }
            });
            //params.flowHeights[flowHeight] = params.cluID[params.cluID.length-1];
            var minH = 9999, maxH = -9999;
            //$$
            if(params.compressFlags[params.data.length-1])
                params.data[params.data.length-1].compress.bounds.forEach(function (l) {
                    for(y in l)
                    {
                        if(l[y].uy < minH)
                            minH = l[y].uy;
                        if(l[y].ly > maxH)
                            maxH = l[y].ly;
                    }
                });
            else
                params.data[params.data.length-1].bounds.forEach(function (l) {
                    for(y in l)
                    {
                        if(l[y].uy < minH)
                            minH = l[y].uy;
                        if(l[y].ly > maxH)
                            maxH = l[y].ly;
                    }
                });
            //console.log(params.flowHeights[Object.keys(params.flowHeights)[Object.keys(params.flowHeights).length-1]]);
            if(maxH == minH)
                params.flowHeights[parseInt(Object.keys(params.flowHeights)[Object.keys(params.flowHeights).length-1])+1] = params.cluID[params.cluID.length-1];
            else
                params.flowHeights[parseInt(Object.keys(params.flowHeights)[Object.keys(params.flowHeights).length-1])+maxH-minH] = params.cluID[params.cluID.length-1];
        };
        var render = function(svg, params) {
            pipServ.emitRenderConn(signalCluster = !signalCluster);
            //console.log(params.data);
            //svg.select("#rankGroup").selectAll(".rankCluGroup").remove();
            var groups = svg.select("#rankGroup")
                .selectAll(".rankCluGroup")
                .data(params.data);
            var container = svg.select("#rankGroup");

            var heights = [];
            Object.keys(params.flowHeights).forEach(function (d, i) {
                heights.push(d);
            });
            heights.sort(function (a, b) {
                return parseInt(a)-parseInt(b);
            });

            //for(h in params.flowHeights)
            //    heights.push(h);

            //groups.exit().remove();
            console.log(params.flowHeights);
            groups.enter()
                .append("g")
                .attr("class", "rankCluGroup")
                .attr("id", function(d, i){return "flowG-"+params.cluID[i];})
                .attr("transform", function (d, i) {
                    var keys = Object.keys(params.flowHeights);
                    keys.sort(function (a, b) {
                        return parseInt(a)-parseInt(b);
                    });
                    return "translate(" + 0 + "," + keys[i*2] + ")";
                });
            groups.transition()
                .duration(1000)
                .attr("transform", function (d, i) {
                    var keys = Object.keys(params.flowHeights);
                    keys.sort(function (a, b) {
                        return parseInt(a)-parseInt(b);
                    });
                    return "translate(" + 0 + "," + parseInt(keys[i*2]) + ")";
                })
                .attr("id", function(d, i){return "flowG-"+params.cluID[i];});
            groups.exit()
                .remove();
            //drawlines
            d3.selectAll(".separateLine").remove();
            //console.log(heights);
            //console.log(params.flowHeights);
            var separateLines = container.selectAll(".separateLine")
                .data(heights);
            separateLines.enter()
                .append("line")
                .attr("x1", -40)
                .attr("y1", function (d, i) {
                    return (i%2==0)?parseInt(d) - config.sLineInterval : parseInt(d) + config.sLineInterval;
                })
                .attr("x2", params.rankWidth)
                .attr("y2", function (d, i) {
                    return (i%2==0)?parseInt(d) - config.sLineInterval : parseInt(d) + config.sLineInterval;
                })
                .attr("stroke", "#e5e5e5")
                .attr("opacity", 1)
                .attr("class", "separateLine");

            separateLines.transition()
                .duration(0)
                .attr("id", function (d, i) {
                    return "separateLine-"+params.flowHeights[d]+"-"+i%2;
                })
                .attr("x1", -40)
                .attr("y1", function (d, i) {
                    return (i%2==0)?parseInt(d) - config.sLineInterval : parseInt(d) + config.sLineInterval;
                })
                .attr("x2", params.rankWidth)
                .attr("y2", function (d, i) {
                    return (i%2==0)?parseInt(d) - config.sLineInterval : parseInt(d) + config.sLineInterval;
                });
            separateLines.exit()
                .remove();

            //draw rects
            //draw rects..
            var heightsForRect = [];
            heights.forEach(function (d, i) {
                if(i%2==0)
                {
                    heightsForRect.push((parseInt(heights[i])+parseInt(heights[i+1]))/2);
                }
            });

            //container.selectAll(".separateRect").remove();
            d3.selectAll(".separateRects").transition()
                .duration(0)
                .attr("transform", function (d, i) {
                    return "translate(" + 0 + "," + params.tranY + ")";
                });

            var separateRect = d3.selectAll(".separateRects")
                .selectAll(".separateRect")
                .data(heightsForRect);

            //console.log(params.flowHeights);
            //console.log(heights);
            //console.log(heightsForRect);

            separateRect.enter()
                .append("rect")
                .attr("x", params.width-40)
                .attr("y", function (d, i) {
                    return parseInt(d)-10;
                })
                .attr("width", 20)
                .attr("height", 20)
                .attr("stroke", "grey")
                .attr("fill", "green")
                .attr("opacity", 0.4)
                .attr("class", "separateRect");

            separateRect.transition()
                .duration(1000)
                .attr("id", function (d, i) {
                    return "separateRect-"+i;
                })
                .attr("y", function (d, i) {
                    return parseInt(d)-10;
                });
            separateRect.exit()
                .remove();

            separateRect.on("click", function (d, i) {
                params.compressFlags[i] = !params.compressFlags[i];
                //render(svg, params);

                for(var i = 0; i < params.data.length; i++) {
                    //$$
                    var tmpD = params.compressFlags[i]?params.data[i].compress:params.data[i];
                    layoutRank(tmpD, params);
                    getflowHeights(params);
                    params.reLayout.flag = true;
                    params.reLayout.factor = 1.0;
                    for(j in params.data)
                    {
                        layoutRank(params.data[j], params);
                        layoutRank(params.data[j].compress, params);
                        getflowHeights(params);
                    }
                    var flag = fitMinHeight(params);
                    if(flag)
                    {
                        for(i in params.data)
                        {
                            layoutRank(params.data[i], params);
                            layoutRank(params.data[i].compress, params);
                            getflowHeights(params);
                        }
                    }
                    else
                    {
                        for(i in params.data)
                        {
                            layoutRank(params.data[i], params);
                            layoutRank(params.data[i].compress, params);
                            getflowHeights(params);
                        }
                    }
                }
                render(svg, params);
                if(params.tranX < params.width - params.rankWidth - margin[0] - 454) {
                    params.tranX = params.width - params.rankWidth - margin[0] - 454;
                    params.transitionFlag = true;
                    render(svg, params);
                    params.transitionFlag = false;
                }
            });

            svg.select("#canvas")
                .transition()
                .duration(function () {
                    return params.transitionFlag? 1000:0;
                })
                .attr("transform", "translate(" + params.tranX + "," + params.tranY + ")");
            svg.select("#PCGroup")
                .transition()
                .duration(function () {
                    return params.transitionFlag? 1000:0;
                })
                .attr("transform", "translate(" + params.tranX + "," + params.tranY + ")");
            svg.select("#rankAxis")
                .transition()
                .duration(function () {
                    return params.transitionFlag? 1000:0;
                })
                .attr("transform", "translate(" + (params.tranX+config.margin[0]) + "," + config.margin[1] + ")");

            renderFlows(groups, params);
            renderLinks(groups, params);
            renderNodes(groups, params);
            renderTimeAxis(svg, params);
        };
        var drawPC = function(year, params) {
            var translate = d3.transform(d3.select("#rankGroup").attr("transform")).translate;
            params.data.forEach(function (data, i) {
                var groupOffset = d3.transform(d3.select("#rankGroup").select("#flowG-"+params.cluID[i]).attr("transform")).translate;
                var svg = d3.select("#PCGroup")
                    .append("g")
                    .attr("id", "PC-"+i+"-"+year)
                    .attr("class", "PC")
                    .attr("transform", "translate(" + (translate[0]+groupOffset[0]) + "," + (translate[1]+groupOffset[1]) + ")");

                //$$
                var bounds = params.compressFlags[i]?data.compress.bounds:data.bounds;
                var nodes = params.compressFlags[i]?data.compress.nodes:data.nodes;

                var expandLeft = [];
                var expandRight = [];
                nodes.forEach(function (l) {
                    l.forEach(function (y) {
                        if(year == y[0].time)
                        {
                            y.forEach(function (d) {
                                expandLeft.push({x:d.x, y:d.y, r:config.glyph.ringInnerRadius});
                                expandRight.push({x:d.x, y: d.y, r:config.glyph.ringInnerRadius});
                            })
                        }
                    });
                });

                var xMin, xMax, yMin, yMax;
                for(var l = 0; l < bounds.length; ++l)
                {
                    //if(year > d3.min(Object.keys(bounds[l])) && year < d3.max(Object.keys(bounds[l])))
                    if(bounds[l][year] != undefined)
                    {
                        xMin = bounds[l][year].x - config.interval;
                        xMax = bounds[l][year].x + config.interval;
                        break;
                    }
                }
                for(l = 0; l < bounds.length; ++l)
                {
                    //if(year > d3.min(Object.keys(bounds[l])) && year < d3.max(Object.keys(bounds[l])))
                    if(bounds[l][year] != undefined)
                    {
                        yMin = bounds[l][year].uy;
                        break;
                    }
                }
                for(l = bounds.length-1; l >= 0; --l)
                {

                    // if(year > d3.min(Object.keys(bounds[l])) && year < d3.max(Object.keys(bounds[l])))
                    if(bounds[l][year] != undefined)
                    {
                        yMax = bounds[l][year].ly;
                        break;
                    }
                }



                var margin = {top: 0, right: 12, bottom: 0, left: 12},
                    width = config.interval * 2;

                //x scale
                //var x = d3.scale.ordinal().rangePoints([divideYearDataUp[yearIndex].x-margin.left, divideYearDataUp[yearIndex].x + width + margin.right], 1),
                var x = d3.scale.ordinal().rangePoints([xMin-margin.left, xMax + /*width +*/ margin.right], 1),
                    y = {},
                    dragging = {};

                var line = d3.svg.line().interpolate("monotone"),
                    axis = d3.svg.axis().tickSize(0).orient("left"),
                    background,
                    foreground;

                var rankData = [];
                for(var i = 0; i < nodes.length; ++i)
                {
                    for(var j = 0; j < nodes[i].length; ++j)
                    {
                        for(var k = 0; k < nodes[i][j].length; ++k)
                        {
                            if(nodes[i][j][k].time == year)
                            {
                                var ranks = nodes[i][j][k].ranks;
                                var metrics = window.config.metrics;
                                var d = {};
                                d['s'] = nodes[i][j][k].y;
                                for(var u = 0; u < metrics.length; ++u)
                                {
                                    d[metrics[u]] = ranks[u];
                                }
                                d['e'] = nodes[i][j][k].y;

                                //if(window.config.mode === "MMO") {
                                //    //rankData.push({m0:nodes[i][j][k].y, ad:ranks[0], m2:ranks[1], m3:ranks[2], m4:ranks[3],m5:ranks[4],m6:ranks[5],m7:ranks[6],m8:ranks[7],m9:ranks[8], me: nodes[i][j][k].y});
                                //    rankData.push(deepCopy(d));
                                //} else {
                                    rankData.push(deepCopy(d));
                                    // rankData.push({m0:nodes[i][j][k].y ,m1:ranks[0], m2:ranks[1], m3:ranks[2], m4:ranks[3],m5:ranks[4],m6:ranks[5],m7:ranks[6],m8:ranks[7],m9:ranks[8],m10:ranks[9], me: nodes[i][j][k].y});
                                //}

                            }
                        }
                    }
                }
                var dimensions;
                // Extract the list of dimensions and create a scale for each.
                x.domain(dimensions = d3.keys(rankData[0]).filter(function(d) {
                    return d != "name" && (y[d] = d3.scale.linear()
                            .domain(d3.extent(rankData, function(p) {return +p[d]; }))
                            .range([yMin, yMax]));
                }));

                var circlesLeft = svg.selectAll(".expandCircleL")
                    .data(expandLeft);
                circlesLeft.enter()
                    .append("circle")
                    .attr("cx", function(d){return d.x - config.interval;})
                    .attr("cy", function(d){return d.y;})
                    .attr("r", function(d){return d.r;})
                    .attr("fill", "grey")
                    .attr("class", "expandCircleL");
                //circlesLeft.transition()
                //    .duration(1000)
                //    .attr("cx", function(d){return d.x;})
                //    .attr("cy", function(d){return d.y;});

                var circlesRight = svg.selectAll(".expandCircleR")
                    .data(expandRight);
                circlesRight.enter()
                    .append("circle")
                    .attr("cx", function(d){return d.x - config.interval;})
                    .attr("cy", function(d){return d.y;})
                    .attr("r", function(d){return d.r;})
                    .attr("fill", "grey")
                    .attr("class", "expandCircleR");

                circlesRight
                    .transition()
                    .duration(0)
                    .attr("cx", function(d){return d.x + config.interval;})
                    .attr("cy", function(d){return d.y;});


                // Add grey background lines for context.
                background = svg.append("g")
                    .attr("class", "background")
                    .selectAll("path")
                    .data(rankData)
                    .enter().append("path")
                    .attr("d", path)
                    .attr("stroke-width", 0.5);

                // Add blue foreground lines for focus.
                foreground = svg.append("g")
                    .attr("class", "foreground")
                    .selectAll("path")
                    .data(rankData)
                    .enter().append("path")
                    .attr("d", path)
                    .attr("stroke-width", 0.5);


                // Add a group element for each dimension.
                var g = svg.selectAll(".dimension")
                    .data(dimensions)
                    .enter().append("g")
                    .attr("class", "dimension")
                    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })

                // Add an axis and title.
                g.append("g")
                    .attr("class", "axis")
                    .each(function(d, i) {
                        if(i!=0&&i!=window.config.metrics.length + 1)
                            d3.select(this).call(axis.scale(y[d]));
                    })


                g.append("g")
                    .attr("transform", "translate(0," + (yMin-20) +")")
                    .append("text")
                    .style("text-anchor", "left"/*"start"*/)
                    //.style("transform", "translate(0, -30)")
                    //.style("transform", "rotate(-30deg)")
                    .attr("transform", "rotate(-30)")
                    //.attr("y", yMin)
                    .attr("class", "PC-title")
                    .attr("font-size", 1)
                    .text(function(d, i) {
                        if(i!=0&&i!=window.config.metrics.length + 1)
                            return d; });

                g.append("text")
                    .style("text-anchor", "middle")
                    .attr("y", function (d, i) {
                        if(i%2 == 0)
                        {
                            return yMax + 15;
                        }
                        else
                            return yMax + 10;
                    })
                    .attr("class", "PC-max")
                    .attr("font-size", 1)
                    .text(function(d, i) {
                        if(i!=0&&i!=window.config.metrics.length + 1)
                            return parseInt(d3.max(rankData, function (a) {
                                return a[d];
                            }));
                    });
                g.append("text")
                    .style("text-anchor", "middle")
                    .attr("y", function (d, i) {
                        if(i%2 == 0)
                        {
                            return yMin-5;
                        }
                        return yMin;
                    })
                    .attr("class", "PC-min")
                    .attr("font-size", 1)
                    .text(function(d, i) {
                        if(i!=0&&i!=window.config.metrics.length + 1)
                            return parseInt(d3.min(rankData, function (a) {
                                return a[d];
                            }));
                    });

                // Add and store a brush for each axis.
                g.append("g")
                    .attr("class", "brush")
                    .each(function(d) {
                        d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
                    })
                    .selectAll("rect")
                    .attr("x", -8)
                    .attr("width", 16);

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
            });


        };
        var renderFlows = function(g, params) {
            g.each(function(group, num) {
                var bounds = params.compressFlags[num]?params.data[num].compress.bounds:params.data[num].bounds;
                //var bounds = params.data[num].bounds;   $$


                //var color = d3.scale.ordinal()
                //    .range([d3.rgb(234,243,249).toString(), d3.rgb(225,238,246).toString(), d3.rgb(243,248,251).toString()]);

                //var color = d3.scale.ordinal()
                //    .range(["#74B6E5","#74B6E5","#74B6E5"]);

                //var color = d3.scale.ordinal()
                //    .range(["#FFE5C5","#FFF2E2","#EDF8FC", "#DAF4FD"]);
                var color = d3.scale.ordinal()
                    .range(["#c7edff","#e0f4fe","#f2faff","#f7f7f7"]);
                    //.range(["#c7f1ff","#dcf5fd","#f2fcff","#f5f5f5"]);
                var faultMinYear = 9999, faultMaxYear=-9999;
                var area = function(d, i) {
                    var x1 = d[0].x,
                        x2 = d[1].x,
                        y1d = d[0].y1,
                        y2d = d[1].y1,
                        y1u = d[0].y0,
                        y2u = d[1].y0;
                    var years = getExpandYears(params);

                    //params.data[num].layers.forEach(function (layer) {
                    //    if(layer.layerNum == d.layerNum)
                    //    {
                    //        if(layer[0].valid && !layer[1].valid)
                    //            faultMinYear = layer[0].year;
                    //
                    //        if(!layer[0].valid && layer[1].valid)
                    //            faultMaxYear = layer[0].year;
                    //    }
                    //});

                    years.forEach(function (y, j) {
                        //$$
                        var ler = params.compressFlags[num]?params.data[num].compress.layers:params.data[num].layers;
                        for(var j = 0; j < ler.length; ++j)
                        {
                            var layer = ler[j];
                            //var layer = params.data[num].layers[j]; $$
                            if(layer[0].layerNum == d[0].layerNum)
                            {
                                if(layer[0].valid && !layer[1].valid)
                                    faultMinYear = layer[0].year;

                                if(!layer[0].valid && layer[1].valid)
                                {
                                    faultMaxYear = layer[0].year;
                                    if(faultMaxYear > y)
                                    {
                                        break;
                                    }

                                }
                            }
                        }


                        var validYear = [true, true];
                        var validYearBack = [true, true];
                        //$$
                        if(params.compressFlags[num])
                        {
                            params.data[num].compress.layers.forEach(function (l, k) {
                                if(l[0].year == y && l[0].layerNum == d[0].layerNum)
                                {
                                    validYear[0] = l[0].valid;
                                    validYear[1] = l[1].valid;
                                }
                                if(l[1].year == y && l[0].layerNum == d[0].layerNum)
                                {
                                    validYearBack[0] = l[0].valid;
                                    validYearBack[1] = l[1].valid;
                                }
                            });
                        }
                        else
                        {
                            params.data[num].layers.forEach(function (l, k) {
                                if(l[0].year == y && l[0].layerNum == d[0].layerNum)
                                {
                                    validYear[0] = l[0].valid;
                                    validYear[1] = l[1].valid;
                                }
                                if(l[1].year == y && l[0].layerNum == d[0].layerNum)
                                {
                                    validYearBack[0] = l[0].valid;
                                    validYearBack[1] = l[1].valid;
                                }
                            });
                        }


                        if(validYear[0] && !validYear[1])
                        {
                            if(d[0].year <= faultMaxYear && d[0].year >= faultMinYear)
                            {
                                if(!d[0].valid && d[1].valid)
                                {
                                    x1 += config.interval;
                                }
                                else if(d[0].year >= y)
                                {
                                    x1 += config.interval;
                                    x2 += config.interval;
                                }
                            }
                        }
                        if(!validYear[0] && !validYear[1])
                        {
                            if(d[0].year <= faultMaxYear && d[0].year >= faultMinYear)
                            {
                                if(!d[0].valid && d[1].valid)
                                {
                                    x1 += 2 * config.interval;
                                }
                                else if(d[0].year >= y)
                                {
                                    x1 += 2 * config.interval;
                                    x2 += 2 * config.interval;
                                }
                            }
                        }
                        if(!validYear[0] && validYear[1])
                        {
                            if(d[0].year == y)
                                x1 += 2 * config.interval;
                        }
                        if(!validYearBack[0] && validYearBack[1])
                        {
                            if(d[1].year == y)
                                x2 -= config.interval;
                        }
                        if(d[0].valid && d[1].valid)
                        {
                            if(d[0].year == -1 && d[1].year == y )
                            {
                                x1 -= config.interval;
                                x2 -= config.interval;
                            }
                            else if(d[0].year == y && d[1].year == -1 )
                            {
                                x1 += config.interval;
                                x2 += config.interval;
                            }
                            else if(d[1].year == y && d[0].year != -1)
                            {
                                //x1 -= config.interval;
                                x2 -= config.interval;
                            }
                            else if(d[0].year == y && d[1].year != -1)
                            {
                                x1 += config.interval;
                                //if(!d[1].valid)
                                //    x2 += config.interval;
                            }
                        }

                    });
                    var cx = (x1 + x2) / 2;
                    return "M " + x1 + "," + y1d + " C " + [cx, y1d, cx, y2d, x2, y2d].join(" ") + "L " + x2 + "," + y2u + " C " + [cx, y2u, cx, y1u, x1, y1u].join(" ") + " Z";
                };

                //d3.select(this).selectAll(".flows").remove();
                var flows = d3.select(this).selectAll(".flows")
                    //$$
                    .data(params.compressFlags[num]?params.data[num].compress.layers:params.data[num].layers);
                //console.log(params.data[num].layers);

                flows.enter().append("path")
                    .attr("class", "flows");

                flows.transition()
                    .duration(1000)
                    .attr("d", area)
                    .attr("id", function (d) {
                        return ""+d[0].year+"."+d[1].year;
                    });

                flows.style("stroke", "none")
                    .style("fill", function(fill, i) {
                        //console.log(fill);
                        //var l = 0, count = 0;
                        //minYear = parseInt(Object.keys(bounds[l])[0]);
                        //maxYear = parseInt(Object.keys(bounds[l])[Object.keys(bounds[l]).length-1]);
                        //i -= (maxYear - minYear + 2);
                        //while(i >= 0)
                        //{
                        //    ++l;
                        //    minYear = parseInt(Object.keys(bounds[l])[0]);
                        //    maxYear = parseInt(Object.keys(bounds[l])[Object.keys(bounds[l]).length-1]);
                        //    i -= (maxYear - minYear + 2);
                        //    ++count;
                        //}
                        //return color(count);
                        return color(fill[0].layerNum); //white
                    })
                    .attr("opacity", function (d, i) {
                        //var l = d[0].layerNum;
                        //return l==0? 1: l==1? 0.6: l==2? 0.3:0.1;
                        return 1;
                    });
                flows.exit().remove();
            });

        };
        var bezLine = function(d) {
            var x1 = d.source.x,
                x2 = d.target.x,
                y1 = d.source.y,
                y2 = d.target.y;
//            if(expandFlags[divideYear - timeScale[0]] && d.target.year == divideYear)
//                x2 -= 2*interval;
            var cx = (x1 + x2) / 2;
            return "M " + x1 + "," + y1 + " C " + [cx, y1, cx, y2, x2, y2].join(" ");
        };
        var renderLinks = function(g, params) {
            g.each(function(d, i) {
                var linkData = params.compressFlags[i]? deepCopy(d.compress.links):deepCopy(d.links);
                var expandYears = getExpandYears(params);
                linkData.forEach(function (d) {
                    expandYears.forEach(function (y) {
                        if(d.source.time === y)
                        {
                            d.source.x -= config.interval;

                        }
                        else if(d.target.time === y)
                        {
                            d.target.x += config.interval;
                        }
                    });
                });

                var g = d3.select(this);
                //g.selectAll(".rankLink").remove();
                var links = g.selectAll(".rankLink")
                    //$$
                    .data(/*params.compressFlags[i]?d.compress.links: d.links*/linkData);
                links.enter()
                    .append("path");

                links.transition()
                    .duration(100)
                    .attr("d",bezLine)
                    .attr("stroke-opacity", function (d) {
                        if(params.highLights.indexOf(d.source.name) >= 0)
                            return 1;
                        else
                            return 0.2;
                    })
                    .attr("class", "rankLink");
                links.exit().remove();
            });

//            return links;

        };
        var renderNodes = function(gg, params) {
            //var svg = d3.selectAll("#rankView");
            //svg.call(tip);

            //var svg = d3.selectAll("#rankView");
            gg.call(tip);
            gg.each(function(d, i) {
                var g = d3.select(this);
                //$$
                var nodes = params.compressFlags[i]?d.compress.nodes: d.nodes;
                var data = [];
                for(var i = 0, len = nodes.length; i < len; i++) {
                    var cluster = nodes[i];
                    for(var j = 0, yearLen = cluster.length; j < yearLen; j++) {
                        cluster[j].forEach(function(n) {
                            data.push(n);
                        })
                    }
                }
                //g.selectAll(".rankNode").remove();
                var rankNodes = g.selectAll(".rankNode")
                    .data(data, function(d) {
                        return d.time + "," +d.name;
                    });
                rankNodes.enter()
                    .append("g")
                    .attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    })
                    .on('mouseover', function (d) {
                        tip.show(d);
                        if(params.highLights.indexOf(d.name) < 0)
                            params.highLights.push(d.name);

                        renderLinks(gg, params);
                    })
                    .on('mouseout', function (d) {
                        tip.hide(d);
                        params.highLights.splice(params.highLights.indexOf(d.name), 1);
                        renderLinks(gg, params);
                    });
                rankNodes.transition()
                    . duration(1000)
                    .attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    })
                    .attr("class", "rankNode")
                    .attr("year", function(d){
                        return d.year;
                    });
                rankNodes.on("click", function (d,i) {
                    pipServ.emitAddDetail([d.name]);
                })
                rankNodes.exit().remove();

                //rankNodes.call(glyph);
                console.log(params);
                glyph(rankNodes, params);
            });

            //nodes.exit()
            //    .remove();
//            return data;
        };
        var renderTimeAxis = function(svg, params) {
            var xScale = scaleOnX(params, 0);
            var config = window.config.rank;
            var ticks = window.config.timeScale;
            var g = svg.select("#rankAxis");

            //************* lines *****************
            var lineArea = function(d, i) {
                var width = 10;
                var x1 = xScale(d),
                    x2 = xScale(ticks[i+1]),
                    yd = 10+width/2,
                    yu = 10-width/2;
                var cx = (x1 + x2) / 2,
                    cyu = yu,//10,
                    cyd = yd;//10;
                params.expandFlag.forEach(function (y, j) {
                    if(j < params.expandFlag.length-1)
                    {
                        if(y.time == d && y.expand)
                        {
                            cyu = yu+width/3;
                            cyd = yd-width/3;
                        }
                        else if(j!=0 && params.expandFlag[j-1].time == d && y.expand)
                        {
                            cyu = yu+width/3;
                            cyd = yd-width/3;
                        }
                    }
                });
                return "M " + x1 + "," + yd + " Q " + [cx, cyd, x2, yd].join(" ") + "L " + x2 + "," + yu + " Q " + [cx, cyu, x1, yu].join(" ") + " Z";
            };
            var area = function(d, i) {
                var width = 2.2222;
                var x1 = xScale(d),
                    x2 = xScale(ticks[i+1]),
                    yd = 10+width/2,
                    yu = 10-width/2;
                var cx = (x1 + x2) / 2,
                    cyu = yu,//10,
                    cyd = yd;//10;
                //params.expandFlag.forEach(function (y, j) {
                //    if(y.time == d || params.expandFlag.time)
                //});
                return "M " + x1 + "," + yd + " Q " + [cx, cyd, x2, yd].join(" ") + "L " + x2 + "," + yu + " Q " + [cx, cyu, x1, yu].join(" ") + " Z";
            };
            var axisLine = g.selectAll(".axisLine")
                .data(ticks.slice(0,ticks.length-1), function (d) {
                    return d;
                })
            axisLine.enter()
                .append("path")
                .attr("class", "axisLine")
                .attr("stroke-width", 0)
                .attr("fill", "black")
                .attr("opacity", 0.5);
            axisLine.transition()
                .duration(1000)
                .attr("d", lineArea);


            //*********** for axis area *************
            var area = function(d, i) {
                var x1 = d.source.x,
                    x2 = d.target.x,
                    y1d = 10-5,
                    y2d = 10-5,
                    y1u = d.source.y,
                    y2u = d.target.y;

                var cx = (x1 + x2) / 2;
                return "M " + x1 + "," + y1d + " C " + [cx, y1d, cx, y2d, x2, y2d].join(" ") + "L " + x2 + "," + y2u + " C " + [cx, y2u, cx, y1u, x1, y1u].join(" ") + " Z";
            };
            var nodePos = {};
            var axisHeight = config.margin[1]-8;
            params.data.forEach(function (d, i) {
                d.nodes.forEach(function (l, j) {
                    l.forEach(function (y, k) {
                        var key = y[0].time;
                        if(Object.keys(nodePos).indexOf("" + key) < 0)
                            nodePos[key] = 0;
                        nodePos[key] += y.length;
                    });
                });
            });
            var maxNodeNum = d3.max(Object.keys(nodePos), function (d, i) {
                return nodePos[d];
            });
            var years = [];
            params.expandFlag.forEach(function (d, i) {
                years.push(parseInt(d.time));
            });
            for(var key = 0; key <= years.length-1; ++key)
            {
                var yearIndex = years[key];
                if(nodePos[yearIndex] == undefined)
                    nodePos[yearIndex] = 10-5;
                else
                    nodePos[yearIndex] = 10-5 - nodePos[yearIndex] * axisHeight/ maxNodeNum;
            }

            var curvePos = [];
            for(key = 0; key < years.length-1; ++key)
            {
                yearIndex = years[key];
                curvePos.push({
                    source:{x:xScale(yearIndex), y:nodePos[yearIndex]},
                    target:{x:xScale(years[key + 1]), y:nodePos[years[key + 1]]}
                });
            }

            //color gredient
            var linear = [1];
            var defs = g.selectAll(".colorDefs")
                .data(linear)
                .enter()
                .append("defs")
                .attr("class", "colorDefs");

            var linearGradient = defs
                .append("linearGradient")
                .attr("id","linearColor")
                .attr("x1","0%")
                .attr("y1","0%")
                .attr("x2","0%")
                .attr("y2","100%");

            var stop1 = linearGradient.append("stop")
                .attr("offset","0%")
                .style("stop-color","#E1F3FF");

            var stop2 = linearGradient.append("stop")
                .attr("offset","100%")
                .style("stop-color","#DCFCF6");

            var axisArea = g.selectAll(".axisArea")
                .data(curvePos);
            axisArea.enter()
                .append("path")
                .attr("class", "axisArea")
                .attr("stroke-width", "0")
                .attr("stroke", "none")
                //.attr("fill", "url(#linearColor)");
                .attr("fill", "none");
            axisArea.transition()
                .duration(1000)
                .attr("d", area);

            //*********** for axis curve ************

            //var axisCurve = g.selectAll(".axisCurve")
            //    .data(curvePos);
            //
            //axisCurve.enter()
            //    .append("path")
            //    .attr("class", "axisCurve")
            //    .attr("stroke-width", "2px")
            //    .attr("stroke", "#8bd4fd")
            //    .attr("fill", "none");
            //axisCurve.transition()
            //    .duration(1000)
            //    .attr("d", bezLine);


            ////******** for axis curve points ********
            //var curvePoints = g.selectAll(".curvePoints")
            //    .data(ticks, function(d) {
            //        return d;
            //    });
            //curvePoints.enter()
            //    .append("circle")
            //    .attr("stroke", "#8bd4fd")
            //    .attr("stroke-width", "2px")
            //    .attr("fill", "white")
            //    .attr("class", "curvePoints")
            //    .attr("id", function (d) {
            //        return "curvePoint-"+d;
            //    });
            //curvePoints.transition()
            //    .duration(1000)
            //    .attr("cx", function(d) {
            //        return xScale(d);
            //    })
            //    .attr("cy", function(d) {
            //        return nodePos[d];
            //    })
            //    .attr("r", function(d) {
            //        return 3.61;
            //    });



            //**************** circles *****************
            var tickCircle = g.selectAll(".ctrlCircles")
                .data(ticks, function(d) {
                    return d;
                });
            tickCircle.enter()
                .append("circle")
                .attr("class", "ctrlCircles")
                .attr("id", function (d) {
                    return "ctrlCircle-"+d;
                });
            tickCircle.transition()
                .duration(1000).attr("cx", function(d) {
                return xScale(d);
            });
            tickCircle.attr("cy", function(d) {
                    return 10;
                })
                .attr("r", function(d) {
                    return 8;
                });
            //.attr("fill", function(d){
            //    return "green";
            //});
            //.attr("opacity", 0.4);
            tickCircle.on("click", function (d, i) {

                if (d3.event.defaultPrevented) return;
                pipServ.emitRankExpand({tranX: params.tranX, tranY: params.tranY, expandFlag: params.expandFlag});
                var flag = params.expandFlag.filter(function(o) {
                    var res = false;
                    if(o.time === d) {
                        res = true;
                    }
                    return res;
                })[0];
                if(!flag["expand"])
                {
                    //*********
                    g.selectAll("#Page-"+d)
                        .transition()
                        .duration(1000)
                        .attr("stroke","none")
                        .attr("stroke-width","1")
                        .attr("fill","none")
                        .attr("fill-rule", "evenodd")
                        .attr("sketch:type","MSPage");
                    g.selectAll("#Artboard-"+d)
                        .transition()
                        .duration(1000)
                        .attr("sketch:type", "MSArtboardGroup")
                        //.attr("transform","translate(-11.000000, -6.000000)")
                        .attr("filter","url(#filter-active)");
                    g.selectAll("#use-"+d)
                        .transition()
                        .duration(1000)
                        .attr("stroke","none")
                        .attr("fill","#5BC689")
                        .attr("fill-rule", "evenodd")
                        .attr("sketch:type", "MSShapeGroup")
                        .attr("xlink:href","#ctrlCircle-"+d);
                    g.selectAll("#use-2-"+d)
                        .transition()
                        .duration(1000)
                        .attr("stroke","#FFFFFF")
                        .attr("stroke-width","1")
                        .attr("fill","none")
                        .attr("xlink:href","#ctrlCircle-"+d);
                    //*********
                }
                else
                {
                    g.selectAll("#Page-"+d)
                        .transition()
                        .duration(1000)
                        .attr("stroke","none")
                        .attr("stroke-width","1")
                        .attr("fill","none")
                        .attr("fill-rule", "evenodd")
                        .attr("sketch:type","MSPage");
                    g.selectAll("#Artboard-"+d)
                        .transition()
                        .duration(1000)
                        .attr("sketch:type", "MSArtboardGroup")
                        //.attr("transform","translate(-41.000000, -6.000000)")
                        .attr("filter","url(#filter-normal)");
                    g.selectAll("#use-"+d)
                        .transition()
                        .duration(1000)
                        .attr("stroke","none")
                        .attr("fill","#5BC689")
                        .attr("fill-rule", "evenodd")
                        .attr("sketch:type", "MSShapeGroup")
                        .attr("xlink:href","#ctrlCircle-"+d);
                    g.selectAll("#use-2-"+d)
                        .transition()
                        .duration(1000)
                        .attr("stroke","#FFFFFF")
                        .attr("stroke-width","1")
                        .attr("fill","none")
                        .attr("xlink:href","#ctrlCircle-"+d);
                }


                flag["expand"] = !flag["expand"];
                //$$
                for(var i = 0; i < params.data.length; i++) {
                    //$$
                    var tmpD = params.compressFlags[i]?params.data[i].compress:params.data[i];
                    layoutRank(tmpD, params);
                }
                getflowHeights(params);
                render(svg, params);
                if(params.tranX < params.width - params.rankWidth - margin[0] - 454) {
                    params.tranX = params.width - params.rankWidth - margin[0] - 454//54;
                    params.transitionFlag = true;
                    getflowHeights(params);
                    render(svg, params);
                    params.transitionFlag = false;
                }
                //clickTickCircle(params, g, svg, d)
            });
            var page1 = g.selectAll(".Pages")
                .data(ticks, function(d) {
                    return d;
                })
                .enter()
                .append("g")
                .attr("id", function (d) {
                    return "Page-"+d;
                })
                .attr("class", "Pages")
                .attr("stroke","none")
                .attr("stroke-width","1")
                .attr("fill","none")
                .attr("fill-rule", "evenodd")
                .attr("sketch:type","MSPage");

            var Artboard = page1.append("g")
                .attr("id", function (d) {
                    return "Artboard-"+d;
                })
                .attr("sketch:type", "MSArtboardGroup")
                //.attr("transform","translate(-41.000000, -6.000000)")
                .attr("filter","url(#filter-normal)");
            var oval1 = Artboard.append("g")
                .attr("id", function (d) {
                    return "Oval-"+d
                });
            oval1.append("use")
                .attr("stroke","none")
                .attr("fill","#5BC689")
                .attr("fill-rule", "evenodd")
                .attr("sketch:type", "MSShapeGroup")
                .attr("xlink:href", function (d) {
                    return "#ctrlCircle-"+d;
                })
                .attr("id", function (d) {
                    return "use-"+d;
                });
            oval1.append("use")
                .attr("stroke","#FFFFFF")
                .attr("stroke-width","1")
                .attr("fill","none")
                .attr("xlink:href",function (d) {
                    return "#ctrlCircle-"+d;
                })
                .attr("id", function (d) {
                    return "use-2-"+d;
                });

            //************** text for years ************
            var yearText = g.selectAll(".yearText")
                .data(ticks, function(d) {
                    return d;
                });
            yearText.enter()
                .append("text")
                .attr("class", "yearText")
                .attr("id", function (d) {
                    return "yearText-"+d;
                })
                .text(function (d) {
                    return d;
                })
                .attr("font","Helvetica")
                .attr("font-size","10px")
                .attr("fill","#444");
            yearText.transition()
                .duration(1000).attr("x", function(d) {
                return xScale(d)-22.234/2;
            });
            yearText.attr("y", function(d) {
                return 20+11.6+2.78;
            });




        };
        var glyph = function(g, params){
            var config = window.config.rank;
            var angScale = d3.scale.linear().domain(config.rankRange).range([0, Math.PI * 2]);
            var rankStep = (config.rankRange[1] - config.rankRange[0]) / 24;

            d3.selectAll(".PC")
                .remove();

            //if(params.tranX < params.width - params.rankWidth - margin[0]) {
            //    params.tranX = params.width - params.rankWidth - margin[0];
            //    console.log(params.tranX);
            //    params.transitionFlag = true;
            //    console.log(params);
            //    render(d3.select("#rankView"), params);
            //    params.transitionFlag = false;
            //}
            var expandYears = getExpandYears(params);
            expandYears.forEach(function (d) {
                drawPC(d, params);
            });

            g.each(function(d, i) {
                var isComressed = Object.keys(d).indexOf("compressRank") >= 0;

                var flag = false;
                expandYears.forEach(function (e) {
                    if(e == d.time)
                    {
                        flag = true;
                    }
                });

                var container = d3.select(this);
                container.selectAll(".expandCircleL")
                    .remove();
                container.selectAll(".expandCircleR")
                    .remove();

                var ranks = isComressed? d.compressRank:d.ranks;
                var outerRadius = config.glyph.ringOuterRadius,
                    innerRadius = config.glyph.ringInnerRadius;
                var color = d3.scale.category20();
                var arc = d3.svg.arc();
                var pie = d3.layout.pie()
                    .sort(null);

                var rankInput = {};
                rankInput["min"] = Math.min.apply(null, ranks);
                rankInput["max"] = Math.max.apply(null, ranks);
                rankInput["data"] = ranks;
                if(isComressed)
                {
                    rankInput["compressDist"] = [];

                    for(var j = rankInput["min"], jj = 0; j < rankInput["max"]; j += rankStep, jj+=1)
                    {
                        rankInput["compressDist"][jj] = 0;
                    }
                    rankInput["data"].forEach(function (d) {
                        for(var j = rankInput["min"], jj = 0; j < rankInput["max"]; j += rankStep, jj+=1)
                        {
                            if(d >= j && d < j + rankStep)
                                rankInput["compressDist"][jj] += 1;
                        }
                    });
                    var distMax = d3.max(rankInput["compressDist"]);
                    var distMin = d3.min( rankInput["compressDist"]);
                }




                if(!flag)
                {
                    var tmpData = [d];
                    container
                        .selectAll(".backgroundCircle")
                        .data(tmpData)
                        .enter()
                        .append("circle")
                        .attr("cx", 0)
                        .attr("cy", 0)
                        .attr("r", outerRadius+1)
                        .attr("stroke", function () {
                            return isComressed? "#aaa":"none";
                        })
                        .attr("stroke-width", "2px")
                        .attr("fill", "white")
                        .attr("class", "backgroundCircle");

                    container
                        .selectAll(".arcMinMax")
                        .data(myarc(rankInput, 0))
                        .enter()
                        .append("g")
                        .attr("class", "arcMinMax")
                        .append("path")
                        .attr("fill", "#34314C")
                        .attr("opacity", 1)
                        .attr("d", arc);

                    container
                        .selectAll(".arcWhite")
                        .data(myarc(rankInput, 1))
                        .enter()
                        .append("g")
                        .attr("class", "arcWhite")
                        .append("path")
                        .attr("fill", "white")
                        .attr("opacity", 1)
                        .attr("d", arc);

                    container
                        .selectAll(".arc")
                        .data(myarc(rankInput, 1))
                        .enter()
                        .append("g")
                        .attr("class", "arc")
                        .append("path")
                        .attr("fill", "#4FC180")
                        .attr("opacity", function (d, i) {
                            if(!isComressed)
                                return 0.7;
                            else
                            {
                                return  (rankInput["compressDist"][i]-distMin)/(distMax-distMin);
                            }
                        })
                        .attr("d", arc);

                    container
                        .selectAll(".glyphCircle")
                        .data(tmpData)
                        .enter()
                        .append("circle")
                        .attr("cx", 0)
                        .attr("cy", 0)
                        .attr("r", innerRadius-1)
                        .attr("fill", function (dd, i) {
                            return dd["devColor"];
                        })
                        .attr("class", "glyphCircle");

                    container.selectAll(".glyphCircle")
                        .transition()
                        .duration(1000)
                        .attr("fill", function (dd, i) {
                            return dd["devColor"];
                        });
                }
                else {
                    container.selectAll(".backgroundCircle")
                        .remove();
                    container.selectAll(".arc")
                        .remove();
                    container.selectAll(".glyphCircle")
                        .remove();
                    container.selectAll(".arcWhite")
                        .remove();
                    container.selectAll(".arcMinMax")
                        .remove();
                }

                function myarc(input, type) {
                    if(isComressed)
                    {
                        if(type == 0)
                        {
                            arcs0 = pie([1]);
                            arcs0[0].innerRadius = innerRadius;
                            arcs0[0].outerRadius = outerRadius;
                            arcs0[0].startAngle = angScale(input.min);
                            arcs0[0].endAngle = angScale(input.max);

                            if(arcs0[0].startAngle < 0)
                                arcs0[0].startAngle = 0;
                            if(arcs0[0].endAngle > Math.PI * 2)
                                arcs0[0].endAngle = Math.PI * 2;
                        }
                        else {
                            arcs0 = pie(input.compressDist);
                            var start = angScale(input.min);
                            var end = angScale(input.max);
                            var nowStart = start;
                            var step = (end - start) / input.compressDist.length;
                            for(var r = 0; r < input.compressDist.length; ++r)
                            {
                                arcs0[r].innerRadius = innerRadius;
                                arcs0[r].outerRadius = outerRadius;

                                arcs0[r].startAngle = nowStart;
                                arcs0[r].endAngle = nowStart + step;

                                nowStart += step;

                                if(arcs0[r].startAngle < 0)
                                    arcs0[r].startAngle = 0;
                                if(arcs0[r].endAngle > Math.PI * 2)
                                    arcs0[r].endAngle = Math.PI * 2;
                            }
                        }

                        return arcs0;
                    }
                    else
                    {
                        var arcs0 = pie([]);
                        if(type == 0)
                        {
                            arcs0 = pie([1]);
                            arcs0[0].innerRadius = innerRadius;
                            arcs0[0].outerRadius = outerRadius;
                            arcs0[0].startAngle = angScale(input.min);
                            arcs0[0].endAngle = angScale(input.max);

                            if(arcs0[0].startAngle < 0)
                                arcs0[0].startAngle = 0;
                            if(arcs0[0].endAngle > Math.PI * 2)
                                arcs0[0].endAngle = Math.PI * 2;
                        }
                        else if(type == 1)
                        {
                            arcs0 = pie(input.data);
                            for(var r = 0; r < input.data.length; ++r)
                            {
                                arcs0[r].innerRadius = innerRadius;
                                arcs0[r].outerRadius = outerRadius;

                                arcs0[r].startAngle = angScale(input.data[r]) - 0.1;
                                arcs0[r].endAngle = angScale(input.data[r]) + 0.1;

                                if(arcs0[r].startAngle < 0)
                                    arcs0[r].startAngle = 0;
                                if(arcs0[r].endAngle > Math.PI * 2)
                                    arcs0[r].endAngle = Math.PI * 2;
                            }
                        }
                        return arcs0;
                    }

                }
            });
        };
        var clickTickCircle = function (params, g, svg, d) {

        }
        var getExpandYears = function (params) {
            var e = params.expandFlag;
            var res = [];
            e.forEach(function (d) {
                if(d.expand)
                    res.push(d.time);
            });
            return res;
        };
        var deepCopy= function(source) {
            var result=(source instanceof Array)?[]:{};
            for (var key in source) {
                result[key] = typeof source[key]==='object'? deepCopy(source[key]): source[key];
            }
            return result;
        };

        return {
            init:init,
            bindDrag: bindDrag,
            addRank:addRank,
            render:render,
            scaleOnX: scaleOnX,
            getflowHeights: getflowHeights,
            clickTickCircle : clickTickCircle
        }
    }]);
}());

//for tip..
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module with d3 as a dependency.
        define(['d3'], factory)
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = function(d3) {
            d3.tip = factory(d3)
            return d3.tip
        }
    } else {
        // Browser global.
        root.d3.tip = factory(root.d3)
    }
}(this, function (d3) {

    // Public - contructs a new tooltip
    //
    // Returns a tip
    return function() {
        var direction = d3_tip_direction,
            offset    = d3_tip_offset,
            html      = d3_tip_html,
            node      = initNode(),
            svg       = null,
            point     = null,
            target    = null

        function tip(vis) {
            svg = getSVGNode(vis)
            point = svg.createSVGPoint()
            document.body.appendChild(node)
        }

        // Public - show the tooltip on the screen
        //
        // Returns a tip
        tip.show = function() {
            var args = Array.prototype.slice.call(arguments)
            if(args[args.length - 1] instanceof SVGElement) target = args.pop()

            var content = html.apply(this, args),
                poffset = offset.apply(this, args),
                dir     = direction.apply(this, args),
                nodel   = getNodeEl(),
                i       = directions.length,
                coords,
                scrollTop  = document.documentElement.scrollTop || document.body.scrollTop,
                scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft

            nodel.html(content)
                .style({ opacity: 1, 'pointer-events': 'all' })

            while(i--) nodel.classed(directions[i], false)
            coords = direction_callbacks.get(dir).apply(this)
            nodel.classed(dir, true).style({
                top: (coords.top +  poffset[0]) + scrollTop + 'px',
                left: (coords.left + poffset[1]) + scrollLeft + 'px'
            })

            return tip
        }

        // Public - hide the tooltip
        //
        // Returns a tip
        tip.hide = function() {
            var nodel = getNodeEl()
            nodel.style({ opacity: 0, 'pointer-events': 'none' })
            return tip
        }

        // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
        //
        // n - name of the attribute
        // v - value of the attribute
        //
        // Returns tip or attribute value
        tip.attr = function(n, v) {
            if (arguments.length < 2 && typeof n === 'string') {
                return getNodeEl().attr(n)
            } else {
                var args =  Array.prototype.slice.call(arguments)
                d3.selection.prototype.attr.apply(getNodeEl(), args)
            }

            return tip
        }

        // Public: Proxy style calls to the d3 tip container.  Sets or gets a style value.
        //
        // n - name of the property
        // v - value of the property
        //
        // Returns tip or style property value
        tip.style = function(n, v) {
            if (arguments.length < 2 && typeof n === 'string') {
                return getNodeEl().style(n)
            } else {
                var args =  Array.prototype.slice.call(arguments)
                d3.selection.prototype.style.apply(getNodeEl(), args)
            }

            return tip
        }

        // Public: Set or get the direction of the tooltip
        //
        // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
        //     sw(southwest), ne(northeast) or se(southeast)
        //
        // Returns tip or direction
        tip.direction = function(v) {
            if (!arguments.length) return direction
            direction = v == null ? v : d3.functor(v)

            return tip
        }

        // Public: Sets or gets the offset of the tip
        //
        // v - Array of [x, y] offset
        //
        // Returns offset or
        tip.offset = function(v) {
            if (!arguments.length) return offset
            offset = v == null ? v : d3.functor(v)

            return tip
        }

        // Public: sets or gets the html value of the tooltip
        //
        // v - String value of the tip
        //
        // Returns html value or tip
        tip.html = function(v) {
            if (!arguments.length) return html
            html = v == null ? v : d3.functor(v)

            return tip
        }

        // Public: destroys the tooltip and removes it from the DOM
        //
        // Returns a tip
        tip.destroy = function() {
            if(node) {
                getNodeEl().remove();
                node = null;
            }
            return tip;
        }

        function d3_tip_direction() { return 'n' }
        function d3_tip_offset() { return [0, 0] }
        function d3_tip_html() { return ' ' }

        var direction_callbacks = d3.map({
                n:  direction_n,
                s:  direction_s,
                e:  direction_e,
                w:  direction_w,
                nw: direction_nw,
                ne: direction_ne,
                sw: direction_sw,
                se: direction_se
            }),

            directions = direction_callbacks.keys()

        function direction_n() {
            var bbox = getScreenBBox()
            return {
                top:  bbox.n.y - node.offsetHeight,
                left: bbox.n.x - node.offsetWidth / 2
            }
        }

        function direction_s() {
            var bbox = getScreenBBox()
            return {
                top:  bbox.s.y,
                left: bbox.s.x - node.offsetWidth / 2
            }
        }

        function direction_e() {
            var bbox = getScreenBBox()
            return {
                top:  bbox.e.y - node.offsetHeight / 2,
                left: bbox.e.x
            }
        }

        function direction_w() {
            var bbox = getScreenBBox()
            return {
                top:  bbox.w.y - node.offsetHeight / 2,
                left: bbox.w.x - node.offsetWidth
            }
        }

        function direction_nw() {
            var bbox = getScreenBBox()
            return {
                top:  bbox.nw.y - node.offsetHeight,
                left: bbox.nw.x - node.offsetWidth
            }
        }

        function direction_ne() {
            var bbox = getScreenBBox()
            return {
                top:  bbox.ne.y - node.offsetHeight,
                left: bbox.ne.x
            }
        }

        function direction_sw() {
            var bbox = getScreenBBox()
            return {
                top:  bbox.sw.y,
                left: bbox.sw.x - node.offsetWidth
            }
        }

        function direction_se() {
            var bbox = getScreenBBox()
            return {
                top:  bbox.se.y,
                left: bbox.e.x
            }
        }

        function initNode() {
            var node = d3.select(document.createElement('div'))
            node.style({
                position: 'absolute',
                top: 0,
                opacity: 0,
                'pointer-events': 'none',
                'box-sizing': 'border-box'
            })

            return node.node()
        }

        function getSVGNode(el) {
            el = el.node()
            if(el.tagName.toLowerCase() === 'svg')
                return el

            return el.ownerSVGElement
        }

        function getNodeEl() {
            if(node === null) {
                node = initNode();
                // re-add node to DOM
                document.body.appendChild(node);
            };
            return d3.select(node);
        }

        // Private - gets the screen coordinates of a shape
        //
        // Given a shape on the screen, will return an SVGPoint for the directions
        // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
        // sw(southwest).
        //
        //    +-+-+
        //    |   |
        //    +   +
        //    |   |
        //    +-+-+
        //
        // Returns an Object {n, s, e, w, nw, sw, ne, se}
        function getScreenBBox() {
            var targetel   = target || d3.event.target;

            while ('undefined' === typeof targetel.getScreenCTM && 'undefined' === targetel.parentNode) {
                targetel = targetel.parentNode;
            }

            var bbox       = {},
                matrix     = targetel.getScreenCTM(),
                tbbox      = targetel.getBBox(),
                width      = tbbox.width,
                height     = tbbox.height,
                x          = tbbox.x,
                y          = tbbox.y

            point.x = x
            point.y = y
            bbox.nw = point.matrixTransform(matrix)
            point.x += width
            bbox.ne = point.matrixTransform(matrix)
            point.y += height
            bbox.se = point.matrixTransform(matrix)
            point.x -= width
            bbox.sw = point.matrixTransform(matrix)
            point.y -= height / 2
            bbox.w  = point.matrixTransform(matrix)
            point.x += width
            bbox.e = point.matrixTransform(matrix)
            point.x -= width / 2
            point.y -= height / 2
            bbox.n = point.matrixTransform(matrix)
            point.y += height
            bbox.s = point.matrixTransform(matrix)

            return bbox
        }

        return tip
    };

}));