'use strict';
(function() {
    angular.module('shvis.fuzzytest.controller', [])
        .controller('fuzzytestController', function($scope, $timeout, FuzzyService, Feature) {
            // FuzzyService.addRule('anomaly', 'low', 'weight', 'high');
            //for a cluster, if size is large, then radius of the cluster glyph is large
            Feature.init('cluster', []);
            // FuzzyService.addRule('cluster', [['size', 'large']], 'cluster_glyph', ['radius', 'large']);
            FuzzyService.addRule('cluster', [['size', 'medium']], 'cluster_glyph', ['radius', 'small']);
            var res = FuzzyService.fs('cluster', [[2,3,4,5,6], [3,4,5,6,7], [3,4,5,6,7], [3,4,5,6,7], [3,4,5,6,7], [3,4,5,6,7], [3,4,5,6,7]]);
        });
})();