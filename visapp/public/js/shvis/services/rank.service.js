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
            params.data.splice(removeIndex, 1);
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
                            data[j].scaled=scaledRank
                            if (scaled[time][scaledRank] == undefined) {
                                scaled[time][scaledRank] = {
                                    objects: [],
                                    count: 0
                                };
                            }
                            scaled[time][scaledRank].count += 1;
                            scaled[time][scaledRank].objects.push(nodes[i].name);
                        }
                    }
                }
            });


        };

        var process = function(d, params) {
          if(d.hasOwnProperty('nodes'))
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
        };

        var layoutSankey = function(dataS,params) {
          var data={},width=params.unitWidth;
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
              var f={}
              Object.keys(o).forEach(function(d) {
                var y=parseInt(d),x=o[d].x,link=o[d].link,r=o[d].r,id=o[d].id;
                f[y]=[]
                var l=Object.keys(dataS).indexOf(time)+1;
                var next_time=undefined;
                if(l<Object.keys(dataS).length){
                  next_time=Object.keys(dataS)[l];
                  var ny=dataS[next_time][link].forEach(function(d,index) {
                    if(id.indexOf(d.id)>=0 && f[y].indexOf(d.y)<0){
                      f[y].push(d.y)
                      data[time][section].push({
                        y:y,
                        x:x,
                        // lux:0,
                        // ldx:0,
                        // lux:22*section,
                        // ldy:22*section+5,
                        r:r,
                        lux:r+x*r*2,//
                        ldx:r+x*r*2,
                        luy:22*section+y*r*2,//
                        ldy:22*section+y*r*2+2*d.r,
                        rux:r+width,//不知道为啥多加r
                        rdx:r+width,//
                        ruy:22*link+d.y*r*2,//
                        rdy:22*link+d.y*r*2+2*d.r,//
                      })
                    }
                  })
                }
              })
            }
          }
          params.sankeytoData=data;
        };

        var layoutNodes = function(d,params) {
          var obj={},index,i,x=0,y=0;
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
              var r=2
              var o={
                id:nodes._id,
                name:nodes.name,
                mean:data.mean,
                scaled:data.scaled,
                ranks:[],
                x:sec[now_sec][next_sec].x,
                y:sec[now_sec][next_sec].y,
                section:now_sec,
                r:r,
                time:time,
                cx:r+sec[now_sec][next_sec].x*r*2,
                cy:22*now_sec+r+sec[now_sec][next_sec].y*r*2,
                link:next_sec,
                lastlink:last_sec
              }
              data.ranks.forEach(function(d) {
                o.ranks.push(d)
              })
              if(obj[time]==undefined){
                obj[time]={};
              }
              if(!obj[time].hasOwnProperty(o.section)){
                obj[time][o.section]=[]
              }
              obj[time][o.section].push(o)
            }
          })
          params.nodetoData=obj;
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
        };

        var renderSankey = function(svg, params) {
          if(params.sankeytoData==undefined)return
          var dataS = params.sankeytoData;
          svg.selectAll('.santogram').remove();
          for(var i=0,l=Object.keys(params.histoData.scaled).length;i<l;i++){
            svg.append('g')
            .attr('class','santogram')
            // .transition().duration(500)
            .attr('transform', 'translate(' + i * params.unitWidth + ',' + 50 + ')')
          };
          var san = svg.selectAll('.santogram')
              .each(function(d,index) {
              var g=d3.select(this)
              var data=[]
              if(dataS[Object.keys(dataS)[index]]!=undefined){
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


              var path=g.selectAll('.sanktopath')
                 .data(data).enter()
                 .append('path')
                 .attr('class', 'sanktopath')
                 .attr('d',function (d) {
                   if(d.ruy<0 || d.rux<0 || d.lux<0 || d.luy<0) return
                   var z=(d.rux-d.lux)/2
                   return "M" + d.lux + "," + (d.luy+d.r)
                        + "C" + (d.lux + z) + "," + (d.luy+d.r)
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
            });
        };

        var renderNodes = function(svg, params) {
          if(params.nodetoData==undefined)return
          var dataS = params.nodetoData;
          svg.selectAll('.nodetogram').remove();
          for(var i=0,l=Object.keys(params.histoData.scaled).length;i<l;i++){
            svg.append('g')
            .attr('class','nodetogram')
            // .transition().duration(500)
            .attr('transform', 'translate(' + i * params.unitWidth + ',' + 50 + ')')
          };
          var node = svg.selectAll('.nodetogram')
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
                .attr('fill','#FFCD00')
                .attr('opacity',1)
                .attr('name',function(d) {
                  return d.name
                })
                .attr('link',function(d){
                  return d.link
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
                    .attr('height', 20)
                    .attr('y', function(d, i) {
                        return 22 * i;
                    })
                    .attr('x', 0)
                    .attr('fill', 'steelblue')
                    .attr('opacity', 0.6);
                var brushed = function() {
                    if (!d3.event.sourceEvent) return; // Only transition after input.
                    if (!d3.event.selection) return; // Ignore empty selections.
                    var brushPos = d3.event.selection.map(function(d) {
                        return Math.round(d / 22) * 22;
                    })

                    d3.select(this).transition().duration(500).call(d3.event.target.move, brushPos);
                    setTimeout(function() {
                        //check hit
                        var histoData = Object.values(d.data);
                        var hitNames = [];
                        for (var st = brushPos[0] / 22, ed = brushPos[1] / 22; st < ed; st++) {
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
                        if (params.brushedData.length == 0) {
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

                        layoutNodes(params.brushedData,params);
                        layoutSankey(params.nodetoData,params);
                        render(params.svg, params);
                    }, 500);

                };
                var brush = d3.brushY()
                    .extent([
                        [0, 0],
                        [params.unitWidth / 2, 22 * data.length]
                    ])
                    .on('end', brushed);
                g.call(brush);

            })
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
