/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    var cluster = angular.module('shvis.cluster.service', []);
    cluster.factory('ClusterService', ['LoadService', 'PipService', function(loadServ, pipServ) {
        var d3 = window.d3;
        var heatmap = window.h337;
        var colorbrewer = window.colorbrewer;
        var diagonal = d3.svg.diagonal()
            .projection(function(d) {
                return [d.y, d.x];
            });
        var init = function(dom, width, height) {
            var configCluster = window.config.cluster;
            var widthCluster = configCluster.width,
                heightCluster = configCluster.height;
            var marginCluster = configCluster.margin;
            var svg = d3.select(dom)
                .select("#cluster-svg")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
            svg.append("rect")
                .attr("width", width)
                .attr("height",height)
                .attr("id", "dragBox")
                .attr("opacity", 0);
            svg.append("g")
                .attr("id", "canvas")
                .attr("transform", "translate(" + marginCluster[0] + ")")
                .append("g")
                .attr("id", "clusterGroup");
            svg.select("#canvas")
                .append("g")
                .attr("id", "encompass");

            return svg;
        };
        var bindDrag = function(svg, params) {
            var drag = d3.behavior.drag();
            var mx, my;
            drag.on('dragstart', function() {
                mx = undefined;
                my = undefined;
            });
            drag.on('drag', function() {
                if(mx === undefined || my === undefined) {
                    mx = d3.event.x;
                    my = d3.event.y;
                }
//                params.tranX += (d3.event.x - mx);
                params.tranY += (d3.event.y - my);
                if(params.tranY > 0) params.tranY = 0;
                if(params.maxHeight < params.height / 2) {
                    params.tranY = 0;
                } else if(params.tranY < (params.height / 2 - params.maxHeight))  {
                    params.tranY = params.height / 2 - params.maxHeight;
                }
                mx = d3.event.x;
                my = d3.event.y;
                var container = svg.select("#clusterGroup")
                    .attr("transform", "translate(" + params.tranX + "," + params.tranY + ")");

                var containerEncompass = svg.select("#encompass");
                containerEncompass.selectAll(".encompassLine")
                    .transition()
                    .duration(0)
                    .attr("y1", function (d) {
                        return d.sourceUp.y + params.tranY;
                    });


                params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
//            var nodes = tree.nodes(root).reverse();
//            var links = tree.links(nodes);
//                setTimeout(function(){
                var nodes = params.nodes
                for(var i = 0, len = nodes.length; i < len; i++) {
//                drawHeatRing(heat, nodes[i]);
                    drawKDERing(params.heat, nodes[i], params);
                }
//                },500);
//                update(svg, params);
//                svg.select("#canvas")
//                    .attr("transform", "translate(" + params.tranX + "," + params.tranY + ")");

            });
            drag.on('dragend', function() {

            });
            svg.select("#dragBox").call(drag);

        };
        var addHeatmap = function(id, width, height) {
            $("#" + id).append("<canvas></canvas>");
            var canvas = $("#" + id + " canvas")[0];
            canvas.width = width;
            canvas.height = height;
            canvas.style.cssText = "position:absolute";
            return $("#cluster-heatmap canvas")[0];
        };
        var nodeSize = function(node, size) {
            size.push(node.data.size);
            var num = 0;
            if(node.children) {
                for(var i = 0; i < node.children.length; i++) {
                    num +=nodeSize(node.children[i], size);
                }
            } else {
                num = 1
            }
            return num;
        };
        var doiFilter = function(node, params) {
            var res;
            if(node.distToRoot - node.distToFocus < 0) {
                var children = node["children"];
                if(children !== undefined && children.length > 0) {
                    res = children.map(function(d) {
                        return doiFilter(d, params);
                    }).filter(function(d) {
                        if(d) {
                            return d;
                        }
                    })[0];
                } else {
                    res = undefined;
                }
            } else {
                res = node;
                var allChildren = [];
                var children = node["children"],
                    _children = node["_children"];
                if(children !== undefined){
                    for(var i = 0; i < children.length; i++) {
                        allChildren.push(children[i]);
                    }
                }
                if(_children !== undefined) {
                    for(var i = 0; i < _children.length; i++) {
                        allChildren.push(_children[i]);
                    }
                }
                var filterChildren = [],
                    remainChildren = [];
                for(var i = 0; i < allChildren.length; i++) {
                    if(doiFilter(children[i], params) === undefined) {
                        filterChildren.push(children[i]);
                    } else {
                        remainChildren.push(children[i]);
                    }
                }
                node["children"] = remainChildren;
                if(node["children"].length == 0) {
                    node["children"] = undefined;
                }
                node["_children"] = filterChildren;
            }

            return res;
        };


        var preprocess = function(tree, params) {
            var configCluster = window.config.cluster;
            var widthCluster = configCluster.treeWidth,
                heightCluster = configCluster.treeHeight;
            var marginCluster = configCluster.margin;
            var root = doiFilter(params["root"], params);
            root['load'] = true;
            var size = [];
            var clusterNum = nodeSize(root, size);
            var maxHeight = clusterNum * (configCluster.maxInnerRadius + 5) * 2
            tree.size([maxHeight, widthCluster - marginCluster[1] - marginCluster[3]]);
            params.maxHeight = maxHeight;
            var nodes = tree.nodes(root).reverse();
            var links = tree.links(nodes);
            params["nodes"] = nodes;
            params["links"] = links;
            var config = window.config.cluster;
            var variance = nodes.filter(function(d) {
                    var res = true;
                    if(d.data.variance === undefined) {
                        res = false;
                    }
                    return res;
                })
                .map(function(d) {
                    return d.data.variance;
                });
            var varRange = [d3.max(variance), d3.min(variance)];
            var max = d3.max(size);
            var min = d3.min(size);
            var radiusScale = d3.scale.log().domain([min, max]).range([configCluster.minInnerRadius, configCluster.maxInnerRadius]);
            var colorScale = d3.scale.linear().domain(varRange).range([0.2, 1]);
            for(var i = 0, len = nodes.length; i < len; i++) {
                var node = nodes[i];
                node["load"] = false;
                var data = [];
                var innerRadius = radiusScale(node.data.size);

                var outerRadius = innerRadius + 5;
                node["outerRadius"] = outerRadius;
                data.push({
                    id:"circles",
                    data:[
                        {
                            r: outerRadius,
                            fill: "none",
                            stroke: "#000",
                            opacity: 1
                        },
                        {
                            r: innerRadius,
//                            fill: colorbrewer['OrRd'][9][Math.floor(Math.random() * 5)],
                            fill: "#ff7761",
                            opacity: colorScale(node.data.variance),
                            stroke: "#000"
                        }
                    ]

                });
                data.push({
                    id: "trend",
                    data: node.data,
                    r:innerRadius
                });
                node.visual = data;
            }
        }

        var update = function(svg, params) {
            var container = svg.select("#clusterGroup")
                .attr("transform", "translate(" + params.tranX + "," + params.tranY + ")");
            //var containerEncompass = svg.select("#encompass");
            var tree = params.tree,
                nodes = params.nodes,
                links = params.links,
                heat = params.heat;
//            heat.setData({
//                data:[]
//            });
//            heat.repaint();

//            heat.repaint();
            var node = container.selectAll(".clusterNode")
                .data(nodes, function(d) {
                    return d.data.id;
                });
            var dragFlag;
            var drag = d3.behavior.drag()
                .on("drag", function(d,i) {
                    dragFlag = true;
                    d.x += d3.event.dy;
                    d.y += d3.event.dx;
                    d3.select(this).attr("transform", function(d,i){
                        return "translate(" + [ d.y,d.x ] + ")"
                    });
                    params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
                    var nodes = params.nodes
                    for(var i = 0, len = nodes.length; i < len; i++) {
                        drawKDERing(params.heat, nodes[i], params);
                    }
                })
                .on("dragend", function (d, i) {
                    if(dragFlag)
                    {
                        params.onSelect = true;
                        update(svg, params);
                        //params.onSelect = false;

                        console.log(params);
                        params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
                        var nodes = params.nodes
                        for(var i = 0, len = nodes.length; i < len; i++) {
                            drawKDERing(params.heat, nodes[i], params);
                        }
                    }
                    dragFlag = false;

                });
            var nodeEnter = node.enter()
                .append("g")
                .attr("class", "clusterNode")
                .on("click", function(d) {
                    if (d3.event.defaultPrevented) return;
                    d.expand = false;
//

                    if(params.onSelect) {
                        params.clickedNodes.push(d);
                        pipServ.emitAddCluster(d.data.id);
                    } else {
                        if(!d.load) {
                            console.log("here")
                            loadServ.loadCluster(d.data.id, function(newCluster) {
                                d.load = true;
                                console.log(newCluster);
                                d["children"] = newCluster["children"];
                                if(newCluster["children"].length !== 0) {
                                    //calculate doi
                                    calDOI(params.root, d);
                                    //refresh
                                    preprocess(params.tree, params);
                                    update(svg, params);
                                }
                            })
                        } else {
                            //calculate doi
                            calDOI(params.root, d);
                            //refresh
                            preprocess(params.tree, params);
                            update(svg, params);
                        }
                    }
                }).attr("transform", function(d) {
                    var x, y;
                    //console.log(d);
                    if(d.parent === undefined) {
                        x = d.y;
                        y = d.x;
                    } else {
                        x = d.parent.y;
                        y = d.parent.x;
                    }
                    return "translate(" + x + "," + y + ")";
                })
                .call(drag);

            node.transition()
                .duration(500)
                .attr("transform", function(d) {
                    return "translate(" + d.y + "," + d.x + ")";
                })

            node.call(drawNode);
            var nodeExit = node.exit().remove();

            drawEncompass(svg, params);

            var link = container.selectAll(".clusterLink")
                .data(links, function(d) {
                    return [d.source.data.id, d.target.data.id].join(",");
                })

            link.enter().insert("path", "g")
                .attr("class", "clusterLink")
                .attr("fill", "none")
                .attr("stroke", "#ccc")
                .attr("opacity", 0.5)
                .attr("d", function(d) {
                    var o = {x: d.source.x, y: d.source.y};
                    return diagonal({source:o, target:o});
                });
            link.transition()
                .duration(500)
                .attr("d", function(d) {
                    var res = {};
                    var source = d.source,
                        target = d.target;
                    res["source"] = {x:source.x, y: source.y + 5};
                    if(target.children === undefined || target.children.length === 0) {
                        res["target"] = {x:target.x, y: target.y - target.outerRadius};
                    } else {
                        res["target"] = {x:target.x, y: target.y - 5};
                    }

//                    console.log(source);
                    return diagonal(res);
                })
            link.exit().remove();

            heat.clearRect(0, 0, heat.canvas.width, heat.canvas.height);
//            var nodes = tree.nodes(root).reverse();
//            var links = tree.links(nodes);
            setTimeout(function(){
                heat.clearRect(0, 0, heat.canvas.width, heat.canvas.height);
                for(var i = 0, len = nodes.length; i < len; i++) {
//                drawHeatRing(heat, nodes[i]);
                    drawKDERing(heat, nodes[i], params);
                }
            },500);

        };
        var bezLineUp = function(d) {
            var x1 = d.sourceUp.x,
                x2 = d.targetUp.x,
                y1 = d.sourceUp.y,
                y2 = d.targetUp.y;
            var cx = (x1 + x2) / 2;
            return "M " + x1 + "," + y1 + " C " + [cx, y1, cx, y2, x2, y2].join(" ");
        };
        var bezLineDn = function(d) {
            var x1 = d.sourceDn.x,
                x2 = d.targetDn.x,
                y1 = d.sourceDn.y,
                y2 = d.targetDn.y;
            var cx = (x1 + x2) / 2;
            return "M " + x1 + "," + y1 + " C " + [cx, y1, cx, y2, x2, y2].join(" ");
        };
        var drawEncompass = function (svg, params) {
            var containerEncompass = svg.select("#encompass");
            var expandID = [];
            params.clickedNodes.forEach(function (d) {
                expandID[d.data.id] = {};
            });
            for(var id in expandID)
            {
                var translateUp = d3.selectAll("#separateLine-"+id+"-0").attr("y1");
                var translateDn = d3.selectAll("#separateLine-"+id+"-1").attr("y1");
                var translateCanvas = d3.transform(d3.selectAll("#rankView").select("#canvas").attr("transform")).translate;
                var translateRankGroup = d3.transform(d3.selectAll("#rankView").select("#canvas").select("#rankGroup").attr("transform")).translate;
                expandID[id] = {yUp: parseInt(translateUp)+parseInt(translateCanvas[1])+parseInt(translateRankGroup[1]),
                    yDn: parseInt(translateDn)+parseInt(translateCanvas[1])+parseInt(translateRankGroup[1])};

            }
            var encompassData = [];
            var encompassDataBez = [];
            var recWidth = 10;
            var recX = 160;
            var LineEndX = 189;
            var zoomFactor = 2/3;
            params.clickedNodes.forEach(function (d, i) {
                var dy = (expandID[d.data.id].yDn - expandID[d.data.id].yUp) * (1 - zoomFactor) / 2;
                encompassData.push({
                    sourceUp:{x: d.y+params.tranX , y: d.x+params.tranY},
                    targetUp:{x:recX, y:expandID[d.data.id].yUp},
                    sourceDn:{x: d.y+params.tranX , y: d.x+params.tranY},
                    targetDn:{x:recX, y:expandID[d.data.id].yDn}});
                encompassDataBez.push({
                    sourceUp:{x:recWidth+recX, y:expandID[d.data.id].yUp + dy},
                    targetUp:{x:LineEndX, y:expandID[d.data.id].yUp},
                    sourceDn:{x:recWidth+recX , y:expandID[d.data.id].yDn - dy },
                    targetDn:{x:LineEndX, y:expandID[d.data.id].yDn}});
            });

            containerEncompass.selectAll(".encompassRect")
                .remove();
            containerEncompass.selectAll(".encompassRect")
                .data(encompassData)
                .enter()
                .append("rect")
                .attr("class", "encompassRect")
                .attr("width", recWidth)
                .attr("height", function (d, i) {
                    return (d.targetDn.y - d.targetUp.y) * 2 / 3;
                })
                .attr("x", function (d, i) {
                    return d.targetUp.x;
                })
                .attr("y", function (d) {
                    return d.targetUp.y + (d.targetDn.y - d.targetUp.y) / 6;
                })
                .attr("fill", "grey")
                .attr("opacity", 0.6)
                .attr("stroke", "grey")
                .attr("stroke-width", 3)
                .attr("stroke-opacity", 0.8);

            containerEncompass.selectAll(".encompassLine")
                .remove();
            containerEncompass.selectAll(".encompassLine")
                .data(encompassData)
                .enter()
                .append("line")
                .attr("x1", function (d) {
                    return d.sourceUp.x;
                })
                .attr("x2", function (d) {
                    return d.targetUp.x;
                })
                .attr("y1", function (d) {
                    return d.sourceUp.y;
                })
                .attr("y2", function (d) {
                    return (d.targetUp.y + d.targetDn.y) / 2;
                })
                .attr("stroke", "grey")
                .attr("stroke-opacity", 0.3)
                .attr("fill", 'none')
                .attr("class", "encompassLine");
            //
            containerEncompass.selectAll(".encompassUp")
                .remove();
            containerEncompass.selectAll(".encompassUp")
                .data(encompassDataBez)
                .enter()
                .append("path")
                .attr("d", bezLineUp)
                .attr("stroke", "black")
                .attr("stroke-opacity", 0.2)
                .attr("fill", 'none')
                .attr("class", "encompassUp");

            containerEncompass.selectAll(".encompassDn")
                .remove();
            containerEncompass.selectAll(".encompassDn")
                .data(encompassDataBez)
                .enter()
                .append("path")
                .attr("d", bezLineDn)
                .attr("stroke", "black")
                .attr("stroke-opacity", 0.2)
                .attr("fill", 'none')
                .attr("class", "encompassDn");

        };
        var drawKDERing = function(canvas, d, params) {
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
                var kde = loadServ.kde(loadServ.kernel(20), angScale.ticks(200))(rankDist);
                var min = d3.min(kde, function(d) {
                    return d[1];
                });
                var max = d3.max(kde, function(d) {
                    return d[1];
                })
                var unit = (max - min)/ 10;
//                console.log(kde);
//                var color = d3.scale.linear().domain(d3.range(min, max, unit)).range(colorbrewer["Greens"][8]);
                var opacityScale = d3.scale.linear().domain(d3.range(min, max, unit)).range(d3.range(0.1, 1, 0.1));
                var visual = d.visual.filter(function(d) {
                    var res = false;
                    if(d.id === "circles") {
                        res = true;
                    }
                    return res;
                })[0];
                var innerRadius = visual.data[1].r + 1;
                var outerRadius = visual.data[0].r + 1;
                var r = (innerRadius + outerRadius) / 2 ;
                for(var i = 0, len = kde.length; i < len; i++) {
                    var ang = angScale(kde[i][0]);
//                    var c = color(kde[i][1]);
                    var c = "#4fc180";

                    canvas.lineWidth = (outerRadius - innerRadius);
                    canvas.strokeStyle = c;
                    canvas.fillStyle = c;
                    canvas.beginPath();
                    canvas.globalAlpha = opacityScale(kde[i][1]);
                    canvas.arc(d.y + margin[0] + params.tranX, d.x + params.tranY, r, ang, ang + unitAngle);
//                    canvas.moveTo(d.y + margin[0] + params.tranX, d.x + params.tranY);
//                    canvas.arc(d.y + margin[0] + params.tranX, d.x + params.tranY, outerRadius, ang, ang + unitAngle);
//                    canvas.arc(d.y + margin[0] + params.tranX, d.x + params.tranY, innerRadius, ang, ang + unitAngle);
                    canvas.closePath();
                    canvas.stroke();
                }
            }

        }
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
        }

        var drawNode = function(g) {
            var config = window.config.cluster;
            g.each(function(d) {
                var g = d3.select(this);
                if(d.children !== undefined) {
                    g.selectAll("g")
                        .remove();
                    g.selectAll("circle")
                        .remove();
                    g.append("circle")
                        .attr("r", 5)
                        .attr("fill", "#ccc")
                        .attr("stroke", "#ccc")
                        .attr("opacity", 0.8);

                } else {
                    var data = d.visual;
//                    if(d.expand) {
//                        data = d.visual["expand"];
//                    } else {
//                        data = d.visual["unexpand"];
//                    }
                    var groups = g.selectAll("g")
                        .data(data, function(d) {
                            return d.id;
                        })
                    var gEnter = groups.enter()
                        .append("g")
                        .each(function(d) {
//                            d3.select(this).call(drawCircles, d.data);
//                            d3.select(this).call(drawArea, d.data);
                            switch(d.id) {
                                case "circles":
                                    d3.select(this).call(drawCircles, d.data);
                                    break;
                                case "trend":
                                    d3.select(this).call(drawArea, d.data, d.r);
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
                    return "none";
                })
                .attr("opacity", function(d) {
                    return d.opacity;
                })
        };

        var drawArea = function(g, d, r) {
            var trend = d.trend;
            var max = d3.max(d.lower),
                min = d3.min(d.upper);
//            var box = config.cluster.trendBox;
            var boxHeight = r - 2,
                boxWidth = 1.732 * (r - 2);
            var scaleY = d3.scale.linear().domain([min, max]).range([-boxHeight * 0.5, boxHeight * 0.5]),
                scaleX = d3.scale.linear().domain([0, trend.length - 1]).range([-boxWidth * 0.5, boxWidth * 0.5]);


            var areaData = [];
            for(var i = d.lower.length - 1; i >= 0; i--) {
                areaData[i] = {
                    y0: scaleY(d.lower[i]),
                    y1: scaleY(d.upper[i]),
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
                .attr("fill", "#4fc180");

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
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("fill", "none");

        };



        var calDOI = function(root, node) {
            //cal distance between the root and each node
            root["distToRoot"] = 1;
            var stack = [root];
            while(stack.length > 0) {
                var prt = stack.pop();
                if(prt["children"] !== undefined && prt["children"].length > 0) {
                    for(var i = 0, len = prt["children"].length; i < len; i++) {
                        stack.push(prt["children"][i]);
                        prt["children"][i]["distToRoot"] = prt["distToRoot"] + 1;
                    }
                }
            }
            //cal distance between the focus node and each node
            node["distToFocus"] = 0;
            var traversed = [];
            stack = [node];
            while(stack.length > 0) {
                var ego = stack.pop();
                var alters = [];
                var prt = ego.parent;
                traversed.push(ego);
                if(prt !== undefined && traversed.indexOf(prt) < 0) {
                    alters.push(prt);
                }
                if(ego["children"] !== undefined && ego["children"].length > 0) {
                    for(var i = 0, len = ego["children"].length; i < len; i++) {
                        var child = ego["children"][i];
                        if(traversed.indexOf(child) < 0) {
                            alters.push(child);
                        }
                    }
                }
                for(var i = 0; i < alters.length; i++) {
                    stack.push(alters[i]);
                    alters[i]["distToFocus"] = ego["distToFocus"] + 1;
                }
            }
//            root["distToRoot"] = 1;
        }


        return {
            'init':init,
            'update':update,
            'addHeatmap':addHeatmap,
            'preprocess':preprocess,
            'bindDrag':bindDrag,
            'drawEncompass':drawEncompass

        };

    }]);
})();