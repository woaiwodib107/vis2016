/**
 * Created by Fangzhou on 2016/2/16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/vis2016');
//mongoose.connect('mongodb://localhost/vis2016_mmo');
//mongoose.connect('mongodb://localhost/vis2016');
mongoose.model('cluster', new Schema({id:Number, data:Array, children:Array},
    {collection:'clusters'}
));
mongoose.model('node', new Schema({id:Number, data:[{year:Number, mean:Number, ranks:Array}]},
    {collection:'nodes'}
));
