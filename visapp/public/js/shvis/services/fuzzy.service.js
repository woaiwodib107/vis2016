'use strict';
(function() {
    var fuzzy = angular.module('shvis.fuzzy.service', []);
    fuzzy.factory('FuzzyService', ['PipService', 'MFS', 'Feature', function(pip, mfs, feature) {
        var BACK_END = 0,
            FRONT_END = 1;
        /*
        one rule
        {
            input: [
                {
    
                }

            ],
            output: []
        }
        */
        var rules = [];
        var ruleStringArray = [];
        var outputMap = {
            rankItemWeight: BACK_END,
            clusterNodeRadius: FRONT_END
        }
        /*
        inputName, [[]], outputName, []
        */
        var addRule = function(inputName, irules, outputName, orules) {
            //transform the rule into a string
            var inputRuleString = irules.map(function(d) {
                return d.join(",");
            }).join(";");
            var outputRuleString = orules.join(";");
            var ruleString = [inputName, inputRuleString, outputName, outputRuleString].join(" ");
            if(ruleStringArray.indexOf(ruleString) >= 0) {
                return;
            } 
            ruleStringArray.push(ruleString);
            rules.push({
                inputName: inputName,
                irules: irules,
                outputName: outputName,
                orules: orules 
            });
        };
        /*
        output: {
            mf1: value,
            mf2: value,
            mf3: value,
            ...
        }
        */
        var fuzzifier = function(inputName, featureName, value) {
            var res = {};
            var mf = mfs.getMF(inputName, featureName);
            if (mf != undefined) {
                res[featureName] = mf(value);
            }
            return res;
        };

        var inference = function(inputName, inputSets) {
            var res = {};
            console.log(inputSets);
            //traverse all rules
            var activeRules = rules.filter(function(d) {
                var res = false;
                if(d.inputName == inputName) {
                    res = true;
                }
                return res;
            });
            activeRules.forEach(function(rule) {
                var minValue = Number.MAX_VALUE;
                rule.irules.forEach(function(d) {
                    var tmp = inputSets[d[0]][d[1]]
                    if(minValue > tmp) {
                        minValue = tmp;
                    }
                });
                var omf = mfs.getMF(rule.outputName, rule.orules[0]);
                // res.push({
                //     rule: rule,
                //     output: omf(minValue)[rule.orules[1]]
                // })
                if(res[rule.outputName] == undefined) {
                    res[rule.outputName] = {};
                }
                if(res[rule.outputName][rule.orules[0]] == undefined) {
                    res[rule.outputName][rule.orules[0]] = [];
                }
                res[rule.outputName][rule.orules[0]].push(omf(minValue)[rule.orules[1]]);
            });
            return res;
        };

        var defuzzifier = function(outputSets) {
            var res = {};
            var outputNames = Object.keys(outputSets);
            outputNames.forEach(function(name) {
                var features = Object.keys(outputSets[name]);
                res[name] = {};
                features.forEach(function(feat) {
                    var values = merge(outputSets[name][feat]);
                    var xs = Object.keys(values);
                    var a = 0, b = 0;
                    for(var i = 0; i < xs.length; i++) {
                        a += values[xs[i]] * xs[i];
                        b += values[xs[i]];
                    }
                    res[name][feat] = a / b;
                });                
            });
            return res;
        };

        var merge = function(ux) {
            var res = {};
            ux.forEach(function(d) {
                var xs = Object.keys(d);
                xs.forEach(function(x) {
                    if(res[x] == undefined) {
                        res[x] = d[x];
                    } else {
                        res[x] = res[x] < d[x] ? d[x] : res[x];
                    }
                });
            });
            return res;
        }

        var fs = function(inputName, value) {
            var res;
            var features = feature.getFeature(inputName)(value);
            Object.keys(features).forEach(function(key) {
                    var inputFuzzySets = fuzzifier(inputName, key, features[key]);
                    if (inputFuzzySets != undefined) {
                        var outputFuzzySet = inference(inputName, inputFuzzySets);
                        if (outputFuzzySet != undefined) {
                            res = defuzzifier(outputFuzzySet);
                        }
                    }
                });
            return res;
        };

        /*
        A rule:
        For X, if a feature is fMF, then weight (visual mapping) for Y is oMF
        */
        return {
            fs: fs,
            addRule: addRule
        };
    }]);
})();