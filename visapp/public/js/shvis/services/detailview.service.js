'use strict';
(function() {
    var detailview = angular.module('shvis.detailview.service', []);
    detailview.factory('Detailview', ['LoadService', 'PipService', function(loadServ, pipServ) {
       var x,y={},traits=[],flowers=[],species=[]
       var detail=function(params,node){
          layoutDetail(params,node)
          renderDetail(params,node)
       }
        var layoutDetail=function(params,node){
            var nodes={},
                detailNode=[]
            traits=[],flowers=[],species=[]
            Object.keys(params.nodetoData).forEach(function(time){
                Object.keys(params.nodetoData[time]).forEach(function(section){
                    nodes.time=[]
                    params.nodetoData[time][section].forEach(function(data){
                        if(node.indexOf(data.id)>=0){
                            nodes[time]=0
                            data.ranks.forEach(function(rank,i){
                                var f=false
                                flowers.forEach(function(d){
                                    if(d.id==data.id && d.species==i){
                                        d[time]=rank
                                        f=true
                                    }
                                })
                                if(!f){
                                    var o={species:i,id:data.id}
                                    o[time]=rank
                                    flowers.push(o)
                                }
                            }) 
                        }
                    })
                })
            })
            traits = Object.keys(nodes)//年份 几个轴
            traits.splice(traits.length-1,1)
            species = ['0','1','2','3','4','5','6','7','8','9']//几种评分
            console.log(flowers)

            var x = d3.scaleBand().domain(traits).range([0, 1600]),
            y = {};

            var line = d3.line(),
                axis = d3.axisLeft(),
                foreground;
            $(d3.select('#detail-svg svg').node().children).remove()
            var svg=d3.select('#detail-svg svg')
            // Create a scale and brush for each trait.
            traits.forEach(function(d,i) { 
                // Coerce values to numbers.
                // flowers.forEach(function(p) { p[d] = +p[d]; });
                
                y[d] = d3.scaleLinear()
                    .domain(d3.extent(flowers, function(p) { return p[d]; }))
                    .range([200, 0]);

                // y[d].brush = d3.brushY()
                //     .y(y[d])
                //     .on("brush", brushed);
            });

            // Add a legend.
            var legend = svg.append('g')
                      .attr('transform','translate('+0+','+205+')')
            legend=legend.selectAll("g.legend")
                .data(species)
                .enter().append("svg:g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; });

            legend.append("svg:line")
                .attr("class", String)
                .attr("x2", 8);

            legend.append("svg:text")
                .attr("x", 12)
                .attr("dy", ".31em")
                .text(function(d) { return "Iris " + d; });
            var svg=svg.append('g')
                    .attr('transform','translate('+80+','+200+')')
            // Add foreground lines.
            foreground = svg.append("svg:g")
                .attr("class", "foreground")
                .selectAll("path")
                .data(flowers)
                .enter().append("svg:path")
                .attr("d", path)
                // .attr("class", function(d) { return d.species; });

            // Add a group element for each trait.
            var g = svg.selectAll(".trait")
                .data(traits)
                .enter().append("svg:g")
                .attr("class", "trait")
                .attr("transform", function(d) { 
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
                        d3.select(this).call(axis.scale(y[d])); 
                    }
                })
                .append("svg:text")
                .attr("text-anchor", "middle")
                .attr("y", -9)
                .text(String);


            // Returns the path for a given data point.
            function path(d) {
            return line(traits.map(function(p) { return [x(p), y[p](d[p])]; }));
            }
       }
       var renderDetail=function(params,node){
            var svg=d3.select('#detail-svg svg')
           

       }

        return {
            'detail':detail
        };
    }
    ]);
})();