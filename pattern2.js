var XLSX = require('xlsx');
var path = require('path');
var pickdate = function (filename) {
    var baseName = path.basename(filename);
    baseName.substr(baseName.length-14, 10);
    if(baseName.substr(baseName.length-14, 1) == '2')
        return baseName.substr(baseName.length-14, 10);
    else
    {
        var time = baseName.substr(baseName.length-12, 8);
        return time.substr(0,4)+"-"+time.substr(4,2)+"-"+time.substr(6,2);
    }
};

// var pattern2 = ['xingyunCqi','LianhaiDingz', 'Xingying6hao', 'Xingying7hao'];
var getPattern2 = function(workbook, filename, account_id, callback, callback2){ 
    var pos_date, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value;
    var trading_day, acct, Fut_margin;
    var Fut_margin = 0, long_value = 0, short_value = 0, margin = 0, total_market_value = 0, total_cost_value = 0, asset_official = 0;
    var asset_us = '';
    var total_cost_value_flag = 0;
    var temp_total_cost_value;
    trading_day = pos_date;
    acct = account_id;
    var others_market_value = 0;
    var others_principal = 0;
    var first_sheet_name = workbook.SheetNames[0];
    pos_date = pickdate(filename);
    var worksheet = workbook.Sheets[first_sheet_name];
    for (var i = 5; i < 1000; i++) 
    {
        var ai = worksheet['A' + i];
        var bi = worksheet['B' + i];
        var ci = worksheet['C' + i]; //size
        var di = worksheet['D' + i]; //size
        var gi = worksheet['G' + i]; //price
        var ei = worksheet['E' + i]; //cost
        var hi = worksheet['H' + i];//market
        var ki = worksheet['K' + i];
        var fi = worksheet['F' + i];//cost_asset
        var ii = worksheet['I' + i];
        var ji = worksheet['J' + i];
        var li = worksheet['L' + i];
        if(ai&&bi&&ci&&hi&&ei&&di&&gi&&(ai.v.substr(0, 4) == '1102'))//done
        {
            if(ci.v == 0 || di.v == 0)//第一条判断就能过滤掉联海定增的空表格    这个判断过滤掉星盈7的空表格
                continue;
            security_id = ai.v.substr(8, 6);
            security_name = bi.v;
            security_type = 1;
            principal = ei.v;
            cost_price = di.v;
            quantity = ci.v;
            market_price = gi.v;
            market_value = hi.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&bi&&ci&&hi&&ei&&di&&gi&&(ai.v.substr(0, 4) == '1105'))//done
        {
            security_id = ai.v.substr(8, 6);
            security_name = bi.v;
            security_type = 2;
            principal = ei.v;
            cost_price = di.v;
            quantity = ci.v;
            market_price = gi.v;
            market_value = hi.v;
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&(ai.v == '1031'))//done
        {
            security_id = account_id + '_margin';
            security_name = '保证金';
            security_type = 3;
            principal = ei.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = hi.v;
            margin = market_value;
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&bi&&(bi.v.indexOf("期货") >= 0) &&(bi.v.indexOf("保证金") >= 0))
        {
            Fut_margin = hi.v;
        }
        else if(ai&&(ai.v == '1202'||ai.v == '1204'||ai.v == '1203'||ai.v == '3003'||ai.v == '1021'||ai.v == '2202'||ai.v == '2001'||ai.v == '120410')) //undone
        {
            security_id = account_id + '_others';
            security_name = '其他';
            security_type = 4;
            if((ai.v == '2202')||(ai.v == '2001')||(ai.v == '120410'))
            {
                if(ei === undefined||hi === undefined)
                    continue;
                else
                {
                    others_principal -= ei.v;
                    others_market_value -= hi.v;
                }
                // if(account_id == 'Shengshi'&& pos_date == '2016-09-01')
                //     console.log(ai.v + '-'+hi.v);
            }
            else
            {
                if(ei === undefined||hi === undefined)
                    continue;
                else
                {
                    others_principal += ei.v;
                    others_market_value += hi.v;
                }
                // if(account_id == 'Shengshi'&& pos_date == '2016-09-01')
                //     console.log(ai.v + '+'+hi.v);
            }
        }
        else if(ai&&(ai.v.substr(0, 4) == '3201'||ai.v.substr(0, 4) =='3102')&&ai.v.substr(7, 2) == '1I') //done
        //用这个逻辑是因为1代表有效的仓位 也就是数量不是空的 I代表股指期货
        {
            security_id = ai.v.substr(8, 6);
            security_name = bi.v;
            security_type = 5;
            principal = ei.v;
            cost_price = di.v;
            quantity = ci.v;
            market_price = gi.v;
            market_value = hi.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value; 
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
        }
        else if(ai&&bi&&ci&&hi&&ei&&di&&gi&&ai.v.substr(6, 2) == '01'&&(ai.v.substr(0, 6) == '310205'||ai.v.substr(0, 6) =='310231'||ai.v.substr(0, 6) =='310241')) //done
        //商品期货  注意pattern3中的  上海是 310205  pattern1中上海是3102.21
        {
            if(ai.v.substr(8, 1) != '0')
                security_id = ai.v.substr(8, 6);
            else
                security_id = ai.v.substr(9, 5);
            security_name = bi.v;
            security_type = 6;
            principal = ei.v;
            cost_price = di.v;
            quantity = ci.v;
            market_price = gi.v;
            market_value = hi.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
        }
        else if(ai&&bi&&ci&&hi&&ei&&di&&gi&&(ai.v.substr(0, 8) == '31020401'||ai.v.substr(0, 8) == '31020301')) //done
        //债券期货
        {
            if(ai.v.substr(8, 1) != '0')
                security_id = ai.v.substr(8, 6);
            else
                security_id = ai.v.substr(9, 5);
            security_name = bi.v;
            security_type = 7;
            principal = ei.v;
            cost_price = di.v;
            quantity = ci.v;
            market_price = gi.v;
            market_value = hi.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
        }
        else if(ai&&bi&&ci&&hi&&ei&&di&&gi&&(ai.v.substr(0, 6)=='310237'||ai.v.substr(0, 6)=='310238'||ai.v.substr(0, 6)=='310239'||ai.v.substr(0, 6)=='310240'||ai.v.substr(0, 6)=='310243'||ai.v.substr(0, 6)=='310244'))//done
        //期权  310237 310238 310239 310240
        {   
            // console.log(ai.v);
            security_id = ai.v.substr(8, 6);
            security_name = bi.v;
            security_type = 8;
            principal = ei.v;
            cost_price = di.v;
            quantity = ci.v;
            market_price = gi.v;
            market_value = hi.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&bi&&ci&&hi&&ei&&di&&gi&&(ai.v.substr(0, 4) == '1103'))//done
        //债券  针对ShunshiGuoji产品 里面全是上海的  
        {
            security_id = ai.v.substr(8, 6)+'.'+'SH';
            security_name = bi.v;
            security_type = 9;
            principal = ei.v;
            cost_price = di.v;
            quantity = ci.v;
            market_price = gi.v;
            market_value = hi.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&(ai.v.length == 14)&&(ai.v.substr(0, 6) == '120410'))//undone
        //债券的应收利息
        { 
            security_id = ai.v.substr(8, 6)+'.'+'SH';
            security_name = bi.v;
            security_type = 10;
            principal = ei.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = hi.v;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&(ai.v == '1002')) //done
        { 
            security_id = account_id + '_cash';
            security_name = '现金';
            security_type = 11;
            principal = ei.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = hi.v;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&bi&&ci&&hi&&ei&&di&&gi&&ai.v.substr(0, 8)=='11090601') //done
        {  
            security_id = ai.v.substr(8, 6);
            security_name = bi.v;
            security_type = 12;
            principal = ei.v;
            cost_price = di.v;
            quantity = ci.v;
            market_price = gi.v;
            market_value = hi.v;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&(ai.v.indexOf('累计单位净值') >= 0)) //累计单位净值不是 那就再找基金单位净值
        {
            asset_official = bi.v;
        }
        else if(ai&&(ai.v.indexOf('基金单位净值') >= 0))
        {
            asset_official = bi.v;
        }
        else if(ai&&(ai.v.indexOf('累计基金净值') >= 0)) //累计单位净值不是 那就再找基金单位净值
        {
            asset_official = bi.v;
        }
        else if(ai&&(ai.v.indexOf('基金单位净值') >= 0))
        {
            asset_official = bi.v;
        }
        else if(ai&&(ai.v == '实收资本'))
        {
            total_cost_value = ci.v;
            total_cost_value_flag = 1;
        }
        else if(ai&&(ai.v.indexOf('基金资产净值') >= 0))
        {
            total_market_value = hi.v;
            if(ci == undefined)
                continue;
            else
                temp_total_cost_value = ci.v;
        }
    }
    if(total_cost_value_flag == 0)  //没有实收资本项 就用基金资产净值的数
        total_cost_value = temp_total_cost_value;
    // console.log(pos_date, account_id, long_value, short_value, margin, total_market_value, total_cost_value, asset_us, asset_official);
    callback2(pos_date, account_id, long_value, short_value, Fut_margin, total_market_value, total_cost_value, asset_official, asset_official);
    callback(pos_date, account_id, account_id + '_others', '其他', 4, others_principal, '', '', '', others_market_value);
    // console.log(pos_date, account_id, account_id + '_others', '其他', 4, others_principal, '', '', '', others_market_value);
}
module.exports = getPattern2;