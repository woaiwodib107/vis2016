'use strict';
(function() {
	var feature = angular.module('shvis.feature.service', []);
	feature.factory("Feature", function() {
		var scale = {
			'cluster': {

			}
		}
		var init = function(inputName, data) {
			switch(inputName) {
				case 'cluster':
					console.log('cluster data init!!!');
					scale.cluster.size = d3.scale.linear().domain([1,10]).range([0,1]);
				break;
				default:
				break;
			}

		};
		var clusterFeature = function(clusterData) {
			console.log(scale.cluster);
			return {
				size: scale.cluster.size(clusterData.length)
			}
		};
		var getFeature = function(inputName) {
			var res;
			switch(inputName) {
				case 'cluster':
					res = clusterFeature;
				break;
				default:
				break;
			}
			return res;
		}
		return {
			init: init,
			getFeature: getFeature
		}
	});
})();