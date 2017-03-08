var XLSX = require('xlsx');
var output = require('debug')('app:log');
var path = require('path');
var config = require('./config.json');
var mysql = require('mysql');
var util = require('util');
var fs = require("fs");
//所有程序的输入文件都需要是单文件 不然容易出现异步的bug
var mysql_irm_client = mysql.createConnection(config.dbPath);
mysql_irm_client.connect();
var sql = '';
var now = new Date();
var log_name = "./"+ (now.getMonth()+1)+"."+now.getDate()+".log";

var handle = function(str)
{
    str = "\'"+ str + "\'";
    return str;
}
//所有程序的输入文件都需要是单文件 不然容易出现异步的bug
//此程序是对 有每日净值的excel进行更新的 也就是九尾一号 金星三号等
var pickdata = function (filename) {
    var baseName = path.basename(filename);
    var time = baseName.substr(baseName.length-12, 8);
    return time.substr(0,4)+"-"+time.substr(4,2)+"-"+time.substr(6,2); 
};
var pickdata2 = function (filename) {
    var baseName = path.basename(filename);
    var time = baseName.substr(baseName.length-14, 10);
    return time;
};
var pickName = function (filename) {
    var baseName = path.basename(filename);
   	var name = "";
   //此处还没有将星云1号写进来 因为星云1号的文件名字和格式不同
    if(baseName.indexOf("九尾1号") >= 0)
    	name = "Jiuwei1hao";
    else if(baseName.indexOf("星海3号") >= 0)
        name = "Xinghai3hao";
    else if(baseName.indexOf("金星三号") >= 0)
        name = "Jinxing3hao";
    else if(baseName.indexOf("星联1号") >= 0)
        name = "xinglian1hao";
    else if(baseName.indexOf("星联2号") >= 0)
        name = "xinglian2hao";
    else if(baseName.indexOf("星云1号") >= 0)
        name = "xingyun1hao";
    else if(baseName.indexOf("星优一号") >= 0)
        name = "Xingyou1hao";
    else if(baseName.indexOf("众星1号") >= 0)
        name = "Zhongxing1hao";
    return name;
};
var readWorkbook_ = function (filename) {
    var workbook = XLSX.readFile(filename);
    return workbook;
};

var errorHandler = function (err, result, callback) {
    if (err) throw err;
    callback(result);
};

var acct_name = {
    '1108.02.01.1HXRY1 OTC':'HuaxiaRY',
    '1108.02.01.1LHLH1 OTC':'LianhaiDingz',
    '1108.02.01.1PNZD1 OTC':'ShunshiGuoji',
    '1108.02.01.1XH1H1 OTC':'Xinhui1hao',
    '1108.02.01.1XH1Q1 OTC':'XingheM1',
    '1108.02.01.SD0678 OTC':'XinghaiM',
    '1108.02.01.SE7702 OTC':'Zhongxing1hao',
    '1108.02.01.SE7703 OTC':'Zhongxing2hao',
    '1108.02.01.SE8268 OTC':'Fengjing3qi',
    '1108.02.01.SH4448 OTC':'LianhaiZunx',
    '1108.02.01.SH4990 OTC':'Jiuwei1hao',
    '1108.02.01.SK6358 OTC':'Jiukun',
    '1108.02.01.SK6366 OTC':'Aiye',
    '1108.02.01.SK6374 OTC':'Shengshi',
    '1108.02.01.SK6378 OTC':'Liangdao',
    '1108.02.01.SK6379 OTC':'Zundao',
    '1108.02.01.SK6382 OTC':'Kanzhan',
    '1108.02.01.SH1882 OTC':'Panda1hao',
    '1108.02.01.SH4876 OTC':'LinjieKaili',
    '1108.02.01.SH4877 OTC':'Bird1hao',
    '1108.02.01.SH4912 OTC':'JiuweiHaoen',
    '1108.02.01.SH4914 OTC':'Jiuwei3hao',
    '1108.02.01.SH7628 OTC':'JiuweiC',
    '1108.02.01.SH7629 OTC':'JiuweiD',
    '1108.02.01.SL6773 OTC':'Xiaoqiang',
    '1108.02.01.SK3919 OTC':'JiuweiE',
    '1108.02.01.SH8833 OTC':'JiuweiB',
    '1108.02.01.SK3893 OTC':'xingyunLightH',
    '1108.02.01.M3174A OTC':'Meifeng2A',
    '1108.02.01.SM3377 OTC':'Xingying1hao',
    '11090101000132':'Shengshi',
    '11090101000134':'Zundao',
    '110901013F2C08':'xingyunYanf',
    '110901013I1870':'xingyunBqi',
    '110901013I1871':'xingyunCqi',
    '11090101E15303':'xingyunShunshi',
    '11090101S81686':'xingyunJial',
    '11090101SK3893':'xingyunLightH',
    '1108.02.01.SN0784 OTC':'LianhaiDuich',
    '1108.02.01.SR3252 OTC':'LianhaiJingx',
    '1108.02.01.1XYXC1 OTC':'Xingchen1hao',
    '1108.02.01.SN2682 OTC':'Xingyou1hao',
    '1108.02.01.SM9462 OTC':'Xingying8hao',
    '1108.02.01.SN4214 OTC':'Xingying14hao',
    '1108.02.01.SN4215 OTC':'Xingying15hao',
    '1108.02.01.SN4216 OTC':'Xingying16hao',
    '1108.02.01.SN4217 OTC':'Xingying17hao',
    '1108.02.01.SH0267 OTC':'ZhongxingSon2',
    '1108.02.01.SH0269 OTC':'ZhongxingSon4',
    '1108.02.01.SH0271 OTC':'ZhongxingSon6',
    '1108.02.01.SH0273 OTC':'ZhongxingSon7',
    '1108.02.01.SH0265 OTC':'ZhongxingSon1',
    '1108.02.01.SH0268 OTC':'ZhongxingSon3'
};



var sqlActionInner = function (workbook, filename, callback, num) {
    var seccode, date, total_equity, asset_official;
    /*处理每一项的仓位 看看他是否在数据库中 即select*的返回值result.length的值是多少*/
    var asset_official, total_equity;
    var fof_asset_official, fof_total_equity, fof_principal;
    var fof_Cash = 0, fof_Etf = 0, fof_Margin = 0, fof_Others = 0;

    var sheet_name = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[sheet_name];
    //遍历每个sheet中的每行数据
    var selectStr = "select * from fundinfo where account_id = ?;";
    var fund_of_fund = pickName(filename);
    var FOF_fund_of_fund = 'N/A';
    var fof_size, ProductNum = 0;
    var Database_Product_Num = num; //这个数 是 数据库中这个fof产品有多少个子基金
    //下面是针对fof 基金的处理
    var etf_flag = 0, margin_flag = 0, others_flag = 0; // 因为是单文件输入 所以可以设立一个fund_flag用来标识fund是否出现过 
    var fof_etf = fund_of_fund+'_etf';
    var fof_margin = fund_of_fund+'_margin';
    var fof_others = fund_of_fund+'_others';
    var fof_cash = fund_of_fund+'_cash';
    var pos_date = 0;
    if(fund_of_fund == 'xingyun1hao')
        pos_date = pickdata2(filename);
    else
        pos_date = pickdata(filename);

    var n = 'A';
    var index = new Array(); //这是一个存储下标的字典
    while((n != 'Z')&&worksheet[n+5]&&worksheet[n+5].v)
    {
        index[worksheet[n + 5].v] = n;
        n = String.fromCharCode(n.charCodeAt() + 1);
    }

    for (var i = 5; i < 300; i++)
    {
        var ai = worksheet[index['科目代码'] + i];//seccode
        var bi = worksheet[index['科目名称'] + i];
        if(index['市价'] == undefined)
            var ji = worksheet[index['行情'] + i];
        else
            var ji = worksheet[index['市价'] + i];
        if(index['市值'] == undefined)
            var li = worksheet[index['市值-本币'] + i];
        else 
            var li = worksheet[index['市值'] + i];
        if(index['成本'] == undefined)
            var hi = worksheet[index['成本-本币'] + i];
        else 
            var hi = worksheet[index['成本'] + i];

        var ki = worksheet[index['市值-原币'] + i];
        var fi = worksheet[index['单位成本'] + i];//cost_asset
        var ei = worksheet[index['数量'] + i]; //cost
        var gi = worksheet[index['成本-原币'] + i]; //price
        if((ai&&li&&hi&&ei&&ai.v.toString()&&ai.v.toString().substr(0, 11) == '1108.02.01.') || (ai&&ai.v.toString().substr(0, 8) =='11090101'))
        {
            ProductNum++;   //这个数是 估值表中这个 fof产品有多少个子基金  
            if(fund_of_fund == 'Jiuwei1hao' || fund_of_fund == 'Jinxing3hao'||fund_of_fund == 'Xinghai3hao'||fund_of_fund == 'Xingyou1hao'||fund_of_fund == 'Zhongxing1hao')
            {
                var account_id = acct_name[ai.v.toString()];
                var asset_official = ji.v;
                var total_equity = li.v;
                var principal = hi.v;
                var cost_price = fi.v;
                var quantity = ei.v;
            }
            if(fund_of_fund == 'xingyun1hao')
            {
                var account_id = acct_name[ai.v.toString()];
                var asset_official = ji.v;
                var total_equity = li.v;
                var principal = hi.v;
                var cost_price = fi.v;
                var quantity = ei.v;                
            }
            if(!account_id)
            {
                console.log(account_id + "程序警告：没有这个产品 请手动创建条目在fundinfo中 并插入到nvdata");
                continue;
            }
            (function(){
                //将fof基金中的产品信息都存进去
                var temp = [pos_date, account_id, total_equity, principal, fund_of_fund, asset_official, asset_official, quantity, cost_price];
                mysql_irm_client.query(selectStr, //用来判断是否在fundinfo这个表中
                    [account_id],
                    function(err, result) { 
                        if(result.length != 0) //这个数据在数据库中 
                        {
                            //那么就需要 更新acct_info里面的principal等信息 
                            //同时需要将FOF的净值和子基金净值都插入数据库中
                            var n = [];
                            for(var i = 0; i < temp.length; i++)
                                n.push(temp[i]);
                            callback(n[0], n[1],n[2],n[3],n[4],n[5],n[6], n[7], n[8], 1);
                            //callback(pos_date, account_id, total_equity, principal, fund_of_fund, asset_official, asset_official, quantity);
                        }
                        else{
                            console.log(account_id + "!!!!!!!!!!!!!!没有这个产品 请手动创建条目在fundinfo中 并插入到nvdata");
                        }
                        if(err) {
                            console.log(err);
                            throw err;
                        }
                });
            })();
        }  //end if
        else if(ai&&(ai.v.toString() == '1002'))
        { //此处是针对现金进行处理的 需要for循环的外面才能搞定
            if(fund_of_fund == 'Jiuwei1hao' ||fund_of_fund == 'Jinxing3hao'||fund_of_fund == 'Xinghai3hao'||fund_of_fund == 'Xingyou1hao')
            {
                var account_id = fund_of_fund + "_cash";
                fof_Cash = li.v;
            }
            else if(fund_of_fund == 'xingyun1hao')
            {
                var account_id = fund_of_fund + "_cash";
                fof_Cash = hi.v;
            }
            callback(pos_date, fof_cash, 0, fof_Cash, fund_of_fund, 0, 0, 0, 1, 4);
        }
        else if(ai&&(ai.v.toString() == '1021'||ai.v.toString() == '3003'))
        { //此处是针对其他进行处理的 需要for循环的外面才能搞定
            if(fund_of_fund == 'Jiuwei1hao' ||fund_of_fund == 'Jinxing3hao'||fund_of_fund == 'Xinghai3hao'||fund_of_fund == 'Xingyou1hao')
            {
                var account_id = fund_of_fund + "_others";
                fof_Others += li.v;
            }
            else if(fund_of_fund == 'xingyun1hao')
            {
                var account_id = fund_of_fund + "_others";
                fof_Others += hi.v;
            }
            others_flag = 1;
           // pos_date, account_id, total_equity, principal, fund_of_fund, asset_official, asset_official, quantity, cost_price, asset_type
        }
        else if(ai&&ai.v.toString() == '1031')
        {  //Margin就一个 所以可以for循环里面搞定
            var account_id = fund_of_fund + "_margin";
            if(fund_of_fund == 'Jiuwei1hao' ||fund_of_fund == 'Jinxing3hao'||fund_of_fund == 'Xinghai3hao'||fund_of_fund == 'Xingyou1hao')
            {
                fof_Margin = li.v;               
            }
            else if(fund_of_fund == 'xingyun1hao')
                fof_Margin = hi.v;
            margin_flag = 1;
           // pos_date, account_id, total_equity, principal, fund_of_fund, asset_official, asset_official, quantity, cost_price, asset_type
            callback(pos_date, fof_margin, 0, fof_Margin, fund_of_fund, 0, 0, 0, 1, 3);
        } 
        else if(ai&&(ai.v.toString() == '1105'||ai.v.toString() == '1202'))
        {  //Etf就一个 所以可以for循环里面搞定
            var account_id = fund_of_fund + "_etf";
            if(fund_of_fund == 'Jiuwei1hao' ||fund_of_fund == 'Jinxing3hao'||fund_of_fund == 'Xinghai3hao'||fund_of_fund == 'Xingyou1hao')
            {
                fof_Etf += li.v;               
            }
            else if(fund_of_fund == 'xingyun1hao')
                fof_Etf += hi.v;
            etf_flag = 1;
        }      
        else if(ai && ai.v.toString() == '单位净值'){
            fof_asset_official = bi.v;
            continue;
        }
        else if(ai && ai.v.toString() == '资产净值'){
            fof_total_equity = li.v;
            continue;
        }
        // else if(ai && ai.v.toString() == '资产合计'){
        //     fof_principal = hi.v;
        //     continue;
        // }
        else if(fund_of_fund == 'xingyun1hao'&&ai && ai.v.toString() == '实收资本')
        {
            fof_size = ei.v;
            continue;
        }
        else if(ai && ai.v.toString() == '基金单位净值：')
        {
            fof_asset_official = hi.v;
            continue;
        }
        else if(ai && ai.v.toString() == '基金资产净值:')
        {
            fof_total_equity = hi.v;
            continue;           
        }
        // else if(ai && ai.v.toString() == '资产类合计:')
        // {
        //     fof_principal = ei.v;
        //     continue;           
        // }
        else if(ai && ai.v.toString() == '实收资本')
        {
            fof_size = hi.v;
            continue;           
        }
        else
        {
            continue;
        }
    }             // end for
    console.log("line:331  "+Database_Product_Num, ProductNum);
    if(Database_Product_Num == ProductNum)
        console.log("子基金运作正常");
    else
        console.log("!!!!NOTICE!!!!!!!!!!产品有申购赎回,在fundinfo表中进行对应操作");

 
    //console.log(pos_date, fund_of_fund, fof_total_equity, fof_principal, FOF_fund_of_fund, fof_asset_official, fof_asset_official, fof_size, 1);
    //fof基金的所有信息 经过for循环之后全都获取到了
    // pos_date, account_id, total_equity, principal, fund_of_fund, asset_official, asset_official, quantity, cost_price, asset_type

    callback(pos_date, fund_of_fund, fof_total_equity, fof_size, FOF_fund_of_fund, fof_asset_official, fof_asset_official, fof_size, 0, 0); // fof的类型标注为0
    // if(etf_flag == 0)
    //     callback(pos_date, fof_etf, 0, 0, fund_of_fund, 0, 0, 0, 1, 2);
    // if(margin_flag == 0)
    //     callback(pos_date, fof_margin, 0, 0, fund_of_fund, 0, 0, 0, 1, 3);
    // if(others_flag == 0)
    //     callback(pos_date, fof_others, 0, 0, fund_of_fund, 0, 0, 0, 1, 5);
    if(others_flag == 1)
    {
        //fof基金的others持仓经过for循环之后 获取到了
        callback(pos_date, fof_others, 0, fof_Others, fund_of_fund, 0, 0, 0, 1, 5);
    }
    if(etf_flag == 1)
    {
        callback(pos_date, fof_etf, 0, fof_Etf, fund_of_fund, 0, 0, 0, 1, 2);
    }
};

var statistics_database_product_num = function(filename){
    var tmpFunction = function(a, b, c, d, e, f, g, h, i, j)
    {
        console.log(a, b, c, d, e, f, g, h, i, j);
        //pos_date, account_id, total_equity, principal, fof_id, asset_official, asset_official, quantity, cost_price, asset_type
        var selectAcct = "select * from nvdata where trading_day = ? and acct = ?;";
        var insertNvdata = "insert into nvdata(trading_day, acct, total_market_value, total_cost_value, asset_us, asset_official, update_time) VALUES(?, ?, ?, ?,?, ?, NOW());";
        var insertFoFholding = "insert into fofholding(pos_date, fof_id, account_id, principal, cost_price, quantity, update_time, asset_type) values(?,?,?,?,?,?,NOW(),?);";
        var updateJXNvdata = "update nvdata set asset_official = ?, total_market_value = ?, total_cost_value = ?, update_time = NOW() where trading_day = ? and acct = ?";  
        var selectFoF = "select * from fofholding where pos_date = ? and fof_id = ? and account_id = ?;";
        var updateCash = "update fofholding set principal = ?, update_time = NOW() where pos_date = ? and account_id = ? and fof_id = ?";
        var FoFFunc = function(err, result)
        {
            if(result.length == 0 && j == 1)
            {
                // 如果是Cash和Fund 那么就走 InsertFuncion函数
                mysql_irm_client.query(insertFoFholding,
                            [a, e, b, d, i, h, j],
                            function(err, result){
                                console.log("FoFFunc函数：插入fofholdind" +a, e, b);
                            }); 

            }
            else if(j == 0)
            {
               //这针对fof的处理
            }
            else
            {
                var updateCash = "update fofholding set principal = ?, update_time = NOW() where pos_date = ? and account_id = ? and fof_id = ?";
                mysql_irm_client.query(updateCash,
                    [d, a, b, e],
                    function(err, result) {
                        if(err) {
                            console.log(err);
                            throw err;
                        }  
                        console.log("FoFFunc函数：更新fofholdind" +a, e, b);
                }); 
            }
        }
        mysql_irm_client.query(selectFoF,
            [a, e, b],FoFFunc);

        var selectFunction = function(err, result){
            if (err){
                    console.log(err);
                    throw err;
            }
            if(result.length == 0) //九尾1号中 有一些净值 每天是没有估值表的 也就是不再净值表中 需要靠此估值表来更新净值 ji就有用了
            {
                console.log(a + " " + b + " " + "不在nvdata中");
                mysql_irm_client.query(insertNvdata,
                    [a, b, c, d, f, g],
                    function(err, result) {
                //console.log("fof表中的子基金（插入）到nvdata表中", a, b);
                        if(err) {
                            console.log(err);
                            throw err;
                        }
                        var sql = util.format("insert into nvdata(trading_day, acct, total_market_value, total_cost_value, asset_us, asset_official, update_time) VALUES(%s, %s, %s, %s,%s, %s, NOW());\n",  handle(a), handle(b), handle(c), handle(d), handle(f), handle(g));
                        fs.appendFile(log_name,sql,'utf8',function(err){  
                            if(err)  
                            {  
                                console.log(err);  
                            }  
                        });  
                    });
                //version1：如果是fof 那么就只插入到nvdata中 不需要插入fofholding
                //nothing to do
                //现在改成第二版：fof的 也插入到fofholding中吧

                if(b != fund_of_fund)
                {
                    var selectFoF = "select * from fofholding where pos_date = ? and fof_id = ? and account_id = ?;";
                    var insertFoFholding = "insert into fofholding(pos_date, fof_id, account_id, principal, cost_price, quantity, update_time, asset_type) values(?,?,?,?,?,?,NOW(),?);";
                    var FoF1 = function(err, result)
                    {
                        if(result.length == 0)
                        {
                            // 如果是Cash和Fund 那么就走 InsertFuncion函数
                            mysql_irm_client.query(insertFoFholding,
                                        [a, e, b, d, i, h, j],
                                        function(err, result){
                                            if(err) {
                                                console.log(err);
                                                throw err;
                                            }
                                        }); 
                        }
                    }
                    mysql_irm_client.query(selectFoF,
                        [a, e, b],FoF1);
                }    
            }
            else
            {
                //存在的就对金星3号的净值进行更新 其他的净值不用管了 因为fundholding的程序已经把子基金的净值录入了
                if(b == 'Jinxing3hao')
                {
                    mysql_irm_client.query(updateJXNvdata,
                        [g, c, d, a, b],
                        function(err, result) {
                    // console.log("fof表中的子基金（插入）到nvdata表中", a, b);
                            if(err) {
                                console.log(err);
                                throw err;
                            }
                            var sql = util.format("update nvdata set asset_official = %s, total_market_value = %s, total_cost_value = %s, update_time = NOW() where trading_day = %s and acct = %s;\n",  handle(g), handle(c), handle(d), handle(a), handle(b));
                            fs.appendFile(log_name,sql,'utf8',function(err){  
                                if(err)  
                                {  
                                    console.log(err);  
                                }  
                            });    
                        });
                }
            }
        }
        var InsertFuncion = function(err, result){
            if (err){
                console.log(err);
                throw err;
            }
            console.log(e + "的资产插入FOFholding表中", a, b);
        }
        if(b == fund_of_fund + "_etf" || b == fund_of_fund + "_cash" || b == fund_of_fund + "_margin" || b == fund_of_fund + "_others")
        {

            var selectFoF = "select * from fofholding where pos_date = ? and fof_id = ? and account_id = ?;";
            var FoFFunc = function(err, result)
            {
                if(result.length == 0)
                {
                    // 如果是Cash和Fund 那么就走 InsertFuncion函数     
                    mysql_irm_client.query(insertFoFholding,
                                [a, e, b, d, i, h, j],
                                InsertFuncion); 

                }
                else
                {
                    var updateCash = "update fofholding set principal = ?, update_time = NOW() where pos_date = ? and account_id = ? and fof_id = ?";
                    mysql_irm_client.query(updateCash,
                        [d, a, b, e],
                        function(err, result) {
                            if(err) {
                                console.log(err);
                                throw err;
                            }  
                    }); 
                }
            }
            mysql_irm_client.query(selectFoF,
                [a, e, b],FoFFunc);
        }
        else
        {
            //如果不是Cash和Fund 那么就走 selectFunction函数
            mysql_irm_client.query(selectAcct,
                    [a, b],
                    selectFunction);
        }
    }
    var fund_of_fund = pickName(filename);
    //我需要取出当前文件中数据库里产品的数量和 估值表中产品的数量

    var selectStr = "select count(*) from fofholding where fof_id = ? and account_id not like '%*_%' escape '*' and pos_date = (SELECT MAX(trading_day) FROM nvdata WHERE acct = ? AND asset_official > 0) ;";
    mysql_irm_client.query(selectStr,
        [fund_of_fund, fund_of_fund],
        function(err, result) {
            if(err) {
                console.log(err);
                throw err;
            }
            n = result[0]['count(*)'];
            sqlActionInner(readWorkbook_(filename), filename, tmpFunction, n);
        });
};



var sqlAction = function (filename) {
    statistics_database_product_num(filename);
};

module.exports = sqlAction;
//TODO:  cash和fund还没有录进去 cash注意是多个条目的相加
