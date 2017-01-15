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
            // tree=d3.tree()
            // .size([height-2*marginCluster[0],configCluster.divideLine-2*marginCluster[0]]);
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
            var levelWidth = [1];
            var childCount = function(level, n) {
                if (n.children && n.children.length > 0) {
                    if (levelWidth.length <= level + 1) levelWidth.push(0);
                    levelWidth[level + 1] += n.children.length;
                    n.children.forEach(function(d) {
                        childCount(level + 1, d);
                    });
                }
            };
            childCount(0, root);
            var per=70
            var newHeight = d3.max(levelWidth) * per;
            var layer=levelWidth.length

            tree = d3.tree().size([newHeight, layer*78]);
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
            var nodes = root.descendants();
            var p=nodes[2].x-nodes[1].x
            newHeight=newHeight/p*per
            tree = d3.tree().size([newHeight, layer*78]);
            tree(root);
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
            var loadId,load=[]
            var nodeClick=function(d){
                if(params.hasOwnProperty('dragNodesArr') && searchDrag(params.dragNodesArr,d.data.data.id,"")>=0)
                    return
                 find=false;
                loadId=d.data.data.id
                if(!d.load) {
                    load.push(loadId)
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
                    load.splice(load.indexOf(loadId),1)
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
            if(arr==undefined) return f
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
             var width=320
              var sortDrag=function(arr,time=0){
                  if(arr==undefined) return
                  arr.forEach(function(d,index){
                      var x=width+20-centerx
                      var y=(index+1)*50-centery
                      d.newx=x
                      d.newy=y
                      var sourcex=parseFloat(d3.select('#circle'+d.parent.data.data.id).attr('oldx'))
                      var sourcey=parseFloat(d3.select('#circle'+d.parent.data.data.id).attr('oldy'))
                      var path=diagonal({source:{x:sourcex,y:sourcey},target:{x:x,y:y}})
                    d3.select('#line'+d.data.data.id)
                        .transition()
                        .duration(time)
                        .attr('d',path)
                    d3.select('#circle'+d.data.data.id)
                    .transition()
                    .duration(time)
                    .attr("transform","translate("+x+","+y+")")
                  })
              }
         var cx=undefined,cy=undefined
         var centerx=0, centery=0,globalDrag=false
         var cwidth=$('#cluster-svg')[0].offsetLeft
         function started(d) {
            var id=d.data.data.id
            if(load.indexOf(id)>=0) return 
            dragNode=true 
            d.path=d3.select('#line'+id).attr('oldd')
            var index=searchDrag(params.dragNodesArr,id,"")
            if(cx==undefined || globalDrag){
                if(index>=0){
                    cx=d3.event.sourceEvent.x-params.dragNodesArr[index].newx
                    cy=d3.event.sourceEvent.y-params.dragNodesArr[index].newy//鼠标位置与原数据坐标的差值
                }else{
                    cx=d3.event.sourceEvent.x-d.x
                    cy=d3.event.sourceEvent.y-d.y//鼠标位置与原数据坐标的差值
                }
                cx-=globalcx
                cy-=globalcy
                globalDrag=false
            }
            console.log('cx'+cx+'cy'+cy)
            console.log('centerx'+centerx+'centery'+centery)
            // if(globalDrag){
            //     cx-=globalcx
            //     cy-=globalcy
            //     globalDrag=false
            // }
            console.log('cx'+cx+'cy'+cy)
            var x=d.x,y=d.y,oldx=x,oldy=y
            d3.event.on("drag", dragged).on("end", ended);

            function dragged(d) { 
                x=d3.event.sourceEvent.x-cx
                y=d3.event.sourceEvent.y-cy
                var path=diagonal({source:{x:d.parent.x,y:d.parent.y},target:{x:x,y:y}})
                d3.select('#line'+id)
                .attr('d',path)
                d3.select('#circle'+id)
                .attr("transform","translate("+x+","+y+")")
                // console.log(d3.event.sourceEvent.x+','+d3.event.sourceEvent.y)
              }

                function ended(d) {
                    var path=d.path
                     dragNode=false
                    // var width=parseFloat(d3.select('#greyRectBack').attr('width'))
                    if(d3.event.sourceEvent.x-cwidth>width){//如果拖到了drag 或者在drag拖
                        if(!params.hasOwnProperty('dragNodesArr'))
                            params.dragNodesArr=[]
                        if(searchDrag(params.dragNodesArr,id,"")<0){//如果是新拖的 加入数组

                            params.dragNodesArr.push(d)
                            // d.x=width+20
                            // d.y=params.dragNodesArr.length*50+50
                            pipServ.emitAddCluster(id);
                        }
                        path=diagonal({source:{x:d.parent.x,y:d.parent.y},target:{x:x,y:y}})
                        sortDrag(params.dragNodesArr,500)//对drag 包括此node 调整
                    }else{//如果拖到了非drag 或者在非drag拖
                        if(params.hasOwnProperty('dragNodesArr')){//如果拖到了非drag 数组中删除
                            searchDrag(params.dragNodesArr,id,'delete')
                            sortDrag(params.dragNodesArr,500)//对drag 不包括此node 调整
                        }
                        x=oldx,y=oldy
                        pipServ.emitDelCluster(id);
                    }
                    //此node
                    if(d3.event.sourceEvent.x-cwidth<width){
                        if(d.hasOwnProperty('path')){
                            d3.select('#line'+id)
                            .transition()
                            .duration(500)
                            .attr('d',path)
                        }
                        d3.select('#circle'+id)
                        .transition()
                        .duration(500)
                        .attr("transform","translate("+x+","+y+")")
                    }
                }
            }
            var dragNode=false,globalcx=0,globalcy=0
            function globalStart () {
                if(dragNode) return
                globalDrag=true
                if(d3.event.x+cwidth>width) return 
                var globaloldx=d3.event.x
                var globaloldy=d3.event.y
                d3.event.on("drag", dragged).on("end", ended);
                function dragged(d) {
                    console.log(centerx+','+centery)
                    // centerx=parseFloat(d3.select('#greyRectBack').attr('width'))/2-
                    // centery=parseFloat(d3.select('#greyRectBack').attr('width'))/2-d3.event.y
                    var path=d3.select('#clusterGroup')
                            .attr('transform')
                    var x=parseFloat( path.substring(path.indexOf('(')+1,path.indexOf(',')))
                    var y=parseFloat( path.substring(path.indexOf(',')+1,path.indexOf(')')))
                    globalcx=centerx                   
                    globalcy=centery
                    centerx=x+d3.event.x-globaloldx
                    centery=y+d3.event.y-globaloldy
                    globalcx-=centerx
                    globalcy-=centery
                    var path=d3.select('#clusterGroup')
                    .attr('transform', 'translate('+centerx+','+centery+')')
                    sortDrag(params.dragNodesArr)
                     globaloldx=d3.event.x
                     globaloldy=d3.event.y
                     d3.selectAll('.node')
                     .style('display',function(d){
                        if(params.hasOwnProperty('dragNodesArr')){
                            var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                            if(index>=0){
                                return 'inline'
                            }
                        }
                        if(d.x>700){
                            console.log(123)
                        }
                    if(d.x+centerx<=width-30)
                            return 'inline'
                        return 'none'
                    })
                 d3.selectAll('.clusterLink')
                .style('display',function(data){
                    var d=data.target
                    if(params.hasOwnProperty('dragNodesArr')){
                        var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                        if(index>=0){
                            return 'inline'
                        }
                    }
                    if(d.x+centerx<=width-30)
                        return 'inline'
                    return 'none'
                })
            
             }
                function ended(d){
                    
                }
            }
            var newUpdate=function(){
                d3.select('#cluster-svg')
                .call(d3.drag().on("start", globalStart));
                cx=undefined,cy=undefined
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
                            return "translate(" + (params.dragNodesArr[index].newx) + "," + (params.dragNodesArr[index].newy) + ")"; 
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
                       if(loadId!=undefined && d.data.data.id.toString()==loadId.toString()){
                       centerx=parseFloat(d3.select('#greyRectBack').attr('width'))/2-30-parseFloat(d.x)
                        centery=parseFloat(d3.select('#greyRectBack').attr('height'))/2-40-parseFloat(d.y)
                        console.log('centerx'+centerx+'centery'+centery)
                        // params.dragNodesArr.forEach(function(data,index){
                        //         data.x-=centerx-parseFloat(d.x)
                        //         data.y-=centery-parseFloat(d.y)
                        //         var  path=diagonal({target:{x:data.parent.x,y:data.parent.y},source:{x:data.x,y:data.y}})
                        //         d3.select('#line'+data.data.data.id)
                        //             .transition()
                        //             .duration(500)
                        //             .attr('d',path)
                        //         d3.select('#circle'+data.data.data.id)
                        //         .transition()
                        //         .duration(500)
                        //         .attr("transform","translate("+data.x+","+data.y+")")
                        // })
                        d3.select('#clusterGroup')
                            .transition()
                            .duration(500)
                            .attr('transform','translate('+centerx+','+centery+')')
                        sortDrag(params.dragNodesArr)
                     }
                       if(params.hasOwnProperty('dragNodesArr')){
                            var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                            // console.log(d.data.data.id)
                            if(index>=0){
                                return "translate(" + (params.dragNodesArr[index].newx) + "," + (params.dragNodesArr[index].newy) + ")"; 
                            }
                        }
                        return "translate(" + (d.x) + "," + (d.y) + ")"; 
                    })
                    .style('display',function(d){
                        if(params.hasOwnProperty('dragNodesArr')){
                            var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                            if(index>=0){
                                return 'inline'
                            }
                        }
                        if(d.x>700){
                            console.log(123)
                        }
                    if(d.x+centerx<=width-30)
                            return 'inline'
                        return 'none'
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
                            return diagonal({source:d.source,target:{x:params.dragNodesArr[index].newx,y:params.dragNodesArr[index].newy}}); 
                       }
                   }
                    return diagonal(d)
                })
                .style('display',function(data){
                    var d=data.target
                    if(params.hasOwnProperty('dragNodesArr')){
                        var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                        if(index>=0){
                            return 'inline'
                        }
                    }
                    if(d.x+centerx<=width-30)
                        return 'inline'
                    return 'none'
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