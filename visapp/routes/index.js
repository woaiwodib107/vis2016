var express = require('express');
var fs = require("fs");
var mongoose = require('mongoose');
var d3 = require("d3");

var clusters = mongoose.model('cluster');
//clusters.find({}, function(err, data) { console.log(err, data, data.length); });
var nodes = mongoose.model('node');
//nodes.find({id:0}, function(err, data) { console.log(err, data, data.length); });
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/testData', function(req, res) {
    fs.readFile('./tNetDataHis.json', function(error, fileData) {
        if(error) {
//            console.log(error);
            res.json("{}");
        } else {
//            console.log(fileData.toString());
            res.json(fileData.toString());
        }
    });

});

var allNodes = {};
var nodesByTime = {};
var rankCount = {};
var rankCountByTime = {};
var maxRankCount;
nodes.find({}, function(err, data) {
    for(var i = 0; i < data.length; i++) {
        allNodes[data[i].get("name")] = data[i];
        var d = data[i].get("data");
        for(var j = 0; j < d.length; j++) {
            var ranks = d[j].get("ranks");
            var time = d[j].get("time");
            if(rankCountByTime[time] === undefined) {
                rankCountByTime[time] = 0;
            }
            // console.log(ranks[0])
              if(ranks[0] instanceof Object){
                  ranks = ranks.map(function (d) {
                      return d.value;
                  })
              }
            rankCountByTime[time] = Math.max(d3.max(ranks), rankCountByTime[time]);
            ranks.forEach(function(r) {
                if(rankCount[r] === undefined) {
                    rankCount[r] = 0;
                }
                rankCount[r] += 1;
            })
        }
    }
    maxRankCount = d3.max(Object.keys(rankCountByTime), function(d) {
        return rankCountByTime[d];
    });
    console.log("ready!!");
//    console.log(allNodes["Klaus Mueller"].get("data").filter(function(d) {
//        var res = false;
//        if(d.get("time") === "2014") {
//            res = true;
//        }
//        return res;
//    }));
//    console.log(rankCountByTime);
//    console.log(allNodes['Jing Qin']['data'][0]['ranks']);
});

function sum(arr) {
    tmp = 0;
    arr.forEach(function(i) {
        tmp += i;
    });
    return tmp;
}

function sortNumber(a, b) {
    return a - b;
}

router.get('/cluster', function(req, res) {
    var cluID = req.query.clu_id;
//    console.log(cluID);
    clusters.find({id: cluID}, {children:1}, function(err, data) {
        var children = data[0].get("children");
        var result = {};
        result["data"] = {id:cluID};
        result["children"] = [];
        clusters.find({id:{"$in":children}}, {data:1, id:1}, function(err, data) {

            for(var i = 0; i < data.length; i++) {
//                console.log(i);
                var childCluster = {};
                var tmp = {id:data[i].get("id")};

                var nodes = data[i].get("data");
                tmp["nodes"] = nodes;
                tmp["size"] = nodes.length;
                tmp["overall"] = 0;
                var trend = [];
                var upper = [];
                var lower = [];
                var dist = [];
                var distStat = {};
                tmpYears = [];
                var variances = [];

                for(var j = 0; j < nodes.length; j++) {
                    var variance = [];
                    var years = allNodes[nodes[j]].get("data");
                    for(var k = 0; k < years.length; k++) {
                        // add years to tmp array(tmpYears)
                        tmpYears.push(years[k].get("time"));

                        ranks  = years[k].get("ranks");
                        if(ranks[0] instanceof Object){
                            ranks = ranks.map(function (d) {
                                return d.value;
                            })
                        }
                        var mean = sum(ranks) / ranks.length;
                        var tmpsum = 0;
                        ranks.forEach(function(d) {
                            if(distStat[d] === undefined) {
                                distStat[d] = 0;
                            }
                            distStat[d] += 1;
                            tmpsum += Math.pow((d-mean), 2);
                        });
                        variance.push(tmpsum/ranks.length);
                        // console.log(ranks)
                    }
                    variances.push(sum(variance) / variance.length)
                }

                // get rid of dupulicated years
                tmpYears.sort();
                var sortedYears = [tmpYears[0]];
                for (var j = 1; j < tmpYears.length; j++) {
                    if (tmpYears[j] != sortedYears[sortedYears.length - 1])
                        sortedYears.push(tmpYears[j])
                }

                // process ranks
                sortedYears.forEach(function(y) {
                    var trend_y = [];
                    var upper_y = [];
                    var lower_y = [];
                    nodes.forEach(function(n) {
                        var years = allNodes[n].get("data");
                        years.forEach(function(r) {
                            if (r.get("time") == y) {
                                var ranks = r.get("ranks"); //.sort(sortNumber);
                                if(ranks[0] instanceof Object){
                                    ranks = ranks.map(function (d) {
                                        return d.value;
                                    })
                                }
                                lower_y.push(d3.max(ranks));
                                upper_y.push(d3.min(ranks));
                                trend_y = trend_y.concat(ranks);
                                // console.log(ranks)
                            }
                        })
                    });

                    // average
                    trend.push(1.0 * sum(trend_y) / trend_y.length / rankCountByTime[y] * maxRankCount);
                    upper.push(1.0 * sum(upper_y) / upper_y.length);
                    lower.push(1.0 * sum(lower_y) / lower_y.length);
                });
//                console.log("trend: " + trend);
//                console.log("upper: " + upper);
//                console.log("lower: " + lower);


                dist = Object.keys(distStat).map(function(d) {
                    return {
                        "pos":Number(d),
                        "count":distStat[d] / rankCount[d]
                    }
                });
                tmp["dist"] = dist;
                tmp["stat"] = distStat;
                tmp["trend"] = trend;
                tmp["upper"] = upper;
                tmp["lower"] = lower;
                tmp["variance"] = sum(variances) / variances.length;
                childCluster["data"] = tmp;

                result["children"].push(childCluster);
            }
            res.json(result);
            // res.json(trend)
        });
//        clusters.find()
    });
//    fs.readFile('./cluster.json', function(error, fileData) {
//        if(error) {
//            console.log(error);
//            res.json("{}");
//        } else {
//            //console.log(fileData.toString());
//            res.json(fileData.toString());
//        }
//    });
});

router.get('/rank', function(req, res) {
    var cluID = req.query.clu_id;
//    console.log(cluID);
    clusters.find({id:cluID}, function(err, data) {
        var nodes = data[0].get("data");
        var children = data[0].get("children");
        var nodeData = [];
        for(var i = 0; i < nodes.length; i++) {
            nodeData.push(allNodes[nodes[i]]);
        }
        if(children.length > 0) {
            clusters.find({id:{"$in":children}}, {data:1, id:1}, function(err, subCluster) {
                var compress = [];
                for(var i = 0; i < subCluster.length; i++) {
                    var subNodes = subCluster[i].get("data");
                    var tmp = {};
                    tmp["id"] = subCluster[i].get("id");
                    tmp["nodes"] = [];
                    for(var j = 0; j < subNodes.length; j++) {
                        tmp["nodes"].push(allNodes[subNodes[j]]);
                    }
                    compress.push(tmp);
                }
                res.json({
                    nodes:nodeData,
                    compress:compress,
                    countByTime:rankCountByTime
                })
            });
        } else {
            res.json({
                nodes:nodeData,
                compress:[],
                countByTime:rankCountByTime
            });
        }
    });
});

router.get('/rankByNames', function(req, res) {
    var names = req.query.names;
    var nodes = [];
    if(names instanceof Array) {
        for(var i = 0; i < names.length; i++) {
            nodes.push(allNodes[names[i]]);
        }
    } else {
        nodes.push(allNodes[names]);
    }
    res.json({
        nodes:nodes,
        compress:[],
        countByTime:rankCountByTime
    });
});

/*
 * query ranks by [name, startTime, endTime, startRank, endRank],
 * any of these parameters can be undefined,
 * @param name can be Array or String.
 * @return all data of qualified names
 * note: if parameter === "", treat as undefined.
 */
router.get('/rankQuery', function(req, res) {
    var names = req.query.names;
    var startTime = req.query.startTime === "" ? undefined : req.query.startTime;
    var endTime = req.query.endTime === "" ? undefined : req.query.endTime;
    var startRank = req.query.startRank === "" ? undefined : req.query.startRank;
    var endRank = req.query.endRank === "" ? undefined : req.query.endRank;
    var data = [];
    var filterAndAdd = function(raw) {
        if(data.indexOf(raw) >= 0) return;
        if(raw === undefined
            || (!raw.get("data") instanceof Array)) {
            console.log("Entry is empty or 'data' in entry is not Array!");
            return;
        }
        var isQualified = raw.get("data").reduce(function(result, row){
            if(result) return true;
            var time = parseInt(row.get("time"));
            var mean = row.get("mean");
            if(time < startTime || time > endTime
                || mean < startRank || mean > endRank) return result;
            return true;
        }, false);
        if(isQualified) data.push(raw);
    };

    if(names === undefined
        || (names instanceof Array && 0 === names.length)) {
        for(var name in allNodes) {
            filterAndAdd(allNodes[name]);
        }
    } else if(names instanceof Array) {
        for(var i = 0; i < names.length; i++) {
            filterAndAdd(allNodes[names[i]]);
        }
    } else {
        filterAndAdd(allNodes[names]);
    }
//    console.log(data[0]
//        .filter(function(d) {
//        var res = false;
//        if(d.get("time") === "2014") {
//            res = true;
//        }
//        return res;
//    }));
//    console.log(data.length);
    res.json({
        nodes:data,
        compress:[],
        countByTime:rankCountByTime});
})


var detailFile = './detail.json';
var communityFile = './community.json';

//var detailFile = './detail_kmeans.json';
//var communityFile = './community_kmeans.json';

router.get('/detail', function(req, res) {
    var id = req.query.id;
    var ret = {};
    //console.log(id);
    //console.log(allNodes[id]);
    fs.readFile(detailFile, function(err, data) {
        //console.log(data);
        if (err)
            throw err;
        var sortfunc = function(a, b) {
            return a.get('time') - b.get('time');
        }
        if(id instanceof  Array) {

        } else {
            ret[id] = {};
            ret[id]["ranks"] = allNodes[id];
            var detail = JSON.parse(data);
            var years = [];
            console.log(ret[id]["ranks"]);

            // 我为什么要按照时间排序啊？不用的吧
            ret[id]["ranks"]["data"].sort(sortfunc);
            console.log(ret[id]);
            // console.log(ret['ranks']['data']);
            var det = {};
            console.log(Object.keys(detail));
            for (var i  = 0; i < ret[id]["ranks"]["data"].length; i++) {
                var year = ret[id]['ranks']['data'][i].get('time');

                console.log(year)
                // console.log(year);
                det[year] = detail[year][id];
                // console.log(data[year])
            }
            ret[id]["detail"] = det;
        }
        fs.readFile(communityFile, function(err, data) {
            if (err)
                throw err;
//            ret["community"] = JSON.parse(data);
            res.json({
                nodes: ret,
                community: JSON.parse(data)
            });
        });
    });
});

router.get('/names', function(req, res) {
    console.log('1111')
    res.json(Object.keys(allNodes));
});

router.get('/range', function(req, res) {
    res.json(rankCountByTime);
})

module.exports = router;
