/**
 * Created by xyx on 2016/3/6.
 * PC group, compress, flow bug!!, timeAxis,
 * glyph white, rect don't move, PC bug, PC->10,,add flow group, encompass,information tip,
 * expand rect.. PC right limit
 */
(function() {
    var cluster = angular.module('shvis.rank.service', []);
    cluster.factory('RankService', ['LoadService', 'PipService', 'Heatmap', 'Detailview', function(loadServ, pipServ, heat, detail) {
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
            params.height-=70
            params.transHeight=50+70
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
            // svg.append("rect")
            //     .attr("width", 41)
            //     .attr("height", height)
            //     .attr("x", width - 40)
            //     .attr("y", 0) //100
            //     .attr("fill", "white")
            //     .attr("opacity", 1);

            // svg.append("rect")
            //     .attr("width", 20)
            //     .attr("height", 100)
            //     .attr("x", width - 20)
            //     .attr("y", 100)
            //     .attr("rx", 3)
            //     .attr("ry", 3)
            //     .attr("id", "dragBox")
            //     .attr("fill", "grey")
            //     .attr("opacity", 0.4)
            //     .attr("transform", "translate(" + 0 + "," + /*(yBox < 0?0:(yBox > 370)?370:yBox+d3.event.dy/2)*/ 0 + ")");
            // white for separate rects
            svg.append("g")
                .attr("transform", "translate(" + (0) + "," + (margin[1] + 100) + ")")
                .append("g")
                .attr("class", "separateRects");
            d3.select('[rank-view]')
                .append('div')
                .attr('id','pointHover')
                .attr('class','Dhover')
                .style('display','none')
            //init the canvas
            var canvas = document.getElementById('heatmap');
            canvas.width = width;
            canvas.height = height;
            var gl = canvas.getContext('experimental-webgl', {antialias:true});
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            var shader = heat.init(gl, params);
            params.shader = shader;
            params.hitNamesSeq = {};
            params.brushes = {};
            params.brushIndexSeq = {};
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
            if(params.cluID.length == 0) {
                params.brushPos = undefined;
                params.brushedData = [];
                params.brushRange = {};
                params.brushIndexSeq = {};
                params.hitNamesSeq = {};
                params.axisWidth = undefined;
                params.axisPos = undefined;
                params.sankeytoData = undefined;
                params.nodetoData = undefined;
                params.brushes = {};
            }
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
            // brushHit(params);
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
            var brushRange = params.brushRange;
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


            //calculate the bar height
            var brushedData = params.brushedData;
            var brushRange = params.brushRange;
            var histobarHeight = {};
            var histoData = params.histoData;
            var time = Object.keys(histoData['scaled']);
            var unitHeightSeq = {};
            var expandIntervalSeq = {};
            for(var i = 0; i < time.length; i++) {
                var data = histoData['scaled'][time[i]];
                var rankIntervals = Object.keys(data);
                var expandInterval = [];
                for(var j = 0; j < brushedData.length; j++) {
                    var item = brushedData[j].data.filter(function(d) {
                        var res = false;
                        if(d.time == time[i]) {
                            res = true;
                        }
                        return res;
                    })[0];
                    if(item != undefined) {
                        var pos = Math.floor(item.scaled / params.interval) * params.interval;
                        if(expandInterval.indexOf(pos) < 0) {
                            expandInterval.push(pos);
                        }
                    }
                }
                expandIntervalSeq[time[i]] = expandInterval;
                //h(n-x) + x * 3h = height
                //h = height/(n + 2x)
                unitHeightSeq[time[i]] = (params.height - margin[1] - margin[3] - (rankIntervals.length - 1) * 2) / (rankIntervals.length + expandInterval.length * 2);
            }
            params.unitHeightSeq = unitHeightSeq;
            params.expandIntervalSeq = expandIntervalSeq;
        };

        var layoutSankey = function(dataS, params) {
            var data = {}
            for (time in dataS) {
                data[time] = {}
                for (section in dataS[time]) {
                    data[time][section] = []
                    var o = {},widthMax=[]//每个section中当前列的最右端为多少
                    params.nodetoData[time][section].forEach(function(data){
                        if(widthMax[data.liney]==undefined) widthMax[data.liney]=0
                        widthMax[data.liney]=Math.max(widthMax[data.liney],data.cx)
                    })
                    // dataS[time][section].forEach(function(d) {
                    //     if (!o.hasOwnProperty(d.y)) {
                    //         o[d.y] = {
                    //             x: 0,
                    //             link: d.link,
                    //             r: d.r,
                    //             id: [d.id]
                    //         }
                    //     } else {
                    //         o[d.y].x++
                    //             o[d.y].id.push(d.id)
                    //     }
                    // })
                    var width = params.axisWidth[time]
                    params.nodetoData[time][section].forEach(function(d){
                        var nextTime=Object.keys(dataS)[Object.keys(dataS).indexOf(time)+1]
                        if(nextTime!=undefined){
                            var r=d.r
                            var next
                            params.nodetoData[nextTime][d.link].forEach(function(data){
                                if(data.id==d.id){
                                    next=data
                                }
                            })
                            data[time][section].push({//热力图需要加R ???
                                y: d.liney,
                                x: d.linex,
                                r: r,
                                lux: widthMax[d.liney]+r, //
                                ldx: widthMax[d.liney]+r, //
                                luy: d.cy-r+r, //r
                                ldy: d.cy+r+r, //r
                                rux: next.r + width, 
                                rdx: next.r + width, 
                                ruy: next.cy-next.r+next.r, //r
                                rdy: next.cy+next.r+next.r, //r
                                id:d.id
                            })
                        }
                    })
                }
               }

                //     var f = {}
                //     Object.keys(o).forEach(function(d) {
                //         var y = parseInt(d),
                //             x = o[d].x,
                //             link = o[d].link,
                //             r = o[d].r,
                //             id = o[d].id;
                //         f[y] = []
                //         // console.log('r'+r)
                //         var l = Object.keys(dataS).indexOf(time) + 1;
                //         var next_time = undefined;
                //         if (l < Object.keys(dataS).length) {
                //             next_time = Object.keys(dataS)[l];
                //             var ny = dataS[next_time][link].forEach(function(d, index) {
                //                 // if (id.indexOf(d.id) >= 0 && f[y].indexOf(d.y) < 0) {
                //                 var width = params.axisWidth[time]
                //                 var heightSection=0,heightLink=0
                //                 for(var i = 0;i<section;i++){
                //                     if(params.expandIntervalIndexSeq[time].indexOf(i)>=0){
                //                         heightSection+=params.unitHeightSeq[time] *3 +2
                //                     }else{
                //                         heightSection+=params.unitHeightSeq[time] +2
                //                     }
                //                 }
                //                 for(var i = 0;i<link;i++){
                //                     if(params.expandIntervalIndexSeq[next_time].indexOf(i)>=0){
                //                         heightLink+=params.unitHeightSeq[next_time] *3 +2
                //                     }else{
                //                         heightLink+=params.unitHeightSeq[next_time] +2
                //                     }
                //                 }
                //                 if(id.indexOf(d.id) >= 0) {
                //                     f[y].push(d.y)
                //                     data[time][section].push({
                //                         y: y,
                //                         x: x,
                //                         // lux:0,
                //                         // ldx:0,
                //                         // lux:22*section,
                //                         // ldy:22*section+5,
                //                         r: r,
                //                         lux: r + x * r * 2, //
                //                         ldx: r + x * r * 2,
                //                         luy: heightSection + y * r * 2, //
                //                         ldy: heightSection + y * r * 2 + 2 * d.r,
                //                         rux: r + width, 
                //                         rdx: r + width, 
                //                         ruy: heightLink + d.y * r * 2, //
                //                         rdy: heightLink + d.y * r * 2 + 2 * d.r, //
                //                     })
                //                 }
                //             })
                //         }
                //     })
                // }
            // }
            params.sankeytoData = data;
        };

        var layoutNodes = function(d, params) {//d是所有的点
            var obj = {},
                index, i, x = 0,
                y = 0,
                max = 0,
                min = 10000
            var box={},usualR=1000,brushR=1000
            var getR = function(h,w,n){
                    var i,j,k,s,l,r=0,size=1000,cha,o={r:0,i:0,j:0,k:0},maxr=0
                    for(i=1;i<=n;i++){
                        for(j=1;j<=n;j++){
                            if(i*j<=n){
                                if(n-i*j<i){
                                    l=j+1
                                    if(n==i*j)
                                        l=j
                                    r=w/2/i
                                    if(r*2*l>h)
                                        r=h/2/l
                                    // cha=i/l-w/h
                                    if(r>maxr){
                                    // if(Math.abs(cha)<Math.abs(size)){
                                        // size=cha
                                        maxr=r
                                        o.r=r
                                        o.i=i
                                        o.j=l
                                        o.k=n-i*j
                                        o.h=h
                                        o.w=w
                                        o.n=n
                                    }
                                }
                            }
                        }
                    }
                    return o
                }
            var nodeIndex={},nodeTime={},nodeSec={},sectionR={},secSum={},nodeSec2={},secbox={},nodeSec0={},nodeSec1={}
            var brushTime= Object.keys(params.brushes)
            Object.keys(params.ranges).forEach(function(time) {
                var section
                nodeIndex[time]=[],nodeTime[time]=[],nodeSec[time]=[],sectionR[time]=[],secSum[time]=[],nodeSec2[time]=[],secbox[time]=[],nodeSec0[time]=[],nodeSec1[time]=[]
                for (index = 0; index < d.length; index++) {
                    for (i = 0; i < d[index].data.length; i++) {
                        if (d[index].data[i].time == time) {
                            nodeIndex[time].push(index);//存点的序号
                            nodeTime[time][index]=i//存点的第几个数据属于当前的time
                            section = Math.floor(d[index].data[i].scaled / 50);
                            if(nodeSec[time][section]!=undefined)
                                nodeSec[time][section]++
                            else
                                nodeSec[time][section]=1//此section有多少个点
                            nodeSec0[time][section]=-1
                            nodeSec0[time][section]=0
                            nodeSec2[time][section]=0
                            var ds = 0;
                            var data = d[index].data[i]
                            data.ranks.forEach(function(d) {
                                ds += (d - data.mean) * (d - data.mean)
                            })
                            ds = (Math.sqrt(ds));
                            if (ds > max) max = ds
                            if (ds < min) min = ds
                            d[index].data[i].ds=ds
                            break;
                        }
                    }
                }
                   
                nodeSec[time].forEach(function(sum,section){
                    if(section!=undefined){
                        var height=params.unitHeightSeq[time]
                        if(params.expandIntervalIndexSeq[time].indexOf(section)>=0){
                            height*=3
                        }
                        var width=params.histoData.scaled[time][section*50].width
                        // secWidth[section]=width
                        var o=getR(height,width,sum)
                        if(o.r)
                        usualR=Math.min(o.r,usualR)
                        if(brushTime.indexOf(time)>=0){
                            brushR=Math.min(o.r,brushR)
                        }
                        // console.log(++xx)
                        // console.log(o)
                    }
                })
            })
            console.log(usualR)
            Object.keys(params.ranges).forEach(function(time) {
                var sec = {},
                    y = 0,
                    section
             
                // timeR=3
                // console.log(timeR)
                if(brushTime.indexOf(time)>=0){
                  timeR=brushR
                }else{
                    timeR=usualR
                }
                if(timeR>10){
                    timeR=10
                }
                nodeIndex[time].sort(function(a,b){
                    var ia=nodeTime[time][a],ib=nodeTime[time][b]
                    return d[b].data[ib].ds-d[a].data[ia].ds
                })
                nodeIndex[time].forEach(function(index){
                    var i=nodeTime[time][index]
                    data=d[index].data[i]
                    nodes=d[index]
                // })
                // for (index = 0; index < d.length; index++) {
                //     for (i = 0; i < d[index].data.length; i++) {
                //         if (d[index].data[i].time == time) {
                //             data = d[index].data[i];
                //             break;
                //         }
                //     }
                    // if (i == d[index].data.length) continue;//用来判断time时有没有此点
                    nodes = d[index];
                    var now_sec = Math.floor(data.scaled / 50);
                    //  now_sec=Object.keys(params.histoData.scaled[time]).length-now_sec
                    var next_sec = i < nodes.data.length - 1 ? Math.floor(nodes.data[i + 1].scaled / 50) : -1;
                    var last_sec = i != 0 ? Math.floor(nodes.data[i - 1].scaled / 50) : -1;
                    // if(next_sec!=undefined)
                    // next_sec=Object.keys(params.histoData.scaled[time]).length-next_sec

                    //  属于第几个区间
                    // var section=Object.keys(params.histoData.scaled[time]).indexOf((Math.floor(data.scaled/50)*50).toString())
                    
                     //每个unit表示time时候的单个高度，放大的在his里面乘了3 
                  
                    var height = params.unitHeightSeq[time] + 2;
                    if(!timeR) timeR=5//郭博的his移动原因
                    var r=timeR
                    // var r=params.unitHeightSeq[time]/4
                    //其实都经过了下面，放大的地方才有点的存在
                    if(params.expandIntervalIndexSeq[time].indexOf(now_sec)>=0){
                        height = params.unitHeightSeq[time] *3 +2
                        // r=params.unitHeightSeq[time]*3/6
                    }
                    // r=sectionR[now_sec]
                    if (!sec.hasOwnProperty(now_sec))
                        sec[now_sec] = {}
                    if (!sec[now_sec].hasOwnProperty(next_sec)) {
                        sec[now_sec][next_sec] = {};
                        sec[now_sec][next_sec].x = 0;
                        sec[now_sec][next_sec].y = Object.keys(sec[now_sec]).length - 1;
                    } else {
                        sec[now_sec][next_sec].x++;
                    }
                    
                    var cn=nodeSec0[time][now_sec]++
                    var cyh=cn*timeR*2+timeR
                    var cxw=nodeSec2[time][now_sec]*timeR*2
                    if(cyh+timeR>height){
                        if(nodeSec1[time][now_sec]!=-1)
                            nodeSec1[time][now_sec]=cn-1       
                    }
                    if(nodeSec1[time][now_sec]!=-1){
                       if(cn>nodeSec1[time][now_sec]){
                         cyh=timeR
                         nodeSec2[time][now_sec]++
                         cxw+=timeR*2
                         nodeSec0[time][now_sec]=1
                       } 
                    }

                    var ds = 0;
                    data.ranks.forEach(function(d) {
                        ds += (d - data.mean) * (d - data.mean)
                    })
                    ds = (Math.sqrt(ds));
                    if (ds > max) max = ds
                    if (ds < min) min = ds
                    var heightSum=0
                    for(var i = 0;i<now_sec;i++){
                        if(params.expandIntervalIndexSeq[time].indexOf(i)>=0){
                            heightSum+=params.unitHeightSeq[time] *3 +2
                        }else{
                            heightSum+=params.unitHeightSeq[time] +2
                        }
                    }

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
                        cx: r+cxw,
                        cy: heightSum+ cyh,
                        link: next_sec,
                        lastlink: last_sec,
                        ds: ds,
                        linex:cxw/r/2,//第几列
                        liney:nodeSec0[now_sec]-1//第几行
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
                })

                
                // if (obj[time] != undefined)
                //     Object.keys(obj[time]).forEach(function(section) {
                //         var key = Object.keys(obj[time][section]);
                //         for (var i0 = 0; i0 < key.length - 1; i0++) {
                //             for (var j0 = i0 + 1; j0 < key.length; j0++) {
                //                 var ik = key[i0],
                //                     jk = key[j0];
                //                 if (obj[time][section][ik][0].link > obj[time][section][jk][0].link) {
                //                     var cha = j0 - i0;
                //                     obj[time][section][ik].forEach(function(d) {
                //                         d.y += cha
                //                         d.cy += d.r * 2 * cha
                //                     })
                //                     obj[time][section][jk].forEach(function(d) {
                //                         d.y -= cha
                //                         d.cy -= d.r * 2 * cha
                //                     })
                //                     var t = obj[time][section][ik]
                //                     obj[time][section][ik] = obj[time][section][jk]
                //                     obj[time][section][jk] = t
                //                 }
                //             }
                //         }
                    // })
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
            params.nodetoData = oo
            params.nodeScale = {}

            // d3.interpolate(d3.rgb(254, 241, 221), d3.rgb(135, 0, 0));
            params.nodeScale.line = d3.scaleLinear().domain([min, max]).range([0, 1]);
            params.nodeScale.color = d3.interpolate(d3.rgb(255,231,229), d3.rgb(255,80,80))
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
        var layoutVa = function (data, params){
            var dataS={}
            Object.keys(data).forEach(function(time){
             dataS[time]={}
               Object.keys(data[time]).forEach(function(section){
                    data[time][section].forEach(function(d){
                        Object.keys(d.ranks).forEach(function(i){
                            if(!dataS[time].hasOwnProperty(i)){
                                dataS[time][i]={va:0,sum:0}
                            }
                            dataS[time][i].va+=Math.pow(d.ranks[i]-d.mean,2)/Math.pow(d.ds,2)
                            dataS[time][i].sum++
                            dataS[time][i].cl=i
                        })
                    })
                })
                Object.keys(dataS[time]).forEach(function(per){
                    dataS[time][per].va/=dataS[time][per].sum
                })
            })
            params.vatoData=dataS
        }
        var render = function(svg, params) {
            renderHistogram(svg, params);
            console.log('start')
            if(!Object.keys(params.brushes).length){//还没开始刷选的时候
                params.brushedData=params.data[0].nodes
            }
            layoutNodes(params.brushedData, params);
            layoutSankey(params.nodetoData, params);
            layoutVa(params.nodetoData, params)
            renderSankey(svg, params);
            renderNodes(svg, params);
            renderVa(svg,params);
            console.log('rank view render finished');
        };
        var renderVa = function(svg,params){
            var dataS=params.vatoData
            svg.selectAll('.vatogram').remove();
            for (var i = 0, l = Object.keys(params.histoData.scaled).length; i < l; i++) {
                var time = Object.keys(params.histoData.scaled)[i]
                var timeWidth = Object.keys(params.axisPos)
                var width = params.axisPos[timeWidth[i]]
                if (Object.keys(dataS).indexOf(time) >= 0)
                    svg.append('g')
                    .attr('class', 'vatogram')
                    // .transition().duration(500)
                    .attr('transform', 'translate(' + width + ',' + 0 + ')')
            };
            var san = svg.selectAll('.vatogram')
            .each(function(d, index) {
                var g = d3.select(this)
                var y=d3.scaleLinear().domain([0,1]).range([0, 200]);
                var dis=105
                var time = Object.keys(dataS)[index]
                var data = []
                Object.values(dataS[time]).forEach(function(d){
                    data.push(d)
                })
                var width=(params.axisWidth[time]-20)/Object.keys(dataS[time]).length
                var path = g.selectAll('.vatorect')
                        .data(data)
                        .enter()
                var text= path.append('text')
                        .text(function(d){
                            var num=d.va
                            return num.toFixed(2)
                        })
                        .attr('class','vatext')
                        .attr('transform', function(d,i){
                            var num=y(d.va)
                            if(d.va>0.3){
                                num=y(0.3)
                            }
                            return  'translate(' +(width*i+(width-2)/2)+','+(dis-num-3)+')'
                        })
                        .attr('display','none')
                        .attr('index',function(d,i){
                            return time+':'+i
                        })
                        .attr('text-anchor','middle')
                var lengend= path.append('text')
                        .text(function(d){
                            return d.cl
                        })
                        .attr('class','valengend')
                        .attr('transform', function(d,i){
                            return  'translate(' +(width*i+(width-2)/2)+','+(dis+14)+')'
                        })
                        .attr('index',function(d,i){
                            return time+':'+i
                        })
                        .attr('display','none')
                        .attr('text-anchor','middle')
                path.append('rect')
                        .attr('class','vatorect')
                        .attr('width',width)
                        .attr('transform', function(d,i){
                            return  'translate(' +(width*i)+','+(dis-70)+')'
                        })
                        .attr('height',function(d){
                            return 70
                        })
                        .attr('fill','yellow')
                        .style('opacity',0)
                        .attr('index',function(d,i){
                            return time+':'+i
                        })
                // var rect=path.append('rect')
                //         .attr('class','vatorect')
                //         .attr('width',width-2)
                //         .attr('transform', function(d,i){
                //             return  'translate(' +(width*i)+','+(dis-y(d.va))+')'
                //         })
                //         .attr('height',function(d){
                //             return y(d.va)
                //         })
                //         .attr('fill','red')
                //         .attr('index',function(d,i){
                //             return time+':'+i
                //         })
                var line="M"
                data.forEach(function(d,i){
                    var num=y(d.va)
                    if(d.va>0.3){
                        num=y(0.3)
                        g.append('circle')
                         .attr('r','3')
                         .attr('transform','translate(' +(width*i+width/2)+','+(dis-num)+')')
                         .attr('fill','#71d122')
                    }
                    if(!i){
                        line+=(width*i+width/2)+" "+(dis-num)
                    }else{
                        line+="L"+(width*i+width/2)+" "+(dis-num)
                    }
                })
                g.append('path')
                  .attr('d',line)
                  .attr('fill','none')
                  .attr('stroke','#71d122')
                  .attr('stroke-opacity','0.6')
                  .attr('stroke-width','1px')
                

                // var max=d3.max(data,function(d){return d.va})
                // var axis = d3.axisLeft().scale(d3.scaleLinear().domain([0,max]).range([y(max), 0])).ticks(5)
                // path.append('g')
                //     .attr('transform', function(d,i){
                //             return  'translate(' +(0)+','+(200-y(max))+')'
                //         })
                // .call(axis);

            
        })
                d3.selectAll('.vatogram').on('mouseover',function(){
                    d3.select(this).selectAll('path').attr('stroke-opacity','1')
                        .attr('stroke-width','2px')
                })
                d3.selectAll('.vatogram').on('mouseout',function(){
                    d3.select(this).selectAll('path').attr('stroke-opacity','0.6')
                    .attr('stroke-width','1px')
                })
                d3.selectAll('.vatorect').on('mouseover',function(){
                    var index=d3.select(this).attr('index')
                    d3.select('.vatext[index="'+index+'"]').attr('display','inline')
                    d3.select('.valengend[index="'+index+'"]').attr('display','inline')
                })
                d3.selectAll('.vatorect').on('mouseout',function(){
                    var index=d3.select(this).attr('index')
                    d3.select('.vatext[index="'+index+'"]').attr('display','none')
                    d3.select('.valengend[index="'+index+'"]').attr('display','none')
             })
        }
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
            var scale0=function(d){
                var scale0=d3.scalePow().exponent(.5)
                var min0=scale0(min),max0=scale0(max)
                var scale1 = d3.scaleLinear().domain([min0, max0]).range([0, 1])
                return scale1(scale0(d))
            }
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
            if(params.axisPos == undefined || Object.keys(params.axisPos).length == 0) {
                params.axisPos = {};
                params.axisWidth = {};
                data.forEach(function(d, i) {
                    params.axisPos[d.time] = i * params.unitWidth;
                    params.axisWidth[d.time] = params.unitWidth;
                })
            }
            var histograms = d3.selectAll('.histogram');
            histograms.transition()
                .duration(500)
                .attr('transform', function(d) {
                    return 'translate(' + params.axisPos[d.time] + ',' + params.transHeight + ')';
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
            var timeWidth = Object.keys(params.axisPos)
            var texts = d3.selectAll('.histoTimeText')
                .transition()
                .duration(500)
                .attr('transform', function(d, i) {
                    return 'translate(' + params.axisPos[timeWidth[i]] + ',' + 30 + ')';
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
            // params.gl.RGB=1000 
            heat.render(heatData, params.gl, params);
            svg.selectAll('.santogram').remove();
            for (var i = 0, l = Object.keys(params.histoData.scaled).length; i < l; i++) {
                var time = Object.keys(params.histoData.scaled)[i]
                var timeWidth = Object.keys(params.axisPos)
                var width = params.axisPos[timeWidth[i]]
                if (Object.keys(dataS).indexOf(time) >= 0)
                    svg.append('g')
                    .attr('class', 'santogram')
                    // .transition().duration(500)
                    .attr('transform', 'translate(' + width + ',' + params.transHeight + ')')
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
                    var processPath = function(line,x0,y0,x1,y1){
                        var s=1,c,y,data=[{x:x0,y:y0}]
                        for(x=x0;x<=x1;x+=s){
                            c=(x-x0)/(x1-x0)
                            y=3*Math.pow(c,2)-2*Math.pow(c,3)
                            y=y*(y1-y0)+y0
                            data.push({x:x,y:y})
                        }
                        data.push({x:x1,y:y1})
                        
                        return line(data)
                    }
                    var line0 = d3.line()
                        .x(function(d) {
                            return d.x;
                            })
                            .y(function(d) {
                            return d.y;
                            })
                        .curve(d3.curveCatmullRom.alpha(0));
                    var path = g.selectAll('.sanktopath')
                        .data(data).enter()
                        .append('path')
                        .attr('class', 'sanktopath')
                        .attr('d', function(d) {
                            return processPath(line0,d.lux,d.luy,d.rux,d.ruy)
                            // if (d.ruy < 0 || d.rux < 0 || d.lux < 0 || d.luy < 0) return
                            // var z = (d.rux - d.lux) / 2
                            // return "M" + d.lux + "," + (d.luy) + "C" + (d.lux + z) + "," + (d.luy ) + " " + (d.rux - z) + "," + (d.ruy) + " " + (d.rux) + "," + (d.ruy)
                                // + "A" +d.r+" "+d.r+", 0, 0, 0, "+ d.rdx+" "+d.rdy
                                // + "C" + (d.rdx - z) + "," + (d.rdy)
                                // + " " + (d.ldx + z) + "," + (d.ldy)
                                // + " " + d.ldx +　"," + d.ldy
                                // + "A" +d.r+" "+d.r+", 0, 0, 0, "+ d.lux+" "+d.luy
                            ;
                        })
                        .style('stroke-width', function(d) {
                            return 2
                        })
                        .attr('lineId',function(d){
                            return d.id
                        })
                        .attr('stroke','white')
                        .style('display','none')
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
                var timeWidth = Object.keys(params.axisPos)
                var width = params.axisPos[timeWidth[i]]
                if (Object.keys(dataS).indexOf(time) >= 0)
                    svg.append('g')
                    .attr('class', 'nodetogram')
                    // .transition().duration(500)
                    .attr('transform', 'translate(' + width + ',' + params.transHeight + ')')
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
                            .attr('linex',function(d) {
                                return d.linex
                            })
                            .attr('liney',function(d) {
                                return d.liney
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
                            .attr('Cirname', function(d) {
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
            params.clickNode={id:[],node:[]}
            var addClick=function(){
                //移动上去时候
                d3.select('#rankView').selectAll('.nodetoCir').on('mouseover',function(d){
                    var id='"'+d.id+'"'
                    d3.selectAll('#rankView .sanktopath[lineId='+id+']')
                        .style('display','inline')
                        .attr('stroke','red')
                    var svg=d3.select('#pointHover')
                        .style('display','inline')
                        .style('top',(d3.event.y+10)+'px')
                        .style('left',(d3.event.x+10)+'px')
                    detail.renderPoint(svg,params,[d],1)
                })
                //移出去的时候
                 d3.select('#rankView').selectAll('.nodetoCir').on('mouseout',function(d){
                    var id='"'+d.id+'"'
                    d3.selectAll('#rankView .sanktopath[lineId='+id+']')
                        .attr('stroke','white')
                        .style('display',function(d){
                            if(params.clickNode.id.indexOf(d.id)>=0){//选中的状态 还是可见的
                                return 'inline'
                            }
                            return 'none'
                        })
                      var svg=d3.select('#pointHover')
                        .style('display','none')
                })

                d3.select('#rankView').selectAll('.nodetoCir').on('click',function(d){
                    var name=d.name
                    if(params.clickNode.id.indexOf(d.id)>=0){//取消选中
                        params.clickNode.id.splice(params.clickNode.id.indexOf(d.id),1)
                        params.clickNode.node.forEach(function(node,i){
                            if(node.id==d.id){
                                params.clickNode.node.splice(i,1)
                            }
                        })
                        d3.select('#rankView')
                          .selectAll('[Cirname="'+name+'"]')
                          .attr('fill',function(d){
                              return color(line(d.ds))
                          })
                        var id='"'+d.id+'"'
                        d3.selectAll('#rankView .sanktopath[lineId='+id+']')
                            .style('display','none')

                    }else{//选中
                        var id='"'+d.id+'"'
                        d3.selectAll('#rankView .sanktopath[lineId='+id+']')
                            .style('display','inline')
                        params.clickNode.id.push(d.id)
                        params.clickNode.node.push(d)
                        d3.select('#rankView')
                          .selectAll('[Cirname="'+name+'"]')
                          .attr('fill','black')
                    }
                   

                    detail.detail(params,params.clickNode.id)
                })
            }
            addClick()
        };

        var bindDrag = function(svg, params) {

        };
        var drawHistogram = function(g, params) {
            var axisWidth = params.axisWidth;
            var unitHeightSeq = params.unitHeightSeq;
            var expandIntervalSeq = params.expandIntervalSeq;

            var expandIntervalIndexSeq = {};
            params.expandIntervalIndexSeq = expandIntervalIndexSeq;
            g.each(function(d, i) {
                var g = d3.select(this);
                var time = d.time;
                var data = Object.keys(d.data)
                    .map(function(key) {
                        return {
                            value: d.data[key],
                            key: key
                        };
                    });
                var barCounts = data.length;
                var scale = d.scale;
                var unitHeight= unitHeightSeq[time];
                var expandInterval = expandIntervalSeq[time];
                var expandIntervalIndex = [];
                expandIntervalIndexSeq[time] = expandIntervalIndex;
                var histoRects = g.selectAll('.histoRect')
                    .data(data, function(d) {
                        return d.key;
                    });
                histoRects.enter()
                    .append('rect')
                    .attr('class', 'histoRect');
                histoRects.exit()
                    .remove();
                var pos = 0;
                g.selectAll('.histoRect').transition()
                    .duration(500)
                    .attr('width', function(d) {
                        var width=scale(d.value.count) * axisWidth[time] * 0.85
                        params.histoData.scaled[time][d.key].width=width
                        return width;
                    })
                    .attr('height', function(d, i) {
                        var res = unitHeight;
                        if(expandInterval.indexOf(Number.parseInt(d.key)) >= 0) {
                            res = unitHeight * 3;
                            expandIntervalIndex.push(i);
                        }
                        return res;
                    })
                    .attr('y', function(d, i) {
                        var tmp = unitHeight;
                        if(expandInterval.indexOf(Number.parseInt(d.key)) >= 0) {
                            tmp = unitHeight * 3;
                        }
                        var res = pos;
                        pos += (tmp + 2);
                        return res;
                    })
                    .attr('x', 0)
                    .attr('fill','#a0ddff')
                    // .attr('fill', '#ace4ff')
                    .attr('opacity', 0.55);
                var brushed = function() {
                    if (!d3.event.sourceEvent) return; // Only transition after input.
                    if (!d3.event.selection) return; // Ignore empty selections.
                    params.brushes[time] = this;
                    //check hit
                    //height and expand before new brush
                    var unitHeight = params.unitHeightSeq[time];
                    var expandInterval = params.expandIntervalSeq[time];
                    var expandIntervalIndex = params.expandIntervalIndexSeq[time];
                    //calculate bar position
                    var pos = 0;
                    var barPos = [];
                    for(var i = 0; i < barCounts; i++) {
                        var range = [pos, 0];
                        if (expandIntervalIndex != undefined && expandIntervalIndex.indexOf(i) >= 0) {
                            pos += unitHeight * 3
                        } else {
                            pos += unitHeight
                        }
                        range[1] = pos
                        pos += 2;
                        barPos.push(range);
                    }
                    //find current brush position
                    var brushIndex = [];
                    var brushPos = d3.event.selection.map(function(d, i) {
                        var index;
                        for (var j = 0; j < barCounts; j++) {
                            if (d < barPos[j][1]) {
                                index = j;
                                break;
                            }
                        }
                        brushIndex.push(index);
                        return barPos[index][i]
                    });
                    params.brushIndexSeq[time] = brushIndex;

                    //calculate hit names
                    var histoData = Object.values(d.data);
                    if (params.mode == 'origin') {
                        histoData = Object.values(params.histoData.originMean[d.time]);
                    } else {
                        histoData = Object.values(params.histoData.scaledMean[d.time]);
                    }
                    var hitNames = [];
                    barPos.forEach(function(d, i) {
                        if(d[0] >= brushPos[0] && d[1] <= brushPos[1]) {
                            var objects = histoData[i].objects;
                            objects.forEach(function(d) {
                                if (hitNames.indexOf(d) < 0) {
                                    hitNames.push(d);
                                }
                            });
                        }
                    })
                    params.hitNamesSeq[time] = hitNames;
                    var intersect = hitNames;
                    Object.values(params.hitNamesSeq).forEach(function(d) {
                        intersect = intersect.filter(function(value) {
                            var res = false;
                            if(d.indexOf(value) >= 0) {
                                res = true;
                            }
                            return res;
                        });
                    });
                    var hitData = [];
                    params.data.forEach(function(rankData) {
                        var tmp = rankData.nodes.filter(function(d) {
                            var res = false;
                            if (intersect.indexOf(d.name) >= 0) {
                                res = true;
                            }
                            return res;
                        });
                        hitData = hitData.concat(tmp);
                    });
                    params.brushedData = hitData;
                    //relayout
                    var axisWidth = {};
                    var timeKeys = Object.keys(params.ranges).sort();
                    params.unitWidth = params.width / (timeKeys.length + 2 * Object.keys(params.hitNamesSeq).length);
                    timeKeys.forEach(function(d) {
                        if(params.hitNamesSeq[d] != undefined) {
                            axisWidth[d] = params.unitWidth * 3;
                        } else {
                            axisWidth[d] = params.unitWidth;
                        }
                    });
                    params.axisWidth = axisWidth;
                    var axisPos = {};
                    var pos = 0;
                    for(var i = 0; i < timeKeys.length; i++) {
                        axisPos[timeKeys[i]] = pos;
                        pos += axisWidth[timeKeys[i]];
                    }
                    params.axisPos = axisPos;
                    //move the brush region
                    process(null, params);
                    layoutHisto(params.histoData, params);
                    // layoutNodes(params.brushedData, params);
                    // layoutSankey(params.nodetoData, params);
                    var brushTimes = Object.keys(params.brushes);
                    brushTimes.forEach(function(time) {
                        var brush = params.brushes[time];
                        var data;
                        if (params.mode == 'origin') {
                            data = params.histoData.originMean[time];
                        } else {
                            data = params.histoData.scaledMean[time];
                        }
                        var brushIndex = params.brushIndexSeq[time];
                        var expandInterval = params.expandIntervalSeq[time];
                        var keys = Object.keys(data).sort(function(a,b) {
                            return Number(a) - Number(b);
                        });
                        var unitHeight = params.unitHeightSeq[time];
                        var pos = 0;
                        var barPos = {};
                        keys.forEach(function(d, i) {
                            var range = [pos, 0];
                            if(expandInterval.indexOf(Number(d)) >= 0) {
                                pos += unitHeight * 3;
                            } else {
                                pos += unitHeight;
                            }
                            range[1] = pos;
                            pos += 2;
                            barPos[d] = range;
                        })
                        brushPos = [barPos[brushIndex[0] * params.interval][0], barPos[brushIndex[1] * params.interval][1]];
                        d3.select(brush).transition().duration(500).call(d3.event.target.move, brushPos);
                        console.log(data);

                    });
                    // d3.select(this).transition().duration(500).call(d3.event.target.move, brushPos);
                    setTimeout(function() {
                        
                        render(params.svg, params);
                    }, 500);
                };
                var brush = d3.brushY()
                    .extent([
                        [0, 0],
                        [params.unitWidth / 2, (params.unitHeight + 2) * data.length]
                    ])
                    .on('end', brushed);
                // params.brushes[time] = brush;
                g.call(brush);
            });
        };

        var deleteBrushedData = function(brushed, deleted) {
            if(brushed == undefined) {
                return;
            }
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