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


// var pattern3 = ['XingheM2', 'ShunshiGuoji', 'XingheM1', 'Xinhui1hao'];
var getPattern3 = function(workbook, filename, account_id, callback, callback2){
    var pos_date, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value;
    var trading_day, acct;
    var Fut_margin = 0, long_value = 0, short_value = 0, margin = 0, total_market_value = 0, total_cost_value = 0, asset_official = 0;
    var asset_us = '';
    trading_day = pos_date;
    acct = account_id;
    var others_market_value = 0;
    var others_principal = 0;
    var first_sheet_name = workbook.SheetNames[0];
    // console.log(first_sheet_name);
    pos_date = pickdate(filename);
    var worksheet = workbook.Sheets[first_sheet_name];
    for (var i = 5; i < 1000; i++) 
    {
        var bi = worksheet['B' + i];
        var ci = worksheet['C' + i]; //size
        var gi = worksheet['G' + i]; //price
        var ei = worksheet['E' + i]; //cost
        var di = worksheet['D' + i]; //cost
        var hi = worksheet['H' + i];//market
        var ki = worksheet['K' + i];
        var fi = worksheet['F' + i];//cost_asset
        var ii = worksheet['I' + i];
        var ji = worksheet['J' + i];
        var li = worksheet['L' + i];
        if(bi&&ci&&fi&&ei&&di&&hi&&ii&&(bi.v.substr(0, 4) == '1102'))//done
        {
            security_id = bi.v.substr(8, 6);
            security_name = ci.v;
            security_type = 1;
            principal = fi.v;
            cost_price = ei.v;
            quantity = di.v;
            market_price = hi.v;
            market_value = ii.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(bi&&ci&&fi&&ei&&di&&hi&&ii&&(bi.v.substr(0, 4) == '1105'))//done
        {
            security_id = bi.v.substr(8, 6);
            security_name = ci.v;
            security_type = 2;
            principal = fi.v;
            cost_price = ei.v;
            quantity = di.v;
            market_price = hi.v;
            market_value = ii.v;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(bi&&(bi.v == '1031'))//done
        {
            security_id = account_id + '_margin';
            security_name = '保证金';
            security_type = 3;
            principal = fi.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = ii.v;
            margin = market_value;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(bi&&(bi.v.substr(0, 4) == '1031')&&(ci.v.indexOf("期货") >=0)&&(ci.v.indexOf("保证金")>= 0))
        {
            Fut_margin = ii.v;
        }
        else if(bi&&(bi.v == '1202'||bi.v == '1204'||bi.v == '1203'||bi.v == '3003'||bi.v == '1021'||bi.v == '2202'||bi.v == '2001'||bi.v == '120410')) //undone
        {
            security_id = account_id + '_others';
            security_name = '其他';
            security_type = 4;
            if((bi.v == '2202')||(bi.v == '2001')||(bi.v == '120410'))
            {
                if(fi === undefined||ii === undefined)
                    continue;
                else
                {
                    others_principal -= fi.v;
                    others_market_value -= ii.v;
                }
                // if(account_id == 'Shengshi'&& pos_date == '2016-09-01')
                //     console.log(bi.v + '-'+hi.v);
            }
            else
            {
                if(fi === undefined||ii === undefined)
                    continue;
                else
                {
                    others_principal += fi.v;
                    others_market_value += ii.v;
                }
                // if(account_id == 'Shengshi'&& pos_date == '2016-09-01')
                //     console.log(bi.v + '+'+hi.v);
            }
        }
        else if(bi&&(bi.v.substr(0, 4) == '3201'||bi.v.substr(0, 4) =='3102')&&bi.v.substr(7, 2) == '1I') //done
        //用这个逻辑是因为1代表有效的仓位 也就是数量不是空的 I代表股指期货
        {
            security_id = bi.v.substr(8, 6);
            security_name = ci.v;
            security_type = 5;
            principal = fi.v;
            cost_price = ei.v;
            quantity = di.v;
            market_price = hi.v;
            market_value = ii.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;  
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
        }
        else if(bi&&ci&&fi&&ei&&di&&hi&&ii&&bi.v.substr(6, 2) == '01'&&(bi.v.substr(0, 6) == '310205'||bi.v.substr(0, 6) =='310231'||bi.v.substr(0, 6) =='310241')) //done
        //商品期货  注意pattern3中的  上海是 310205  pattern1中上海是3102.21
        {
            if(bi.v.substr(8, 1) != '0')
                security_id = bi.v.substr(8, 6);
            else
                security_id = bi.v.substr(9, 5);
            security_name = ci.v;
            security_type = 6;
            principal = fi.v;
            cost_price = ei.v;
            quantity = di.v;
            market_price = hi.v;
            market_value = ii.v; 
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value; 
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
        }
        else if(bi&&ci&&fi&&ei&&di&&hi&&ii&&(bi.v.substr(0, 8) == '31020401'||bi.v.substr(0, 8) == '31020301')) //done
        //债券期货
        {
            if(bi.v.substr(8, 1) != '0')
                security_id = bi.v.substr(8, 6);
            else
                security_id = bi.v.substr(9, 5);
            security_name = ci.v;
            security_type = 7;
            principal = fi.v;
            cost_price = ei.v;
            quantity = di.v;
            market_price = hi.v;
            market_value = ii.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;  
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
        }
        else if(bi&&ci&&fi&&ei&&di&&hi&&ii&&(bi.v.substr(0, 6)=='310237'||bi.v.substr(0, 6)=='310238'||bi.v.substr(0, 6)=='310239'||bi.v.substr(0, 6)=='310240'||bi.v.substr(0, 6)=='310243'||bi.v.substr(0, 6)=='310244'))//done
        //期权  310237 310238 310239 310240
        { 
            // console.log(bi.v);  
            security_id = bi.v.substr(8, 6);
            security_name = ci.v;
            security_type = 8;
            principal = fi.v;
            cost_price = ei.v;
            quantity = di.v;
            market_price = hi.v;
            market_value = ii.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;  
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(bi&&ci&&fi&&ei&&di&&hi&&ii&&(bi.v.substr(0, 8) == '11031301'))//done
        //债券  针对ShunshiGuoji产品 里面全是上海的  
        {
            security_id = bi.v.substr(8, 6)+'.'+'SH';
            security_name = ci.v;
            security_type = 9;
            principal = fi.v;
            cost_price = ei.v;
            quantity = di.v;
            market_price = hi.v;
            market_value = ii.v; 
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value; 
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(bi&&(bi.v.length == 14)&&(bi.v.substr(0, 6) == '120410'))//done
        //债券的应收利息
        {
            security_id = bi.v.substr(8, 6)+'.'+'SH';
            security_name = ci.v;
            security_type = 10;
            principal = fi.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = ii.v;  
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(bi&&(bi.v == '1002')) //done
        { 
            security_id = account_id + '_cash';
            security_name = '现金';
            security_type = 11;
            principal = fi.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = ii.v;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(bi&&ci&&fi&&ei&&di&&hi&&ii&&bi.v.substr(0, 8)=='11090601')
        {  
            security_id = bi.v.substr(8, 6);
            security_name = ci.v;
            security_type = 12;
            principal = fi.v;
            cost_price = ei.v;
            quantity = di.v;
            market_price = hi.v;
            market_value = ii.v;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(bi&&(bi.v =='基金单位净值：') )
        {
            asset_official = ci.v;
        }
        else if(bi&&(bi.v == '基金资产净值:'))
        {
            total_market_value = ii.v;
        }
        else if(bi&&(bi.v == '实收资本'))
        {
            total_cost_value = di.v;
        }
    }
    // console.log(pos_date, account_id, long_value, short_value, Fut_margin, total_market_value, total_cost_value, asset_official, asset_official);
    callback2(pos_date, account_id, long_value, short_value, Fut_margin, total_market_value, total_cost_value, asset_official, asset_official);

    callback(pos_date, account_id, account_id + '_others', '其他', 4, others_principal, '', '', '', others_market_value);
    // console.log(pos_date, account_id, account_id + '_others', '其他', 4, others_principal, '', '', '', others_market_value);
}
module.exports = getPattern3;