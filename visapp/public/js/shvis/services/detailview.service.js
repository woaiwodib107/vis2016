'use strict';
(function() {
    var detailview = angular.module('shvis.detailview.service', []);
    detailview.factory('Detailview', ['LoadService', 'PipService', function(loadServ, pipServ) {
       var flowersId={}
       var detail=function(params,node){
          layoutDetail(params,node)
          renderinit(params,node)
          renderPoint(d3.select('#detailPoint'),params,node)
          if(node.length){
            renderDetail(params,node[node.length-1])
          }
        //   renderDetail(params,clickNode)
       }
        var layoutDetail=function(params,node){
            flowersId={}
            node.forEach(function(d){
                flowersId[d]=[]
            })
            Object.keys(params.nodetoData).forEach(function(time){
                Object.keys(params.nodetoData[time]).forEach(function(section){
                    params.nodetoData[time][section].forEach(function(data){
                        if(node.indexOf(data.id)>=0){
                            data.ranks.forEach(function(rank,i){
                                var f=false
                                flowersId[data.id].forEach(function(d){
                                    if(d.id==data.id && d.species==i){
                                        d[time]=rank
                                        f=true
                                    }
                                })
                                if(!f){
                                    var o={species:i,id:data.id,name:data.name}
                                    o[time]=rank
                                    flowersId[data.id].push(o)
                                }
                            }) 
                        }
                    })
                })
            })
         

            
       }
       var renderinit=function(params,node){
           var svg=d3.select('#detail-svg svg')
            .attr('height','430px').attr('width','100%')
            if(d3.select('#detailLegend').node()==null){
            //   d3.select('#detail-svg').append('div')
            //     .attr('id','detailBox0')
            //     .attr('class','detailBox')
            //     .append('div')
            //     .attr('id','detailBox')
              d3.select('#search_panel').append('div')
                 .html(
                     '<div id="detailPoint" class="panel-group" id="accordion" role="tablist" aria-multiselectable="true" style="margin:-40px 5px 0px 5px;overflow:scroll;height:800px">'
                 )
                //  .attr('id','detailPoint')
                //  .attr('class','detail-point')
            d3.select('#detail-svg').append('div')
                .attr('class','detailChoose')
                .html(
                    '<div class="btn-group" data-toggle="buttons">' +
                    '<label class="btn btn-primary active">' +
                        '<input type="radio" name="options" id="option1" autocomplete="off" checked>SHOW' +
                    '</label>' +
                    '<label class="btn btn-primary">' +
                        '<input type="radio" name="options" id="option2" autocomplete="off"> HIDE' +
                    '</label>' +
                    '</div>'
                )
                $(document).off('.data-api')
              svg.append('g')
                 .attr('id','detailLegend')
                //  .attr('transform','translate(1520,210)')
              svg.append('g')
                 .attr('id','detailFore')
                 .attr("class", "foreground")
                 .attr('transform','translate(70,38)')
           }else{
               if(!node.length){
                    d3.select('#detailBox0').remove()
                    d3.select('#detailPoint').remove()
                    d3.select('#detailFore').remove()
                    d3.select('#detailLegend').remove()
                    d3.select('.detailChoose').remove() 
               }
           }

       }
       var renderPoint=function(svg,params,node,f=0){
        //   var svg=d3.select('#detail-svg svg')
            if(!f){
                var node=params.clickNode.node
            }
            var color = params.nodeScale.color
            var line = params.nodeScale.line
            var r=30
            var point=svg
                      .selectAll('.Drect')
                      .data(node,function(d){
                          return d.id
                      })
                // if(!f && node.length==2){
                //     $('#detailPoint [aria-controls]').parent().next().collapse('toggle')
                // }
                // if(!f){
                //     $('#detailPoint [aria-controls]').parent().next().collapse('hide')
                // }
                var exitIn=""
                if(f) exitIn=" in"
                var height=200
                var marginTop=(height/2)-50
                var rect=point.enter()
                     .append('div')
                     .attr('class','Drect panel panel-default')
                // var per=rect.append('div')  
                rect.html(function(d){
                    // var s='<div class="Drect panel panel-default">'+
                        var s='<div class="panel-heading" role="tab" id="heading'+d.id+'">'+
                    '<a role="button" data-toggle="collapse" data-parent="#detailPoint"aria-controls="collapse'+d.id+'">'+
                        d.name+
                    '</a>'+
                '</div>'+
                '<div nodeId='+d.id+' id="collapse'+d.id+'" class="panel-collapse collapse'+exitIn+'" role="tabpanel" aria-expanded="false"  aria-labelledby="heading'+d.id+'">'+
                            '<div class="panel-body">'+
                                '<p>'+
                                        'Anim pariatur cliche reprehenderit, enim eiusmod high'+
                                '</p>'+
                            '</div>'+
                            '<table class="table">'+
                                '<thead>'+
                                    '<tr>'+
                                    '<th>SUM</th>'+
                                    '<th>2004</th>'+
                                    '<th>2005</th>'+
                                    '<th>2006</th>'+
                                    '</tr>'+
                                '</thead>'+
                            '<tbody> <tr> <th>10</th><td>3</td> <td>4</td> <td>3</td> </td> </tbody>'+
                            '</table>'+
                            '</div>'
                        // '</div>'
                        return s
                    })
                if(!f){
                $('#detailPoint [aria-controls]').parent().next().collapse('hide')
                var id='"collapse'+params.clickNode.id[params.clickNode.id.length-1]+'"'
                $('#detailPoint [aria-controls='+id+']').parent().next().collapse('show')
                $('#detailPoint [aria-controls='+id+']').on('click',function(){
                    var node =$(this).parent().next() 
                    var f=node.hasClass('in')
                    if(!f){
                        renderDetail(params,node.attr('nodeId'))
                        $('#detailPoint [aria-controls]').parent().next().collapse('hide')
                    }
                    console.log(f)
                    node.collapse('toggle')
                    console.log(node.hasClass('in'))
                })
                }
                point.exit().remove() 
              
       }
       var renderDetail=function(params,id){
            var flowers=flowersId[id]
            var traits =[]
            var species=[]
            flowers.forEach(function(d){
                species.push(d.species)//几种评分
                Object.keys(d).forEach(function(data){
                    if(traits.indexOf(data)<0)
                        traits.push(data)//年份 几个轴
                })
            })
            traits.splice(traits.length-3,3)
            // species = ['0','1','2','3','4','5','6','7','8','9']//几种评分
            var pathColor=d3.scaleOrdinal(d3.schemeCategory20)
            var x = d3.scaleBand().domain(traits).range([0, 2085])
            var y = {}
            traits.forEach(function(d,i) { 
                y[d] = d3.scaleLinear()
                    // .domain(d3.extent(flowers, function(p) { return p[d]; }))
                    .domain([0,params.ranges[d]])
                    .range([0,parseInt(d3.select('#detail-svg svg').attr('height'))-55]);
            });


            var svg=d3.select('#detail-svg svg')

            d3.select('#detailBox div').remove()
            var box="detailBox"
            var boxData=[]
            traits.forEach(function(time,i){
                var o={name:time+'年',type:'box',  boxpoints: 'suspectedoutliers',   
                     marker: {
                        // color: 'red',//整体的颜色
                        outliercolor: 'red',//怀疑的中间颜色
                        size : 10,
                        line: {
                            outliercolor: 'black',//怀疑的变是黑色
                            outlierwidth: 3
                        }
                    },
                }
                o.y=[]
                flowers.forEach(function(s,i){
                    o.y.push(s[time])
                    // if(s.species==d){
                    //     Object.values(s).forEach(function(v){
                    //         o.y.push(v)
                    //     })
                    // }
                })
                boxData.push(o)
            })
            var title={
                     title: flowers[0].name+" "+traits[0]+'~'+traits[traits.length-2],
                        yaxis: {
                            title: 'rank',
                            titlefont: {
                            family: 'Courier New, monospace',
                            size: 18,
                            color: '#7f7f7f'
                         },
                            autorange:true,
                            mirror: true,
                            range:[1000,0]
                        }
                    }
            var con={
                displayModeBar: false,
                scrollZoom: true,
                displaylogo:false
            }
            // Plotly.newPlot(box, boxData,title,con);
            var plotDate={}
            boxData.forEach(function(d,i){
                var o=[]
                d.y.forEach(function(data,i){
                    o.push(-data)
                })
                plotDate[parseInt(d.name)]=o

            })
            $('#detail-svg [name="options"]').on('click',function(){
                $('#detail-svg [name="options"]').parent().removeClass('active')
                $(this).parent().addClass('active')
                if($(this).attr('id')=='option1'){
                    d3.selectAll('#detail-svg .boxplot-g')
                        .style('opacity',1)
                }else{
                    d3.selectAll('#detail-svg .boxplot-g')
                        .style('opacity',0)
                }
                // $('#detail-svg [name="options"]').button('reset')
                // $(this).button('toggle')
            })

            

            // Add a group element for each trait.
            d3.select('#detailFore').selectAll(".trait").remove()
            var g = d3.select('#detailFore').selectAll(".trait")
                .data(traits)
                .enter().append("svg:g")
                .attr("class", "trait")
                .attr("transform", function(d) {
                    // d3.select(this).append('text').attr('transform',"translate(" + 0+','+(-18) + ")").text(d)
                    //     .attr("text-anchor", "middle")
                    return "translate(" + x(d) + ")"; 
                })
           // Add foreground lines.
            d3.select('#detailFore')
                .selectAll("path").remove()
           var foreground = d3.select('#detailFore')
                .selectAll("path")
                .data(flowers)
            var foreLine=foreground.enter()
            foreLine.append("svg:path")
                .attr("d", path)
                .attr('stroke','white')
                .style('opacity','0')
                .attr('stroke-width','30px')
                .attr('species',function(d){
                    return d.species
                })
            
            //画细线
            foreLine.append("svg:path")
                .attr("d", path)
                .attr("stroke", '#5d5d5d')
                .attr('stroke-width','1px')
                .attr('class','linepath')
                .attr('species',function(d){
                    return d.species
                })
            foreground.exit().remove()
            var chart = d3.box()
                .whiskers(iqr(1.5))
                .width(30)
                .height(378);

                d3.selectAll("#detailFore .boxplot-g").remove()
                traits.forEach(function(d){
                    var chartTime=chart.domain([-params.ranges[d],0])
                    d3.select("#detailFore")
                        .append('g')
                        .attr('class','boxplot-g')
                        .attr("transform", "translate(" + (x(d)-15)+")")
                        .selectAll(".boxplot")
                        .data([plotDate[d]])
                        .enter().append("g")
                        .attr("class", "boxplot")
                        .append("g")
                        .call(chartTime);
                })
                if(d3.select('#detailFore .boxplot circle').node()!=null){
                    // var cx=parseInt(d3.select('#detailFore .boxplot circle').attr('cx'))
                    d3.selectAll('#detailFore .boxplot circle')
                    .style('fill','red')
                }
            // Add an axis and title.
            g.append("svg:g")
                .attr("class", "axis")
                .each(function(d,i) {
                    d3.select(this).call(d3.axisLeft().scale(y[d]).ticks(8)); 
                    // if(!i){
                    //     d3.select(this).call(d3.axisRight().scale(y[d]).ticks(5)); 
                    // } 
                    // else{
                    //     d3.select(this).call(d3.axisLeft().scale(y[d]).ticks(5)); 
                    // }
                })
                .append("svg:text")
                .attr("text-anchor", "middle")
                .attr("y", -9)
                .text(String);
                var x1=parseInt(d3.select('#detailFore .tick text').attr('x'))
                var x2=parseInt(d3.select('#detailFore .tick line').attr('x2'))
                d3.selectAll('#detailFore .tick text').attr('x',x1-10)
                d3.selectAll('#detailFore .tick line').attr('x2',x2)

            //  d3.select('#detailFore')
            //     .selectAll(".axis text[text-anchor]")
            //     .style('font-weight','bold')
            //     .style('fill', 'black')
            //添加矩形和移动字体
             var smallText=d3.select('#detailFore')
                .selectAll('.boxplot g text').nodes()
            var smallRect=d3.select('#detailFore')
                .selectAll('.boxplot g .smallRect').nodes()
                smallRect.forEach(function(d,i){
                    var svg=d3.select(d)
                    var svgT=d3.select(smallText[i])
                    var height=$(smallText[i]).height()
                    var width=$(smallText[i]).width()
                    var x=parseInt(svgT.attr('dx'))
                    var y=parseInt(svg.attr('y'))-height/2-1
                    var x0=parseInt(svg.attr('x'))
                    var y0=parseInt(svgT.attr('y'))+2
                    if(x<0){
                        x-=width
                    }else{
                        x+=x0
                    }
                    if(i%5==1){//移动到中间
                        svgT.attr('text-anchor','end')
                        svgT.attr('dx',Math.abs(30-width)/2-1)
                        y0=y0-height/2-2-7
                        if(width<30){
                            x=1
                        }else{
                         x=-Math.abs(30-width)/2
                        }
                        y=y-height/2-2-7
                    }
                    svg.attr('height',height)
                        .attr('width',width+4)
                        .attr('x',x-2)
                        .attr('y',y)
                        .attr('rx','2px')
                    svgT.attr('y',y0)
                })
            //添加hover事件
             d3.select('#detailFore')
                .selectAll('.boxplot g text').style('opacity','0')
            d3.select('#detailFore')
                .selectAll('.boxplot g .smallRect').style('opacity','0')
            d3.select('#detailFore')
                .selectAll('.boxplot').on('mouseover',function(d){
                    d3.select(this)
                        .selectAll('.boxplot g text').style('opacity','1')
                    d3.select(this)
                        .selectAll('.boxplot g .smallRect').style('opacity','1')
                })
            d3.select('#detailFore')
                .selectAll('.boxplot').on('mouseout',function(d){
                    d3.select(this)
                        .selectAll('.boxplot g text').style('opacity','0')
                    d3.select(this)
                        .selectAll('.boxplot g .smallRect').style('opacity','0')
                })
            

                            // var node=params.clickNode.node
            // Add a legend.
            d3.select('#detailLegend')
                .selectAll('.legend').remove()
            d3.select('#detailLegend').attr('transform','translate('+($('.foreground').width()
+20)+','+225+')')
            
            // var legend=d3.select('#detailLegend')
            //     .selectAll('.legend')
            //     .data(species)
            // var lengendText=legend.enter()
            //     .append("svg:g")
            //     .attr("class", "legend")
            //     .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; })
            //    lengendText.append("svg:rect")
            //     .attr("class", 'chooseRect')
            //     .attr('fill', function(species){
            //         return pathColor(species)
            //     })
            //    lengendText.append("svg:text")
            //     .attr('class','chooseText')
            //     .attr("x", 35)
            //     .attr("y", 7)
            //     .text(function(d) { return "第" + d +"项评分"; })



                // .attr('fill', function(species){
                //     return pathColor(species)
                // })
            // legend.exit().remove()

            //线上点的标识
            d3.selectAll('.detailText').remove()
            flowers.forEach(function(d){
                var dataPoint=traits.map(function(p) { return [x(p), y[p](d[p])]; })
                var num=Object.keys(d)
                dataPoint.forEach(function(axis,i){
                    d3.select('#detailFore')
                      .append('text')
                      .text(d[num[i]])
                      .attr('x',axis[0])
                      .attr('y',axis[1])
                      .style('display','none')
                      .attr('species',d.species+'point')
                      .attr('class','detailText')
                })
            })
            d3.select('#detail-svg').append('div')
                .attr('class','detailSp')
            d3.selectAll('#detailFore path').on('mouseover',function(d){
                var species='"'+d3.select(this).attr('species')+'point"'
                d3.selectAll('#detailFore [species='+species+']').style('display','inline')
                var axis=d3.mouse(d3.select('#detail-svg').node())
                if(axis[1]>350) axis[1]=350
                d3.select('.detailSp')
                    .style('left',(axis[0]+10)+'px')
                    .style('top',(axis[1]+10)+'px')
                    .style('display','inline')
                $('.detailSp').text('rank:'+d3.select(this).attr('species'))
                d3.select('.linepath[species="'+d3.select(this).attr('species')+'"]').attr('stroke','#fc8d59')
                    .attr('stroke-width','5px')
            })
            d3.selectAll('#detailFore path').on('mousemove',function(d){
                var axis=d3.mouse(d3.select('#detail-svg').node())
                if(axis[1]>350) axis[1]=350
                d3.select('.detailSp')
                    .style('left',(axis[0]+10)+'px')
                    .style('top',(axis[1]+10)+'px')
                    // .style('display','inline')
            })

            d3.selectAll('#detailFore path').on('mouseout',function(d){
                var species='"'+d3.select(this).attr('species')+'point"'
                d3.selectAll('#detailFore [species='+species+']').style('display','none')
                d3.select('.detailSp')
                    .style('display','none')
                d3.select('.linepath[species="'+d3.select(this).attr('species')+'"]').attr('stroke','#5d5d5d')
                    .attr('stroke-width','1px')
            })

            // Returns the path for a given data point.
            function path(d) {
                var data=traits.map(function(p) { return [x(p), y[p](d[p])]; })
                var s="M "+data[0][0]+","+data[0][1]
                data.forEach(function(d,i){
                    if(i<data.length-1){
                        var z = (data[i+1][0] - d[0]) / 2
                        s+=" C " + (d[0]+z)+","+d[1]+" "+(data[i+1][0]-z)+","+data[i+1][1]+" "+data[i+1][0]+","+data[i+1][1]
                    }
                })
                return s;
            }
            function iqr(k) {
                return function(d, i) {
                    var q1 = d.quartiles[0],
                        q3 = d.quartiles[2],
                        iqr = (q3 - q1) * k,
                        i = -1,
                        j = d.length;
                    while (d[++i] < q1 - iqr);
                    while (d[--j] > q3 + iqr);
                    return [i, j];
                };
                }


       }

        return {
            'detail':detail,
            'renderPoint':renderPoint
        };
    }
    ]);
})();