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
            return "M" + d.source.x + "," + d.source.y
                + "C" + (d.source.x + d.target.x) / 2 + "," + d.source.y
                + " " + (d.source.x + d.target.x) / 2 + "," + d.target.y
                + " " + d.target.x + "," + d.target.y;
         }
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) {
                return '<span>' + 'cluster id: '+d.data.data.id + '</span>'})
            .offset([-12, 0]);
        var tree;
        var init = function(dom, width, height) {
            var widthCluster = configCluster.width,
                heightCluster = configCluster.height;
            var marginCluster = configCluster.margin;
            tree=d3.tree()
            .size([height-2*marginCluster[0],configCluster.divideLine-2*marginCluster[0]]);
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
            // svg.append("rect")
            //     .attr("width", width)
            //     .attr("height",height)
            //     .attr("id", "dragBox")
            //     .attr("opacity", 0);

            svg.append("g")
                .attr("id", "canvas")
                .attr("transform", "translate(" + marginCluster[0] + ")")
                .append("g")
                .attr("id", "clusterGroup");

            svg.append("g")
                .attr("id", "dragNodesGroup")
                                //.attr("transform", "translate(" + configCluster.divideLine + ",-5)")
                // .append("rect")
                // .attr("width", 120)
                // .attr("height", height)
                // .attr("x", configCluster.divideLine)
                // .attr("y", -5)
                // .attr("fill", "white")
                // .attr("opacity", 0.3)
                // .attr("stroke", "none")
                // .attr("id", "greyRect");
            svg.select("#dragNodesGroup")
                .append("g")
                .attr("id", "dragNodes");

            // svg.select("#canvas")
            //     .append("g")
            //     .attr("id", "encompass");

            return svg;
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
        var preprocess = function(x, params) {
            var configCluster = window.config.cluster;
            var widthCluster = configCluster.treeWidth,
                heightCluster = configCluster.treeHeight;
            var marginCluster = configCluster.margin;

            params.dragNodes = [];
            var root = params["root"];
            var size = [];
            var clusterNum = nodeSize(root, size);
            for(var i = 0; i < params.dragNodes.length; i++) {
                var dragNode = params.dragNodes[i];
                size.push(dragNode.data.size);
            }
            var maxHeight = clusterNum * (configCluster.maxInnerRadius + 10) * 2
            // tree.size([maxHeight, widthCluster - marginCluster[1] - marginCluster[3]]);
            params.maxHeight = maxHeight;
            params.root=root
            root = d3.hierarchy(root);
            tree(root);
            var swap=function(root){
                var t=root.x
                root.x=root.y
                root.y=t
                if(root.hasOwnProperty('children')){
                    root.children.forEach(function(data){
                     swap(data)
                    })
                }
            }
            swap(root)
            var nodes = root.descendants();
            var links = root.links();
            params["nodes"] = nodes;
            params["links"] = links;
   
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
            var colorScale = d3.interpolate(d3.rgb(255,228,204),d3.rgb(255,120,0));

            var varLineScale = d3.scaleLinear().domain(varRange).range([0, 1]);
            for(var i = 0, len = nodes.length; i < len; i++) {
                var node = nodes[i];
                // if(node.data.hasOwnProperty('visual')){
                //     continue
                // }
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
                            r: isNaN(innerRadius)?3:innerRadius,
//                            fill: colorbrewer['OrRd'][9][Math.floor(Math.random() * 5)],
                            fill: colorScale(varLineScale(node.data.data.variance)),
                            opacity: 1,
                            stroke: "#ff7800",
                            strokeWidth: 2
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
        var update = function(svg, params) {
//            console.log(params);
            var container = svg.select("#clusterGroup")
                .attr("transform", "translate(" + params.tranX + "," + params.tranY + ")");
            var containerDragNodes = svg.select("#dragNodes");//拖拽进来的点
            var find=false,findNode=undefined
            var findId=function(id,root){
                if(!find){
                    if(root.data.id.toString()==id.toString()){
                        find=true;
                        findNode=root
                    }else
                    if(root.hasOwnProperty('children'))
                        root.children.forEach( function(data){
                            if(!find)
                             findId(id,data)
                        })
                }
            }
            var nodeClick=function(d){
                if(params.hasOwnProperty('dragNodesArr') && searchDrag(params.dragNodesArr,d.data.data.id,"")>=0)
                    return 
                find=false;
                if(!d.load) {
                    loadServ.loadCluster(d.data.data.id, function(newCluster) {
                        findId(d.data.data.id,params.root)
                        if(find)
                            findNode["children"]=newCluster.children
                        d.load=!d.load
                        preprocess("",params)
                        newUpdate()
                    })
                }else{
                    findId(d.data.data.id,params.root)
                    if(find)
                        delete(findNode["children"])
                    d.load=!d.load
                    preprocess("",params)
                    newUpdate()
                }

            }
            var svg=d3.select('#clusterGroup')
            var f={}
            var disFa=function(root){
                root.id=root.data.data.id.toString()
                if(root['children']!=undefined){
                    root.children.forEach(function(d){
                        disFa(d)
                    })
                }
            }
         var drawArea = function(trend,r) {
            // if(d.depth==0) return ""
            if(trend==undefined){
                return 
            }
            var max = d3.max(trend),
                min = d3.min(trend);
            var boxHeight = r - 2,
                boxWidth = 1.732 * (r - 2);
            var scaleY = d3.scaleLinear().domain([min, max]).range([-boxHeight * 0.5, boxHeight * 0.5]),
                scaleX = d3.scaleLinear().domain([0, trend.length - 1]).range([-boxWidth * 0.5, boxWidth * 0.5]);
            var line = d3.line()
                .x(function(d, i) {
                    return scaleX(i);
                })
                .y(function(d) {
                    return scaleY(d);
                });
            return line(trend)

         }; 
         function searchDrag(arr,id,o){
            var f=-1
            arr.forEach(function(data,index){
                if(data.data.data.id==id){
                    if(o=='delete'){
                        arr.splice(index,1)
                    }
                    f=index
                }
            })
            return f
        }
         function started(d) {
            var sel = d3.select(this)
            var id=d.data.data.id
            d.path=d3.select('#line'+id).attr('oldd')
            d.oldx=d3.select('#circle'+id).attr('oldx')
            d.oldy=d3.select('#circle'+id).attr('oldy')
            d3.event.on("drag", dragged).on("end", ended);
            function dragged(d) {  
                d.x=d3.event.x
                d.y=d3.event.y
                var path=diagonal({target:{x:d.parent.x,y:d.parent.y},source:{x:d3.event.x,y:d3.event.y}})
                d3.select('#line'+id)
                .attr('d',path)
                sel.attr("transform","translate("+d3.event.x+","+d3.event.y+")")
                // console.log(d3.event.x+','+d3.event.y)

              }
                function ended(d) {
                    console.log('end'+d3.event.x+','+d3.event.y)
                    var path=d.path
                    // var width=parseFloat(d3.select('#greyRectBack').attr('width'))
                    var width=300
                    if(d3.event.x>width){
                        if(!params.hasOwnProperty('dragNodesArr'))
                            params.dragNodesArr=[]
                        if(searchDrag(params.dragNodesArr,id,"")<0){
                            params.dragNodesArr.push(d)
                            d.x=width+20
                            d.y=params.dragNodesArr.length*50+50
                            d.drag=true
                            pipServ.emitAddCluster(id);
                            console.log('true')
                            console.log(d)
                        }
                        path=diagonal({target:{x:d.parent.x,y:d.parent.y},source:{x:d.x,y:d.y}})
                    }else{
                        if(params.hasOwnProperty('dragNodesArr'))
                            searchDrag(params.dragNodesArr,id,'delete')
                        d.x=d.oldx
                        d.y=d.oldy
                        d.drag=false
                         pipServ.emitDelCluster(id);
                        console.log('false')
                        console.log(d)
                    }
                    if(d.hasOwnProperty('path')){
                        d3.select('#line'+id)
                        .transition()
                        .duration(500)
                        .attr('d',path)
                    }
                    sel
                    .transition()
                    .duration(500)
                    .attr("transform","translate("+d.x+","+d.y+")")
                }
            }
            var newUpdate=function(){
                var links=params.links
                var nodes=params.nodes
                var dragNodes = params.dragNodes;
                // tree(root);
                nodes[0].parent={x:nodes[0].x,y:nodes[0].y}
              
                var node = svg.selectAll(".node")
                    .data(nodes,function(d){
                        return d.data.data.id.toString()
                    })
                var newNode=node.enter()
                .append("g")
                .attr('class','node')
                .attr("transform",function(d){
                    // if(params.hasOwnProperty('dragNodesArr') && params.dragNodesArr.indexOf(d.data.data.id)){
                    //     return "translate(" + (d.oldx) + "," + (d.oldy) + ")"; 
                    // }
                   if(params.hasOwnProperty('dragNodesArr')){
                       var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                       if(index>=0){
                            return "translate(" + (params.dragNodesArr[index].x) + "," + (params.dragNodesArr[index].y) + ")"; 
                       }
                   }
                    return "translate(" + (d.parent.x) + "," + (d.parent.y) + ")"; 
                })
                .attr('id',function(d){
                    return 'circle'+d.data.data.id
                })
                .attr('oldx',function(d){
                    return d.parent.x
                })
                .attr('oldy',function(d){
                    return d.parent.y
                })
                newNode.call(d3.drag().on("start", started));
                newNode.append("circle")
                .attr("r", function(d) {
                    d.r=d.data.visual[0].data[2].r;
                    return d.r
                })
                .attr("fill", function(d) {
                    return d.data.visual[0].data[2].fill;
                })
                .attr("stroke", function(d) {
                    return d.data.visual[0].data[2].stroke;
                })
                .attr("opacity", function(d) {
                    return d.data.visual[0].data[2].opacity;
                })
                .attr("stroke-width", function(d) {
                    return d.data.visual[0].data[2].strokeWidth;
                })
                .on('dblclick',function(d){
                    return nodeClick(d)
                })
                newNode.append("path")
                .attr("class", "trendLine")
                .attr("d", function(d){
                    return drawArea(d.data.data.trend,d.data.visual[1].r)
                 })
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("fill", "none");

                node.exit()
                    .remove();
                
                d3.selectAll('.node')
                    .transition()
                    .duration(500)
                    .attr("transform", function(d) {
                       if(params.hasOwnProperty('dragNodesArr')){
                            var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                            if(index>=0){
                                return "translate(" + (params.dragNodesArr[index].x) + "," + (params.dragNodesArr[index].y) + ")"; 
                            }
                        }
                        return "translate(" + (d.x) + "," + (d.y) + ")"; 
                    })
                     .attr('oldx',function(d){
                        return d.x
                    })
                    .attr('oldy',function(d){
                        return d.y
                    })
                      var link = svg.selectAll(".clusterLink")
                .data(links)

                link.enter()
                    .append("path")
                    .attr("class", "clusterLink")

                link.exit()
                    .remove();
                d3.selectAll('.clusterLink')
                .transition()
                .duration(500)
                .attr("d", function(d) {
                    if(params.hasOwnProperty('dragNodesArr')){
                       var index=searchDrag(params.dragNodesArr,d.target.data.data.id,"")
                       if(index>=0){
                            return diagonal({source:d.source,target:{x:params.dragNodesArr[index].x,y:params.dragNodesArr[index].y}}); 
                       }
                   }
                    return diagonal(d)
                })
                .attr("oldd", function(d) {
                    return diagonal(d)
                })
                .attr('id',function(d){
                    return 'line'+d.target.data.data.id
                })
            }
            newUpdate()
        }
        var bindDrag = function() {
        }



        return {
            'init':init,
            'update':update,
            'preprocess':preprocess,
            'bindDrag':bindDrag,
            // 'drawEncompass':drawEncompass,
            // 'translateDragNodes':translateDragNodes,
            // 'highlightCluster':highlightCluster
        };

    }]);
})();