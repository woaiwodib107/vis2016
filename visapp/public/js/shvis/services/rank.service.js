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

            svg.append("g")
                .attr('id', 'sankey-group');
            svg.append('g')
                .attr('id', 'histo-group');
            svg.append('g')
                .attr('id', 'node-group');
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
                        data[j].scaled=data[j].mean/ranges[time]*maxRank;
                    }
                }
            });
        };

        var brushHit = function(params) {
            var bandHeight = params.unitHeight + 2;
            var brushRange = params.brushRange;
            //validation of the brushRange
            Object.keys(brushRange).forEach(function(key) {
                if(params.histoData.origin[key] == undefined) {
                    delete brushedData[key];
                }
            });
            params.brushedData = undefined;
            Object.keys(brushRange).forEach(function(key) {
                    var brushPos = brushRange[key];
                    var histoData;
                    if(params.mode == 'origin') {
                        histoData = Object.values(params.histoData.origin[key]);
                    } else {
                        histoData = Object.values(params.histoData.scaled[key]);
                    }
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
            // console.log(params.brushedData);

        };

        var process = function(d, params) {
          if(d!=null && d.hasOwnProperty('nodes'))
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
            var bar = Object.values(params.histoData.scaled)[0];
            if (bar != undefined) {
                var maxBarCount = Object.keys(Object.values(params.histoData.scaled)[0]).length;
                params.unitHeight = Math.floor((height - margin[2] - margin[3] - 50) / maxBarCount);
            } else {
                params.unitHeight = 0;
            }
        };

        var layoutSankey = function(dataS,params) {
          var data={},width=params.unitWidth,height=params.unitHeight+2,id0=0;
          for(time in dataS){
            data[time]={}
            for(section in dataS[time]){
              data[time][section]=[]
              var o={}
              dataS[time][section].forEach(function(d) {
                if(!o.hasOwnProperty(d.y)){
                  o[d.y]={x:0,link:d.link,r:d.r,id:[d.id]}
                }else{
                  o[d.y].x++
                  o[d.y].id.push(d.id)
                }
              })
              var f={};
              Object.keys(o).forEach(function(d) {
                var y=parseInt(d),x=o[d].x,link=o[d].link,r=o[d].r,id=o[d].id;
                f[y]=[]
                var l=Object.keys(dataS).indexOf(time)+1;
                var next_time=undefined;
                if(l<Object.keys(dataS).length){
                  next_time=Object.keys(dataS)[l];
                  var ny=dataS[next_time][link].forEach(function(d,index) {
                    // if(id.indexOf(d.id)>=0 && f[y].indexOf(d.y)<0){//用来把重合的线去掉
                    if(id.indexOf(d.id)>=0){
                      f[y].push(d.y)
                      data[time][section].push({
                        id:d.id,
                        link:link,
                        section:parseInt(section),
                        y:y,
                        x:x,
                        // lux:0,
                        // ldx:0,
                        // lux:22*section,
                        // ldy:22*section+5,
                        r:r,
                        lux:r+x*r*2,//
                        ldx:r+x*r*2,
                        luy:height*section+y*r*2,//
                        ldy:height*section+y*r*2+2*d.r,
                        rux:r+width,//
                        rdx:r+width,//
                        ruy:height*link+d.y*r*2,//
                        rdy:height*link+d.y*r*2+2*d.r,//
                      })
                    }
                  })
                }
              })
            }
          }
          var flowLine=function(data) {
            var flowData=params.flow
            var flow=[],line={},draw=[]//flow 存在此flow中线的id  line 存line出现的flow的id
            Object.keys(flowData).forEach(function(time) {
              flowData[time].forEach(function(edge) {
                var left_bot_y=edge.left_bot_y,
                left_top_y=edge.left_top_y,
                right_bot_y=edge.right_bot_y,
                right_top_y=edge.right_top_y
                var lineData=Object.keys(data[time])
                lineData.sort(function(a,b) {
                  return parseInt(a)-parseInt(b)
                })
                flow[edge.id]=[]
                for(var i=left_top_y;i<=left_bot_y;i++){
                  var si=i.toString()
                  if(lineData.indexOf(si)<0) break;
                  for(var j=0,l=data[time][si].length;j<l;j++){
                    if(data[time][si][j].link<=right_bot_y && data[time][si][j].link>=right_top_y){
                      flow[edge.id].push(data[time][si][j])
                      if(left_bot_y-left_top_y ==right_bot_y-right_top_y && right_bot_y-right_top_y==0){
                        var linesum=0
                        data[time][left_bot_y].forEach(function(data) {
                          if(data.link==right_top_y){
                            linesum++;
                            data.draw='yes'
                            if(linesum==1)
                              data.draw='no'
                          }
                        })
                      }
                      if(!line.hasOwnProperty(data[time][si][j].id))
                        line[data[time][si][j].id]=[]
                      line[data[time][si][j].id].push(edge.id)
                    }
                  }
                }
              })
            })
            // flow.sort(function(a,b) {
            //   return a.length-b.length
            // })
            for(var i=0;i<flow.length;i++){
              if(!flow[i].length) continue
              if(flow[i].length==1){
                draw.push(flow[i][0].id)// 唯一的线被选中
                line[flow[i][0].id].forEach(function(flowid) {//让所有有此线flow 清除为length=0 flow=[]
                  flow[flowid]=[]
                })
                i=0;
              }
            }
            for(var i=0;i<flow.length;i++){
              if(!flow[i].length) continue
              if(flow[i].length){
                var choose=flow[i][Math.floor(flow[i].length/2)].id
                draw.push(choose)// 选第一个（可以随机 或者 选择一个好的）
                line[choose].forEach(function(flowid) {//让所有有此线flow 清除为length=0 flow=[]
                  flow[flowid]=[]
                })
                i=0;
              }
            }
            Object.keys(data).forEach(function(time) {
              Object.keys(data[time]).forEach(function(sec) {
                var l=data[time][sec].length
                for(var i=0;i<l;i++){
                  if(draw.indexOf(data[time][sec][i].id)<0){
                    data[time][sec].splice(i,1)
                    i=-1;l--;//结束后会 i++
                  }
                }
              })
            })
            console.log("线"+draw.length)
            return data
          }

        params.sankeytoData=flowLine(data)
        };

        var layoutNodes = function(d,params) {
          var obj={},rect_sec={},index,i,x=0,y=0,max=0,min=10000,height=params.unitHeight+2;
          Object.keys(params.ranges).forEach(function(time) {
            var sec={},y=0;
            for(index=0;index<d.length;index++){
              for(i=0;i<d[index].data.length;i++){
                if(d[index].data[i].time==time){
                  data=d[index].data[i];
                  break;
                }
              }
              if(i==d[index].data.length) continue;
              nodes=d[index];
              var now_sec=Math.floor(data.scaled/50);
              //  now_sec=Object.keys(params.histoData.scaled[time]).length-now_sec
              var next_sec=i<nodes.data.length-1?Math.floor(nodes.data[i+1].scaled/50):-1;
              var last_sec=i!=0?Math.floor(nodes.data[i-1].scaled/50):-1;
              // if(next_sec!=undefined)
              // next_sec=Object.keys(params.histoData.scaled[time]).length-next_sec

              //  属于第几个区间
              // var section=Object.keys(params.histoData.scaled[time]).indexOf((Math.floor(data.scaled/50)*50).toString())
              if(!sec.hasOwnProperty(now_sec))
                sec[now_sec]={}
              if(!sec[now_sec].hasOwnProperty(next_sec)){
                sec[now_sec][next_sec]={};
                sec[now_sec][next_sec].x=0;
                sec[now_sec][next_sec].y=Object.keys(sec[now_sec]).length-1;
              }else{
                sec[now_sec][next_sec].x++;
              }
              var r=2,ds=0;
              data.ranks.forEach(function(d) {
                ds+=(d-data.mean)*(d-data.mean)
              })
              ds=(Math.sqrt(ds));
              if(ds>max)max=ds
              if(ds<min)min=ds
              var o={
                id:nodes._id,
                name:nodes.name,
                mean:data.mean,
                scaled:data.scaled,
                ranks:[],
                r:r,
                x:sec[now_sec][next_sec].x,
                y:sec[now_sec][next_sec].y,
                section:now_sec,
                time:time,
                cx:r+sec[now_sec][next_sec].x*r*2,
                cy:height*now_sec+r+sec[now_sec][next_sec].y*r*2,
                link:next_sec,
                lastlink:last_sec,
                ds:ds,
              }
              data.ranks.forEach(function(d) {
                o.ranks.push(d)
              })
              if(o!=undefined){
                if(obj[time]==undefined){
                  obj[time]={};
                }
                if(!obj[time].hasOwnProperty(o.section)){
                  obj[time][o.section]={}
                }
                if(!obj[time][o.section].hasOwnProperty(sec[now_sec][next_sec].y))
                  obj[time][o.section][sec[now_sec][next_sec].y]=[]
                obj[time][o.section][sec[now_sec][next_sec].y].push(o)
              }
            }
            if(obj[time]!=undefined){
              rect_sec[time]=[]
              rect_sec[time].push(sec);
              Object.keys(obj[time]).forEach(function(section){
                var key=Object.keys(obj[time][section]);
                for(var i0=0;i0<key.length-1;i0++){
                  for(var j0=i0+1;j0<key.length;j0++){
                    var ik=key[i0],jk=key[j0];
                    if(obj[time][section][ik][0].link>obj[time][section][jk][0].link){
                      var cha=j0-i0;
                      obj[time][section][ik].forEach(function(d) {
                        d.y+=cha
                        d.cy+=d.r*2*cha
                      })
                      obj[time][section][jk].forEach(function(d) {
                        d.y-=cha
                        d.cy-=d.r*2*cha
                      })
                      var t=obj[time][section][ik]
                      obj[time][section][ik]=obj[time][section][jk]
                      obj[time][section][jk]=t
                    }
                  }
                }
              })
            }
          })
          // flow
          var flow={},id=0;
          var layoutFlow=function() {
          Object.keys(obj).forEach(function(time) {
            flow[time]=[]
            var linkLtoR={}
            var arrL=[]
            Object.keys(obj[time]).forEach(function(sec) {
              arrL.push(parseInt(sec))
            })
            arrL.forEach(function(section) {
              linkLtoR[section]=[]
            })
            var linkRtoL={}
            // console.log(arrL)
            Object.keys(obj[time]).forEach(function(section) {
              Object.values(obj[time][section]).forEach(function(arr) {
                arr.forEach(function(d) {
                  var next_sec=d.link
                  if(!linkRtoL.hasOwnProperty(next_sec)){
                    linkRtoL[next_sec]=[]
                  }
                  if(linkRtoL[next_sec].indexOf(section)<0){
                    linkRtoL[next_sec].push(parseInt(section))
                  }
                  if(linkLtoR[section].indexOf(next_sec)<0){
                    linkLtoR[section].push(parseInt(next_sec))
                  }
                })
              })
            })
            var Msort=function(a,b){
              return a-b
            }
            arrL.sort(Msort)

            var flowIte=function(arrOld,arr,dir) {
              // console.log(arr)
              var top_y=arr[0],bottom_y=arr[arr.length-1],last_sec=undefined,link={},arr_new=[]
              if(dir>0){
                link=linkLtoR
              }else{
                link=linkRtoL
              }
              var arr_next=[]
              for(var i=top_y;i<=bottom_y;i++){
                link[i].forEach(function(next_sec) {
                  if(arr_next.indexOf(next_sec)<0 && (arrOld.length==0 || arrOld.indexOf(next_sec)>=0))
                    arr_next.push(next_sec)
                })
              }
              arr_next.sort(Msort)
              arr_next.forEach(function(section,index) {
                if(!index){
                  top_y=section
                  bottom_y=section
                }else{
                  if(last_sec+1==section){
                    bottom_y++
                  }else{
                    arr_new=[]
                    for(var i=top_y;i<=bottom_y;i++){
                      arr_new.push(i)
                    }
                    flowIte(arr,arr_new,-dir)
                    top_y=section
                    bottom_y=section
                  }
                }
                last_sec=section
                if(index==(arr_next.length-1)){
                  if(top_y==arr_next[0] && bottom_y==arr_next[arr_next.length-1]){//不开拆分
                    if(dir>0){
                      flow[time].push({
                        id:id++,
                        left_top_y:arr[0],
                        left_bot_y:arr[arr.length-1],
                        right_top_y:arr_next[0],
                        right_bot_y:arr_next[arr_next.length-1]
                      })
                    }else{
                      flow[time].push({
                        id:id++,
                        left_top_y:arr_next[0],
                        left_bot_y:arr_next[arr_next.length-1],
                        right_top_y:arr[0],
                        right_bot_y:arr[arr.length-1]
                      })
                    }
                  }else{
                     arr_new=[]
                    for(var i=top_y;i<=bottom_y;i++){
                      arr_new.push(i)
                    }
                    flowIte(arr,arr_new,-dir)
                  }
                }
              })

            }
            var head=0,arr=[],f=1
            arrL.forEach(function(section,index) {
              if((index && section!=arrL[index-1]+1) || index==arrL.length-1){
                arr=[]
                for(var i=arrL[head];i<=arrL[index-1];i++){
                  arr.push(i)
                }
                if(arrL.length-1==index && section==arrL[index-1]+1){
                   arr.push(i)
                   f=0
                }
                head=index
                arr.sort(Msort)
                flowIte([],arr,1)
              }
            })
            if(f){
              arr=[]
              for(var i=arrL[head];i<=arrL[arrL.length-1];i++){
                arr.push(i)
              }
              arr.sort(Msort)
              flowIte([],arr,1)
            }
          })
        }
        layoutFlow()
          var oo={}
          Object.keys(obj).forEach(function(time) {
            oo[time]={}
            Object.keys(obj[time]).forEach(function(section) {
              oo[time][section]=[]
              Object.values(obj[time][section]).forEach(function(sec) {
                // if(sec!=undefined)
                sec.forEach(function(d) {
                  oo[time][section].push(d)
                })
              })
            })
          })
          params.nodetoData=oo;
          params.nodeScale={};
          params.rect_sec=rect_sec;
          params.flow=flow;

          d3.interpolate(d3.rgb(254,241,221),d3.rgb(135,0,0));
          params.nodeScale.line = d3.scaleLinear().domain([min, max]).range([0, 1]);
          params.nodeScale.color = d3.interpolate(d3.rgb(255,228,204),d3.rgb(255,120,0));

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
            renderSankey(svg,params);
            renderNodes(svg,params);
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
            params.histoData.scale=scale
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

            var histoGroup = svg.select('#histo-group')
            var bindHisto = histoGroup.selectAll('.histogram')
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
          if(params.sankeytoData==undefined)return
          var dataS = params.sankeytoData;
          svg.selectAll('.santogram').remove();
          var sankeyGroup=svg.select('#sankey-group')
          for(var i=0,l=Object.keys(params.histoData.scaled).length;i<l;i++){
            var time=Object.keys(params.histoData.scaled)[i]
            if(Object.keys(dataS).indexOf(time)>=0)
            sankeyGroup.append('g')
            .attr('class','santogram')
            // .transition().duration(500)
            .attr('transform', 'translate(' + i * params.unitWidth + ',' + 50 + ')')
          };
          // 测试 test his flow
          /*dataS=params.rect_sec
          var scale= params.histoData.scale
          var san = svg.selectAll('.santogram')
              .each(function(d,index) {
              var g=d3.select(this)
              var data=[],height=params.unitHeight+2;
              if(dataS[Object.keys(dataS)[index]]!=undefined){
                var time=Object.keys(dataS)[index]
                Object.values(dataS[time]).forEach(function(section) {
                  Object.keys(section).forEach(function(sec) {
                    var width=scale(params.histoData.scaled[time][parseInt(sec)*50].count)* params.unitWidth / 2;
                    Object.keys(section[sec]).forEach(function(sec0) {
                      var l=parseInt(sec),r=parseInt(sec0)
                      data.push({
                        lux:width,
                        ldx:width,
                        luy:height*l,//
                        ldy:height*l+(height-2),//
                        rux:params.unitWidth,//
                        rdx:params.unitWidth,//
                        ruy:height*r,//
                        rdy:height*r+(height-2),//
                        sec:sec
                      })
                    })
                  })
                })
              }
              var path=g.selectAll('.sanktopath')
                 .data(data).enter()
                 .append('path')
                 .attr('class', 'sanktopath')
                 .attr('d',function (d) {
                   if(d.ruy<0 || d.rux<0 || d.lux<0 || d.luy<0) return
                   var z=(d.rux-d.lux)/2
                   return "M" + d.lux + "," + (d.luy)
                       + "C" + (d.lux + z) + "," + (d.luy)
                       + " " + (d.rux - z) + "," + (d.ruy)
                       + " " + (d.rux) + "," + (d.ruy)
                       +"L" + (d.rdx) + "," +(d.rdy)
                       +"C" + (d.rdx - z) + "," + (d.rdy)
                       + " " + (d.ldx + z) + "," + (d.ldy)
                       + " " + d.ldx +　"," + d.ldy
                       +"L"+(d.lux)+','+d.luy
                    })
                    .attr('fill', '#7DB97B')
                    .attr('opacity',0.6)
            })*/

          // test params.flow
          var testFlow=function(){
            var dataS=params.flow,dataline=params.sankeytoData
            var width=params.unitWidth
            var height=params.unitHeight+2
            var san = sankeyGroup.selectAll('.santogram')
              .each(function(d,index) {
              var g=d3.select(this)
              var data=[]
              var scale=params.histoData.scale
              var time=Object.keys(dataS)[index]
              if(dataS[time]!=undefined){
                dataS[time].forEach(function(d) {
                  var begin=scale(params.histoData.scaled[time][d.left_top_y*50].count)* width / 2;
                  var end=scale(params.histoData.scaled[time][d.left_bot_y*50].count)* width / 2;
                  // var xmin=100000,xmax=-1000
                  // for(var i=d.left_top_y;i<=d.left_bot_y;i++){
                  //   var x=scale(params.histoData.scaled[time][i*50].count)* width / 2;
                  //   if(x<xmin) xmin=x
                  //   if(x>xmax) xmax=x
                  // }
                  var shape="path",draw='yes'
                  if(d.left_bot_y-d.left_top_y==d.right_bot_y-d.right_top_y && d.right_bot_y-d.right_top_y<=2){
                    shape="line"
                    if(d.left_bot_y-d.left_top_y==0){
                      var linesum=0
                      dataline[time][d.left_bot_y].forEach(function(data) {
                        if(data.link==d.right_top_y)
                        linesum++;
                      })
                      if(linesum==1)
                        draw='no'
                    }
                  }
                  data.push({
                    shape:shape,
                    draw:draw,
                    begin:begin,
                    end:end,
                    id:d.id,
                    lux:0,
                    luy:d.left_top_y*height,
                    ldx:0,
                    ldy:d.left_bot_y*height+height-2,
                    rux:width,
                    ruy:d.right_top_y*height,
                    rdx:width,
                    rdy:d.right_bot_y*height+height-2
                  });
                })
              }
              var path=g.selectAll('.sanktopath')
                 .data(data).enter()
                 .append('path')
                 .attr('class', 'sanktopath')
                 .attr('d',function (d) {
                   if(d.ruy<0 || d.rux<0 || d.lux<0 || d.luy<0 || d.draw=='no') return
                   var begin=(d.rux-d.begin)/2
                   var end=(d.rdx-d.end)/2
                   var mid=(d.rdy-d.ruy)/2
                  //  if((d.rdy+2-height)==d.ruy)return
                   if(d.shape=='line'){
                     if(d.begin>d.end){
                       return "M" + d.lux + "," + (d.luy+mid)
                            + "L" + d.begin + "," + (d.luy+mid)
                            + "C" + (d.begin + begin) + "," + (d.luy+mid)
                            + " " + (d.begin + begin) + "," + (d.ruy+mid)
                            + " " + (d.rux) + "," + (d.ruy+mid)
                      }
                      return "M" + d.lux + "," + (d.luy+mid)
                           + "L" + d.end + "," + (d.luy+mid)
                           + "C" + (d.end + end) + "," + (d.luy+mid)
                           + " " + (d.end + end) + "," + (d.ruy+mid)
                           + " " + (d.rux) + "," + (d.ruy+mid)
                   }
                   return "M" + d.lux + "," + (d.luy)
                        + "L" + d.begin + "," + d.luy
                        + "C" + (d.begin + begin) + "," + (d.luy)
                        + " " + (d.begin + begin) + "," + (d.ruy)
                        + " " + (d.rux) + "," + (d.ruy)
                        + "L" + (d.rdx) + "," +(d.rdy)
                        // + "A" +d.r+" "+d.r+", 0, 0, 0, "+ d.rdx+" "+d.rdy
                        + "C" + (d.end + end) + "," + (d.rdy)
                        + " " + (d.end + end) + "," + (d.ldy)
                        + " " + d.end +　"," + d.ldy
                        + "L" + d.ldx + "," + d.ldy
                        + "L" + d.lux + "," +d.luy
                        // + "A" +d.r+" "+d.r+", 0, 0, 0, "+ d.lux+" "+d.luy
                        ;
                 })
                  //  .style('stroke', '#7DB97B')
                  // .style('stroke-width',6)
                //  .attr('fill','#7DB97B')
                 .attr('fill',function(d){
                   if(d.shape=='line')
                    return 'none'
                     return '#80c41c'
                 })
                 .style('stroke-width',function(d){
                   if(d.shape=='line')
                    return (d.rdy-d.ruy)
                   return 0
                 })
                 .style('stroke', '#80c41c')
                 .style('stroke-opacity',0.5)
                 .attr('opacity',function(d){
                   if(d.shape=='line')
                    return 1
                   return 0.5
                 })
                 .attr('flowid',function(d) {
                   return d.id
                 })
               })
          }
          var line=function() {
            var scale=params.histoData.scale,width=params.unitWidth
            var dataS=params.sankeytoData;
            var san = sankeyGroup.selectAll('.santogram')
              .each(function(d,index) {
              var g=d3.select(this)
              var data=[]
              var scale=params.histoData.scale
              var time=Object.keys(dataS)[index]
              if(dataS[time]!=undefined){
                Object.values(dataS[time]).forEach(function(section) {
                  // var width=scale(params.histoData.scaled[time][parseInt(section)*50].count)* params.unitWidth / 2;
                  section.forEach(function(d) {
                    d.hisx=scale(params.histoData.scaled[time][d.section*50].count)* width / 2;;
                    // d.width=width
                    data.push(d);
                  })
                })
              }
              var path=g.selectAll('.sanktoflow')
                 .data(data).enter()
                 .append('path')
                 .attr('class', 'sanktoflow')
                 .attr('d',function (d) {
                   if(d.ruy<0 || d.rux<0 || d.lux<0 || d.luy<0) return
                   var z=(d.rux-d.hisx)/2
                   return "M" + d.lux + "," + (d.luy+d.r)
                        + "L" + (d.hisx) + "," + (d.luy+d.r)
                        + "C" + (d.hisx + z) + "," + (d.luy+d.r)
                        + " " + (d.rux - z) + "," + (d.ruy+d.r)
                        + " " + (d.rux) + "," + (d.ruy+d.r)
                        // + "A" +d.r+" "+d.r+", 0, 0, 0, "+ d.rdx+" "+d.rdy
                        // + "C" + (d.rdx - z) + "," + (d.rdy)
                        // + " " + (d.ldx + z) + "," + (d.ldy)
                        // + " " + d.ldx +　"," + d.ldy
                        // + "A" +d.r+" "+d.r+", 0, 0, 0, "+ d.lux+" "+d.luy
                        ;
                 })
                 .style('stroke-width',function(d){
                   return d.r*2
                 })
                 .style('stroke', function(d){
                  //  if(d.draw!='no')
                    return '#40a629'
                  //  return 'yellow'
                 })
                 .attr('fill','none')
                 .style('stroke-opacity',0.7)
                 .attr('lineid',function(d) {
                    return d.id
                 })
            });
          }
          testFlow()

          line();
        };

        var renderNodes = function(svg, params) {
          if(params.nodetoData==undefined)return
          var color=params.nodeScale.color
          var line=params.nodeScale.line
          var dataS = params.nodetoData;
          var nodegroup=svg.select('#node-group')
          svg.selectAll('.nodetogram').remove();
          for(var i=0,l=Object.keys(params.histoData.scaled).length;i<l;i++){
            var time=Object.keys(params.histoData.scaled)[i]
            if(Object.keys(dataS).indexOf(time)>=0)
            nodegroup.append('g')
            .attr('class','nodetogram')
            // .transition().duration(500)
            .attr('transform', 'translate(' + i * params.unitWidth + ',' + 50 + ')')
          };
          var node = nodegroup.selectAll('.nodetogram')
              .each(function(d,index) {
              var g=d3.select(this)
              var data=[]
              if(dataS[Object.keys(dataS)[index]]!=undefined){
              Object.values(dataS[Object.keys(dataS)[index]]).forEach(function(section) {
                section.forEach(function(d) {
                  data.push(d);
                })
              })
              var circle=g.selectAll('.nodetoCir')
                 .data(data).enter()
                 .append('circle')
                 .attr('class', 'nodetoCir')
                 .attr('r',function(d) {
                    return d.r
                })
                .attr('cx' ,function(d) {
                    return d.cx
                  })
                .attr('cy',function(d) {
                    return d.cy
                  })
                .attr('fill',function (d) {
                  return color(line(d.ds))
                })
                // .attr('fill','#FFCD00')
                .attr('opacity',1)
                .style('stroke', '#ffffff')
                .style('stroke-width', '0.4px')
                .style('stroke-opacity', 1)
                .attr('name',function(d) {
                  return d.name
                })
                .attr('ds',function(d){
                  return d.ds
                })
                .attr('mean',function(d) {
                  return d.mean
                })
                .attr('scaled',function(d) {
                  return d.scaled
                })
                .attr('nodeid',function(d) {
                  return d.id
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
                    // .attr('fill', '#afe5ff')
                    .attr('fill', '#75d2ff')
                    .attr('opacity', 0.6)
                    .attr('stroke', '#69c1ec')
                    .attr('stroke-width', '0.5px');
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
                        if (params.brushedData == undefined || params.brushedData.length==0) {
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
                        layoutNodes(params.brushedData,params);
                        layoutSankey(params.nodetoData,params);
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
