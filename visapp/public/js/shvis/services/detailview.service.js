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
            .attr('height','430px').attr('width','75%')
            if(d3.select('#detailLegend').node()==null){
              d3.select('#detail-svg').append('div')
                .attr('id','detailBox0')
                .attr('class','detailBox')
                .append('div')
                .attr('id','detailBox')
              d3.select('#detail-svg').append('div')
                 .attr('id','detailPoint')
                 .attr('class','detail-point')
            d3.select('#detail-svg').append('div')
                .attr('class','detailChoose')
                .html(
                    '<div class="btn-group" data-toggle="buttons">' +
                    '<label class="btn btn-primary active">' +
                        '<input type="radio" name="options" id="option1" autocomplete="off" checked>'+
                        'A' +
                    '</label>' +
                    '<label class="btn btn-primary">' +
                        '<input type="radio" name="options" id="option2" autocomplete="off">' +
                        'B' +
                    '</label>' +
                    '</div>'
                )
              svg.append('g')
                 .attr('id','detailLegend')
                //  .attr('transform','translate(1520,210)')
              svg.append('g')
                 .attr('id','detailFore')
                 .attr("class", "foreground")
                 .attr('transform','translate(30,38)')
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
                      .selectAll('.Dpoint')
                      .data(node,function(d){
                          return d.id
                      })
                var height=200
                var marginTop=(height/2)-50
                var rect=point.enter()
                     .append('div')
                     .attr('class','Dpoint')
                     .style('height',height+'px')
                rect.append('div')
                    .attr('class','Dcircle')  
                    .style('background-color',function(d){
                        return color(line(d.ds))
                    })
                    .style('border-color',function(d){
                        return color(line(d.ds))
                    })
                    .style('margin-top',marginTop+'px')
                    .on('click',function(d){
                        renderDetail(params,d.id)
                    })
                var per=rect.append('div')  
                per.html(function(d){
                    var s='<div class="Drect panel panel-default">'+
                            '<div class="panel-heading">'+
                                '名字：'+d.name+
                            '</div>'+
                            '<div class="panel-body">'+
                                '<p>个人简介'+
               '                 ButtonsCSS按钮样式库Buttons 是一个基于 Sass 和 Compass 构建的CSS按钮（button）样式库，图标采用的是Font Awesome，可以和Bootstrap融合使用。'+
                        '</p>'+
                            '</div>'+
                            '<table class="table">'+
                                '<thead>'+
                                    '<tr>'+
                                    '<th>文章数/年份</th>'+
                                    '<th>2004年</th>'+
                                    '<th>2005年</th>'+
                                    '<th>2006年</th>'+
                                    '</tr>'+
                                '</thead>'+
                            '<tbody> <tr> <th>10</th><td>3</td> <td>4</td> <td>3</td> </td> </tbody>'+
                            '</table>'+
                        '</div>'
                        return s
                    })
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
            var x = d3.scaleBand().domain(traits).range([0, 1600])
            var y = {}
            traits.forEach(function(d,i) { 
                y[d] = d3.scaleLinear()
                    .domain(d3.extent(flowers, function(p) { return p[d]; }))
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
            Plotly.newPlot(box, boxData,title,con);
            $('#detail-svg [name="options"]').on('click',function(){
                $('#detail-svg [name="options"]').parent().removeClass('active')
                $(this).parent().addClass('active')
                if($(this).attr('id')=='option1'){
                    d3.select('#detail-svg .detailBox')
                        .style('opacity',1)
                }else{
                    d3.select('#detail-svg .detailBox')
                        .style('opacity',0)
                }
                // $('#detail-svg [name="options"]').button('reset')
                // $(this).button('toggle')
            })

            // Add foreground lines.
            d3.select('#detailFore')
                .selectAll("path").remove()
            var foreground = d3.select('#detailFore')
                .selectAll("path")
                .data(flowers)
            foreground.enter().append("svg:path")
                .attr("d", path)
                .attr("stroke", function(d) { return pathColor(d.species); })
                .attr('class','linepath')
                // .attr("class", function(d) { return d.species; });
                foreground.exit().remove()

            // Add a group element for each trait.
            d3.select('#detailFore').selectAll(".trait").remove()
            var g = d3.select('#detailFore').selectAll(".trait")
                .data(traits)
                .enter().append("svg:g")
                .attr("class", "trait")
                .attr("transform", function(d) {
                    d3.select(this).append('text').attr('transform',"translate(" + 0+','+(-18) + ")").text(d)
                        .attr("text-anchor", "middle")
                    return "translate(" + x(d) + ")"; 
                })
                // .origin(function(d) { return {x: x(d)}; })

            // Add an axis and title.
            g.append("svg:g")
                .attr("class", "axis")
                .each(function(d,i) {
                    if(!i){
                        d3.select(this).call(d3.axisRight().scale(y[d])); 
                    } 
                    else{
                        d3.select(this).call(d3.axisLeft().scale(y[d])); 
                    }
                })
                .append("svg:text")
                .attr("text-anchor", "middle")
                .attr("y", -9)
                .text(String);
                            // var node=params.clickNode.node
            // Add a legend.
            d3.select('#detailLegend')
                .selectAll('.legend').remove()
            d3.select('#detailLegend').attr('transform','translate('+($('.foreground').width()
)+','+225+')')
            var legend=d3.select('#detailLegend')
                .selectAll('.legend')
                .data(species)
            var lengendText=legend.enter()
                .append("svg:g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; })
               lengendText.append("svg:rect")
                .attr("class", 'chooseRect')
                .attr('fill', function(species){
                    return pathColor(species)
                })
               lengendText.append("svg:text")
                .attr('class','chooseText')
                .attr("x", 35)
                .attr("y", 7)
                .text(function(d) { return "第" + d +"项评分"; })
                // .attr('fill', function(species){
                //     return pathColor(species)
                // })
            // legend.exit().remove()

            // Returns the path for a given data point.
            function path(d) {
                return d3.line()(traits.map(function(p) { return [x(p), y[p](d[p])]; }));
            }

       }

        return {
            'detail':detail,
            'renderPoint':renderPoint
        };
    }
    ]);
})();