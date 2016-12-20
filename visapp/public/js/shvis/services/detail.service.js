/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';

/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    var cluster = angular.module('shvis.detail.service', []);
    cluster.factory('DetailService', ['LoadService', 'RankService','PipService', function(loadServ, rankServ, pipServ) {
        var d3 = window.d3;
        var config = window.config.detail;
        var amplifyFactor = config.amplifyFactor;
        var amplifyFactorMini = config.amplifyFactorMini;
        var pushFactor = config.pushFactor;
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) {
                return '<span>' + d.id + '</span>'})
            .offset([-12, 0]);
        var tipCenterNode = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) {
                return '<span>' + d.center.id + '</span>'})
            .offset([-12, 0]);
        var init = function(dom, width, height, params) {
            var svg =  d3.select(dom)
                .select("#detail-svg")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
            var drag = d3.drag()
                .on("start", function() {
                    my = undefined;
                })
                .on("drag", function() {
                    if(my === undefined) {
                        my = d3.event.y;
                    }
                    //params.tranX -= (d3.event.x - mx);
                    var tBox = d3.transform(svg.select("#canvas").attr("transform")),
                        xPos = tBox.translate[0],
                        yPos = tBox.translate[1];

                    svg.select("#canvas")
                        .attr("transform", "translate(" + xPos + "," + (yPos+(d3.event.y - my)) + ")");

                    params.tranY += (d3.event.y - my);
                    my = d3.event.y;
                })
                .on("end", function() {

                })
            svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "#fff")
                .attr("id", "dragBox")
                .call(drag);
            svg.append("g")
                .attr("id", "canvas")
                .attr("transform", "translate(45,"+config.initailHeight+")");
            var mx, my;

            return svg;

        };
        var preprocess = function(params) {
            params.data = [];
            var rawData = params.rawData;
            var allAttr = [];
            rawData.forEach(function(data) {
                var ranks = data.ranks,
                    details = data.detail,
                    communities = data.community;
                var center = ranks.name;
                var meanRanks = ranks.data.map(function(d) {
                    return d["mean"];
                });
                var visual = ranks.data.map(function(rankItem) {
                    var rankDist = rankItem.ranks;
                    var mean = rankItem.mean;
                    var time = rankItem.time;
                    var detail = details[time];
                    var cids = detail["cids"];
                    var nodes = detail["nodes"].filter(function(d) {
                        var res = true;
                        if(d.id === center) {
                            res = false;
                        }
                        return res;
                    });
                    var centerNode = detail["nodes"].filter(function(d) {
                        var res = false;
                        if(d.id === center) {
                            res = true;
                        }
                        return res;
                    })[0];
                    var com = {};
                    for(var i = 0; i < cids.length; i++) {
                        var cid = cids[i];
                        var attr = communities[time].filter(function(d) {
                            var res = false;
                            if(d["cid"] === cid) {
                                res = true;
                            }
                            return res;
                        })[0];
                        allAttr.push(attr);
                        com[cids[i]] = {
                            "attribute": attr,
                            "nodes":[]
                        };
                    }
                    for(var i = 0; i < nodes.length; i++) {
                        com[nodes[i]["cid"]]["nodes"].push(nodes[i]);
                        nodes[i]["value"] = 50;
                    }
                    com = cids.map(function(cid) {
                        com[cid]["cid"] = cid;
                        return com[cid];
                    });
                    var links = detail["links"].filter(function(d) {
                        var sourceID = d.source,
                            targetID = d.target;
                        var res =true;
                        if(detail["nodes"][sourceID].id === center || detail["nodes"][targetID].id === center) {
                            res = false;
                        }
                        return res;
                    }).map(function(d) {
                        var sourceID = d.source,
                            targetID = d.target;
                        return {
                            source:detail["nodes"][sourceID],
                            target:detail["nodes"][targetID]
                        }
                    });
                    return {
                        "com":com,
                        "time":time,
                        "links":links,
                        "mean":mean,
                        "center":centerNode
                    }
                });
                params.data.push(
                    {
                        visual:visual,
                        rankRange:[d3.min(meanRanks),d3.max(meanRanks)]
                    }
                )
            });
            var attrByKey = {};
            allAttr.forEach(function(d) {
                for(var key in d) {
                    if(attrByKey[key] === undefined) {
                        attrByKey[key] = [];
                    }
                    attrByKey[key].push(d[key]);
                }
            });
            var range = {};
            Object.keys(attrByKey).forEach(function(key) {
                range[key] = [d3.min(attrByKey[key]), d3.max(attrByKey[key])];
            });
            params["attrRange"] = range;
            //community attributes scale

        };
        var attrScale = function(ranges, r1, r2) {
            var res = {};
            for(var key in ranges) {
                res[key] = d3.scale.linear().domain(ranges[key]).range([r1, r2]);
            }
            return function(attr) {
                return res[attr];
            }
        };
        var layout = function(params) {
            var config = window.config.detail;
            var opacityScale = d3.scale.linear().domain(params["attrRange"]["nodes"]).range([0.2, 1]);
            params.data.forEach(function(data) {
                var visual = data["visual"];
                var scaleX = rankServ.scaleOnX(params, 0);
                var yMin = 50, yMax = params.data.length == 1? config.height-50:config.groupHeight - 50;
                var scaleY = d3.scale.linear().domain(data["rankRange"]).range([yMin, yMax]);
                var diameter = 15;
                var radius = config.radius;//70;
                var bubble = d3.layout.pack()
                    .sort(null)
                    .size([diameter * 2, diameter * 2])
                    .padding(1.5);
                for(var i = 0; i < visual.length; i++) {
                    var dataItem = visual[i];
                    var time = dataItem["time"];
                    var expand = getExpandFlag(time, params);
                    var starScale = attrScale(params["attrRange"], config.innerRadius*(expand? amplifyFactor:1), config.outerRadius*(expand? amplifyFactorMini:1));
                    dataItem["x"] = scaleX(time);
                    dataItem["y"] = scaleY(dataItem["mean"]);
                    dataItem["center"]["x"] = 0;
                    dataItem["center"]["y"] = 0;
                    dataItem["center"]["lx"] = 0;
                    dataItem["center"]["ly"] = 0;
                    var com = dataItem["com"];
                    var unitAngle = Math.PI * 2 / com.length;
                    for(var j = 0; j < com.length; j++) {
                        com[j]["x"] = radius * Math.cos(Math.PI / 2 + unitAngle * j);
                        com[j]["y"] = radius * Math.sin(Math.PI / 2 + unitAngle * j);
                        var attr = com[j]["attribute"];
                        var starGlyph = {};
                        for(var key in attr) {
//                            if(key === "cid" || key === "connected_components" || key === "estrada_index" ||
//                                key === "transitivity" || key === "nodes") {
                            if(config.filterAttr.indexOf(key) >= 0) {
                                continue;
                            }
                            var r = starScale(key)(attr[key]);
//                            console.log(r);
                            starGlyph[key] = r;
                        }
                        com[j]["glyph"] = starGlyph;
                        com[j]["opacity"] = opacityScale(com[j]["attribute"]["nodes"]);
                        bubble.nodes({
                            children:com[j]["nodes"]
                        }).forEach(function(d) {
                            d.x = d.x - diameter;
                            d.y = d.y - diameter;
                            d.lx = com[j]["x"] + d.x;
                            d.ly = com[j]["y"] + d.y;
                        });
                    }
                }
            })

        };
        var timeline = function(data) {
            var res = [];
            var nodes = data.visual;
            nodes.forEach(function (d, i) {
                if(i != nodes.length-1)
                    res.push({source:{x: d.x, y: d.y}, target:{x: nodes[i+1].x, y: nodes[i+1].y}});
            });
            return res;
        };
        var renderFrame = function(gg, params) {
            gg.call(tipCenterNode);
            gg.each(function(d, i) {
                var expand = getExpandFlag(d.time, params);
                var g = d3.select(this);
                var comsAttr = g.selectAll(".comGroupAttr")
                    .data(d["com"]);
                comsAttr.enter()
                    .append("g")
                    .attr("class", "comGroupAttr")
                    .attr("transform", function(com) {
                        if(expand)
                            return "translate(" + (com.x*amplifyFactor) + "," + (com.y*amplifyFactor) + ")";
                        else
                            return "translate(" + (com.x) + "," + (com.y) + ")";
                    })
                    .call(renderComAttribute, params, expand);


                comsAttr
                    .transition()
                    .duration(1000)
                    .attr("transform", function(com) {
                    if(expand)
                        return "translate(" + (com.x*amplifyFactor) + "," + (com.y*amplifyFactor) + ")";
                    else
                        return "translate(" + (com.x) + "," + (com.y) + ")";
                    })
                    .call(renderComAttribute, params, expand);
                var links = g.selectAll(".comLinks")
                    .data(d["links"], function(d) {
                        return d.source.id + "," + d.target.id;
                    });
                links.enter()
                    .append("line")
                    .attr("class", "comLinks")
                    .attr("x1", function(d) {
                        if(expand)
                            return d.source.lx*amplifyFactor;
                        else
                            return d.source.lx;
                    })
                    .attr("y1", function(d) {
                        if(expand)
                            return d.source.ly*amplifyFactor;
                        else
                            return d.source.ly;
                    })
                    .attr("x2", function(d) {
                        if(expand)
                            return d.target.lx*amplifyFactor;
                        else
                            return d.target.lx;
                    })
                    .attr("y2", function(d) {
                        if(expand)
                            return d.target.ly*amplifyFactor;
                        else
                            return d.target.ly;
                    })
                    .attr("stroke", function(d) {
                        return "#aaa"
                    })
                    .attr("stroke-width", 0.5);
                g.selectAll(".comLinks").transition()
                    .duration(1000)
                    .attr("x1", function(d) {
                        if(expand)
                            return d.source.lx*amplifyFactor;
                        else
                            return d.source.lx;
                    })
                    .attr("y1", function(d) {
                        if(expand)
                            return d.source.ly*amplifyFactor;
                        else
                            return d.source.ly;
                    })
                    .attr("x2", function(d) {
                        if(expand)
                            return d.target.lx*amplifyFactor;
                        else
                            return d.target.lx;
                    })
                    .attr("y2", function(d) {
                        if(expand)
                            return d.target.ly*amplifyFactor;
                        else
                            return d.target.ly;
                    });

                links.exit()
                    .remove();
                var comsNodes = g.selectAll(".comGroupNodes")
                    .data(d["com"], function(d) {
                        return d.time + "," + d.cid;
                    });
                comsNodes.enter()
                    .append("g")
                    .attr("transform", function(com) {
                        if(expand)
                            return "translate(" + (com.x*amplifyFactor) + "," + (com.y*amplifyFactor) + ")";
                        else
                            return "translate(" + (com.x) + "," + (com.y) + ")";
                    })
                    .attr("class", "comGroupNodes");
                comsNodes.call(renderComNodes, params, expand);

                comsNodes.transition()
                    .duration(1000)
                    .attr("transform", function(com) {
                    if(expand)
                        return "translate(" + (com.x*amplifyFactor) + "," + (com.y*amplifyFactor) + ")";
                    else
                        return "translate(" + (com.x) + "," + (com.y) + ")";
                });

                comsNodes.exit().remove();
                var centerNodeGroup = g.selectAll(".centerNodeGroup")
                    .data([1])
                    .enter()
                    .append("g")
                    .attr("class","centerNodeGroup");

                var centerNode = centerNodeGroup.append("circle")
                    .attr("class", "centerNode")
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .attr("r", 5*((expand)?amplifyFactorMini:1))
                    .attr("fill", "#000")
                    .on('mouseover', function () {
                        tipCenterNode.show(d);
                    })
                    .on('mouseout', function () {
                        tipCenterNode.hide(d);
                    })
                    .on('click', function () {
                        params.clickName = d.center.id;
                        pipServ.emitDetailExpand(d.time);
                        console.log("emit click::" + d.time);
                    });
                g.selectAll(".centerNode").transition()
                    .duration(1000)
                    .attr("r", 5*((expand)?amplifyFactorMini:1));

            })

        };
        var renderComAttribute = function(g, params, expand) {
            var config = window.config.detail;
            layout(params);
            g.each(function(d) {
                var g = d3.select(this);

                var circleData = [{
                    r:config.outerRadius,
                    fill:"#ccc",
                    opacity:d["opacity"]
                },{
                    r:config.innerRadius,
                    fill:"#fff",
                    opacity:1
                }];

                g.selectAll("circle")
                    .data(circleData)
                    .enter()
                    .append("circle")
                    .attr("class", "ring")
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .attr("r", function(d, i) {
                        if(expand)
                        {
                            if(i == 0)
                                return d.r * amplifyFactorMini;
                            if(i == 1)
                                return d.r * amplifyFactor;
                        }
                        else
                            return d.r;
                    })
                    .attr("fill", function(d) {
                        return d.fill;
                    })
                    .attr("opacity", function(d) {
                        return d.opacity;
                    });
                g.selectAll(".ring")
                    .transition()
                    .duration(1000)
                    .attr("r", function(d, i) {
                        if(expand)
                        {
                            if(i == 0)
                                return d.r * amplifyFactorMini;
                            if(i == 1)
                                return d.r * amplifyFactor;
                        }
                        else
                            return d.r;
                    });
//                    .attr("opacity", d["opacity"]);
//                circleGroup.append("circle")
//                    .attr("cx", 0)
//                    .attr("cy", 0)
//                    .attr("r", 25)
//                    .attr("fill", "#ccc")
//                    .attr("opacity", d["opacity"]);
//                circleGroup.append("circle")
//                    .attr("cx", 0)
//                    .attr("cy", 0)
//                    .attr("r", 10)
//                    .attr("fill", "#fff");
                var glyph = d.glyph;
                var keys = Object.keys(glyph).sort();
                var lines = [];
                var unitAngle = Math.PI * 2 / keys.length;
                for(var i = 0; i < keys.length - 1; i++) {
                    lines.push({
                        x1: glyph[keys[i]] * Math.cos(unitAngle * i),
                        y1: glyph[keys[i]] * Math.sin(unitAngle * i),
                        x2: glyph[keys[i + 1]] * Math.cos(unitAngle * (i + 1)),
                        y2: glyph[keys[i + 1]] * Math.sin(unitAngle * (i + 1))
                    });
                }
                lines.push({
                    x1: glyph[keys[keys.length - 1]] * Math.cos(unitAngle * i),
                    y1: glyph[keys[keys.length - 1]] * Math.sin(unitAngle * i),
                    x2: glyph[keys[0]] * Math.cos(unitAngle * (i + 1)),
                    y2: glyph[keys[0]] * Math.sin(unitAngle * (i + 1))
                });
                g.selectAll("line")
                    .data(lines)
                    .enter()
                    .append("line")
                    .attr("x1", function(d) {
                        return d.x1//*(expand? amplifyFactorMini : 1);
                    })
                    .attr("y1", function(d) {
                        return d.y1//*(expand? amplifyFactorMini : 1);
                    })
                    .attr("x2", function(d) {
                        return d.x2//*(expand? amplifyFactorMini : 1);
                    })
                    .attr("y2", function(d) {
                        return d.y2//*(expand? amplifyFactorMini : 1);
                    })
                    .attr("stroke", "#555")
                    .attr("stroke-width", 0.5)
                    .attr("class", "star");

                g.selectAll(".star")
                    .transition()
                    .duration(1000)
                    .attr("x1", function(d) {
                        return d.x1//*(expand? amplifyFactorMini : 1);
                    })
                    .attr("y1", function(d) {
                        return d.y1//*(expand? amplifyFactorMini : 1);
                    })
                    .attr("x2", function(d) {
                        return d.x2//*(expand? amplifyFactorMini : 1);
                    })
                    .attr("y2", function(d) {
                        return d.y2//*(expand? amplifyFactorMini : 1);
                    })

            });
        };
        var renderComNodes = function(gg, params, expand) {
            gg.call(tip);
            gg.each(function(d) {
//                console.log(d);
                var g = d3.select(this);
                var nodeGroup = g;
                nodeGroup.selectAll(".neighborNodes")
                    .data(d["nodes"])
                    .enter()
                    .append("circle")
                    .attr("r", function(d) {
                        return 3;
                    })
                    .attr("cx", function(d) {
                        return d.x*(expand?amplifyFactor:1);
                    })
                    .attr("cy", function(d) {
                        return d.y*(expand?amplifyFactor:1);
                    })
                    .attr("fill", "#ccc")
                    .attr("class", "neighborNodes")
                    .on('mouseover', function (d) {
                        tip.show(d);
                        //if(params.highLights.indexOf(d.name) < 0)
                        //    params.highLights.push(d.name);
                        //
                        //renderLinks(gg, params);
                    })
                    .on('mouseout', function (d) {
                        tip.hide(d);
                        //params.highLights.splice(params.highLights.indexOf(d.name), 1);
                        //renderLinks(gg, params);
                    });
                nodeGroup.selectAll(".neighborNodes")
                    .transition()
                    .duration(1000)
                    .attr("r", function(d) {
                        return 3;
                    })
                    .attr("cx", function(d) {
                        return d.x*(expand?amplifyFactor:1);
                    })
                    .attr("cy", function(d) {
                        return d.y*(expand?amplifyFactor:1);
                    });

            });
        };
        var render = function(svg, params) {
            var config = window.config.detail;
            var height = params.data.length == 0? config.height:config.groupHeight;
            preprocess(params);
            layout(params);
            var detailGroups = svg.select("#canvas").selectAll(".detailGroup")
                .data(params.data);
            detailGroups.enter()
                .append("g")
                .attr("class", "detailGroup")
                .attr("id", function (d, i) {
                    return "detailGroup-"+ d.visual[0].center.id.replace(/[\s\.\#]+/g,'_');
                })
                .attr("transform", function(d, i) {
                    return "translate(" + 0 + "," + i * height  + ")";
                });

            var flagCount = 0;
            var state = "";
            params.expandFlag.forEach(function (d, i) {
                if(d.expand)
                    flagCount++;
            });
            if(params.flagRec == 0 && flagCount == 0)
                state = "0-0";
            if(params.flagRec == 0 && flagCount == 1)
            {
                state = "0-1";
            }
            else if(params.flagRec >= 1 && flagCount >= 2)
            {
                state = "1-2";
            }
            else if(params.flagRec >= 2 && flagCount >= 1)
            {
                state = "2-1";
            }
            else if(params.flagRec == 1 && flagCount == 0)
            {
                state = "1-0";
            }

            detailGroups
                .transition()
                .duration(1000)
                .attr("transform", function(d, i) {
                    return "translate(" + 0 + "," + i * height*(state!=="0-0"&&state!=="1-0"? pushFactor:1)  + ")";
                });

            var tBox = d3.transform(svg.select("#canvas").attr("transform")),
                xPos = tBox.translate[0],
                yPos = tBox.translate[1];

            if(params.clickName !== "")
            {
                var name = "#detailGroup-"+params.clickName.replace(/[\s\.\#]+/g,'_');
                console.log(d3.selectAll(name));
                var clickTrans = d3.transform(d3.selectAll(name).attr("transform"));
                    //clickX = clickTrans.translate[0],
                    //clickY = clickTrans.translate[1];
                if(state === "0-1")
                {
                    yPos = -clickTrans.translate[1];
                    yPos = yPos*pushFactor+100;
                }
                else if(state == "1-0")
                {
                    yPos = -clickTrans.translate[1];
                    yPos = yPos / pushFactor + config.groupHeight;
                }
            }
            params.flagRec = flagCount;

            svg.select("#canvas")
                .transition()
                .duration(1000)
                .attr("transform", function(d, i) {
                    //return "translate(" + xPos + "," + yPos*(flag? 2:1/2)  + ")";
                    return "translate(" + (xPos) + "," + yPos  + ")";
                });
            //params.tranY = yPos*(flag? 2:1/2);
            params.tranY = yPos;

            detailGroups.each(function(d) {
                var g = d3.select(this);
                var line = timeline(d);

                var interLines = g.selectAll(".interLines")
                    .data(line);
                interLines.enter()
                    .append("line")
                    .attr("class", "interLines")
                    .attr("x1", function (d) {
                        return d.source.x;
                    })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    })
                    .attr("stroke", function (d, i) {
                        if(d.source.y == d.target.y)
                            return "grey";
                        else if(d.source.y > d.target.y)
                            return "green";
                        else
                            return "red";
                    })
                    .attr("opacity", 0.5);
                interLines.transition()
                    .duration(1000)
                    .attr("x1", function (d) {
                        return d.source.x;
                    })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    })
                    .attr("stroke", function (d, i) {
                        if(d.source.y == d.target.y)
                            return "grey";
                        else if(d.source.y > d.target.y)
                            return "green";
                        else
                            return "red";
                    });

                var timeGroup = g.selectAll(".timeGroup")
                    .data(d["visual"]);
                timeGroup.enter()
                    .append("g")
                    .attr("class", "timeGroup");


                timeGroup
                    .attr("transform", function(d) {
                        var res;
                        var transform = this.getAttribute("transform");
                        if(transform === null) {
                            res = "translate(" + d.x + "," + d.y + ")";
                        } else {
                            var pos = transform.split(/[(,)]/)
                            res = "translate(" + pos[1] + "," + pos[2] + ")";
                        }
                        return res;
                    })
                    .transition()
                    .duration(1000)
                    .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
                    .call(renderFrame, params);
            })
        };
        var addDetail = function(svg, data, width, height, id, params, callback) {
//            var visual = preprocess(data);
//            layout(visual, params);
//            console.log(visual);
            for(var name in data.nodes) {
                var raw = data.nodes[name];
                raw["community"] = data.community;
                params.rawData.push(raw);
            }
            callback();
            var yPos = d3.transform(svg.selectAll("#canvas").attr("transform")).translate[1];
            var xPos = d3.transform(svg.selectAll("#canvas").attr("transform")).translate[0];
            svg.selectAll("#detailGroup")
                //.transition()
                //.duration(1000)
                .attr("transform", function(d, i) {
                    var tmp = "translate(" + (0) + "," + (params.data.length==0||params.data.length==1?yPos:(-(params.data.length-1)*config.groupHeight)+config.initailHeight) + ")";
                    return tmp;
                })
            svg.selectAll("#canvas")
                .transition()
                .duration(1000)
                .attr("transform", function(d, i) {
                    var tmp = "translate(" + (xPos) + "," + (params.data.length==0||params.data.length==1?yPos:(-(params.data.length-config.firstKeep)*config.groupHeight)+config.initailHeight) + ")";
                    //var tmp = "translate(" + (xPos) + "," + (params.data.length==0||params.data.length==1?yPos:(-(params.data.length-2)*config.groupHeight)) + ")";
                    //var tmp = "translate(" + xPos + "," + (params.data.length==0||params.data.length==1?yPos:(params.tranY)) + ")";
                    //var tmp = "translate(" + params.tranX + "," + i *  (params.data.length == 1?config.height:config.groupHeight) + ")";
                    if(params.data.length > 1)
                        params.tranY = -(params.data.length-2)*config.groupHeight;
                    return tmp;
                })
//            render(svg, params);
        };
        var getExpandFlag = function(year, params)
        {
            for(var i = 0; i < params.expandFlag.length; ++i)
            {
                if(params.expandFlag[i].time === year)
                {
                    return params.expandFlag[i].expand;
                }
            }
            return undefined;
        }

        return {
            'init':init,
            'addDetail': addDetail,
            'render':render
        };
    }
    ]);
})();