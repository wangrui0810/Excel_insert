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
//                 'Xingying8hao','Xingying14hao','Xingying15hao','Xingying16hao','Xingying17hao','Tianwangxing', 'Haiwangxing',
//                 'xingyunYanf','xingyunJial','Xingmei4hao','xingyunLightH', 'Huaxia2hao', 'Xingying2hao', 'Jinxing3hao'];

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
    //现在需要确定判断出 ‘成本’ ‘数量’等对应的下标  存在一个dict中
    var n = 'A';
    var index = new Array(); //这是一个存储下标的字典
    while((n != 'Z'))
    {
        if(worksheet[n+5]&&worksheet[n+5].v)
            index[worksheet[n + 5].v] = n;
        n = String.fromCharCode(n.charCodeAt() + 1);
    }

    for (var i = 5; i < 1000; i++) 
    {
        var ai = worksheet[index['科目代码'] + i];//seccode
        var bi = worksheet[index['科目名称'] + i];
        var gi = worksheet[index['成本-原币'] + i]; //price
        var ei = worksheet[index['数量'] + i]; //cost
        if(index['成本'] == undefined)
            var hi = worksheet[index['成本-本币'] + i];//market
        else
            var hi = worksheet[index['成本'] + i];//market
        var ki = worksheet[index['市值-原币'] + i];
        var fi = worksheet[index['单位成本'] + i];//cost_asset
        if(index['市价'] == undefined)
            var ji = worksheet[index['行情'] + i];
        else
            var ji = worksheet[index['市价'] + i];
        if(index['市值'] == undefined)
            var li = worksheet[index['市值-本币'] + i];
        else 
            var li = worksheet[index['市值'] + i];
        //海王星的估值表格式有点问题
        if(account_id == 'Haiwangxing')
        {
            li = worksheet['L' + i];
            hi = worksheet['H' + i];
        }

        if(ai&&bi&&hi&&ei&&ji&&li&&fi&&(ai.v.toString().substr(0, 4) == '1102')) //done
        { 
          //pos_date, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value
            if(ei.v == ' '||ji.v == ' '||li.v == ' '||fi.v == ' '||ei.v == ''||ji.v == ''||li.v =='')
                continue;
            security_id = ai.v.toString().substr(11, 6);
            security_name = bi.v;
            security_type = 1;
            principal = hi.v;
            cost_price = fi.v;
            quantity = ei.v;
            market_price = ji.v;
            market_value = li.v;
            if(market_value > 0)
                long_value += Number(market_value);
            else
                short_value += Number(market_value);
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&bi&&ei&&ji&&li&&(ai.v.toString().substr(0, 4) == '1105'))//done
        {
            if(ei.v == ' '||ji.v == ' '||li.v == ' '||fi.v == ' '||ei.v == ''||ji.v == ''||li.v =='')
                continue;
            security_id = ai.v.toString().substr(11, 6);
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
        else if(ai&&ai.v.toString() == '1031')//done
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
        else if(ai&&bi&&(bi.v.toString().indexOf("期货") >= 0)&&(bi.v.toString().indexOf("保证金") >= 0))
        {
            Fut_margin += li.v;
        }
        else if(ai&&ai.v&&((ai.v.toString() == '1202')||(ai.v.toString() == '1204')||(ai.v.toString() == '1204.10')||(ai.v.toString() == '1203')||(ai.v.toString() == '3003')||(ai.v.toString() == '1021')||(ai.v.toString() == '2202')||(ai.v.toString() == '2001')))//done
        {
            security_id = account_id + '_others';
            security_name = '其他';
            security_type = 4;
            if((ai.v.toString() == '2202')||(ai.v.toString() == '2001')||(ai.v.toString() == '1204.10'))
            {
                if(hi == undefined||li == undefined)
                    continue;
                else
                {
                    others_principal -= hi.v;
                    others_market_value -= li.v;
                }
                // if(account_id == 'Shengshi'&& pos_date == '2016-09-01')
                //     //console.log(ai.v.toString() + '-'+hi.v);
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
                //     //console.log(ai.v.toString() + '+'+hi.v);
            }
        }
        else if(ai&&bi&&hi&&ei&&ji&&li&&fi&&(ai.v.toString().substr(0, 4) == '3102')) //done
        //股指期货  商品期货 债券期货 期权 这四种类型全在里面
        {
            // //console.log(ai.v, '!!!'+ei.v+'!!!', typeof(fi.v));
            if(ei.v == ' '||ji.v == ' '||li.v == ' '||fi.v == ' '||ei.v == ''||ji.v == ''||li.v =='')
                continue;
            if((ai.v.toString().substr(0,7) == '3102.01')||(ai.v.toString().substr(0,7) == '3102.03')) //||(ai.v.toString().substr(0,7) == '3102.02')
            {   //股指期货
                security_id = ai.v.toString().substr(11, 6);
                security_name = bi.v;
                security_type = 5;
                principal = hi.v;
                cost_price = fi.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
                if(market_value > 0)
                    long_value += Number(market_value);
                else
                    short_value += Number(market_value);

                //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
                callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
            }
            else if((ai.v.toString().substr(0,7) == '3102.04')||(ai.v.toString().substr(0,7) == '3102.02'))
            {
                //这个是债券期货
                security_id = ai.v.toString().substr(11, 6);
                security_name = bi.v;
                security_type = 7;
                principal = hi.v;
                cost_price = fi.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
                if(market_value > 0)
                    long_value += Number(market_value);
                else
                    short_value += Number(market_value);
                //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
                callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
            }
            else if(((ai.v.toString().substr(0, 7)=='3102.37')||(ai.v.toString().substr(0, 7)=='3102.38')||(ai.v.toString().substr(0, 7)=='3102.39')||(ai.v.toString().substr(0, 7)=='3102.40')||(ai.v.toString().substr(0, 7)=='3102.43')||(ai.v.toString().substr(0, 7)=='3102.44')))
            {
                //这个是期权
                security_id = ai.v.toString().substr(11, 6);
                security_name = bi.v;
                security_type = 8;
                principal = hi.v;
                cost_price = fi.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
                if(market_value > 0)
                    long_value += Number(market_value);
                else
                    short_value += Number(market_value);
                //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
                callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 

            }
            else if((ai.v.toString().substr(5,1) == '2')||(ai.v.toString().substr(5,1) == '3')||(ai.v.toString().substr(5,1) == '4'))
            {   //商品期货 有的商品期货的证券代码不是六位数  截取之后字符串最后带有空格 这个对筛选是没有影响的
                security_id = ai.v.toString().substr(11, 6);
                security_name = bi.v;
                security_type = 6;
                principal = hi.v;
                cost_price = fi.v;
                quantity = ei.v;
                market_price = ji.v;
                market_value = li.v;
                if(market_value > 0)
                    long_value += Number(market_value);
                else
                    short_value += Number(market_value);
                //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
                callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value); 
            }
            else
            {
                //console.log(ai.v, bi.v, typeof(fi.v));
                //console.log(pos_date,account_id+'!!!!!!!!!!!!!!!!!!!!!!!估值表中有3102 没有处理过的情况', bi.v);
                continue;
            }
        }
        else if(ai&&bi&&hi&&ei&&ji&&li&&fi&&ai.v.toString().substr(0, 4)=='1103')//done
        {
            //债券
            //如果
            if(ei.v == ' '||ji.v == ' '||li.v == ' '||fi.v == ' '||ei.v == ''||ji.v == ''||li.v =='')
                continue;
            security_id = ai.v.toString().substr(11, 6)+'.'+ai.v.toString().substr(ai.v.toString().length-2, 2);
            security_name = bi.v;
            security_type = 9;
            principal = hi.v;
            cost_price = fi.v;
            quantity = ei.v;
            market_price = ji.v;
            market_value = li.v;
            if(market_value > 0)
                long_value += Number(market_value);
            else
                short_value += Number(market_value);
            //console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&(ai.v.toString().length == 20)&&ai.v.toString().substr(0, 7)=='1204.10') //done
        {
            //债券应收利息
            security_id = ai.v.toString().substr(11, 6)+'.'+ai.v.toString().substr(ai.v.toString().length-2, 2);
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
        else if(ai&&hi&&ai.v.toString() == '1002')
        {
            security_id = account_id + '_cash';
            security_name = '现金';
            security_type = 11;
            principal = hi.v;
            cost_price = '';
            quantity = '';
            market_price = '';
            market_value = li.v;
            // console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if((ai&&ai.v.toString() == '1109')||(ai&&bi&&fi&&ei&&ji&&li&&(ai.v.toString().substr(0, 4) == '1108')))
        {
            if(ei.v == ' '||ji.v == ' '||li.v == ' '||fi.v == ' '||ei.v == ''||ji.v == ''||li.v =='')
                continue;
            security_id = ai.v.toString().substr(11, 6);
            security_name = bi.v;
            security_type = 12;
            principal = hi.v;
            cost_price = fi.v;
            quantity = ei.v;
            market_price = ji.v;
            market_value = li.v;
            console.log(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
            callback(pos_date, account_id, security_id, security_name, security_type, principal, cost_price, quantity, market_price, market_value);
        }
        else if(ai&&ai.v.toString() == '资产净值')
        {
            if(li)
                total_market_value = li.v;
        }
        else if(ai&&ai.v.toString() == '实收资本')
        {
            total_cost_value = ei.v;
        }
        else if(ai&&ai.v.toString() == '单位净值')
        {
            asset_official = bi.v;
        }
        else if(ai&&ai.v.toString() == '今日单位净值')
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