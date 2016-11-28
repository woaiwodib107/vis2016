/**
 * Created by anakin on 16/3/6.
 */
/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    var information = angular.module('shvis.information.service', []);
    information.factory('informationService', ['LoadService', function(loadServ) {
        var d3 = window.d3;
        var addInformation = function () {
            var svg = d3.select("#information-svg")
                .append("svg")
                .attr("id", "table-svg");
            var data = [];
            for(var i = 0; i < 50; ++i)
            {
                data[i] = {};
                data[i]["y"] = i*30+10;
            }
            console.log(data);

            var chartGroup = svg.append("g")
                .attr("class", "chartGroup");
            var expandID = -1;

            chartGroup.selectAll(".rects")
                .data(data)
                .enter()
                .append("rect")
                .attr("rx", 3)
                .attr("ry", 3)
                .attr("x", 15)
                .attr("y", function (d, i) {
                    return d.y;
                })
                .attr("width", "250")
                .attr("height", "24")
                .attr("fill", "green")
                .attr("fill-opacity", 0.25)
                .attr("stroke", "#999999")
                .attr("stroke-width", "2px")
                .attr("class", "rects")
                .on("click", function (d, i) {
                    if(expandID == -1)
                    {
                        data.forEach(function (dd, ii) {
                            if(ii > i)
                            {
                                data[ii].y += 60;
                            }
                        });
                        chartGroup.append("rect")
                            .attr("x", 15)
                            .attr("y", d.y+24)
                            .attr("width", "250")
                            .attr("height", "60")
                            .attr("fill", "green")
                            .attr("fill-opacity", 0)
                            .attr("stroke", "#999999")
                            .attr("stroke-width", "0px")
                            .attr("class", "info");

                        chartGroup.selectAll(".info")
                            .transition()
                            .duration(2000)
                            .attr("fill-opacity", 0.15)
                            .attr("stroke", "#999999")
                            .attr("stroke-width", "2px");
                    }
                    else if(expandID == i)
                    {
                        data.forEach(function (dd, ii) {
                            if(ii > i)
                            {
                                data[ii].y -= 60;
                            }
                        });

                        chartGroup.selectAll(".info")
                            .transition()
                            .duration(2000)
                            .attr("fill-opacity", 0)
                            .attr("stroke", "#999999")
                            .attr("stroke-width", "0px");

                        chartGroup.selectAll(".info")
                            .remove();
                    }
                    else
                    {
                        data.forEach(function (dd, ii) {
                            if(ii > expandID)
                            {
                                data[ii].y -= 60;
                            }
                        });
                        data.forEach(function (dd, ii) {
                            if(ii > i)
                            {
                                data[ii].y += 60;
                            }
                        });
                        chartGroup.selectAll(".info")
                            .remove();
                        chartGroup.append("rect")
                            .attr("x", 15)
                            .attr("y", d.y+24)
                            .attr("width", "250")
                            .attr("height", "60")
                            .attr("fill", "green")
                            .attr("fill-opacity", 0)
                            .attr("stroke", "#999999")
                            .attr("stroke-width", "0px")
                            .attr("class", "info");

                        chartGroup.selectAll(".info")
                            .transition()
                            .duration(2000)
                            .attr("fill-opacity", 0.15)
                            .attr("stroke", "#999999")
                            .attr("stroke-width", "2px");

                    }

                    chartGroup.selectAll(".rects")
                        .transition()
                        .duration(1000)
                        .attr("y", function (d, i) {
                            return d.y;
                        });
                    chartGroup.selectAll(".texts")
                        .transition()
                        .duration(1000)
                        .attr("transform", function (d, i) {
                            return "translate("+30+","+(d.y+18)+")";
                        });

                    expandID = (expandID == i)?-1:i;
                });

            chartGroup.selectAll(".texts")
                .data(data)
                .enter()
                .append("text")
                .attr("transform", function (d, i) {
                    return "translate("+30+","+(d.y+18)+")";
                })
                .text(function (d, i) {
                    return i;
                })
                .attr("class", "texts");
        };
        return {
            'addInformation': addInformation
        };

    }]);
})();