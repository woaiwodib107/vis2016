/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    var cluster = angular.module('shvis.cluster.service', []);
    cluster.factory('ClusterService', ['LoadService', 'PipService','RankService', function(loadServ, pipServ, rankServ) {
        var d3 = window.d3;
        var heatmap = window.h337;
        var colorbrewer = window.colorbrewer;
        var configCluster = window.config.cluster;
        var diagonal = function(d) {
            return 'M' + d.y + ',' + d.x
                  + 'C' + (d.parent.y + 100) + ',' + d.x
                  + ' ' + (d.parent.y + 100) + ',' + d.parent.x
                  + ' ' + d.parent.y + ',' + d.parent.x;
        };
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) {
                return '<span>' + 'cluster id: '+d.data.data.id + '</span>'})
            .offset([-12, 0]);

        var init = function(dom, width, height) {
            var widthCluster = configCluster.width,
                heightCluster = configCluster.height;
            var marginCluster = configCluster.margin;
            var svg = d3.select(dom)
                .select("#cluster-svg")
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            svg.append("rect")
                .attr("width", configCluster.divideLine)
                .attr("height", height)
                .attr("x", 0)
                .attr("y", 0)
                .attr("stroke", "none")
                .attr("opacity", 0)
                .attr("id", "greyRectBack");

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

            svg.append("g")
                .attr("id", "dragNodesGroup")
                //.attr("transform", "translate(" + configCluster.divideLine + ",-5)")
                .append("rect")
                .attr("width", 120)
                .attr("height", height)
                .attr("x", configCluster.divideLine)
                .attr("y", -5)
                .attr("fill", "white")
                .attr("opacity", 0.3)
                .attr("stroke", "none")
                .attr("id", "greyRect");
            svg.select("#dragNodesGroup")
                .append("g")
                .attr("id", "dragNodes");

            // svg.select("#canvas")
            //     .append("g")
            //     .attr("id", "encompass");

            return svg;
        };
        var bindDrag = function(svg, params) {
            var drag = d3.drag();
            var mx, my;
            drag.on('start', function() {
                mx = undefined;
                my = undefined;
            });
            drag.on('drag', function() {
                if(mx == undefined || my == undefined) {
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


                // params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
//            var nodes = tree.nodes(root).reverse();
//            var links = tree.links(nodes);
//                setTimeout(function(){
                var nodes = params.nodes.concat(params.dragNodes);
//                 for(var i = 0, len = nodes.length; i < len; i++) {
// //                drawHeatRing(heat, nodes[i]);
//                     drawKDERing(params.heat, nodes[i], params);
//                 }
//                },500);
//                update(svg, params);
//                svg.select("#canvas")
//                    .attr("transform", "translate(" + params.tranX + "," + params.tranY + ")");

            });
            drag.on('end', function() {

            });
            svg.select("#dragBox").call(drag);

        };
        // var addHeatmap = function(id, width, height) {
        //     $("#" + id).append("<canvas></canvas>");
        //     var canvas = $("#" + id + " canvas")[0];
        //     canvas.width = width;
        //     canvas.height = height;
        //     canvas.style.cssText = "position:absolute";
        //     return $("#cluster-heatmap canvas")[0];
        // };
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
//            var dragedChildren = node["dragChildren"] == undefined? []:node["dragChildren"];
            //console.log(node);
//            if(node.distToRoot + node.distToFocus > params.doiThres + 2) {
            if(node.distToFocus > 2 ) {
                var children = node["children"];
                if(children !== undefined && children.length > 0) {
                    res = children.map(function(d) {
                        return doiFilter(d, params);
                    }).filter(function(d) {
                        if(d) {
                            return d;
                        }
                    })[0];
//                    children.forEach(function (d, i) {
//                        if(d.isDrag == true)
//                            dragedChildren.push(d);
//                    })
                } else {
                    res = undefined;
                }
            } else {
                res = node;
                var allChildren = node["allChildren"];
                var children = node["children"],
                    _children = node["_children"];
                //var dragedChildren = node["dragChildren"] == undefined? []:node["dragChildren"];

//                if(children !== undefined){
//                    for(var i = 0; i < children.length; i++) {
//                        //if(children[i].isDrag == true)
//                        //    continue;
//                        allChildren.push(children[i]);
//                    }
//                }
//                if(_children !== undefined) {
//                    for(var i = 0; i < _children.length; i++) {
//                        //if(_children[i].isDrag == true)
//                        //    continue;
//                        allChildren.push(_children[i]);
//                    }
//                }
                var filterChildren = [],
                    remainChildren = [];
                if(allChildren !== undefined && allChildren.length !== 0) {
                    for(var i = 0; i < allChildren.length; i++) {
//                    if(allChildren[i].isDrag == true)
//                    {
//                        dragedChildren.push(allChildren[i]);
//                        continue;
//                    }
                        if(doiFilter(allChildren[i], params) == undefined) {
                            filterChildren.push(allChildren[i]);
                        } else {
                            remainChildren.push(allChildren[i]);
                        }
                    }
                }


//                for(i = 0; i < dragedChildren.length; ++i)
//                {
//                    console.log(dragedChildren);
//                    if(dragedChildren[i].isDrag == false)
//                    {
//                        dragedChildren[i].parent.children.push(dragedChildren[i]);
//                        var tmp = dragedChildren.splice(i, 1);
//                        remainChildren.push(tmp[0]);
//                    }
//                }

                node["children"] = remainChildren;
                if(node["children"].length == 0) {
                    node["children"] = undefined;
                }
                node["_children"] = filterChildren;
//                node["dragChildren"] = dragedChildren;
                //dragedChildren.forEach(function (d, i) {
                //    if(params.dragNodes.indexOf(d) < 0)
                //        params.dragNodes.push(d);
                //});
            }
//            dragedChildren.forEach(function (d, i) {
//                //if(params.dragNodes.indexOf(d) < 0)
//                    params.dragNodes.push(d);
//            });
            //console.log(res);
            return res;
        };

        var filterDragNodes = function(doiRoot, params) {
            var root = params.root;
            var dragedChildren = [];
            var stack = [root];
            while(stack.length > 0) {
                var node = stack.pop();
                var allChildren = node.allChildren;
                if(allChildren !== undefined && allChildren.length !== 0) {
                    for(var i = 0; i < allChildren.length; i++) {
                        if(allChildren[i].isDrag == true) {
                            dragedChildren.push(allChildren[i]);
                        } else {
                            stack.push(allChildren[i]);
                        }
                    }
                }

//                if(children !== undefined && children.length !== 0) {
//                    for(var i = 0; i < children.length; i++) {
//
//                    }
//                }
//                if(_children !== undefined && _children.length !== 0) {
//                    for(var i = 0; i < _children.length; i++) {
//                        if(_children[i].isDrag == true) {
//                            dragedChildren.push(_children[i]);
//                        } else {
//                            stack.push(_children[i]);
//                        }
//                    }
//                }
            }
            //filter dragedChildren out in doiRoot
            params.dragNodes = params.clickedNodes;
            stack = [doiRoot];
            while(stack.length > 0) {
                node = stack.pop();
                var children = node.children;
                var _children = node._children;

                if(children !== undefined && children.length !== 0) {
                    for(var i = 0; i < children.length; i++) {
                        if(dragedChildren.indexOf(children[i]) >= 0) {
                            children.splice(children.indexOf(children[i]), 1);
                            i--;
                        } else {
                            stack.push(children[i]);
                        }
                    }
                }
                if(_children !== undefined && _children.length !== 0) {
                    for(var i = 0; i < _children.length; i++) {
                        if(dragedChildren.indexOf(_children[i]) >= 0) {
                            _children.splice(_children.indexOf(_children[i]), 1);
                            i--;
                        } else {
                            stack.push(_children[i]);
                        }
                    }
                }
            }

        }

        var preprocess = function(tree, params) {
            var configCluster = window.config.cluster;
            var widthCluster = configCluster.treeWidth,
                heightCluster = configCluster.treeHeight;
            var marginCluster = configCluster.margin;

            params.dragNodes = [];
            var root = doiFilter(params["root"], params);
            filterDragNodes(root, params);
            highlightCluster(params.highlightNodes, params);
//            root['load'] = true;
            var size = [];
            var clusterNum = nodeSize(root, size);
            for(var i = 0; i < params.dragNodes.length; i++) {
                var dragNode = params.dragNodes[i];
                size.push(dragNode.data.size);
            }
            var maxHeight = clusterNum * (configCluster.maxInnerRadius + 10) * 2
            tree.size([maxHeight, widthCluster - marginCluster[1] - marginCluster[3]]);
            params.maxHeight = maxHeight;

            root = d3.hierarchy(root);
            tree(root);
            var nodes = root.descendants();
            var links = root.descendants().slice(1);
            nodes.forEach(function (d, i) {
                d.formerX = d.x;
                d.formerY = d.y;
            });
            params["nodes"] = nodes;
            params["links"] = links;


            //params["links"] = [];
            //params["nodes"] = [];
            //nodes.forEach(function (d, i) {
            //    if(d.isDrag == undefined)
            //    {
            //        params["nodes"].push(d);
            //        d.isDrag = false;
            //    }
            //    else if(d.isDrag == false)
            //        params["nodes"].push(d);
            //});
            //console.log(params["nodes"]);
            //links.forEach(function (d, i) {
            //    if(!(d.source.isDrag == true || d.target.isDrag == true))
            //    {
            //        params["links"].push(d);
            //    }
            //});
            //links = params["links"];
            //nodes = params["nodes"];


            var config = window.config.cluster;
            var variance = nodes.filter(function(d) {
                    var res = true;
                    if(d.data.data.variance == undefined) {
                        res = false;
                    }
                    return res;
                })
                .map(function(d) {
                    return d.data.data.variance;
                });
            var varRange = [d3.min(variance), d3.max(variance)];
            var max = d3.max(size);
            var min = d3.min(size);
            var radiusScale = d3.scaleLog().domain([min, max]).range([configCluster.minInnerRadius, configCluster.maxInnerRadius]);
            var colorScale = d3.scaleLinear().domain(varRange).range([0.2, 1]);
            for(var i = 0, len = nodes.length; i < len; i++) {
                var node = nodes[i];
//                node["load"] = false;
                if(node["load"] == undefined) {
                    node["load"] = false;
                }
                var data = [];
                var innerRadius = radiusScale(node.data.data.size);

                var outerRadius = innerRadius + config.kdeOffset;
                node["outerRadius"] = outerRadius;
                data.push({
                    id:"circles",
                    data:[
                        {
                            r: outerRadius + 6,
                            fill: "none",
                            stroke: "#aaa",
                            opacity: (node["highlight"]==true?0.5:0),
                            strokeWidth: 5
                        },
                        {
                            r: outerRadius,
                            fill: "none",
                            stroke: "none",
                            opacity: 0,
                            strokeWidth: 0
                        },
                        {
                            r: innerRadius,
//                            fill: colorbrewer['OrRd'][9][Math.floor(Math.random() * 5)],
                            fill: "#ff7761",
                            opacity: colorScale(node.data.data.variance),
                            stroke: "none",
                            strokeWidth: 0
                        }
                    ]

                });
                data.push({
                    id: "trend",
                    data: node.data,
                    r:innerRadius
                });
                node.data.visual = data;
            }
        }
        var translateDragNodes = function (svg, params, transitionTime) {
            if(params.dragNodes.length == 0)
                return;
            var expandID = [];
            params.clickedNodes.forEach(function (d) {
                expandID[d.data.data.id] = {};
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

            var changeXY = function (d, i) {
                d.each(function (d, i) {
                    var tranYDn = expandID[d.data.data.id].yDn;
                    var tranYUp = expandID[d.data.data.id].yUp;
                    d.x = (tranYDn+tranYUp)/2;
                    d.y = 320;
                });

            }
            d3.selectAll(".dragNode")
                .transition()
                .duration(transitionTime)
                .call(changeXY)
                .attr("transform", function (d, i) {
                    return "translate(" + (d.y + configCluster.margin[0]) + "," + d.x + ")"
                });

            // setTimeout(function(){
            // params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
            var nodes = params.nodes.concat(params.dragNodes);
            // for(var i = 0, len = nodes.length; i < len; i++) {
            //     drawKDERing(params.heat, nodes[i], params);
            // }

            //var draglink = d3.selectAll(".clusterLinkDrag")
            //draglink.transition()
            //    .duration(500)
            //    .attr("d", function(d) {
            //        var res = {};
            //        var source = d.source,
            //            target = d.target;
            //        res["source"] = {x:source.x, y: source.y + 5};
            //        if(target.children === undefined || target.children.length === 0) {
            //            res["target"] = {x:target.x, y: target.y - target.outerRadius};
            //        } else {
            //            res["target"] = {x:target.x, y: target.y - 5};
            //        }
            //
            //        return diagonal(res);
            //    })
            //},1000);

        }
        var update = function(svg, params) {
//            console.log(params);
            var container = svg.select("#clusterGroup")
                .attr("transform", "translate(" + params.tranX + "," + params.tranY + ")");
            var containerDragNodes = svg.select("#dragNodes");
            //var containerEncompass = svg.select("#encompass");
            var tree = params.tree,
                nodes = params.nodes,
                links = params.links,
                heat = params.heat;
            var dragNodes = params.dragNodes;
            //var dragLinks = [];
            //dragNodes.forEach(function (d, i) {
            //    dragLinks.push({
            //        source:d,
            //        target: d.parent
            //    })
            //});

            var dragBack = d3.drag()
                .on("drag", function(d,i) {
                    dragFlag = true;
                    d3.select("#greyRectBack")
                        .transition()
                        .duration(100)
                        .attr("fill", "grey")
                        .attr("opacity", 0.2);
                    d.x += d3.event.dy;
                    d.y += d3.event.dx;
                    d3.select(this).attr("transform", function(d,i){
                        return "translate(" + [ (d.y+configCluster.margin[0]),d.x ] + ")"
                    });
                    // params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
                    // var nodes = params.nodes.concat(params.dragNodes);
                    // for(var i = 0, len = nodes.length; i < len; i++) {
                    //     drawKDERing(params.heat, nodes[i], params);
                    // }
                })
                .on("end", function (d, i) {
                    if(dragFlag)
                    {
                        d3.select("#greyRectBack")
                            .transition()
                            .duration(100)
                            .attr("fill", "white");

                        if(d.y >= configCluster.divideLine-40)
                        {
                            translateDragNodes(svg, params, 500);
                        }
                        else
                        {
                            d3.selectAll(".detailGroup")
                                .remove();
                            d.isDrag = false;
                            preprocess(params.tree, params);
                            params.clickedNodes.splice(params.clickedNodes.indexOf(d), 1);
                            pipServ.emitDelCluster(d.data.data.id);
                            update(svg, params);
                            //d3.selectAll(".dragNode")
                            //    .attr("transform", function (e, i) {
                            //        return "translate(" + (e.y+configCluster.margin[0]) + "," + e.x + ")"
                            //    });
                            // params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
                            // var nodes = params.nodes.concat(params.dragNodes);
                            // for(var i = 0, len = nodes.length; i < len; i++) {
                            //     drawKDERing(params.heat, nodes[i], params);
                            // }
                        }
                    }
                    dragFlag = false;
                });
            containerDragNodes.call(tip);
            container.call(tip);
            containerDragNodes
                .selectAll(".dragNode")
                .remove();
//            console.log(dragNodes);
            var node_ = containerDragNodes
                .selectAll(".dragNode")
                .data(dragNodes);
            node_.enter()
                .append("g")
                .attr("class", "dragNode")
                .attr("id", function (d, i) {
                    return "dragNode"+ d.data.id;
                })
                .call(drawNode)
                .call(dragBack)
                .attr("transform", function (d, i) {
                    return "translate(" + (d.y + configCluster.margin[0]) + "," + d.x + ")"
                })
                .on('mouseover', function (d) {
                    tip.show(d);
                })
                .on('mouseout', function (d) {
                    tip.hide(d);
                });


            node_.exit()
                .remove();




            var node = container.selectAll(".clusterNode")
                .data(nodes, function(d) {
                    return d.data.data.id;
                });
            var dragFlag;
            var drag = d3.drag()
                .on("drag", function(d,i) {
                    dragFlag = true;
                    d3.select("#greyRect")
                        .transition()
                        .duration(100)
                        .attr("fill", "grey")
                        .attr("opacity", 0.2);
                    d.x += d3.event.dy;
                    d.y += d3.event.dx;
                    d3.select(this).attr("transform", function(d,i){
                        return "translate(" + [ d.y,d.x ] + ")"
                    });
                    // params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
                    var nodes = params.nodes.concat(params.dragNodes);
                    // for(var i = 0, len = nodes.length; i < len; i++) {
                    //     drawKDERing(params.heat, nodes[i], params);
                    // }
                })
                .on("end", function (d, i) {
                    if(dragFlag)
                    {
                        d3.select("#greyRect")
                            .transition()
                            .duration(100)
                            .attr("fill", "white");

                        if(d.y >= configCluster.divideLine-40)
                        {
                            d.data.isDrag = true;
                            preprocess(params.tree, params);
                            params.clickedNodes.push(d);
                            pipServ.emitAddCluster(d.data.data.id);
                            //params.onSelect = true;
                            update(svg, params);
                            d3.selectAll(".dragNode")
                                .attr("transform", function (e, i) {
                                    return "translate(" + (e.y+configCluster.margin[0]) + "," + e.x + ")"
                                });


                            params.onSelect = false;
                            // params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
                            var nodes = params.nodes.concat(params.dragNodes);
                            // for(var i = 0, len = nodes.length; i < len; i++) {
                            //     drawKDERing(params.heat, nodes[i], params);
                            // }
                        }
                        else
                        {
                            d.x = d.formerX;
                            d.y = d.formerY;
                            d3.select(this)
                                .transition()
                                .duration(500)
                                .attr("transform", function(d,i){
                                    return "translate(" + [ d.y,d.x ] + ")"
                                });
                            // params.heat.clearRect(0, 0, params.heat.canvas.width, params.heat.canvas.height);
                            var nodes = params.nodes.concat(params.dragNodes);
                            // for(var i = 0, len = nodes.length; i < len; i++) {
                            //     drawKDERing(params.heat, nodes[i], params);
                            // }
                        }
                    }
                    dragFlag = false;

                });
            var nodeEnter = node.enter()
                .append("g")
                .attr("class", "clusterNode")
                .on("click", function(d) {
//                    d.expand = false;
                    if (d3.event.defaultPrevented) return;
//
                    console.log('node clicked');
                    //if(params.onSelect) {
                    //    params.clickedNodes.push(d);
                    //    pipServ.emitAddCluster(d.data.data.id);
                    //} else {
                    if(!d.load) {
                        loadServ.loadCluster(d.data.data.id, function(newCluster) {
                            d.load = true;
                            d["children"] = newCluster["children"];
                            d["allChildren"] = newCluster["allChildren"]
                            if(newCluster["children"].length !== 0) {
                                //calculate doi
                                params.doiThres = calDOI(params.root, d);
                                //refresh
                                preprocess(params.tree, params);
                                update(svg, params);
                            }
                        })
                    } else {
//                            if((d["children"] != undefined && d["children"].length !== 0) ||
//                                d["_children"] != undefined && d["_children"].length !== 0) {
////                                if(d["children"] === undefined  || d["children"].length === 0) {
////                                    d["children"] = d["_children"];
////                                    d["_children"] = undefined;
////                                } else if(d["_children"] === undefined || d["_children"].length === 0){
////                                    d["_children"] = d["children"];
////                                    d["children"] = undefined;
////                                }
//
//                                //calculate doi
                        params.doiThres = calDOI(params.root, d);
                        //refresh
                        preprocess(params.tree, params);
                        update(svg, params);
//                            }
                    }
                    //}
                })
                .attr("transform", function(d) {
                    var x, y;
                    //console.log(d);
                    if(d.parent == undefined) {
                        x = d.y;
                        y = d.x;
                    } else {
                        x = d.parent.y;
                        y = d.parent.x;
                    }
                    return "translate(" + x + "," + y + ")";
                })
                .call(drag)
                .on('mouseover', function (d) {
                    tip.show(d);
                })
                .on('mouseout', function (d) {
                    tip.hide(d);
                });

            container.selectAll('.clusterNode').transition()
                .duration(500)
                .attr("transform", function(d) {
                    return "translate(" + d.y + "," + d.x + ")";
                })

            container.selectAll('.clusterNode').call(drawNode);
            var nodeExit = node.exit().remove();

            //drawEncompass(svg, params);

            //var area = function(d, i) {
            //    var width = 2.2222;
            //    var x1 = xScale(d),
            //        x2 = xScale(ticks[i+1]),
            //        yd = 10+width/2,
            //        yu = 10-width/2;
            //    var cx = (x1 + x2) / 2,
            //        cyu = yu,//10,
            //        cyd = yd;//10;
            //    //params.expandFlag.forEach(function (y, j) {
            //    //    if(y.time == d || params.expandFlag.time)
            //    //});
            //    return "M " + x1 + "," + yd + " Q " + [cx, cyd, x2, yd].join(" ") + "L " + x2 + "," + yu + " Q " + [cx, cyu, x1, yu].join(" ") + " Z";
            //};
            //var draglink = container.selectAll(".clusterLinkDrag")
            //    .data(dragLinks, function(d) {
            //        return [d.source.data.id, d.target.data.id].join(",");
            //    })
            //
            //draglink.enter().insert("path", "g")
            //    .attr("class", "clusterLinkDrag")
            //    .attr("fill", "none")
            //    .attr("stroke", "#ccc")
            //    .attr("opacity", 0.5)
            //    .attr("d", function(d) {
            //        var o = {x: d.source.x, y: d.source.y};
            //        return diagonal({source:o, target:o});
            //    });
            //draglink.transition()
            //    .duration(500)
            //    .attr("d", function(d) {
            //        var res = {};
            //        var source = d.source,
            //            target = d.target;
            //        res["source"] = {x:source.x, y: source.y + 5};
            //        if(target.children === undefined || target.children.length === 0) {
            //            res["target"] = {x:target.x, y: target.y - target.outerRadius};
            //        } else {
            //            res["target"] = {x:target.x, y: target.y - 5};
            //        }
            //
            //        return diagonal(res);
            //    })
            //draglink.exit().remove();


            var link = container.selectAll(".clusterLink")
                .data(links, function(d) {
                    return [d.parent.data.data.id, d.data.data.id].join(",");
                })

            link.enter().insert("path", "g")
                .attr("class", "clusterLink")
                .attr("fill", "none")
                .attr("stroke", "#ccc")
                .attr("opacity", 0.5)
                // .attr("d", function(d) {
                //     var o = {x: d.source.x, y: d.source.y};
                //     return diagonal({source:o, target:o});
                // });
                .attr('d', diagonal);
            link.transition()
                .duration(500)
                // .attr("d", function(d) {
                //     var res = {};
                //     var source = d.source,
                //         target = d.target;
                //     res["source"] = {x:source.x, y: source.y + 5};
                //     if(target.children == undefined || target.children.length == 0) {
                //         res["target"] = {x:target.x, y: target.y - target.outerRadius};
                //     } else {
                //         res["target"] = {x:target.x, y: target.y - 5};
                //     }

                //     return diagonal(res);
                // })
                .attr('d', diagonal);
            link.exit().remove();
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
                expandID[d.data.data.id] = {};
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
                var dy = (expandID[d.data.data.id].yDn - expandID[d.data.data.id].yUp) * (1 - zoomFactor) / 2;
                encompassData.push({
                    sourceUp:{x: d.y+params.tranX , y: d.x+params.tranY},
                    targetUp:{x:recX, y:expandID[d.data.data.id].yUp},
                    sourceDn:{x: d.y+params.tranX , y: d.x+params.tranY},
                    targetDn:{x:recX, y:expandID[d.data.data.id].yDn}});
                encompassDataBez.push({
                    sourceUp:{x:recWidth+recX, y:expandID[d.data.data.id].yUp + dy},
                    targetUp:{x:LineEndX, y:expandID[d.data.data.id].yUp},
                    sourceDn:{x:recWidth+recX , y:expandID[d.data.data.id].yDn - dy },
                    targetDn:{x:LineEndX, y:expandID[d.data.data.id].yDn}});
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
//         var drawKDERing = function(canvas, d, params) {
//             var config = window.config.cluster;
//             var rankRange = window.config.rankRange;
//             var margin = config.margin;
// //            console.log(d.children);
// //            if(d.children !== undefined || d.children.length !== 0) {
// //
// //            } else {
//             if(d.children === undefined || d.children.length === 0) {

//                 var angScale = d3.scale.linear().domain(config.angleDomain).range([-Math.PI / 2, Math.PI * 3 / 2]);
// //                var kdeScale = d3.scale.linear().domain(config.angleDomain);
//                 var unitAngle = Math.PI * 2 / (config.angleDomain[1] - config.angleDomain[0] + 1);
//                 var rankDist = [];
//                 var rankUnit = window.config.rankRange[1] / 1200;
//                 d.data.dist.forEach(function(d) {
//                     var angle = Math.floor(d.pos / rankUnit);
//                     rankDist.push(angle);
// //                    for(var i = 0; i < d.count; i++) {
// //                        rankDist.push(d.pos);
// //                    }
//                 });
//                 //console.log(rankDist);
//                 var kde = loadServ.kde(loadServ.kernel(config.kdeKernel), angScale.ticks(config.kdeTicks))(rankDist);
//                 var min = d3.min(kde, function(d) {
//                     return d[1];
//                 });
//                 var max = d3.max(kde, function(d) {
//                     return d[1];
//                 })
//                 var unit = (max - min)/ 10;
// //                console.log(kde);
// //                var color = d3.scale.linear().domain(d3.range(min, max, unit)).range(colorbrewer["Greens"][8]);
//                 var opacityScale = d3.scale.linear().domain(d3.range(min, max, unit)).range(d3.range(0.0, 1, 0.1));
//                 var visual = d.visual.filter(function(d) {
//                     var res = false;
//                     if(d.id === "circles") {
//                         res = true;
//                     }
//                     return res;
//                 })[0];
//                 var innerRadius = visual.data[2].r + 1;
//                 var outerRadius = visual.data[1].r + 1;
//                 var r = (innerRadius + outerRadius) / 2 ;
//                 for(var i = 0, len = kde.length; i < len; i++) {
//                     var ang = angScale(kde[i][0]);
// //                    var c = color(kde[i][1]);
//                     var c = "#4fc180";

//                     canvas.lineWidth = (outerRadius - innerRadius);
//                     canvas.strokeStyle = c;
//                     canvas.fillStyle = c;
//                     canvas.beginPath();
//                     canvas.globalAlpha = opacityScale(kde[i][1]);
//                     if(d.isDrag == true)
//                         canvas.arc(d.y + margin[0], d.x, r, ang, ang + unitAngle);
//                     else
//                         canvas.arc(d.y + margin[0] + params.tranX, d.x + params.tranY, r, ang, ang + unitAngle);
// //                    canvas.moveTo(d.y + margin[0] + params.tranX, d.x + params.tranY);
// //                    canvas.arc(d.y + margin[0] + params.tranX, d.x + params.tranY, outerRadius, ang, ang + unitAngle);
// //                    canvas.arc(d.y + margin[0] + params.tranX, d.x + params.tranY, innerRadius, ang, ang + unitAngle);
//                     canvas.closePath();
//                     canvas.stroke();
//                 }
//             }

//         }
//         var drawHeatRing = function(heat, d) {
//             var config = window.config.cluster;
//             var margin = config.margin;
//             var rankRange = window.config.rankRange;
//             var config = window.config.cluster;

//             var angScale = d3.scale.linear().domain(rankRange).range([-Math.PI / 2, Math.PI * 3 / 2]);
//             if(d.children !== undefined) {

//             } else if(d.expand) {
//                 var dist = d.data.dist;
//                 var innerRadius = config.innerRadius;
//                 var outerRadius = config.middleRadius;
//                 var r = (innerRadius + outerRadius) / 2;
//                 for(var i = 0, len = dist.length; i < len; i++) {
//                     var ang = angScale(dist[i].pos);
//                     var x = d.y + r * Math.cos(ang) + margin[0],
//                         y = d.x + r * Math.sin(ang);
//                     heat.addData({
//                         x: x,
//                         y: y,
//                         value: dist[i].count
//                     })
//                 }
//             } else {
//                 var dist = d.data.dist;
//                 var innerRadius = config.innerRadius;
//                 var outerRadius = config.middleRadius;
//                 var r = (innerRadius + outerRadius) / 2;
//                 for(var i = 0, len = dist.length; i < len; i++) {
//                     var ang = angScale(dist[i].pos);
//                     var x = d.y + r * Math.cos(ang) + margin[0],
//                         y = d.x + r * Math.sin(ang);
//                     heat.addData({
//                         x: x,
//                         y: y,
//                         value: dist[i].count
//                     })
//                 }
//             }
//         }

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
                    var data;
                    if(d.visual != undefined) {
                        data = d.visual;
                    } else {
                        data = d.data.visual;
                    }
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
                        .append("g");
                    g.selectAll("g").each(function(d) {
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
            var groups = g.selectAll("circle")
                .data(d);
            groups.enter()
                .append("circle");
            groups.exit()
                .remove();
            g.selectAll("circle").attr("r", function(d) {
                    return d.r;
                })
                .attr("fill", function(d) {
                    return d.fill;
                })
                .attr("stroke", function(d) {
                    return d.stroke;
                })
                .attr("opacity", function(d) {
                    return d.opacity;
                })
                .attr("stroke-width", function(d) {
                    return d.strokeWidth;
                })
        };

        var drawArea = function(g, d, r) {
            var trend = d.data.trend;
            var max = d3.max(trend),
                min = d3.min(trend);
//            var box = config.cluster.trendBox;
            var boxHeight = r - 2,
                boxWidth = 1.732 * (r - 2);
            var scaleY = d3.scaleLinear().domain([min, max]).range([-boxHeight * 0.5, boxHeight * 0.5]),
                scaleX = d3.scaleLinear().domain([0, trend.length - 1]).range([-boxWidth * 0.5, boxWidth * 0.5]);


            var areaData = {
                data:[],
                id: d.id
            };
            for(var i = d.data.lower.length - 1; i >= 0; i--) {
                areaData.data[i] = {
                    y0: scaleY(d.data.lower[i]),
                    y1: scaleY(d.data.upper[i]),
                    x: scaleX(i),
                    id: d.id
                }
            }
            // var areaGroup = g.selectAll(".uncerArea")
            //     .data([areaData],function(d) {
            //         return d.id;
            //     });
            // areaGroup.enter()
            //     .append("path")
            //     .attr("class", "uncerArea")
            //     .attr("d", function(d) {
            //         return area(d.data);
            //     })
            //     .attr("stroke", "none")
            //     .attr("fill", "#4fc180");
            // areaGroup.exit().remove();

            var line = d3.line()
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
            root["distToRoot"] = 0;
            var stack = [root];
            while(stack.length > 0) {
                var prt = stack.pop();
                var prtID;
                if(prt.data.data == undefined) {
                    prtID = prt.data.id;
                } else {
                    prtID = prt.data.data.id;
                }
                if(node.data.data != undefined && prtID == node.data.data.id) {
                    node = prt;
                }

                if(prt["children"] !== undefined && prt["children"].length > 0) {
                    for(var i = 0, len = prt["children"].length; i < len; i++) {
                        stack.push(prt["children"][i]);
                        prt["children"][i]["distToRoot"] = prt["distToRoot"] + 1;
                    }
                }
                if(prt["_children"] !== undefined && prt["_children"].length > 0) {
                    for(var i = 0, len = prt["_children"].length; i < len; i++) {
                        stack.push(prt["_children"][i]);
                        prt["_children"][i]["distToRoot"] = prt["distToRoot"] + 1;
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
                if(ego["_children"] !== undefined && ego["_children"].length > 0) {
                    for(var i = 0, len = ego["_children"].length; i < len; i++) {
                        var child = ego["_children"][i];
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
//            console.log(root);
            return node.distToFocus + node.distToRoot;
//            root["distToRoot"] = 1;
        };

        var highlightCluster = function(nodes, params, callback) {
            var root = params.root;
            var stack = [root];
            if(nodes == undefined || nodes.length == 0) {
                return;
            }
            while(stack.length > 0) {
                var n = stack.pop();
                if(n.children !== undefined) {
                    //check childrem
                    n.highlight = undefined;
                    var children = n.children;
                    for(var i = 0; i < children.length; i++) {
                        stack.push(children[i]);
                    }
                } else {
                    //check n
                    var data = n.data.nodes;
                    var res = undefined;
                    for(var i = 0; i < nodes.length; i++) {
                        if(data.indexOf(nodes[i]) >= 0){
                            res = true;
                        }
                    }
                    n.highlight = res;
                }
            }
//            callback();
        };


        return {
            'init':init,
            'update':update,
            'preprocess':preprocess,
            'bindDrag':bindDrag,
            'drawEncompass':drawEncompass,
            'translateDragNodes':translateDragNodes,
            'highlightCluster':highlightCluster
        };

    }]);
})();