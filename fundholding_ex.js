var fs = require("fs");
var fsEx = require('fs-extra');
var sqlAction = require('./fundholding.js');
var output = require('debug')('app:log');
var insertSql_ = function() {
    var xx = fs.readdirSync('E:/workplace/about_job/insertExcel/ZZX/EXCEL');
    for (var key1 in xx) {
    	var account_id = xx[key1];
    	var dir_name = 'E:/workplace/about_job/insertExcel/ZZX/EXCEL/' + xx[key1];
        var dir_content = fs.readdirSync(dir_name);
        for(var key2 in dir_content){
            var file_name = dir_name + '/' + dir_content[key2];	
            sqlAction(file_name, account_id);
        }
    }
};
insertSql_();

