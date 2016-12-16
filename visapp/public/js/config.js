/**
 * Created by Fangzhou on 2016/2/5.
 */
'use strict';
(function() {
    var config = {};
    var system = {};
    config.system = system;
    var mode = "dblp";
    config.mode = mode;
    if(mode === "MMO") {
        config.timeScale = [625, 702, 709, 716, 723, 730, 806, 813, 820, 827, 903, 910, 917, 924, 1001];
        config.rankRange = [0, 15072];

    } else {
        config.timeScale = d3.range(2004, 2017).map(function(d){return String(d)});
        config.rankRange = [0, 1346];
    }
    //dblp
//
    //mmorpg
    if(mode === "MMO") {
        //config.metrics = ['H', 'HIS', 'ICC', 'aggre_constraint', 'betweenness', 'clust_coef', 'effective_size', 'local_effic', 'pagerank'];
        config.metrics = ['H', 'HIS', 'ICC', 'AC', 'BTW', 'CLCO', 'ES', 'LE', 'PGK'];
    } else {
        config.metrics = ['H', 'HIS', 'ICC', 'MaxD','AC', 'BTW', 'CLCO', 'ES', 'LE', 'PGK'];
        //config.metrics = ['H', 'HIS', 'ICC', 'MaxD', 'aggre_constraint', 'betweenness', 'clust_coef', 'effective_size', 'local_effic', 'pagerank'];
    }
    var cluster = {};
    cluster.width = 420;
    cluster.height = 735;
    cluster.divideLine = 300;
    cluster.treeWidth = 220;
    cluster.treeHeight = 655;
    cluster.margin = [40,40,40,40];
    cluster.minInnerRadius = 12;
    cluster.maxInnerRadius = 25;
    cluster.singleRadius = 2;
    cluster.innerRadius = 15;
    cluster.middleRadius = 20;
    cluster.kdeKernel = 20;

    cluster.kdeOffset = 5;

    if(mode === "MMO") {
        cluster.angleDomain = [0,1200];
        cluster.kdeTicks = 200;
    } else {
        cluster.angleDomain = [0, 1200];
        cluster.kdeTicks = 200;
    }
//    cluster.width = 1000;
//    cluster.height = 1000;
//    cluster.treeWidth = 600;
//    cluster.treeHeight = 1000;
//    cluster.margin = [5,40,40,40];
//    cluster.minInnerRadius = 100;
//    cluster.maxInnerRadius = 150;
//    cluster.singleRadius = 2;
//    cluster.innerRadius = 15;
//    cluster.middleRadius = 20;
    var trendBox = {};
    trendBox.width = 20;
    trendBox.height = 10;

    config.cluster = cluster;
    config.cluster.trendBox = trendBox;

    var rank = {};
    rank.width = 1200;
    rank.height = 735;
    //rank.margin = [40,70,40,40];
    rank.margin = [40,40,40,40];
    if(mode === "MMO") {
        rank.rankRange = [0, 15072];

    } else {
        rank.rankRange = [0, 1346];
    }
    var maxRank = rank.rankRange[1];
    rank.partition = [0.2, 0.5, 0.7, 1];
    rank.weight = {
        0:0.1,
        1:0.1,
        2:0.1,
        3:0.1,
        4:0.1,
        5:0.1,
        6:0.1,
        7:0.1,
        8:0.1,
        9:0.1
    };

    rank.maxNodeNumber = 5;
    var rankGlyph = {};

    rankGlyph.ringOuterRadius = 15;
    rankGlyph.ringInnerRadius = 7;
    rankGlyph.cirMaxRadius = 5;
    rankGlyph.cirMinRadius = 2;
    rank.glyph = rankGlyph;
    rank.unitWidth = 150;
    rank.interval = 150;
    rank.flowMargin = 20;
    rank.flowInterval = 100;
    rank.sLineInterval = rank.flowInterval / 2;
    rank.minRankHeight = 160;
    config.rank = rank;


    var detail = {};
    detail.width = 1200;
    detail.height = 250;
    detail.svgHeight = 400;
    detail.initailHeight = 100;
    detail.groupHeight = 130; //130  //255
    detail.innerRadius = 15;
    detail.outerRadius = 25;
    detail.radius = 45;   //75
    detail.firstKeep = 1;
    detail.amplifyFactor = 3;
    detail.amplifyFactorMini = 2;
    detail.pushFactor = 4;

    if(mode === "MMO") {
        detail.filterAttr = ["cid", "avg_shortes_path_length", "estrada_index", "nodes","diameter"];
    } else {
        detail.filterAttr = ["cid", "connected_components", "estrada_index","nodes"];
    }
    config.detail = detail;

    var information = {};
    information.width = 1200;
    information.height = 200;
    config.information = information;

    window.config = config;
})();