/**
 * Created by xyx on 2016/3/8.
 */
/**
 * Created by Fangzhou on 2016/2/3.
 */
'use strict';
(function() {
    var cluster = angular.module('shvis.pip.service', []);
    cluster.factory('PipService', ['$rootScope',
        function($rootScope) {
            var ADD_CLU = 'addClu';
            var DEL_CLU = 'delClu';
            var RENDER_CONN = 'renderConn';
            var QUERY = 'query';
            var RANKMOVE = 'rankMove';
            var ADD_DETAIL = 'addDetail';
            var RANKEXPAND = 'rankExpand';
            var DETAILEXPAND = 'detailExpand';
            var MOUSEOVER = 'mouseover';
            var STANDARDDEV = 'StandardDev';
            var HIGHLIGHT = 'Highlight';
            var VISUAL_MAP_CHANGED = 'visualMapChanged';

            var emitAddCluster = function(msg) {
                $rootScope.$broadcast(ADD_CLU, msg);
            };
            var onAddCluster = function(scope, callback) {
                scope.$on(ADD_CLU, function(event, msg) {
                    callback(msg);
                })
            };
            var emitDelCluster = function(msg) {
                $rootScope.$broadcast(DEL_CLU, msg);
            };
            var onDelCluster = function(scope, callback) {
                scope.$on(DEL_CLU, function(event, msg) {
                    callback(msg);
                })
            };
            var emitRenderConn = function(msg) {
                $rootScope.$broadcast(RENDER_CONN, msg);
            };
            var onRenderConn = function(scope, callback) {
                scope.$on(RENDER_CONN, function(event, msg) {
                    callback(msg);
                })
            };

            var emitQueryResult = function(msg) {
                $rootScope.$broadcast(QUERY, msg);
            };

            var onQueryResult = function(scope, callback) {
                scope.$on(QUERY, function(event, msg) {
                    callback(msg);
                })
            };

            var emitRankMove = function(msg) {
                $rootScope.$broadcast(RANKMOVE, msg);
            };

            var onRankMove = function(scope, callback) {
                scope.$on(RANKMOVE, function(event, msg) {
                    callback(msg);
                })
            };
            var emitRankExpand = function(msg) {
                $rootScope.$broadcast(RANKEXPAND, msg);
            };

            var onRankExpand = function(scope, callback) {
                scope.$on(RANKEXPAND, function(event, msg) {
                    callback(msg);
                })
            };
            var emitDetailExpand = function(msg) {
                $rootScope.$broadcast(DETAILEXPAND, msg);
            };

            var onDetailExpand = function(scope, callback) {
                scope.$on(DETAILEXPAND, function(event, msg) {
                    callback(msg);
                })
            };

            var emitAddDetail = function(msg) {
                $rootScope.$broadcast(ADD_DETAIL, msg);
            };

            var onAddDetail = function(scope, callback) {
                scope.$on(ADD_DETAIL, function(event, msg) {
                    callback(msg);
                })
            };

            var emitMouseover = function(msg) {
                $rootScope.$broadcast(MOUSEOVER, msg);
            };

            var onMouseover = function(scope, callback) {
                scope.$on(MOUSEOVER, function(event, msg) {
                    callback(msg);
                })
            };

            //for Standard Deviation in control panel..
            var emitStandardDev = function(msg) {
                $rootScope.$broadcast(STANDARDDEV, msg);
            };

            var onStandardDev = function(scope, callback) {
                scope.$on(STANDARDDEV, function(event, msg) {
                    callback(msg);
                })
            };

            var emitHighlight = function(msg) {
                $rootScope.$broadcast(HIGHLIGHT, msg);
            };

            var onHighlight = function(scope, callback) {
                scope.$on(HIGHLIGHT, function(event, msg) {
                    callback(msg);
                })
            };

            var emitVisualMapChanged = function(msg) {
                $rootScope.$broadcast(VISUAL_MAP_CHANGED, msg);
            }

            var onVisualMapChanged = function(scope, callback) {
                scope.$on(VISUAL_MAP_CHANGED, function(event, msg) {
                    callback(msg);
                })
            }

            return {
                emitAddCluster: emitAddCluster,
                onAddCluster: onAddCluster,
                emitDelCluster: emitDelCluster,
                onDelCluster: onDelCluster,
                emitRenderConn: emitRenderConn,
                onRenderConn: onRenderConn,
                emitQueryResult:emitQueryResult,
                onQueryResult:onQueryResult,
                emitRankMove:emitRankMove,
                onRankMove:onRankMove,
                emitRankExpand:emitRankExpand,
                onRankExpand:onRankExpand,
                emitAddDetail:emitAddDetail,
                onAddDetail:onAddDetail,
                emitMouseover: emitMouseover,
                onMouseover: onMouseover,
                emitStandardDev: emitStandardDev,
                onStandardDev: onStandardDev,
                emitHighlight:emitHighlight,
                onHighlight:onHighlight,
                emitDetailExpand: emitDetailExpand,
                onDetailExpand: onDetailExpand,
                emitVisualMapChanged: emitVisualMapChanged,
                onVisualMapChanged: onVisualMapChanged

            };
        }
    ]);
})();