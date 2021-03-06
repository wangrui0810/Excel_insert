var XLSX = require('xlsx');
var output = require('debug')('app:log');
var config = require('./config.json');
var getPattern1 = require('./pattern1.js');
var getPattern2 = require('./pattern2.js');
var getPattern3 = require('./pattern3.js');
var util = require('util');
var fs = require("fs");

var handle = function(str)
{
    str = "\'"+ str + "\'";
    return str;
}

var now = new Date();
var log_name = "./"+ (now.getMonth()+1)+"."+now.getDate()+".log";

var mysql = require('mysql');
var mysql_irm_client = mysql.createConnection(config.dbPath);
mysql_irm_client.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + mysql_irm_client.threadId);
});

var readWorkbook_ = function (filename) {
    var workbook = XLSX.readFile(filename);
    return workbook;
};
var errorHandler = function (err, result, callback) {
    if (err) throw err;
    callback(result);
};
var flag = {};
//pattern是估值表的三种形式 
var pattern1 = ['HuaxiaRY','XinghaiM','Zhongxing1hao','Zhongxing2hao','Fengjing3qi','LianhaiZunx',
                'Jiuwei1hao','Jiukun','Aiye','Shengshi','Liangdao','Zundao','Kanzhan','LianhaiDuich',
                'Kanzhan','Panda1hao','LinjieKaili','Bird1hao','JiuweiHaoen','Jiuwei3hao','Xingyou1hao',
                'JiuweiC','JiuweiD','Xiaoqiang','JiuweiE','JiuweiB','Meifeng2A','Xingying1hao', 'Xingying2hao','Xingying4hao',
                'Xingying8hao','Xingying14hao','Xingying15hao','Xingying16hao','Xingying17hao','Tianwangxing','Haiwangxing',
                'xingyunYanf','xingyunJial','Xingmei4hao','xingyunLightH', 'Huaxia2hao','Jinxing3hao', 'LianhaiJingx', 'Youshi6qi',
                'ZhongxingSon1','ZhongxingSon2', 'ZhongxingSon3', 'ZhongxingSon4', 'ZhongxingSon5', 'ZhongxingSon6',
                 'ZhongxingSon7', 'ZhongxingSon8', 'ZhongxingSon9'];
for(var i = 0; i < pattern1.length; ++i)
{
    flag[pattern1[i]] = 1;
}
var pattern2 = ['xingyunCqi','LianhaiDingz', 'Xingying6hao', 'Xingying7hao', 'LanshiLingt'];
for(var i = 0; i < pattern2.length; ++i)
{
    flag[pattern2[i]] = 2;
}
var pattern3 = ['XingheM2', 'ShunshiGuoji', 'XingheM1', 'Xinhui1hao', 'JiaxuanDingz'];
for(var i = 0; i < pattern3.length; ++i)
{
    flag[pattern3[i]] = 3;
}


var sqlAction = function (filename, account_id) {
    var tmpFunction = function (a, b, c, d, e, f, g, h, i, j) 
    {
        var selectFund = 'select *from fundholding where pos_date = ? and account_id = ? and security_id = ?;';
        var insertFundholding = 'insert into fundholding(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value, update_time) values(?,?,?,?,?,?,?,?,?,?,NOW());';
        var insertFundholding2 = 'insert into fundholding(pos_date, account_id, security_id, security_name, security_type, principal, market_value, update_time) values(?,?,?,?,?,?,?,NOW());';
        var updateFundholding = "update fundholding set security_type = ?, principal = ?, cost_price = ?, quantity = ?, market_price = ?,market_value = ?, update_time = NOW() where pos_date = ? and account_id = ? and security_id = ?;";
        var updateFundholding2 = "update fundholding set security_type = ?, principal = ?, market_value = ?, update_time = NOW() \
        where pos_date = ? and account_id = ? and security_id = ?;";
        var selectFunction = function(err, result) {
            if(result.length == 0)
            {
                // 如果是Cash和Fund 那么就走 InsertFuncion函数
                if(e == 3||e == 4||e == 10||e == 11)
                    mysql_irm_client.query(insertFundholding2,
                            [a, b, c, d, e, f, j],
                            function(err, result){
                                if(err) {
                                    console.log(err);
                                    throw err;
                                }  
                                console.log("插入Fundholding" +a, b, c);
                                // console.log(result);
                            }); 

                else
                    mysql_irm_client.query(insertFundholding,
                            [a, b, c, d, e, f, g, h, i, j],
                            function(err, result){
                                if(err) {
                                    console.log(err);
                                    throw err;
                                }  
                                console.log("插入Fundholding" +a, b, c);
                                // console.log(result);
                            }); 
            }
        }
        mysql_irm_client.query(selectFund, 
            [a, b, c],
            selectFunction);
    };
    //trading_day, acct, long_value, short_value, total_market_value, total_cost_value, asset_us, asset_official);
    var insertNvdata = function(a, b, c, d, e, f, g, h, i)
    {
        var selectAcct = "select * from nvdata where trading_day = ? and acct = ?;";
        var insertNvdata = "insert into nvdata(trading_day, acct, long_value, short_value, margin, total_market_value, total_cost_value,\
         asset_us, asset_official, update_time) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());";
        var updateNvdata = "update nvdata set long_value = ?,short_value = ?,margin = ?,total_market_value = ?,total_cost_value =?,\
         asset_us = ?, asset_official = ?, update_time = NOW() where trading_day = ? and acct = ?";
        
        var insertFunction = function(err, result) {
            if(result.length == 0)
            {
                // 如果是Cash和Fund 那么就走 InsertFuncion函数
                mysql_irm_client.query(insertNvdata,
                            [a, b, c, d, e, f, g, h, i],
                            function(err, result){
                                if(err) {
                                    console.log(err);
                                    throw err;
                                }
                                var sql = util.format("insert into nvdata(trading_day, acct, long_value, short_value, margin, total_market_value, total_cost_value,\
asset_us, asset_official, update_time) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW());\n",  handle(a), handle(b), handle(c), handle(d), handle(e), handle(f), handle(g), handle(h), handle(i));
                                fs.appendFile(log_name,sql,'utf8',function(err){  
                                    if(err)  
                                    {  
                                        console.log(err);  
                                    }  
                                });      
                                console.log("插入Nvdata" +a, b);
                                // console.log(result);
                            }); 
            }
            else
            {
                mysql_irm_client.query(updateNvdata,
                        [c, d, e, f, g, h, i, a, b],
                        function(err, result){
                            if(err) {
                                console.log(err);
                                throw err;
                            }  
                            var sql = util.format("update nvdata set long_value = %s,short_value = %s,margin = %s,total_market_value = %s,total_cost_value =%s,\
asset_us = %s, asset_official = %s, update_time = NOW() where trading_day = %s and acct = %s;\n",  handle(c), handle(d), handle(e), handle(f), handle(g), handle(h), handle(i), handle(a), handle(b));
                            fs.appendFile(log_name,sql,'utf8',function(err){  
                                if(err)  
                                {  
                                    console.log(err);  
                                }  
                            });  
                            // console.log("更新Nvdata" +a, b);
                            // console.log(result);
                        }); 
            }
        }
        mysql_irm_client.query(selectAcct, 
            [a, b],
            insertFunction);  
    };

    if(flag[account_id] == 1)
        getPattern1(readWorkbook_(filename), filename, account_id, tmpFunction, insertNvdata);
    else if(flag[account_id] == 2)
        getPattern2(readWorkbook_(filename), filename, account_id, tmpFunction, insertNvdata);
    else if(flag[account_id] == 3)
        getPattern3(readWorkbook_(filename), filename, account_id, tmpFunction, insertNvdata);
    //sqlActionInner(readWorkbook_(filename), filename, account_id, tmpFunction);
};

module.exports = sqlAction;
