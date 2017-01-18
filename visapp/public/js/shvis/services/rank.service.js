/**
 * Created by xyx on 2016/3/6.
 * PC group, compress, flow bug!!, timeAxis,
 * glyph white, rect don't move, PC bug, PC->10,,add flow group, encompass,information tip,
 * expand rect.. PC right limit
 */
(function() {
    var cluster = angular.module('shvis.rank.service', []);
    cluster.factory('RankService', ['LoadService', 'PipService', 'Heatmap', function(loadServ, pipServ, heat) {
        var config = window.config.rank;
        var margin = config.margin;
        var init = function(dom, width, height, params) {
            //svg for global time axis
            var svg = d3.select(dom)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("id", "rankView")
                .style("position", "absolute");

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

            //init the canvas
            var canvas = document.getElementById('heatmap');
            canvas.width = width;
            canvas.height = height;
            var gl = canvas.getContext('experimental-webgl', {antialias:true});
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            var shader = heat.init(gl, params);
            params.shader = shader;
            return {
                svg: svg,
                gl: gl
            }
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
                scaled: {},
                originMean: {},
                scaledMean: {}
            }
            data.forEach(function(d) {
                var nodes = d.nodes;
                var origin = params.count.origin;
                var scaled = params.count.scaled;
                var originMean = params.count.originMean;
                var scaledMean = params.count.scaledMean;
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
                        data[j].scaled = data[j].mean / ranges[time] * maxRank;
                        var meanValue = Math.floor(data[j].mean);
                        var scaledMeanValue = Math.floor(data[j].mean / ranges[time] * maxRank);
                        if (originMean[time] == undefined) {
                            originMean[time] = {};
                        }
                        if (originMean[time][meanValue] == undefined) {
                            originMean[time][meanValue] = {
                                objects: [],
                                count: 0
                            }
                        }
                        originMean[time][meanValue].count += 1;
                        originMean[time][meanValue].objects.push(nodes[i].name);

                        if (scaledMean[time] == undefined) {
                            scaledMean[time] = {};
                        }
                        if (scaledMean[time][scaledMeanValue] == undefined) {
                            scaledMean[time][scaledMeanValue] = {
                                objects: [],
                                count: 0
                            }
                        }
                        scaledMean[time][scaledMeanValue].count += 1;
                        scaledMean[time][scaledMeanValue].objects.push(nodes[i].name);

                    }
                }
            });
        };

        var brushHit = function(params) {
            var bandHeight = params.unitHeight + 2;
            var brushRange = params.brushRange;
            //validation of the brushRange
            Object.keys(brushRange).forEach(function(key) {
                if (params.histoData.origin[key] == undefined) {
                    delete brushedData[key];
                }
            });
            params.brushedData = undefined;
            Object.keys(brushRange).forEach(function(key) {
                    var brushPos = brushRange[key];
                    var histoData;
                    if (params.mode == 'origin') {
                        histoData = Object.values(params.histoData.originMean[key]);
                    } else {
                        histoData = Object.values(params.histoData.scaledMean[key]);
                    }
                    // histoData = Object.values(params.histoData.mean[key]);
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
                    if (params.brushedData == undefined || params.brushedData.length == 0) {
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
                })
                //check hit
                // var histoData = Object.values(d.data);
                // var hitNames = [];
            console.log(params.brushedData);

        };

        var process = function(d, params) {
            if (d != null && d.hasOwnProperty('nodes'))
                d.nodes.forEach(function(d) {
                    d.data.sort(function(a, b) {
                        return a.time - b.time;
                    });
                })
            processHisto(params.data, params);
            processSankey();
            processNodes();
        };

        var processHisto = function(d, params) {
            histoCount(d, params);
            params.histoData = merge(params.count, params.ranges, params.interval);
            brushHit(params);
        };

        var processSankey = function() {

        };

        var processNodes = function() {

        };

        var layout = function(params) {
            layoutHisto(params.histoData, params);

        };

        var layoutHisto = function(histoData, params) {
            var height = params.height;
            var width = params.width;
            var timeCount = Object.keys(histoData.origin).length;
            var margin = window.config.rank.margin;
            params.unitWidth = (width - margin[0] - margin[1]) / timeCount;
            params.rx = params.unitWidth * (timeCount - 1) / width * 2 - 1;
            var bar = Object.values(params.histoData.scaled)[0];
            if (bar != undefined) {
                var maxBarCount = Object.keys(Object.values(params.histoData.scaled)[0]).length;
                params.unitHeight = Math.floor((height - margin[2] - margin[3] - 50) / maxBarCount);
            } else {
                params.unitHeight = 0;
            }
            params.ryt = 1 - 50 / height * 2;
            params.ryb = 1 - ((params.unitHeight + 2) * maxBarCount + 50) * 2 / height;
            params.histoHeight = (params.unitHeight + 2) * maxBarCount - 2;
        };

        var layoutSankey = function(dataS, params) {
            var data = {},
                width = params.unitWidth,
                height = params.unitHeight + 2;
            for (time in dataS) {
                data[time] = {}
                for (section in dataS[time]) {
                    data[time][section] = []
                    var o = {}
                    dataS[time][section].forEach(function(d) {
                        if (!o.hasOwnProperty(d.y)) {
                            o[d.y] = {
                                x: 0,
                                link: d.link,
                                r: d.r,
                                id: [d.id]
                            }
                        } else {
                            o[d.y].x++
                                o[d.y].id.push(d.id)
                        }
                    })
                    var f = {}
                    Object.keys(o).forEach(function(d) {
                        var y = parseInt(d),
                            x = o[d].x,
                            link = o[d].link,
                            r = o[d].r,
                            id = o[d].id;
                        f[y] = []
                        var l = Object.keys(dataS).indexOf(time) + 1;
                        var next_time = undefined;
                        if (l < Object.keys(dataS).length) {
                            next_time = Object.keys(dataS)[l];
                            var ny = dataS[next_time][link].forEach(function(d, index) {
                                // if (id.indexOf(d.id) >= 0 && f[y].indexOf(d.y) < 0) {
                                if(id.indexOf(d.id) >= 0) {
                                    f[y].push(d.y)
                                    data[time][section].push({
                                        y: y,
                                        x: x,
                                        // lux:0,
                                        // ldx:0,
                                        // lux:22*section,
                                        // ldy:22*section+5,
                                        r: r,
                                        lux: r + x * r * 2, //
                                        ldx: r + x * r * 2,
                                        luy: height * section + y * r * 2, //
                                        ldy: height * section + y * r * 2 + 2 * d.r,
                                        rux: r + width, //不知道为啥多加r
                                        rdx: r + width, //
                                        ruy: height * link + d.y * r * 2, //
                                        rdy: height * link + d.y * r * 2 + 2 * d.r, //
                                    })
                                }
                            })
                        }
                    })
                }
            }
            params.sankeytoData = data;
        };

        var layoutNodes = function(d, params) {
            var obj = {},
                index, i, x = 0,
                y = 0,
                max = 0,
                min = 10000,
                height = params.unitHeight + 2;
            Object.keys(params.ranges).forEach(function(time) {
                var sec = {},
                    y = 0;
                for (index = 0; index < d.length; index++) {
                    for (i = 0; i < d[index].data.length; i++) {
                        if (d[index].data[i].time == time) {
                            data = d[index].data[i];
                            break;
                        }
                    }
                    if (i == d[index].data.length) continue;
                    nodes = d[index];
                    var now_sec = Math.floor(data.scaled / 50);
                    //  now_sec=Object.keys(params.histoData.scaled[time]).length-now_sec
                    var next_sec = i < nodes.data.length - 1 ? Math.floor(nodes.data[i + 1].scaled / 50) : -1;
                    var last_sec = i != 0 ? Math.floor(nodes.data[i - 1].scaled / 50) : -1;
                    // if(next_sec!=undefined)
                    // next_sec=Object.keys(params.histoData.scaled[time]).length-next_sec

                    //  属于第几个区间
                    // var section=Object.keys(params.histoData.scaled[time]).indexOf((Math.floor(data.scaled/50)*50).toString())
                    if (!sec.hasOwnProperty(now_sec))
                        sec[now_sec] = {}
                    if (!sec[now_sec].hasOwnProperty(next_sec)) {
                        sec[now_sec][next_sec] = {};
                        sec[now_sec][next_sec].x = 0;
                        sec[now_sec][next_sec].y = Object.keys(sec[now_sec]).length - 1;
                    } else {
                        sec[now_sec][next_sec].x++;
                    }
                    var r = 2,
                        ds = 0;
                    data.ranks.forEach(function(d) {
                        ds += (d - data.mean) * (d - data.mean)
                    })
                    ds = (Math.sqrt(ds));
                    if (ds > max) max = ds
                    if (ds < min) min = ds
                    var o = {
                        id: nodes._id,
                        name: nodes.name,
                        mean: data.mean,
                        scaled: data.scaled,
                        ranks: [],
                        r: r,
                        x: sec[now_sec][next_sec].x,
                        y: sec[now_sec][next_sec].y,
                        section: now_sec,
                        time: time,
                        cx: r + sec[now_sec][next_sec].x * r * 2,
                        cy: height * now_sec + r + sec[now_sec][next_sec].y * r * 2,
                        link: next_sec,
                        lastlink: last_sec,
                        ds: ds,
                    }
                    data.ranks.forEach(function(d) {
                        o.ranks.push(d)
                    })
                    if (o != undefined) {
                        if (obj[time] == undefined) {
                            obj[time] = {};
                        }
                        if (!obj[time].hasOwnProperty(o.section)) {
                            obj[time][o.section] = {}
                        }
                        if (!obj[time][o.section].hasOwnProperty(sec[now_sec][next_sec].y))
                            obj[time][o.section][sec[now_sec][next_sec].y] = []
                        obj[time][o.section][sec[now_sec][next_sec].y].push(o)
                    }
                }
                if (obj[time] != undefined)
                    Object.keys(obj[time]).forEach(function(section) {
                        var key = Object.keys(obj[time][section]);
                        for (var i0 = 0; i0 < key.length - 1; i0++) {
                            for (var j0 = i0 + 1; j0 < key.length; j0++) {
                                var ik = key[i0],
                                    jk = key[j0];
                                if (obj[time][section][ik][0].link > obj[time][section][jk][0].link) {
                                    var cha = j0 - i0;
                                    obj[time][section][ik].forEach(function(d) {
                                        d.y += cha
                                        d.cy += d.r * 2 * cha
                                    })
                                    obj[time][section][jk].forEach(function(d) {
                                        d.y -= cha
                                        d.cy -= d.r * 2 * cha
                                    })
                                    var t = obj[time][section][ik]
                                    obj[time][section][ik] = obj[time][section][jk]
                                    obj[time][section][jk] = t
                                }
                            }
                        }
                    })
            })
            var oo = {}
            Object.keys(obj).forEach(function(time) {
                oo[time] = {}
                Object.keys(obj[time]).forEach(function(section) {
                    oo[time][section] = []
                    Object.values(obj[time][section]).forEach(function(sec) {
                        // if(sec!=undefined)
                        sec.forEach(function(d) {
                            oo[time][section].push(d)
                        })
                    })
                })
            })
            params.nodetoData = oo;
            params.nodeScale = {}

            d3.interpolate(d3.rgb(254, 241, 221), d3.rgb(135, 0, 0));
            params.nodeScale.line = d3.scaleLinear().domain([min, max]).range([0, 1]);
            params.nodeScale.color = d3.interpolate(d3.rgb(254, 241, 221), d3.rgb(135, 0, 0));

        };

        var merge = function(count, ranges, interval) {
            var times = Object.keys(count.origin);
            var res = {
                origin: {},
                scaled: {},
                originMean: {},
                scaledMean: {}
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
                if (res.originMean[time] == undefined) {
                    res.originMean[time] = {};
                }
                for (var j = 0; j < maxRank; j += interval) {
                    if (res.originMean[time][j] == undefined) {
                        res.originMean[time][j] = {
                            count: 0,
                            objects: []
                        };
                    }
                    for (var k = j; k < j + interval; k++) {
                        var c = count.originMean[time][k];
                        if (c != undefined) {
                            res.originMean[time][j].count += c.count;
                            c.objects.forEach(function(d) {
                                if (res.originMean[time][j].objects.indexOf(d) < 0) {
                                    res.originMean[time][j].objects.push(d);
                                }
                            });
                        }
                    }
                }
                if (res.scaledMean[time] == undefined) {
                    res.scaledMean[time] = {};
                }
                for (var j = 0; j < maxRank; j += interval) {
                    if (res.scaledMean[time][j] == undefined) {
                        res.scaledMean[time][j] = {
                            count: 0,
                            objects: []
                        };
                    }
                    for (var k = j; k < j + interval; k++) {
                        var c = count.scaledMean[time][k];
                        if (c != undefined) {
                            res.scaledMean[time][j].count += c.count;
                            c.objects.forEach(function(d) {
                                if (res.scaledMean[time][j].objects.indexOf(d) < 0) {
                                    res.scaledMean[time][j].objects.push(d);
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
            renderSankey(svg, params);
            renderNodes(svg, params);
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
            if (params.sankeytoData == undefined) return;
            var dataS = params.sankeytoData;
            var times = Object.keys(dataS);
            var heatData = {};
            for(var i = 0; i < times.length - 1; i++) {
                var t = times[i];
                if(heatData[t] == undefined) {
                    heatData[t] = [];
                }
                var values = Object.values(dataS[t]);
                for(var j = 0; j < values.length; j++) {
                    for(var k = 0; k < values[j].length; k++) {
                        heatData[t].push({
                            y0: 1 - values[j][k].luy / params.histoHeight,
                            y1: 1 - values[j][k].ruy / params.histoHeight
                        })
                    }
                }
            }
            heat.render(heatData, params.gl, params);



            
            svg.selectAll('.santogram').remove();
            for (var i = 0, l = Object.keys(params.histoData.scaled).length; i < l; i++) {
                var time = Object.keys(params.histoData.scaled)[i]
                if (Object.keys(dataS).indexOf(time) >= 0)
                    svg.append('g')
                    .attr('class', 'santogram')
                    // .transition().duration(500)
                    .attr('transform', 'translate(' + i * params.unitWidth + ',' + 50 + ')')
            };
            var san = svg.selectAll('.santogram')
                .each(function(d, index) {
                    var g = d3.select(this)
                    var data = []
                    if (dataS[Object.keys(dataS)[index]] != undefined) {
                        Object.values(dataS[Object.keys(dataS)[index]]).forEach(function(section) {
                            section.forEach(function(d) {
                                data.push(d);
                            })
                        })
                    }
                    // var diagonal=d3.svg.diagonal()
                    // .source(function(d) { return {"x":d.source.y, "y":d.source.x}; })
                    // .target(function(d) { return {"x":d.target.y, "y":d.target.x}; })
                    // .projection(function(d) { return [d.y, d.x]; });


                    // var path = g.selectAll('.sanktopath')
                    //     .data(data).enter()
                    //     .append('path')
                    //     .attr('class', 'sanktopath')
                    //     .attr('d', function(d) {
                    //         if (d.ruy < 0 || d.rux < 0 || d.lux < 0 || d.luy < 0) return
                    //         var z = (d.rux - d.lux) / 2
                    //         return "M" + d.lux + "," + (d.luy + d.r) + "C" + (d.lux + z) + "," + (d.luy + d.r) + " " + (d.rux - z) + "," + (d.ruy + d.r) + " " + (d.rux) + "," + (d.ruy + d.r)
                    //             // + "A" +d.r+" "+d.r+", 0, 0, 0, "+ d.rdx+" "+d.rdy
                    //             // + "C" + (d.rdx - z) + "," + (d.rdy)
                    //             // + " " + (d.ldx + z) + "," + (d.ldy)
                    //             // + " " + d.ldx +　"," + d.ldy
                    //             // + "A" +d.r+" "+d.r+", 0, 0, 0, "+ d.lux+" "+d.luy
                    //         ;
                    //     })
                    //     .style('stroke-width', function(d) {
                    //         return d.r * 2
                    //     })
                });

        };

        var renderNodes = function(svg, params) {
            if (params.nodetoData == undefined) return
            var color = params.nodeScale.color
            var line = params.nodeScale.line
            var dataS = params.nodetoData;
            svg.selectAll('.nodetogram').remove();
            for (var i = 0, l = Object.keys(params.histoData.scaled).length; i < l; i++) {
                var time = Object.keys(params.histoData.scaled)[i]
                if (Object.keys(dataS).indexOf(time) >= 0)
                    svg.append('g')
                    .attr('class', 'nodetogram')
                    // .transition().duration(500)
                    .attr('transform', 'translate(' + i * params.unitWidth + ',' + 50 + ')')
            };
            var node = svg.selectAll('.nodetogram')
                .each(function(d, index) {
                    var g = d3.select(this)
                    var data = []
                    if (dataS[Object.keys(dataS)[index]] != undefined) {
                        Object.values(dataS[Object.keys(dataS)[index]]).forEach(function(section) {
                            section.forEach(function(d) {
                                data.push(d);
                            })
                        })
                        var circle = g.selectAll('.nodetoCir')
                            .data(data).enter()
                            .append('circle')
                            .attr('class', 'nodetoCir')
                            .attr('r', function(d) {
                                return d.r
                            })
                            .attr('cx', function(d) {
                                return d.cx
                            })
                            .attr('cy', function(d) {
                                return d.cy
                            })
                            .attr('fill', function(d) {
                                return color(line(d.ds))
                            })
                            // .attr('fill','#FFCD00')
                            .attr('opacity', 1)
                            .attr('name', function(d) {
                                return d.name
                            })
                            .attr('ds', function(d) {
                                return d.ds
                            })
                            .attr('mean', function(d) {
                                return d.mean
                            })
                            .attr('scaled', function(d) {
                                return d.scaled
                            })
                    }
                })
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
                    .attr('fill', '#ace4ff')
                    .attr('opacity', 1);
                var brushed = function() {
                    if (!d3.event.sourceEvent) return; // Only transition after input.
                    if (!d3.event.selection) return; // Ignore empty selections.
                    var bandHeight = params.unitHeight + 2;
                    var brushPos = d3.event.selection.map(function(d) {
                        return Math.round(d / bandHeight) * bandHeight;
                    });
                    params.brushRange[d.time] = brushPos;

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
                        if (params.brushedData == undefined || params.brushedData.length == 0) {
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
                        process(null, params);
                        layoutNodes(params.brushedData, params);
                        layoutSankey(params.nodetoData, params);
                        render(params.svg, params);
                    }, 500);

                };
                var brush = d3.brushY()
                    .extent([
                        [0, 0],
                        [params.unitWidth / 2, (params.unitHeight + 2) * data.length]
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
                    if (nodes.indexOf(d.name) < 0) {
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