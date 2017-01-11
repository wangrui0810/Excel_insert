//估算 n日净值 用离得最近的 n-3日的估值表 insert  
//然后 发来n日估值表时 先手动修改 pos_date = file_date 再进行更新fof的所有数值 

var XLSX = require('xlsx');
var output = require('debug')('app:log');
var path = require('path');
var config = require('./config.json');
var mysql = require('mysql');
//所有程序的输入文件都需要是单文件 不然容易出现异步的bug
var mysql_irm_client = mysql.createConnection(config.dbPath);
mysql_irm_client.connect();





var pos_date = "2017-01-10";   //这是执行时间 与文件的时间相吻合的话 更新fof的asset_official 否则就不用更新
//所有程序的输入文件都需要是单文件 不然容易出现异步的bug
//该程序有疑问 未处理 !!!!!!!!
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
    //此处针对需要每日进行估算的三个产品
    if(baseName.indexOf("星联1号") >= 0)
        name = "xinglian1hao";
    else if(baseName.indexOf("星联2号") >= 0)
        name = "xinglian2hao";
    else if(baseName.indexOf("星云1号") >= 0)
        name = "xingyun1hao";
    else if(baseName.indexOf("金星三号") >= 0)
        name = "Jinxing3hao";
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
    '1108.02.01.1XYXC1 OTC':'Xingchen1hao',
    '11090601SK6382':'Kanzhan',
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
    '1108.02.01.M3174A OTC':'Meifeng2A',
    '1108.02.01.SM7317 OTC':'Xingying4hao',
    '1108.02.01.1XY6H1 OTC':'Xingying6hao',
    '1108.02.01.1XY7H1 OTC':'Xingying7hao',
    '11090101SD7429':'XingheM2',
    '11090601S82543':'XingheM1',
    '11090101000132':'Shengshi',
    '11090101000134':'Zundao',
    '110901013F2C08':'xingyunYanf',
    '110901013I1870':'xingyunBqi',
    '110901013I1871':'xingyunCqi',
    '11090101E15303':'xingyunShunshi',
    '11090101S81686':'xingyunJial',
    '11090101SK3893':'xingyunLightH',
    '1108.02.01.1XM4H1 OTC':'Xingmei4hao',
    '1108.02.01.SK3893 OTC':'xingyunLightH',
    '1108.02.01.SR3252 OTC':'LianghuaJingx'
};

var isExistFoFholding  = function(a, b, c, d, e, f, g, h, i, j)
{
    var selectFoF = "select * from fofholding where pos_date = ? and fof_id = ? and account_id = ?;";
    var FoFFunc = function(err, result){
        if(err) {
            console.log(err);
            throw err;
        }
        if(result.length == 0)
            return 0;
        else
            return 1;
    }
    mysql_irm_client.query(selectFoF,
    [a, e, b],FoFFunc);
}

var sqlActionInner = function (workbook, filename, callback1) {

    var acct_asset = {};
    //需要先把所有最新的子基金数据弄下来
    var selectNeatest = "select nvdata.trading_day, nvdata.acct, nvdata.asset_us from nvdata join (select max(trading_day) as trading_day, acct from nvdata where trading_day <= ? group by acct) s on nvdata.trading_day = s.trading_day and nvdata.acct = s.acct";
    var fund_of_fund = pickName(filename);
    //下面需要获取数据库中fof产品的数量 以应对申购赎回的问题

    var Database_Product_Num = 0;
    var selectFOFnum = "select count(*) from fofholding where fof_id = ? and account_id not like '%*_%' escape '*' and pos_date = (SELECT MAX(trading_day) FROM nvdata WHERE acct = ? AND asset_official > 0) ;";

    var selectFunction = function (err, result) {
        if (err) {
            console.log(err);
            throw err;
        }
        Database_Product_Num = result[0]['count(*)'];   //因为在fofholding中会有fof基金的数据 所以计算子基金树木的时候需要减掉            
        var selectFunction2 = function (err, result) {
            if (err) {
                console.log(err);
                throw err;
            }
            for(var i = 0; i < result.length; i++)
            {
                var temp = result[i]['acct'];
                acct_asset[temp] = result[i]['asset_us'];
            }
            //所有子基金的最新净值存下了
            callback1(workbook, Database_Product_Num, acct_asset);
        };
        mysql_irm_client.query(selectNeatest,  //查询出 离输入日期最近的子基金净值
            [pos_date],
            selectFunction2);
    };
    mysql_irm_client.query(selectFOFnum,
        [fund_of_fund, fund_of_fund],
        selectFunction);
};


var sqlAction = function (filename) {
    var fund_of_fund = pickName(filename);
    if(fund_of_fund == 'xingyun1hao')
        var file_date = pickdata2(filename); //此处需要一个估值表时间 用来和一个执行时间进行比对
    else
        var file_date = pickdata(filename);
    //pos_date, account_id, total_equity, principal, fund_of_fund, asset_us, asset_official, quantity, cost_price, asset_type
    var updateFunction = function(a, b, c, d, e, f, g, h, i, j)
    {
        //因为此函数是 更新 fof基金和 更新fof基金中的cash、etf啥的通用 所以需要if判断一下是不是 account_id 
        var updateOfficial = "update nvdata set asset_official = ?, total_market_value = ?, total_cost_value = ?, update_time = NOW() where trading_day = ? and acct = ?";
        var updateCash = "update fofholding set principal = ?, update_time = NOW() where pos_date = ? and account_id = ? and fof_id = ?";
        if(b == pickName(filename)){
            mysql_irm_client.query(updateOfficial,
                [f, c, d, a, b],
                function(err, result) {
                    if(err) {
                        console.log(err);
                        throw err;
                    }  
                    if(result.rowCount == 0)
                    {
                        console.log(file_date,"没有fof数据的，也就是没有估算，无法更新官方净值");
                    }
                    else
                    {
                        console.log("更新官方净值" +a, b);
                    }
            });
        }
        else
        {
            mysql_irm_client.query(updateCash,
                [d, a, b, e],
                function(err, result) {
                    if(err) {
                        console.log(err);
                        throw err;
                    }  
                console.log("针对fof的函数：更新fofholdind" +a, e, b);
            });  
        }
    }
    var insertFunction = function(a, b, c, d, e, f, g, h, i, j)  // 处理cash etf 和fof信息的插入
    {
        if(b == e) //针对fof基金净值的插入
        {
            if(g == '')
            {
                var insertNvdata = "insert into nvdata(trading_day, acct, total_market_value, total_cost_value, asset_us, update_time) VALUES(?, ?, ?, ?, ?, NOW());";
                mysql_irm_client.query(insertNvdata,
                    [a, b, c, d, f],
                    function(err, result) {
                // console.log("fof表中的子基金（插入）到nvdata表中", a, b);
                        if(err) {
                            console.log(err);
                            throw err;
                        }
                        console.log("针对fof的函数：插入Nvdata" +a, b);
                    });
            }
            else
            {
                var insertNvdata = "insert into nvdata(trading_day, acct, total_market_value, total_cost_value, asset_us, asset_official, update_time) VALUES(?, ?, ?, ?, ?, ?, NOW());";
                mysql_irm_client.query(insertNvdata,
                    [a, b, c, d, f, g],
                    function(err, result) {
                // console.log("fof表中的子基金（插入）到nvdata表中", a, b);
                        if(err) {
                            console.log(err);
                            throw err;
                        }
                        console.log("针对fof的函数：插入Nvdata" +a, b);
                    });
            }
        }
        else
        {
            // 将数据插入到fofHolding中
            var selectFoF = "select * from fofholding where pos_date = ? and fof_id = ? and account_id = ?;";
            var insertFoFholding = "insert into fofholding(pos_date, fof_id, account_id, principal, cost_price, quantity, update_time, asset_type) values(?,?,?,?,?,?,NOW(),?);";
            var FoF1 = function(err, result){
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
    var tmpFunction = function(a, b, c, d, e, f, g, h, i, j)  //只用来处理子基金的nvdata
    {
        var selectAcct = "select * from nvdata where trading_day = ? and acct = ?;";
        var selectFunction = function(err, result)
        {
            if (err){
                console.log(err);
                throw err;
            }
            var insertFoFholding = "insert into fofholding(pos_date, fof_id, account_id, principal, cost_price, quantity, update_time, asset_type) values(?,?,?,?,?,?,NOW(),?);";
            var selectFoF = "select * from fofholding where pos_date = ? and fof_id = ? and account_id = ?;";
            var updateCash = "update fofholding set principal = ?, update_time = NOW() where pos_date = ? and account_id = ? and fof_id = ?";

            var FoFFunc = function(err, result)
            {
                if(result.length == 0)
                {
                    // 如果是Cash和Fund 那么就走 InsertFuncion函数
                    mysql_irm_client.query(insertFoFholding,
                                [file_date, e, b, d, i, h, j],
                                function(err, result){
                                    // console.log("FoFFunc函数：插入fofholdind" +file_date, e, b);
                                }); 

                }
                else
                {
                    var updateCash = "update fofholding set principal = ?, update_time = NOW() where pos_date = ? and account_id = ? and fof_id = ?";
                    mysql_irm_client.query(updateCash,
                        [d, file_date, b, e],
                        function(err, result) {
                            if(err) {
                                console.log(err);
                                throw err;
                            }  
                            // console.log("FoFFunc函数：更新fofholdind" +file_date, e, b);
                    }); 
                }
            }
            mysql_irm_client.query(selectFoF,
                [file_date, e, b],FoFFunc);

            //没有这天的净值信息 
            if(result.length == 0) 
            {
                //这一天的净值信息没有 看看有没有fofholding 如果也没有 那么就插入
                if(pos_date == file_date)
                {
                    // 有准确的估值表 并且数据没录入nvdata 因为有的子基金是没有估值表的
                    var insertNvdata = "insert into nvdata(trading_day, acct, total_market_value, asset_us, asset_official, update_time) VALUES(?, ?, ?, ?, ?, NOW());";
                    mysql_irm_client.query(insertNvdata,
                        [file_date, b, c, f, g],
                        function(err, result) {
                    // console.log("fof表中的子基金（插入）到nvdata表中", file_date, b);
                            if(err) {
                                console.log(err);
                                throw err;
                            }
                            console.log(file_date, b+"这个净值是新的 没录过 插入nvdata");
                        });
                    //更新对于 fof中的子基金 既要更新principal  又要更新nvdata的净值
                    var updateFoFholding = "update fofholding set principal = ?, quantity = ?, cost_price = ?, update_time = NOW() where account_id = ? and fof_id = ? and pos_date = ?;";
                    mysql_irm_client.query(updateFoFholding,
                        [d, h, i, b, e, a],
                        function(err, result) {
                        //console.log("fof表中的子基金（插入）到FoFholding表中", a, b);
                            if(err) {
                                console.log(err);
                                throw err;
                            }
                            //console.log(result);
                        });
                    //因为星联估值表的数据来的慢 不需要用其来更新净值
                }
            }
            else  //有这天的信息 那么更新即可
            {
                if(pos_date == file_date)
                {
                    //更新对于 fof中的子基金 既要更新principal  又要更新nvdata的净值
                    var updateFoFholding = "update fofholding set principal = ?, quantity = ?, cost_price = ?, update_time = NOW() where account_id = ? and fof_id = ? and pos_date = ?;";
                    mysql_irm_client.query(updateFoFholding,
                        [d, h, i, b, e, a],
                        function(err, result) {
                        //console.log("fof表中的子基金（插入）到FoFholding表中", a, b);
                            if(err) {
                                console.log(err);
                                throw err;
                            }
                            // console.log("tmpFunction函数～更新fofholdind" +file_date, e, b, d, h, i );
                        });
                    //因为星联估值表的数据来的慢 不需要用其来更新净值
                }
            }
        }
        //因为是对估值表中的数据查询 所以此处的时间必须是file_date
        mysql_irm_client.query(selectAcct,
        [file_date, b],
        selectFunction);
    }
    var tmpFunction1 = function(workbook, Database_Product_Num, acct_asset) 
    {
        // console.log(Database_Product_Num);
        //接收到了数据库中fof的子基金数量 和所有子基金的净值 可以开始净值的估算了
        var Product_Num = 0;
        //估算开始
        var seccode, date, total_equity, asset_official;
        /*处理每一项的仓位 看看他是否在数据库中 即select*的返回值result.rowCount的值是多少*/
        var asset_official, total_equity, asset_us;
        var fof_size;
        var sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[sheet_name];
        var fof_Debt = 0;
        var fof_Cash = 0, fof_Etf = 0, fof_Margin = 0, fof_Others = 0;
        var etf_flag = 0, margin_flag = 0, others_flag = 0; // 因为是单文件输入 所以可以设立一个fund_flag用来标识fund是否出现过 
        var fof_etf = fund_of_fund+'_etf';
        var fof_margin = fund_of_fund+'_margin';
        var fof_others = fund_of_fund+'_others';
        var fof_cash = fund_of_fund+'_cash';

        var sum = 0;   //分子总钱数
        //前提:程序建立在 所有的信息都已经更新 用子基金来更新fof
        //1. 还需要将Cash和Fund 也录进去
        //2. 更新里面所有产品的principle和size
        //3. 计算出估算净值 插入
        var n = 'A';
        var index = new Array(); //这是一个存储下标的字典
        if(fund_of_fund != 'xingyun1hao')
        {
            while((n != 'Z')&&worksheet[n+5]&&worksheet[n+5].v)
            {
                index[worksheet[n + 5].v] = n;
                n = String.fromCharCode(n.charCodeAt() + 1);
            }
        }
        else
        {
            while((n != 'Z')&&worksheet[n+4]&&worksheet[n+4].v)
            {
                index[worksheet[n + 4].v] = n;
                n = String.fromCharCode(n.charCodeAt() + 1);
            }
        }


        console.log("估算的日期是："+pos_date, "估值表日期是:" + file_date);
        for (var i = 0; i < 300; i++)
        {
            var ai = worksheet[index['科目代码'] + i];//seccode
            var bi = worksheet[index['科目名称'] + i];
            if(index['市值'] == undefined)
                var li = worksheet[index['市值-本币'] + i];
            else 
                var li = worksheet[index['市值'] + i];            
            if(index['成本'] == undefined)
                var hi = worksheet[index['成本-本币'] + i];
            else 
                var hi = worksheet[index['成本'] + i];
            var fi = worksheet[index['单位成本'] + i];//cost_asset

            var ei = worksheet[index['数量'] + i]; //cost
            if(index['市价'] == undefined)
                var ji = worksheet[index['行情'] + i];
            else
                var ji = worksheet[index['市价'] + i];


            if((ai&&li&&hi&&ei&&ai.v.toString()&&ai.v.toString().substr(0, 11) == '1108.02.01.') || (ai&&li&&hi&&ei&&(ai.v.toString().substr(0, 8) =='11090101'||ai.v.toString().substr(0, 8) =='11090601')))
            { 
                Product_Num++; //记录估值表中的产品数量 用来和Database_Product_Num中的比较 看有没有申购赎回
                var account_id = acct_name[ai.v.toString()];
                var asset_official = ji.v;
                var total_equity = li.v;
                var principal = hi.v;
                var cost_price = fi.v;
                var quantity = ei.v;

                console.log(account_id, acct_asset[account_id]*principal/cost_price);
                if(account_id == 'xingyunCqi')
                    continue;
                sum += acct_asset[account_id]*principal/cost_price;
                // console.log("line:415 ～" + account_id, acct_asset[account_id]);
                //console.log(sum);
                //console.log("line:401 " + account_id, acct_asset[account_id], acct_asset[account_id]*principal/cost_price);
                // 对于星联一号 二号 里面的产品净值在nvdata中 但是需要把这些信息插入到fofholding中
                tmpFunction(pos_date, account_id, total_equity, principal, fund_of_fund, asset_official, asset_official, quantity, cost_price, 1);
            } // end if

            //3003是证券清算款    1031是保证金    
            else if(ai&&(ai.v.toString() == '1002'))
            { //此处是针对现金进行处理的 需要for循环的外面才能搞定
                //console.log("line: 303 " + sum , li.v);
                sum += li.v; //这里是 将所有金钱的总数放到一起
                fof_Cash += li.v;  //这里是为了将所有的现金放到一起

            }
            else if(ai&&ai.v.toString() == '1031')
            {
                //Margin就一个 所以可以for循环里面搞定  录进去
                var account_id = fund_of_fund + "_margin";
                fof_Margin = li.v;
                sum += li.v;
                margin_flag = 1;
                if(pos_date == file_date){
                    //在文件日期等于估算日期的时候 我们需要将fof_Margin更新
                    insertFunction(pos_date, account_id, 0, fof_Margin, fund_of_fund, 0, 0, 0, 1, 3);
                }
                // else 
                //     insertFunction(pos_date, account_id, 0, fof_Margin, fund_of_fund, 0, 0, 0, 1, 3);
               //看到此处了 也就是 插入保证金这块已经写完了
            }
            else if(ai&&(ai.v.toString() == '3003'||ai.v.toString() == '1021'))
            {
                //证券清算款 算到others中
                var account_id = fund_of_fund + "_others";
                console.log("line : 471 " + sum, li.v);
                fof_Others = li.v;
                sum += li.v
                others_flag = 1;
                if(pos_date == file_date)
                    insertFunction(pos_date, account_id, 0, fof_Others, fund_of_fund, 0, 0, 0, 1, 5);
                // else  
                //     insertFunction(pos_date, account_id, 0, fof_Others, fund_of_fund, 0, 0, 0, 1, 5);
            }            
            else if(ai&&(ai.v.toString() == '2206'||ai.v.toString() == '2207'||ai.v.toString() == '2203'||ai.v.toString() == '2211'))
            {
                fof_Debt += hi.v;
            }
            else if(ai&&(ai.v.toString() == '1105'||ai.v.toString() == '1202'))
            {  //Fund就一个 所以可以for循环里面搞定  录进去
                var account_id = fund_of_fund + "_etf";
                console.log("line : 487 " + sum, li.v);
                fof_Etf = li.v;
                sum += li.v
                etf_flag = 1;
                if(pos_date == file_date)
                    insertFunction(pos_date, account_id, 0, fof_Etf, fund_of_fund, 0, 0, 0, 1, 2);
                // else  
                //     insertFunction(pos_date, account_id, 0, fof_Etf, fund_of_fund, 0, 0, 0, 1, 2);
            }  
            else if(ai && ai.v.toString() == '单位净值'){
                if(pos_date == file_date)
                    fof_asset_official = bi.v;
                else
                {
                    fof_asset_official = '';
                    console.log("今天没有"+fund_of_fund+"的官方净值");
                }
                continue;
            }
            else if(ai && ai.v.toString() == '资产净值'){
                fof_total_equity = li.v;
                continue;
            }
            else if(ai && ai.v.toString() == '资产合计'){
                fof_principal = hi.v;
                continue;
            }
            else if(ai && ai.v.toString() == '实收资本'){
                fof_size = ei.v;
                continue;
            }
            else if(ai && ai.v.toString() == '基金单位净值：')
            {
                if(pos_date == file_date)
                    fof_asset_official = bi.v;
                else
                    fof_asset_official = '';
                continue;
            }
            else if(ai && ai.v.toString() == '基金资产净值:')
            {
                fof_total_equity = li.v;
                continue;           
            }
            else if(ai && ai.v.toString() == '资产类合计:')
            {
                fof_principal = hi.v;
                continue;           
            }
            else
            {
                continue;
            }
        } //end for

        console.log("line:546 ++ 数据库的结果：" + Database_Product_Num,"估值表的结果：" +Product_Num);
        if(Database_Product_Num == Product_Num)
            console.log("子基金运作正常");
        else if(Database_Product_Num > Product_Num)
            console.log("!!!!NOTICE!!!!!!!!!!有赎回 赎回 赎回");
        else
            console.log("!!!!NOTICE!!!!!!!!!!有申购 申购 申购");
        console.log(sum);
        console.log(sum - fof_Debt, fof_size);
        asset_us = (sum - fof_Debt)/ fof_size;
        //如果录入的日期 大于 估值表的时间 那么 只需要按照估值表的时间来更新fof_asset_official即可
        if(pos_date == file_date)
        {
            //更新asset_official
            updateFunction(pos_date, fund_of_fund, fof_total_equity, fof_principal, fund_of_fund, fof_asset_official, fof_asset_official, fof_size, 0, 1);
            //把现金 etf 保证金 其他 录进去
            insertFunction(pos_date, fof_cash, 0, fof_Cash, fund_of_fund, 0, 0, 0, 1, 4);
            // if(etf_flag == 0)
            //     insertFunction(pos_date, fof_etf, 0, 0, fund_of_fund, 0, 0, 0, 1, 2); 
            // if(margin_flag == 0)
            //     insertFunction(pos_date, fof_margin, 0, 0, fund_of_fund, 0, 0, 0, 1, 3);
            // if(others_flag == 0)
            //     insertFunction(pos_date, fof_others, 0, 0, fund_of_fund, 0, 0, 0, 1, 5); 
        }
        else
        {
            //pos_date, account_id, total_equity, principal, fund_of_fund, asset_official, asset_official, quantity, cost_price, asset_type
            //估算的时候只录入净值
            console.log(pos_date, fund_of_fund, fof_total_equity, fof_principal, fund_of_fund, asset_us, fof_asset_official, fof_size, 0, 1);
            insertFunction(pos_date, fund_of_fund, fof_total_equity, fof_principal, fund_of_fund, asset_us, fof_asset_official, fof_size, 0, 1);

        }        
    };
    sqlActionInner(readWorkbook_(filename), filename, tmpFunction1);
    // console.log('sqlAction' + filename);
};

module.exports = sqlAction;






