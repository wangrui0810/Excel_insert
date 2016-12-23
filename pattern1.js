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


// var pattern1 = ['HuaxiaRY','XinghaiM','Zhongxing1hao','Zhongxing2hao','Fengjing3qi','LianhaiZunx',
//                 'Jiuwei1hao','Jiukun','Aiye','Shengshi','Liangdao','Zundao','Kanzhan','LianhaiDuich',
//                 'Kanzhan','Panda1hao',    'LinjieKaili','Bird1hao','JiuweiHaoen','Jiuwei3hao','Xingyou1hao',
//                 'JiuweiC','JiuweiD','Xiaoqiang','JiuweiE','JiuweiB','Meifeng2A','Xingying4hao',
//                 'Xingying8hao','Xingying14hao','Xingying15hao','Xingying16hao','Xingying17hao',
//                 'xingyunYanf','xingyunJial','Xingmei4hao','xingyunLightH', 'Huaxia2hao', 'Xingying2hao'];

var getPattern1 = function(workbook, filename, account_id, callback, callback2){
    var pos_date, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value;
    var trading_day, acct;
    var long_value = 0, short_value = 0, margin = 0, total_market_value = 0, total_cost_value = 0, asset_official = 0;
    var asset_us = '';
    var others_market_value = 0;
    var others_principal = 0;
    var first_sheet_name = workbook.SheetNames[0];
    pos_date = pickdate(filename);
    trading_day = pos_date;
    acct = account_id;
    var Fut_margin = 0;
    var worksheet = workbook.Sheets[first_sheet_name];
    for (var i = 5; i < 1000; i++) 
    {
        var ai = worksheet['A' + i];//seccode
        var bi = worksheet['B' + i];
        var ci = worksheet['C' + i]; //size
        var gi = worksheet['G' + i]; //price
        var ei = worksheet['E' + i]; //cost
        var hi = worksheet['H' + i];//market
        var ki = worksheet['K' + i];
        var fi = worksheet['F' + i];//cost_asset
        var ji = worksheet['J' + i];
        var li = worksheet['L' + i];
        if(ai&&bi&&hi&&ei&&ji&&li&&fi&&(ai.v.substr(0, 4) == '1102')) //done
        { 
          //pos_date, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value
            security_id = ai.v.substr(11, 6);
            security_name = bi.v;
            security_type = 1;
            principal = hi.v;
            cost_price = fi.v;
            quantity = ei.v;
            market_price = ji.v;
            market_value = li.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&bi&&ei&&ji&&li&&(ai.v.substr(0, 4) == '1105'))//done
        {
            security_id = ai.v.substr(11, 6);
            security_name = bi.v;
            security_type = 2;

            if(fi === undefined || hi === undefined){ //星光H中有成本空白的 用市值补齐
                principal = li.v;
                cost_price = ji.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
            }
            else
            {
                principal = hi.v;
                cost_price = fi.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
            }
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);

        }
        else if(ai&&ai.v == '1031')//done
        {
            security_id = account_id + '_margin';
            security_name = '保证金';
            security_type = 3;
            principal = hi.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = li.v;
            margin = market_value;
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&bi&&(bi.v.indexOf("期货") >= 0)&&(bi.v.indexOf("保证金") >= 0))
        {
            Fut_margin += li.v;
        }
        else if(ai&&ai.v&&((ai.v == '1202')||(ai.v == '1204')||(ai.v == '1204.10')||(ai.v == '1203')||(ai.v == '3003')||(ai.v == '1021')||(ai.v == '2202')||(ai.v == '2001')))//done
        {
            security_id = account_id + '_others';
            security_name = '其他';
            security_type = 4;
            if((ai.v == '2202')||(ai.v == '2001')||(ai.v == '1204.10'))
            {
                if(hi == undefined||li == undefined)
                    continue;
                else
                {
                    others_principal -= hi.v;
                    others_market_value -= li.v;
                }
                // if(account_id == 'Shengshi'&& pos_date == '2016-09-01')
                //     //console.log(ai.v + '-'+hi.v);
            }
            else
            {
                if(hi == undefined||li == undefined)
                    continue;
                else
                {
                    others_principal += hi.v;
                    others_market_value += li.v;
                }
                // if(account_id == 'Shengshi'&& pos_date == '2016-09-01')
                //     //console.log(ai.v + '+'+hi.v);
            }
        }
        else if(ai&&bi&&hi&&ei&&ji&&li&&fi&&(ai.v.substr(0, 4) == '3102')) //done
        //股指期货  商品期货 债券期货 期权 这四种类型全在里面
        {
            if((ai.v.substr(0,7) == '3102.01')||(ai.v.substr(0,7) == '3102.03')) //||(ai.v.substr(0,7) == '3102.02')
            {   //股指期货
                security_id = ai.v.substr(11, 6);
                security_name = bi.v;
                security_type = 5;
                principal = hi.v;
                cost_price = fi.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
                if(market_value > 0)
                    long_value += market_value;
                else
                    short_value += market_value;

                //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
                callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
            }
            else if((ai.v.substr(0,7) == '3102.04')||(ai.v.substr(0,7) == '3102.02'))
            {
                //这个是债券期货
                security_id = ai.v.substr(11, 6);
                security_name = bi.v;
                security_type = 7;
                principal = hi.v;
                cost_price = fi.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
                if(market_value > 0)
                    long_value += market_value;
                else
                    short_value += market_value;
                //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
                callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
            }
            else if(((ai.v.substr(0, 7)=='3102.37')||(ai.v.substr(0, 7)=='3102.38')||(ai.v.substr(0, 7)=='3102.39')||(ai.v.substr(0, 7)=='3102.40')||(ai.v.substr(0, 7)=='3102.43')||(ai.v.substr(0, 7)=='3102.44')))
            {
                //这个是期权
                security_id = ai.v.substr(11, 6);
                security_name = bi.v;
                security_type = 8;
                principal = hi.v;
                cost_price = fi.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
                if(market_value > 0)
                    long_value += market_value;
                else
                    short_value += market_value;
                //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
                callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 

            }
            else if((ai.v.substr(5,1) == '2')||(ai.v.substr(5,1) == '3')||(ai.v.substr(5,1) == '4'))
            {   //商品期货 有的商品期货的证券代码不是六位数  截取之后字符串最后带有空格 这个对筛选是没有影响的
                security_id = ai.v.substr(11, 6);
                security_name = bi.v;
                security_type = 6;
                principal = hi.v;
                cost_price = fi.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
                if(market_value > 0)
                    long_value += market_value;
                else
                    short_value += market_value;
                //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
                callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
            }
            else
            {
                //console.log(pos_date,account_id+'!!!!!!!!!!!!!!!!!!!!!!!估值表中有3102 没有处理过的情况');
                return ;
            }
        }
        if(ai&&bi&&hi&&ei&&ji&&li&&fi&&ai.v.substr(0, 4)=='1103')//done
        {
            //债券
            security_id = ai.v.substr(11, 6)+'.'+ai.v.substr(ai.v.length-2, 2);
            security_name = bi.v;
            security_type = 9;
            principal = hi.v;
            cost_price = fi.v;
            quantity = ei.v;
            market_price = ji.v;
            market_value = li.v;
            if(market_value > 0)
                long_value += market_value;
            else
                short_value += market_value;
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        if(ai&&(ai.v.length == 20)&&ai.v.substr(0, 7)=='1204.10') //done
        {
            //债券应收利息
            security_id = ai.v.substr(11, 6)+'.'+ai.v.substr(ai.v.length-2, 2);
            security_name = bi.v;
            security_type = 10;
            principal = hi.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = li.v;
            //console.log('line198:'+pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&ai.v == '1002')
        {
            security_id = account_id + '_cash';
            security_name = '现金';
            security_type = 11;
            principal = hi.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = li.v;
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&ai.v == '1109'||(ai&&bi&&fi&&ei&&ji&&li&&(ai.v.substr(0, 4) == '1108')))
        {
            security_id = ai.v.substr(11, 6);
            security_name = bi.v;
            security_type = 12;
            principal = hi.v;
            cost_price = fi.v;
            quantity = ei.v;
            market_price = ji.v;
            market_value = li.v;
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&ai.v == '资产净值')
        {
            total_market_value = li.v;
        }
        else if(ai&&ai.v == '实收资本')
        {
            total_cost_value = ei.v;
        }
        else if(ai&&ai.v == '单位净值')
        {
            asset_official = bi.v;
        }
    }
    //console.log(pos_date, account_id, long_value, short_value, margin, total_market_value, total_cost_value, asset_us, asset_official);
    callback2(pos_date, account_id, long_value, short_value, Fut_margin, total_market_value, total_cost_value, asset_official, asset_official);

    //console.log(pos_date, account_id, account_id + '_others', '其他', 4, others_principal, '', '', '', others_market_value);
    callback(pos_date, account_id, account_id + '_others', '其他', 4, others_principal, '', '', '', others_market_value);
}
module.exports = getPattern1;