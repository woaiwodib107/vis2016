'use strict';
/*
only the member functions of visual mapping is recorded here
the member functions of weight and symbolic is recorded at backend
*/
(function() {
	var mfs = angular.module('shvis.mfs.service', []);
	mfs.factory('MFS', function() {
		var memberFunctions = {
			//input member functions
			//feature member functions
			'rank': {
			},
			'ensemble': {
			},
			'terank': {
			},
			'cluster': {
				size: function(value) {
					var small = [
						{
							a:0,
							b:1,
							domain:[0,0.2]
						},
						{
							a:-5,
							b:2,
							domain:[0.2,0.4]
						}
					];
					var medium = [
						{
							a:10/3,
							b:-2/3,
							domain:[0.2,0.5]
						},
						{
							a:-10/3,
							b:8/3,
							domain:[0.5,0.8]
						}
					];
					var large = [
						{
							a:5,
							b:-3,
							domain:[0.6,0.8]
						},
						{
							a:0,
							b:1,
							domain:[0.8,1]
						}
					];
					return {
						small: y(small, value),
						medium: y(medium, value),
						large: y(large, value)
					}

				},
				length: function(value) {
					var short = function() {

					};
					var long = function() {

					};
					var medium = function() {

					};
					return {
						short: short(value),
						long: long(value),
						medium: medium(value)
					}

				}
			},
			//output member functions
			//visual mapping member functions
			'cluster_glyph': {
				radius: function(value) {
					var small = [
						{
							a:0,
							b:1,
							domain:[0,0.1]
						},
						{
							a:-2,
							b:1.2,
							domain:[0.1,0.6]
						}
					];
					var large = [
						{
							a:2,
							b:-0.8,
							domain:[0.4,0.9]
						},
						{
							a:0,
							b:1,
							domain:[0.9, 1]
						}
					];
					return {
						small: x(small, value),
						large: x(large, value)
					}
				}

			}

		};

		var getMF = function(varName, featureName) {
			return memberFunctions[varName][featureName];
		};

		var y = function(para, x) {
			var func = para.filter(function(d) {
				var res = false;
				if(x > d.domain[0] && x < d.domain[1]) {
					res = true;
				}
				return res;
			})[0];
			var res = 0;
			if(func) {
				res = func.a * x + func.b
			}
			return res;
		};

		var x = function(para, y) {
			var res = {};
			para.forEach(function(d) {
				var domain = d.domain;
				for(var i = domain[0]; i <= domain[1]; i+=0.1) {
					if(d.a * i + d.b > y) {
						res[i] = y;
					} else {
						res[i] = d.a * i + d.b;
					}
				}
			});
			return res;
		};


		return {
			getMF: getMF
		}
	})
})();