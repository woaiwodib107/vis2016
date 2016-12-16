/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    var cluster = angular.module('shvis.loader.service', []);
    cluster.factory('LoadService', ['$http',
            function($http) {
                var loadCluster = function(cluid, callback) {
                    $http.get('/cluster', {
                        params: { clu_id: cluid}
                    })
                        .success(function(d) {
                            d.allChildren = [];
                            for(var i = 0; i < d.children.length; i++) {
                                d.allChildren.push(d.children[i]);
                            }
                            callback(d);
                        });
                };

                var loadClusterByName = function(name, callback) {
                    
                }

                var loadRank = function(cluid, callback) {
                    $http.get('/rank', {
                        params: { clu_id: cluid }
                    })
                        .success(function(d) {
                            d.cluid = cluid;
                            callback(d);
                        })
                };

                var loadDetail = function(id, callback) {
                    $http.get('/detail', {
                        params: { id: id }
                    })
                        .success(function(d) {
                            // console.log(d);
                            callback(d);
                        });
                };

                var loadNames = function(callback) {
                    $http.get('/names')
                        .success(function(d) {

                            callback(d);
                        });
                };

                var loadRankByNames = function(names, callback) {
                    $http.get('/rankByNames', {
                        params: {
                            names:names
                        }
                    })
                        .success(function(d) {
                            callback(d);
                        })
                };

                var loadQuery = function(params, callback) {
                    $http.get('rankQuery', {
                        params:params
                    })
                        .success(function(d) {
                            callback(d);
                        })
                }

                var kde = function (kernel, x) {
                    return function(sample) {
                        return x.map(function(x) {
                            return [x, d3.mean(sample, function(v) { return kernel(x - v); })];
                        });
                    };
                };

                var kernel = function (scale) {
                    return function(u) {
                        return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
                    };
                };

                var changeRule = function(rules, callback) {
                  
                };

                var loadRankRange = function(callback) {
                    $http.get('/range')
                        .success(function(d) {
                            callback(d);
                        })
                };

                return {
                    'loadCluster':loadCluster,
                    'loadRank':loadRank,
                    'loadDetail': loadDetail,
                    'loadNames': loadNames,
                    'loadRankByNames': loadRankByNames,
                    'loadQuery':loadQuery,
                    'kde':kde,
                    'kernel':kernel,
                    'loadRankRange': loadRankRange
                };
            }
    ]);
})();