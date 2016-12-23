var fs = require("fs");
var fsEx = require('fs-extra');
var sqlAction = require('./mysql_EXCELgusuan.js');
var output = require('debug')('app:log');


var insertSql_ = function() {
    var xx = fs.readdirSync('E:/workplace/about_job/insertExcel/ZZX/gusuan_data');
    for (var key in xx) {
        var file_name = 'E:/workplace/about_job/insertExcel/ZZX/gusuan_data/' + xx[key];
        sqlAction(file_name);
    }
};
insertSql_();