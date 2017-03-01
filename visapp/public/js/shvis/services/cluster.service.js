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

            // d3.select(dom).select("#cluster-svg").append('div')
            //     .attr('id','dragarea')
            //     .attr('class','dragarea')
            var svg = d3.select(dom)
                .select("#cluster-svg")
                .append("svg")
                .attr("width", width)
                .attr("height",  $('.topview').height()-$('.rankView-heading').height()-$('.rankView-heading').height());


            svg.append("rect")
                .attr("width", configCluster.divideLine)
                .attr("height", height)
                .attr("x", 0)
                .attr("y", 0)
                .attr("stroke", "none")
                .attr("opacity", 0)
                .attr("id", "greyRectBack")

            svg.append('rect')
                .attr('id','dragarea')
                .attr('class','dragarea')
                .attr('fill','#fff')
                // .attr('opacity','0')
                .attr('transform', 'translate(' + (width-100) + ',' + 0 + ')')
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
            d3.select('[cluster-view]')
                .append('svg')
                .attr('id','cluster-overview')
                .attr('width', '100px')
                .attr('height','200px')
                .style('position','absolute')
                .style('background-color','#F9F9F9')
                .style('margin-top','500px')
                .style('padding','10px 20px')//原来上下0 左右10
            d3.select('[cluster-view]')
                .append('svg')
                .attr('id','cluster-drag')
                .style('position','absolute')
                .attr('width',100)
                .attr('height',200)
                .style('border','2px solid #aaa')
                .style('top','566px')
                // .attr('opacity','0.5')
                // .style('margin-left','10px')


            //filter
            var clickF=function(){
                var time=400,sumHeight=383,sumWidth=290
                d3.select('#filter_toggle').on('click',function(){
                var filter=d3.select('#search_panel')
                var dis=parseInt(filter.style('opacity'))
                // var height=d3.scaleLinear().domain([0,time]).range([0,sumHeight])
                // var width=d3.scaleLinear().domain([0,time]).range([0,sumWidth])
                // var opacity=d3.scaleLinear().domain([0,time]).range([0,1])
                var ch=1,i=0
                if(!dis){
                    filter.transition().duration(time)
                        .style('height',sumHeight+'px')
                        .style('width',sumWidth+'px')
                        .style('opacity',1)
                        .style('margin-left',0+'px')
                    d3.select(this).select('svg').transition().duration(time).style('transform','rotateZ(-90deg)')
                }else{
                     filter.transition().duration(time)
                        .style('height',0+'px')
                        .style('width',0+'px')
                        .style('opacity',0)
                        .style('margin-left',sumWidth+'px')
                    d3.select(this).select('svg').transition().duration(time).style('transform','rotateZ(0deg)')
                }
            })
            }
            setTimeout(clickF,1000)


            return svg;
        };
        var dragNode=false,globalcx=0,globalcy=0,maxDepth=1,globaloldx=0,globaloldy=0,lastx=0,lasty=0
        var centerx=0, centery=0,globalDrag=false
        var sortDrag=function(arr,time=0){
            var width=320
            if(arr==undefined) return
            arr.forEach(function(d,index){
                var x=width+10-centerx
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
        var searchDrag = function (arr,id,o){
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
        var moveRect = function(centerx,centery,params,width){
            var path=d3.select('#clusterGroup')
            .attr('transform', 'translate('+centerx+','+centery+')')
            sortDrag(params.dragNodesArr)
             d3.select('#clusterGroup').selectAll('.node')
             .style('display',function(d){
                var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                if(index>=0){
                    return 'inline'
                }
                // if(d.x>700){
                //     console.log(123)
                // }
                if(d.x+centerx<=width-30)
                        return 'inline'
                    return 'none'
            })
             d3.select('#clusterGroup').selectAll('.clusterLink')
            .style('display',function(data){
                var d=data.target
                var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                if(index>=0){
                    return 'inline'
                }
                if(d.x+centerx<=width-30)
                    return 'inline'
                return 'none'
            })
        }
        var dragRect=function(params,cx=0,cy=0,f=0,width){
            var depth=2
            if(maxDepth<=2)
                depth=maxDepth
            var viewH = ($('#cluster-overview').height()+20)
            var viewW = ($('#cluster-overview').width()+40)
            // var dragH = $('#clusterGroup').height()
            // var dragW = $('#clusterGroup').width()
            var dragH = params.dragH
            var dragW = params.dragW
            console.log(dragH+','+dragW)
            var rectH =  $('.topview').height()-$('.rankView-heading').height()-$('.rankView-heading').height()-10
            var rectW = 300+30
            var height,width
            if(dragH/rectH<1)
                height = viewH
            else
                height=viewH*rectH/dragH
            if(dragW/rectW<1)
                width = viewW
            else
                width = viewW*rectW/dragW
            var s = d3.select('#clusterGroup').attr('transform')
            var x =parseFloat(s.substring(s.indexOf('(')+1,s.indexOf(',')))
            var y =parseFloat(s.substring(s.indexOf(',')+1,s.indexOf(')')))
            var left=-x/dragW*viewW*depth/2,top=-y/dragH*viewH
            if(f){
                left=parseFloat(d3.select('#cluster-drag').attr('lleft'))+cx
                top=parseFloat(d3.select('#cluster-drag').attr('ttop'))+cy
            }
            d3.select('#cluster-drag')
                .attr('lleft',left)
                .attr('ttop',top)
            if(width+left>viewW)
                width=viewW-left
            if(width-left>viewW){
                width=viewW+left
                left=0
            }
            if(height+top>viewH)
                height=viewH-top
            if(height-top>viewH){
                height=viewH+top
                top=0
            }
            d3.select('#cluster-drag')
               // .transition()
               // .duration(500)
                .attr('width',width)
                .attr('height',height)
            d3.select('#cluster-drag')
                // .transition()
                // .duration(500)
                .style('margin-left',left)
                .style('margin-top',top)
            if(f){
                var x=-parseFloat(d3.select('#cluster-drag').attr('lleft'))/viewW*dragW*2/depth-40
                var y=-parseFloat(d3.select('#cluster-drag').attr('ttop'))/viewH*dragH

                globalcx=centerx
                globalcy=centery
                centerx=x
                centery=y
                globalDrag=true
                globalcx-=x
                globalcy-=y
                moveRect(x,y,params,320)
            }
        }
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
            if(!params.hasOwnProperty('dragNodesArr')){
                     params.dragNodesArr=[]
            }
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
            // params.root=root
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
            var newHeight = d3.max(levelWidth) * 70;
            var layer=levelWidth.length
            var tree = d3.tree().size([newHeight, layer*78]);
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
            // var links = root.links();
            var dragWmin=100000,dragWmax=-100000,dragHmin=100000,dragHmax=-100000
            nodes.forEach(function(data,index){
                if(index!=0 && data.depth==nodes[index-1].depth){
                    if(data.y-nodes[index-1].y<=50){
                        data.y=nodes[index-1].y+50
                    }
                }
                dragWmin=Math.min(dragWmin, data.x)
                dragWmax=Math.max(dragWmax, data.x)
                dragHmin=Math.min(dragHmin, data.y)
                dragHmax=Math.max(dragHmax, data.y)

            })
            params.dragW = dragWmax - dragWmin
            params.dragH = dragHmax - dragHmin
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
            // var colorScale = d3.interpolate(d3.rgb(255,228,204),d3.rgb(255,120,0));
            var colorScale =  d3.interpolate(d3.rgb(255,231,229), d3.rgb(255,80,80))
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
                dragRect(params)
            var containerDragNodes = svg.select("#dragNodes");//ÍÏ×§½øÀ´µÄµã
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
                        if(find){
                            findNode["children"]=newCluster.children
                            //°ÑdragµÄ¸¸Ç×»¹Ô­
                        }
                        d.load=!d.load
                        preprocess("",params)
                        newUpdate()
                        d3.select('#circle'+loadId+" circle")
                            .transition().duration(500)
                            .attr('r',13)
                    })
                }else{
                    findId(d.data.data.id,params.root)
                    if(find){
                        //Òª°ÑdragµÄµãµÄ¸¸Ç×±äÎªËü
                        delete(findNode["children"])
                    }
                    d.load=!d.load
                    load.splice(load.indexOf(loadId),1)
                    preprocess("",params)
                    newUpdate()
                    d3.select('#circle'+loadId+" circle")
                        .transition().duration(500)
                        .attr('r', d.data.visual[0].data[2].r)
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

         var cx=undefined,cy=undefined
         var cwidth=$('#cluster-svg')[0].offsetLeft
         var gwidth=320+$('#cluster-svg')[0].offsetLeft

         function started(d) {
            // console.log(globalcx+','+globalcy+','+centerx+','+centery+','+globaloldx+','+globaloldy)
            var id=d.data.data.id
            if(load.indexOf(id)>=0) return
            dragNode=true
            d.path=d3.select('#line'+id).attr('oldd')
            var index=searchDrag(params.dragNodesArr,id,"")
            if(cx==undefined || globalDrag){
                if(index>=0){
                    cx=d3.event.sourceEvent.x-params.dragNodesArr[index].newx
                    cy=d3.event.sourceEvent.y-params.dragNodesArr[index].newy//Êó±êÎ»ÖÃÓëÔ­Êý¾Ý×ø±êµÄ²îÖµ
                }else{
                    cx=d3.event.sourceEvent.x-d.x
                    cy=d3.event.sourceEvent.y-d.y//Êó±êÎ»ÖÃÓëÔ­Êý¾Ý×ø±êµÄ²îÖµ
                }
                cx-=globalcx
                cy-=globalcy
                globalDrag=false
            }

            d3.select('#dragarea').attr('fill','#F9F9F9')


            // console.log('cx'+cx+'cy'+cy)
            // console.log('centerx'+centerx+'centery'+centery)
            // if(globalDrag){
            //     cx-=globalcx
            //     cy-=globalcy
            //     globalDrag=false
            // }
            // console.log('cx'+cx+'cy'+cy)
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
                    d3.select('#dragarea').attr('fill','#FFF')
                    var path=d.path
                     dragNode=false
                    // var width=parseFloat(d3.select('#greyRectBack').attr('width'))
                    if(d3.event.sourceEvent.x-cwidth>gwidth-cwidth){//Èç¹ûÍÏµ½ÁËdrag »òÕßÔÚdragÍÏ
                        if(searchDrag(params.dragNodesArr,id,"")<0){//Èç¹ûÊÇÐÂÍÏµÄ ¼ÓÈëÊý×é

                            params.dragNodesArr.push(d)
                            // d.x=width+20
                            // d.y=params.dragNodesArr.length*50+50
                            pipServ.emitAddCluster(id);
                        }
                        path=diagonal({source:{x:d.parent.x,y:d.parent.y},target:{x:x,y:y}})
                        sortDrag(params.dragNodesArr,500)//¶Ôdrag °üÀ¨´Ënode µ÷Õû
                    }else{//Èç¹ûÍÏµ½ÁË·Çdrag »òÕßÔÚ·ÇdragÍÏ
                        if(params.hasOwnProperty('dragNodesArr')){//Èç¹ûÍÏµ½ÁË·Çdrag Êý×éÖÐÉ¾³ý
                            searchDrag(params.dragNodesArr,id,'delete')
                            sortDrag(params.dragNodesArr,500)//¶Ôdrag ²»°üÀ¨´Ënode µ÷Õû
                        }
                        x=oldx,y=oldy
                        pipServ.emitDelCluster(id);
                    }
                    //´Ënode
                    if(d3.event.sourceEvent.x-cwidth<gwidth-cwidth){
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

            function globalStart () {
                if(dragNode) return
                globalDrag=true
                if(d3.event.x+cwidth>gwidth) return
                globaloldx=d3.event.x
                globaloldy=d3.event.y
                d3.event.on("drag", dragged).on("end", ended);
                function dragged(d) {
                    // console.log(centerx+','+centery)
                    // centerx=parseFloat(d3.select('#greyRectBack').attr('width'))/2-
                    // centery=parseFloat(d3.select('#greyRectBack').attr('width'))/2-d3.event.y
                    lastx=d3.event.x
                    lasty=d3.event.y
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

                    dragRect(params)
                     globaloldx=d3.event.x
                     globaloldy=d3.event.y
                    moveRect(centerx,centery,params,320)

             }
                function ended(d){

                }
            }
            var overView=function(){
                var root = params['root']
                root = d3.hierarchy(root);
                maxDepth=0
                var getDepth=function(root){
                    if(root.depth>maxDepth)
                        maxDepth=root.depth
                    if(root.children!=undefined){
                        root.children.forEach(function(d){
                            getDepth(d)
                        })
                    }
                }
                getDepth(root)
                // console.log(maxDepth)
                var svgRect = $('#cluster-overview')
                var height=svgRect.height(),width=svgRect.width()
                if(maxDepth<=2){
                    width=width*maxDepth/2
                }
                var tree = d3.tree().size([height, width]);
                tree(root)
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
                nodes.forEach(function(data,index){
                    if(index!=0 && data.depth==nodes[index-1].depth){
                        if(data.y-nodes[index-1].y<=10){
                            data.y=nodes[index-1].y+10
                        }
                    }
                })

                var links = root.links();
                nodes[0].parent={x:nodes[0].x,y:nodes[0].y}
                var svg=d3.select('#cluster-overview')
                var node = svg.selectAll(".node")
                    .data(nodes,function(d){
                        return d.data.data.id.toString()
                    })
                var newNode=node.enter()
                .append("g")
                .attr('class','node')
                .attr("transform",function(d){
                    return "translate(" + (d.x) + "," + (d.y) + ")";
                })
                newNode.append("circle")
                .attr("r", function(d,i) {
                    d.r=d.data.visual[0].data[2].r;
                    if(i==0) return 5
                    return d.r/5
                })
                .attr("fill", function(d) {
                    return d.data.visual[0].data[2].fill;
                })
                node.exit()
                    .remove();
                svg.selectAll('.node')
                    .transition()
                    .duration(500)
                    .attr("transform", function(d) {
                        return "translate(" + (d.x) + "," + (d.y) + ")";
                    })
                var link = svg.selectAll(".clusterLink")
                .data(links)
                link.enter()
                    .append("path")
                    .attr("class", "clusterLink")
                link.exit()
                    .remove();
                svg.selectAll('.clusterLink')
                .transition()
                .duration(500)
                .attr('d',function(d){
                    return diagonal(d)
                })
                dragRect(params)
            }
            var dragStart=function(){
                var oldx=d3.event.x
                var oldy=d3.event.y
                d3.event.on("drag", dragged);
                function dragged(d) {
                    // if(d3.event.x>$('#cluster-overview').width() || d3.event.y>$('#cluster-overview').height() || d3.event.x<0 || d3.event.y<0)
                    // return
                    var cx=d3.event.x-oldx
                    var cy=d3.event.y-oldy
                    dragRect(params,cx,cy,1,320)
                    oldx=d3.event.x
                    oldy=d3.event.y
                }
            }
            var newUpdate=function(){
                d3.select('#cluster-svg')
                .call(d3.drag().on("start", globalStart));
                d3.select('#cluster-drag')
                    .call(d3.drag().on("start", dragStart));
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
                    var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                    if(index>=0){
                        return "translate(" + (params.dragNodesArr[index].newx) + "," + (params.dragNodesArr[index].newy) + ")";
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

                d3.select('#cluster-svg').selectAll('.node')
                    .transition()
                    .duration(500)
                    .attr("transform", function(d) {
                       if(loadId!=undefined && d.data.data.id.toString()==loadId.toString()){
                       centerx=parseFloat(d3.select('#greyRectBack').attr('width'))/2-30-parseFloat(d.x)
                        centery=parseFloat(d3.select('#greyRectBack').attr('height'))/2-40-parseFloat(d.y)
                        // console.log('centerx'+centerx+'centery'+centery)
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
                        sortDrag(params.dragNodesArr,500)
                        d3.select('#clusterGroup')
                            .transition()
                            .duration(500)
                            .attr('transform','translate('+centerx+','+centery+')')
                     }
                        var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                        // console.log(d.data.data.id)
                        if(index>=0){
                            return "translate(" + (params.dragNodesArr[index].newx) + "," + (params.dragNodesArr[index].newy) + ")";
                        }
                        return "translate(" + (d.x) + "," + (d.y) + ")";
                    })
                    .style('display',function(d){
                        var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                        if(index>=0){
                            return 'inline'
                        }
                        if(d.x>700){
                            console.log(123)
                        }
                    if(d.x+centerx<=320-30)
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
                d3.select('#cluster-svg').selectAll('.clusterLink')
                .transition()
                .duration(500)
                .attr("d", function(d) {
                    var index=searchDrag(params.dragNodesArr,d.target.data.data.id,"")
                    if(index>=0){
                        return diagonal({source:d.source,target:{x:params.dragNodesArr[index].newx,y:params.dragNodesArr[index].newy}});
                    }
                    return diagonal(d)
                })
                .style('display',function(data){
                    var d=data.target
                    var index=searchDrag(params.dragNodesArr,d.data.data.id,"")
                    if(index>=0){
                        return 'inline'
                    }
                    if(d.x+centerx<=320-30)
                        return 'inline'
                    return 'none'
                })
                .attr("oldd", function(d) {
                    return diagonal(d)
                })
                .attr('id',function(d){
                    return 'line'+d.target.data.data.id
                })

                overView()
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
