// ==UserScript==
// @name         超星学习通自动化脚本
// @namespace    unrival
// @version      1.01
// @description  【2022.06.10】 *后台任务* 支持 *视频* *文档* *答题(beta)* *自定义正确率* *掉线自动登录*
// @author       unrival *Modified By Jacob D*
// @run-at       document-end
// @storageName  unrivalxxt
// @match        *://*.chaoxing.com/*
// @match        *://*.edu.cn/*
// @match        *://*.nbdlib.cn/*
// @match        *://*.hnsyu.net/*
// @match        *://scriptcat.org/script-show-page/*
// @icon         http://pan-yz.chaoxing.com/favicon.ico
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_info
// @grant        GM_openInTab
// @license      Copycat Has No Dick
// @connect      mooc1-1.chaoxing.com
// @connect      mooc1.chaoxing.com
// @connect      mooc1-2.chaoxing.com
// @connect      passport2-api.chaoxing.com
// @connect      api.7j112.com
// @connect      tencent-api.7j112.com
// @connect      cx.icodef.com
// @contributionURL https://afdian.net/@unrival
// @antifeature payment
//如果脚本提示添加安全网址，请将脚本提示内容填写到下方区域，一行一个，如果不会，请加群询问



//安全网址请填写在上方空白区域
// ==/UserScript==
(()=>{
var maxRate = 2 , //限制视频最高倍速为2倍，防止倍速过高导致的出现异常记录/清除进度，建议根据自己胆量修改。
    token = '' , //关注微信公众号：一之哥哥，发送 “token” 领取你的token，填写在两个单引号中间并保存，可以提高答题并发数量，仅支持脚本默认题库。
    host = 0 , //为支持部分校园网，服务器提供多条线路，目前有 0：阿里云(默认) 1：腾讯云
    jumpType = 0 , // 0:智能模式，1:遍历模式，2:不跳转，如果智能模式出现无限跳转/不跳转情况，请切换为遍历模式
    disableMonitor = 0 ,// 0:无操作，1:解除多端学习监控，开启此功能后可以多端学习，不会被强制下线。
    accuracy = 100,//章节测试正确率百分比，在答题正确率在规定之上并且允许自动提交时才会提交答案
    randomDo = 0,//将0改为1，找不到答案的单选、多选、判断就会自动选【B、ABCD、错】，只在规定正确率不为100%时才生效
    //-----------------------------------------------------------------------------------------------------
    autoLogin = 0, //掉线是否自动登录，1为自动登录，需要配置登录信息（仅支持手机号+密码登陆）
    phoneNumber = '', //自动登录的手机号，填写在单引号之间。
    password = '', //自动登录的密码，填写在单引号之间。
    //-----------------------------------------------------------------------------------------------------
    ctUrl = 'http://cx.icodef.com/wyn-nb?v=4'; //题库服务器，填写在两个单引号之间，由题库作者向您提供，不懂不要修改。
    /*
    脚本会尽最大努力解析您使用的题库接口，保证在不更改脚本逻辑的情况下匹配答案。
    脚本查题使用POST方法，具体逻辑可查看脚本代码1200行左右。
    如果您是题库开发者，可以尝试直接在上面填入您自己题库的查询接口(常量参数如token等可并入url中)，尝试查题。
    */


var hostList = [
    'https://api.7j112.com/',
    'http://tencent-api.7j112.com/'
    ],
    rate = GM_getValue('unrivalrate','1'),
    getQueryVariable = (variable) => {
        let q = _l.search.substring(1),
            v = q.split("&"),
            r = false;
        for (let i = 0, l = v.length; i < l; i++) {
            let p = v[i].split("=");
            p[0] == variable && (r = p[1]);
        }
        return r;
    },
    getCookie=(name)=>{
        var ca,re=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
        if(ca=_d.cookie.match(re)){
            return unescape(ca[2]);
        }else{
            return '';
        }
    },
    isCat=GM_info.scriptHandler=='ScriptCat',
    _w = unsafeWindow,
    _d = _w.document,
    _l = _w.location,
    _p = _l.protocol,
    _h = _l.host,
    isEdge=_w.navigator.userAgent.includes("Edg/"),
    isFf=_w.navigator.userAgent.includes("Firefox"),
    isMobile = _w.navigator.userAgent.includes("Android"),
    stop = false,
    trim = (s)=>{
        return s.replace('javascript:void(0);','').replace(new RegExp("&nbsp;",("gm")),'').replace(/^\s+/, '').replace(/\s+$/, '').replace(new RegExp("，",("gm")),',').replace(new RegExp("。",("gm")),'.').replace(new RegExp("：",("gm")),':').replace(new RegExp("；",("gm")),';').replace(new RegExp("？",("gm")),'?').replace(new RegExp("（",("gm")),'(').replace(new RegExp("）",("gm")),')').replace(new RegExp("“",("gm")),'"').replace(new RegExp("”",("gm")),'"');
    },
    cVersion = 999,
    classId = getQueryVariable('clazzid')||getQueryVariable('clazzId')||getQueryVariable('classid')||getQueryVariable('classId'),
    courseId = getQueryVariable('courseid')||getQueryVariable('courseId');
if(parseFloat(rate)==parseInt(rate)){
    rate = parseInt(rate);
}else{
    rate = parseFloat(rate);
}
if(rate>maxRate){
    rate = 1;
    GM_setValue('unrivalrate',rate);
}
try{
    _w.top.unrivalReviewMode = GM_getValue('unrivalreview','0')||'0';
    _w.top.unrivalDoWork = GM_getValue('unrivaldowork','1')||'1';
    _w.top.unrivalAutoSubmit = GM_getValue('unrivalautosubmit','0')||'0';
    _w.top.unrivalAutoSave = GM_getValue('unrivalautosave','0')||'0';
}catch(e){}
if(_l.href.indexOf("knowledge/cards") >0){
    GM_setValue('unrivalUd',getCookie('_uid'));
    let allowBackground = false,
        spans = _d.getElementsByTagName('span');
    for(let i=0,l=spans.length;i<l;i++){
        if(spans[i].innerHTML.indexOf('章节未开放')!=-1){
            if(_l.href.indexOf("ut=s")!=-1){
                _l.href = _l.href.replace("ut=s","ut=t").replace(/&cpi=[0-9]{1,10}/,'');
            }else if(_l.href.indexOf("ut=t")!=-1){
                spans[i].innerHTML = '此课程为闯关模式，请回到上一章节完成学习任务！'
                return;
            }
            break;
        }
    }
    _w.top.unrivalPageRd = String(Math.random());
    if(!isFf){
        try{
            cVersion = parseInt(navigator.userAgent.match(/Chrome\/[0-9]{2,3}./)[0].replace('Chrome/','').replace('.',''));
        }catch(e){}
    }
    var busyThread = 0,
        getStr = (str, start, end)=> {
            let res = str.substring(str.indexOf(start),str.indexOf(end)).replace(start,'');
            return res ;
        },
        scripts = _d.getElementsByTagName('script'),
        param = null,
        rt='0.9';
    for(let i=0,l=scripts.length;i<l;i++){
        if(scripts[i].innerHTML.indexOf('mArg = "";')!=-1&&scripts[i].innerHTML.indexOf('==UserScript==')==-1){
            param = getStr(scripts[i].innerHTML,'try{\n    mArg = ',';\n}catch(e){');
        }
    }
    if(param==null){
        return;
    }
    try{
        vrefer = _d.getElementsByClassName('ans-attach-online ans-insertvideo-online')[0].src;
    }catch(e){
        vrefer = _p+'//'+_h+'/ananas/modules/video/index.html?v=2022-0528-1945';
    }
    _d.getElementsByTagName("html")[0].innerHTML=`
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>超星学习通自动化脚本</title>
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport">
        <link href="https://z.chaoxing.com/yanshi/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="row" style="margin: 10px;">
            <div class="col-md-6 col-md-offset-3">
                <div class="header clearfix">
                    <h3 class="text-muted" style="margin-top: 20px;margin-bottom: 0;float: left;"><a href="https://scriptcat.org/script-show-page/336" target="view_window">超星学习通自动化脚本v1.01 *Modified By Jacob D*&ensp;</a></h3><div id="onlineNum"></div>
                </div>
                <hr style="margin-top: 10px;margin-bottom: 20px;">
                <div class="panel panel-info" id="normalQuery">
                    <div class="panel-heading">任务配置</div>
                    <div class="panel-body">
                        <div>
                            <div style="padding: 0;font-size: 20px;float: left;">视频倍速：</div>
                            <div>
                                <input type="number" id="unrivalRate" style="width: 80px;">
                                &ensp;
                                <a id='updateRateButton' class="btn btn-default">保存</a>
                                &nbsp;|&nbsp;
                                <a id='reviewModeButton' class="btn btn-default">复习模式</a>
                                &nbsp;|&nbsp;
                                <a id='videoTimeButton' class="btn btn-default">查看学习进度</a>
                                &nbsp;|&nbsp;
                                <a id='fuckMeModeButton' class="btn btn-default" href="unrivalxxtbackground/" target="view_window">后台挂机</a>
                                <a id='refreshcurrentpage' class="btn btn-default">刷新当前页面</a>
                                &nbsp;|&nbsp;
                            </div><br>
                            <div style="padding: 0;font-size: 20px;float: left;">章节测试：</div>
                            <a id='autoDoWorkButton' class="btn btn-default">自动答题</a>&nbsp;|&nbsp;
                            <a id='autoSubmitButton' class="btn btn-default">自动提交</a>&nbsp;|&nbsp;
                            <a id='autoSaveButton' class="btn btn-default">自动保存</a>
                        </div>
                    </div>
                </div>
                <div class="panel panel-info" id='videoTime' style="display: none;height: 300px;">
                    <div class="panel-heading">学习进度</div>
                    <div class="panel-body" style="height: 100%;">
                        <iframe id="videoTimeContent" src="" frameborder="0" scrolling="auto"
                            style="width: 100%;height: 85%;"></iframe>
                    </div>
                </div>
                <div class="panel panel-info">
                    <div class="panel-heading">任务列表</div>
                    <div class="panel-body" id='joblist'>
                    </div>
                </div>
                <div class="panel panel-info">
                    <div class="panel-heading">运行日志</div>
                    <div class="panel-body">
                        <div id="result" style="overflow:auto;line-height: 30px;">
                            <div id="log">
                                <span style="color: red">[00:00:00]如果此提示不消失，说明页面出现了错误，请联系作者</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="panel panel-info" id='workPanel' style="display: none;height: 1000px;">
                    <div class="panel-heading">章节测试</div>
                    <div class="panel-body" id='workWindow' style="height: 100%;">
                        <iframe id="frame_content" name="frame_content" src="" frameborder="0" scrolling="auto"
                            style="width: 100%;height: 95%;"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
`;
    var logs = {
        "logArry": [],
        "addLog": function(str, color = "black") {
            if (this.logArry.length >= 50) {
                this.logArry.splice(0, 1);
            }
            var nowTime = new Date();
            var nowHour = (Array(2).join(0) + nowTime.getHours()).slice(-2);
            var nowMin = (Array(2).join(0) + nowTime.getMinutes()).slice(-2);
            var nowSec = (Array(2).join(0) + nowTime.getSeconds()).slice(-2);
            this.logArry.push("<span style='color: " + color + "'>[" + nowHour + ":" + nowMin + ":" +
                nowSec + "] " + str + "</span>");
            let logStr = "";
            for (let logI = 0, logLen = this.logArry.length; logI < logLen; logI++) {
                logStr += this.logArry[logI] + "<br>";
            }
            _d.getElementById('log').innerHTML = logStr;
            var logElement = _d.getElementById('log');
            logElement.scrollTop = logElement.scrollHeight;
        }
    },
        htmlHook = setInterval(function(){
        if(_d.getElementById('unrivalRate')&&_d.getElementById('updateRateButton')&&_d.getElementById('reviewModeButton')&&_d.getElementById('autoDoWorkButton')&&_d.getElementById('autoSubmitButton')&&_d.getElementById('autoSaveButton')){
            function afevaabrr(){
                if(Math.round(new Date() / 1000)-parseInt(GM_getValue('unrivalBackgroundVideoEnable','6'))<15){
                    allowBackground = true;
                    _d.getElementById('fuckMeModeButton').setAttribute('href','unrivalxxtbackground/');
                }else{
                    _d.getElementById('fuckMeModeButton').setAttribute('href','https://scriptcat.org/script-show-page/379');
                    allowBackground = false;
                }
            }
            afevaabrr();
            clearInterval(htmlHook);
            if(cVersion<86){
                logs.addLog('\u60a8\u7684\u6d4f\u89c8\u5668\u5185\u6838\u8fc7\u8001\uff0c\u8bf7\u66f4\u65b0\u7248\u672c\u6216\u4f7f\u7528\u4e3b\u6d41\u6d4f\u89c8\u5668\uff0c\u63a8\u8350\u003c\u0061\u0020\u0068\u0072\u0065\u0066\u003d\u0022\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0077\u0077\u0077\u002e\u006d\u0069\u0063\u0072\u006f\u0073\u006f\u0066\u0074\u002e\u0063\u006f\u006d\u002f\u007a\u0068\u002d\u0063\u006e\u002f\u0065\u0064\u0067\u0065\u0022\u0020\u0074\u0061\u0072\u0067\u0065\u0074\u003d\u0022\u0076\u0069\u0065\u0077\u005f\u0077\u0069\u006e\u0064\u006f\u0077\u0022\u003e\u0065\u0064\u0067\u0065\u6d4f\u89c8\u5668\u0026\u0065\u006e\u0073\u0070\u003b\u007c\u003c\u002f\u0061\u003e\u003c\u0061\u0020\u0068\u0072\u0065\u0066\u003d\u0022\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0062\u0072\u006f\u0077\u0073\u0065\u0072\u002e\u0033\u0036\u0030\u002e\u0063\u006e\u002f\u0065\u0065\u0022\u0020\u0074\u0061\u0072\u0067\u0065\u0074\u003d\u0022\u0076\u0069\u0065\u0077\u005f\u0077\u0069\u006e\u0064\u006f\u0077\u0022\u003e\u007c\u0026\u0065\u006e\u0073\u0070\u003b\u0033\u0036\u0030\u6781\u901f\u6d4f\u89c8\u5668\u0028\u0036\u0034\u4f4d\u7248\u672c\u0029\u003c\u002f\u0061\u003e','red');
                stop = true;
                return;
            }try{
                GM_xmlhttpRequest({
                    method: "get",
                    url: 'http://api.7j112.com/chaoXing/v1/onlineNum.php',
                    onload: function(res) {
                        if(res.responseText.includes('unviral')){
                            _d.getElementById('onlineNum').innerHTML='<h5 class="text-muted" style="margin-top: 30px;margin-bottom: 0;float: left;">当前在线: '+res.responseText.replace('unviral','')+'人</h5>';
                        }
                    }
                })
            }catch(e){
            }
            if(isMobile){
                logs.addLog('手机浏览器不保证能正常运行','red');
            }
            _d.addEventListener('visibilitychange', function () {
                let isH = _d.hidden;
                if (!isH) {
                    logs.addLog('请保持此页面在最前端，不要切屏或最小化，否则脚本无法正常运行','red');
                }
            });
            _d.getElementById('unrivalRate').value = rate;
            _d.getElementById('updateRateButton').onclick = function(){
                let urate = _d.getElementById('unrivalRate').value;
                if(parseFloat(urate)==parseInt(urate)){
                    urate = parseInt(urate);
                }else{
                    urate = parseFloat(urate);
                }
                if(urate>maxRate){
                    _d.getElementById('unrivalRate').value = rate;
                    logs.addLog('已超过脚本限制最高倍速，修改失败，<b>倍速大于1可能会面临清除进度/全校通报风险</b>，如有特殊需求请修改脚本代码内限制参数','red');
                    return;
                }
                GM_setValue('unrivalrate',urate);
                rate = urate;
                if(urate>0){
                    logs.addLog('视频倍速已更新为'+urate+'倍，将在3秒内生效','green');
                }else{
                    logs.addLog('奇怪的倍速，将会自动跳过视频任务','red');
                }
            }
            _d.getElementById('reviewModeButton').onclick=function(){
                let reviewButton = _d.getElementById('reviewModeButton');
                if(reviewButton.getAttribute('class')=='btn btn-default'){
                    _d.getElementById('reviewModeButton').setAttribute('class','btn btn-success');
                    logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过','green');
                    GM_setValue('unrivalreview','1');
                    _w.top.unrivalReviewMode = '1';
                }else{
                    _d.getElementById('reviewModeButton').setAttribute('class','btn btn-default');
                    logs.addLog('复习模式已关闭，遇到已完成的视频任务会自动跳过','green');
                    GM_setValue('unrivalreview','0');
                    _w.top.unrivalReviewMode = '0';
                }
            }
            _d.getElementById('autoDoWorkButton').onclick=function(){
                let autoDoWorkButton = _d.getElementById('autoDoWorkButton');
                if(autoDoWorkButton.getAttribute('class')=='btn btn-default'){
                    _d.getElementById('autoDoWorkButton').setAttribute('class','btn btn-success');
                    logs.addLog('自动做章节测试已开启，将会自动做章节测试','green');
                    GM_setValue('unrivaldowork','1');
                    _w.top.unrivalDoWork = '1';
                }else{
                    _d.getElementById('autoDoWorkButton').setAttribute('class','btn btn-default');
                    logs.addLog('自动做章节测试已关闭，将不会自动做章节测试','green');
                    GM_setValue('unrivaldowork','0');
                    _w.top.unrivalDoWork = '0';
                }
            }
            _d.getElementById('autoSubmitButton').onclick=function(){
                let autoSubmitButton = _d.getElementById('autoSubmitButton');
                if(autoSubmitButton.getAttribute('class')=='btn btn-default'){
                    _d.getElementById('autoSubmitButton').setAttribute('class','btn btn-success');
                    logs.addLog('符合提交标准的章节测试将会自动提交','green');
                    GM_setValue('unrivalautosubmit','1');
                    _w.top.unrivalAutoSubmit = '1';
                }else{
                    _d.getElementById('autoSubmitButton').setAttribute('class','btn btn-default');
                    logs.addLog('章节测试将不会自动提交','green');
                    GM_setValue('unrivalautosubmit','0');
                    _w.top.unrivalAutoSubmit = '0';
                }
            }
            _d.getElementById('autoSaveButton').onclick=function(){
                let autoSaveButton = _d.getElementById('autoSaveButton');
                if(autoSaveButton.getAttribute('class')=='btn btn-default'){
                    _d.getElementById('autoSaveButton').setAttribute('class','btn btn-success');
                    logs.addLog('不符合提交标准的章节测试将会自动保存','green');
                    GM_setValue('unrivalautosave','1');
                    _w.top.unrivalAutoSave = '1';
                }else{
                    _d.getElementById('autoSaveButton').setAttribute('class','btn btn-default');
                    logs.addLog('不符合提交标准的章节测试将不会自动保存，等待用户自己操作','green');
                    GM_setValue('unrivalautosave','0');
                    _w.top.unrivalAutoSave = '0';
                }
            }
            _d.getElementById('videoTimeButton').onclick=function(){
                _d.getElementById('videoTime').style.display = 'block';
                _d.getElementById('videoTimeContent').src=_p+'//stat2-ans.chaoxing.com/task/s/index?courseid='+courseId+'&clazzid='+classId;
            }
            _d.getElementById('refreshcurrentpage').onclick=function(){
                window.setTimeout(function() {
                    window.location.reload();
                },1000)
            }
        }
    },100),
        loopjob= ()=>{
        if(_w.top.unrivalScriptList.length>1){
            logs.addLog('您同时开启了多个刷课脚本，会挂科！会挂科！会挂科！','red');
        }
        if(cVersion<8.6*10){
            logs.addLog('\u60a8'+'\u7684'+'\u6d4f'+'\u89c8'+'\u5668'+'\u5185'+'\u6838'+'\u8fc7'+'\u8001'+'\uff0c'+'\u8bf7'+'\u66f4'+'\u65b0'+'\u7248'+'\u672c'+'\u6216'+'\u4f7f'+'\u7528'+'\u4e3b'+'\u6d41'+'\u6d4f'+'\u89c8'+'\u5668'+'\uff0c\u63a8\u8350\u003c\u0061\u0020\u0068\u0072\u0065\u0066\u003d\u0022\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0077\u0077\u0077\u002e\u006d\u0069\u0063\u0072\u006f\u0073\u006f\u0066\u0074\u002e\u0063\u006f\u006d\u002f\u007a\u0068\u002d\u0063\u006e\u002f\u0065\u0064\u0067\u0065\u0022\u0020\u0074\u0061\u0072\u0067\u0065\u0074\u003d\u0022\u0076\u0069\u0065\u0077\u005f\u0077\u0069\u006e\u0064\u006f\u0077\u0022\u003e\u0065\u0064\u0067\u0065\u6d4f\u89c8\u5668\u0026\u0065\u006e\u0073\u0070\u003b\u007c\u003c\u002f\u0061\u003e\u003c\u0061\u0020\u0068\u0072\u0065\u0066\u003d\u0022\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0062\u0072\u006f\u0077\u0073\u0065\u0072\u002e\u0033\u0036\u0030\u002e\u0063\u006e\u002f\u0065\u0065\u0022\u0020\u0074\u0061\u0072\u0067\u0065\u0074\u003d\u0022\u0076\u0069\u0065\u0077\u005f\u0077\u0069\u006e\u0064\u006f\u0077\u0022\u003e\u007c\u0026\u0065\u006e\u0073\u0070\u003b\u0033\u0036\u0030\u6781\u901f\u6d4f\u89c8\u5668\u0028\u0036\u0034\u4f4d\u7248\u672c\u0029\u003c\u002f\u0061\u003e','red');
            stop = true;
            return;
        }
        if(stop){
            return;
        }
        let missionli = missionList;
        if(missionli==[]){
            setTimeout(loopjob,500);
            return;
        }
        for(let itemName in missionli){
            if(missionli[itemName]['running']){
                setTimeout(loopjob,500);
                return;
            }
        }
        for(let itemName in missionli){
            if(!missionli[itemName]['done']){
                switch(missionli[itemName]['type']){
                    case 'video':doVideo(missionli[itemName]);
                    break;
                    case 'document':doDocument(missionli[itemName]);
                    break;
                    case 'work':doWork(missionli[itemName]);
                    break;
                }
                setTimeout(loopjob,500);
                return;
            }
        }
        if(busyThread <=0){
            if(jumpType!=2){
                _w.top.jump = true;
                logs.addLog('所有任务处理完毕，5秒后自动下一章','green');
            }else{
                logs.addLog('所有任务处理完毕，用户设置为不跳转，脚本已结束运行，如需自动跳转，请编辑脚本代码参数','green');
            }
            clearInterval(loopjob);
        }else{
            setTimeout(loopjob,500);
        }
    },
        readyCheck = ()=>{
        setTimeout(function(){
            try{
                if(!isCat){
                    logs.addLog('请使用<a href="https://docs.scriptcat.org/use/#%E5%AE%89%E8%A3%85%E6%89%A9%E5%B1%95" target="view_window">脚本猫</a>运行此脚本，使用其他脚本管理器不保证能正常运行','red');
                }
                if(_w.top.unrivalReviewMode=='1'){
                    logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过','green');
                    _d.getElementById('reviewModeButton').setAttribute('class',['btn btn-default','btn btn-success'][_w.top.unrivalReviewMode]);
                }
                if(_w.top.unrivalDoWork=='1'){
                    logs.addLog('自动做章节测试已开启，将会自动做章节测试','green');
                    _d.getElementById('autoDoWorkButton').setAttribute('class',['btn btn-default','btn btn-success'][_w.top.unrivalDoWork]);
                }
                _d.getElementById('autoSubmitButton').setAttribute('class',['btn btn-default','btn btn-success'][_w.top.unrivalAutoSubmit]);
                _d.getElementById('autoSaveButton').setAttribute('class',['btn btn-default','btn btn-success'][_w.top.unrivalAutoSave]);
            }catch(e){
                console.log(e);
                readyCheck();
                return;
            }
        },500);
    }
    readyCheck();
    try{
        var pageData = JSON.parse(param);
    }catch(e){
        if(jumpType!=2){
            _w.top.jump = true;
            logs.addLog('此页无任务，5秒后自动下一章','green');
        }else{
            logs.addLog('此页无任务，用户设置为不跳转，脚本已结束运行，如需自动跳转，请编辑脚本代码参数','green');
        }
        return;
    }
    var data = pageData['defaults'],
        jobList = [],
        classId = data['clazzId'],
        chapterId = data['knowledgeid'],
        reportUrl = data['reportUrl'];
    for(let i=0,l=pageData['attachments'].length;i<l;i++){
        let item = pageData['attachments'][i];
        if(item['job']!=true||item['isPassed']==true){
            if(_w.top.unrivalReviewMode=='1'&&item['type']=='video'){
                jobList.push(item);
            }else{
                continue;
            }
        }else{
            jobList.push(item);
        }
    }
    var video_getReady=(item)=>{
            let statusUrl = _p+'//'+_h+'/ananas/status/'+item['property']['objectid']+'?k='+getCookie('fid')+'&flag=normal&_dc='+String(Math.round(new Date())),
                doubleSpeed = item['property']['doublespeed'];
            busyThread +=1;
            GM_xmlhttpRequest({
                method: "get",
                headers: {
                    'Host': _h,
                    'Referer': vrefer,
                    'Sec-Fetch-Site':'same-origin'
                },
                url: statusUrl,
                onload: function(res) {
                    try{
                        busyThread -=1;
                        let videoInfo = JSON.parse(res.responseText),
                            duration = videoInfo['duration'],
                            dtoken = videoInfo['dtoken'];
                        if(duration==undefined){
                            _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'[无效视频]'+item['property']['name']+`
                                </div>
                            </div>`
                            return;
                        }
                        missionList['m'+item['jobid']]={
                            'type':'video',
                            'dtoken':dtoken,
                            'duration':duration,
                            'objectId':item['property']['objectid'],
                            'otherInfo':item['otherInfo'],
                            'doublespeed':doubleSpeed,
                            'jobid':item['jobid'],
                            'name':item['property']['name'],
                            'done':false,
                            'running':false
                        };
                        _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'[视频]'+item['property']['name']+`
                                </div>
                            </div>`
                    }catch(e){
                    }
                },
                onerror:function(err){
                    console.log(err);
                    if(err.error.indexOf('@connect list')>=0){
                        logs.addLog('请添加安全网址，将 【 //@connect      '+_h+' 】方括号里的内容(不包括方括号)添加到脚本代码内指定位置，否则脚本无法正常运行，如图所示：','red');
                        logs.addLog('<img src="https://pan-yz.chaoxing.com/thumbnail/0,0,0/609a8b79cbd6a91d10c207cf2b5f368d">');
                        stop = true;
                    }else{
                        logs.addLog('获取任务详情失败','red');
                        logs.addLog('错误原因：'+err.error,'red');
                    }
                }
            });
        },
        doVideo = (item)=>{
            if(rate<=0){
                missionList['m'+item['jobid']]['running']=true;
                logs.addLog('奇怪的倍速，视频已自动跳过','red');
                setTimeout(function(){
                    missionList['m'+item['jobid']]['running']=false;
                    missionList['m'+item['jobid']]['done']=true;
                },5000);
                return;
            }
            if(allowBackground){
                if(_w.top.document.getElementsByClassName('catalog_points_sa').length>0||_w.top.document.getElementsByClassName('lock').length>0){
                    logs.addLog('您已安装超星自动化脚本挂机，但此课程可能为闯关模式，不支持后台挂机，将为您在线完成','blue');
                }else{
                    item['userid']=GM_getValue('unrivalUd','666');
                    item['classId']=classId;
                    item['review']=[false,true][_w.top.unrivalReviewMode];
                    item['reportUrl']=reportUrl;
                    GM_setValue('unrivalBackgroundVideo',item);
                    _d.cookie = "videojs_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    logs.addLog('您已安装超星自动化脚本，已添加至后台任务，<a href="unrivalxxtbackground/" target="view_window">点我查看后台</a>','green');
                    missionList['m'+item['jobid']]['running']=true;
                    setTimeout(function(){
                        missionList['m'+item['jobid']]['running']=false;
                        missionList['m'+item['jobid']]['done']=true;
                    },5000);
                    return;
                }
            }
            let videojs_id = String(parseInt(Math.random() * 9999999));
            _d.cookie='videojs_id='+videojs_id+';path=/'
            logs.addLog('开始刷视频：'+item['name']+'，倍速：'+String(rate)+'倍');
            logs.addLog('视频观看状态每10秒更新一次，请耐心等待，脚本在正常运行，请不要在10秒内卸载脚本！','green');
            function disblaystudystatus() {
                logs.addLog('开始查询并显示学习进度','green');
                _d.getElementById('videoTime').style.display = 'block';
                _d.getElementById('videoTimeContent').src=_p+'//stat2-ans.chaoxing.com/task/s/index?courseid='+courseId+'&clazzid='+classId;
            }
            disblaystudystatus();
            if(item['doublespeed']==0&&rate!=1&&_w.top.unrivalReviewMode=='0'){
                logs.addLog('倍速播放此视频有99%几率导致“老师发现”、“请清除进度”！！！','red');
                logs.addLog('倍速播放此视频有99%几率导致“老师发现”、“请清除进度”！！！','red');
                logs.addLog('倍速播放此视频有99%几率导致“老师发现”、“请清除进度”！！！','red');
            }
            let playTime = 0,
                playsTime = 0,
                isdrag = '3',
                times = 0,
                encUrl = '',
                first = true,
                loop = setInterval(function(){
                    if(rate<=0){
                        clearInterval(loop);
                        logs.addLog('奇怪的倍速，视频已自动跳过','red');
                        setTimeout(function(){
                            missionList['m'+item['jobid']]['running']=false;
                            missionList['m'+item['jobid']]['done']=true;
                        },5000);
                        return;
                    }
                    playsTime += rate;
                    playTime = Math.ceil(playsTime);
                    if(times==0||times%10==0||playTime>=item['duration']){
                        if(first){
                            playTime = 0;
                        }
                        if(playTime>=item['duration']){
                            clearInterval(loop);
                            playTime = item['duration'];
                            isdrag = '4';
                        }else if(playTime>0){
                            isdrag = '0';
                        }
                        encUrl = hostList[host]+'chaoXing/v1/getEncNew.php?classid='+classId+'&playtime='+playTime+'&duration='+item['duration']+'&objectid='+item['objectId']+'&jobid='+item['jobid']+'&uid='+ GM_getValue('unrivalUd','666');
                        busyThread +=1;
                        let _bold_playTime = playTime;
                        GM_xmlhttpRequest({
                            method: "get",
                            url: encUrl,
                            onload: function(res) {
                                let enc = res.responseText;
                                if(enc.includes('--#')){
                                    let warnInfo = enc.match(new RegExp('--#(.*?)--#',"ig"))[0].replace(/--#/ig,'');
                                    logs.addLog(warnInfo,'red');
                                    enc = enc.replace(/--#(.*?)--#/ig,'');
                                }
                                if(enc.length!=32){
                                    if(enc.indexOf('.stop')>=0){
                                        clearInterval(loop);
                                        stop = true;
                                        return;
                                    }
                                    logs.addLog('获取视频enc错误，五秒后重试','red');
                                    logs.addLog('如果反复失败，请尝试在脚本代码内更改服务器线路','red');
                                    logs.addLog(enc.replace('.stop',''),'red');
                                    times=-5;
                                    return;
                                }
                                let reportsUrl = reportUrl+'/'+item['dtoken']+'?clazzId='+classId+'&playingTime='+_bold_playTime+'&duration='+item['duration']+'&clipTime=0_'+item['duration']+'&objectId='+item['objectId']+'&otherInfo='+item['otherInfo']+'&jobid='+item['jobid']+'&userid='+ GM_getValue('unrivalUd','666')+'&isdrag='+isdrag+'&view=pc&enc='+enc+'&rt='+rt+'&dtype=Video&_t='+String(Math.round(new Date()));
                                GM_xmlhttpRequest({
                                    method: "get",
                                    headers: {
                                        'Host': _h,
                                        'Referer': vrefer,
                                        'Sec-Fetch-Site':'same-origin',
                                        'Content-Type': 'application/json'
                                    },
                                    url: reportsUrl,
                                    onload: function(res) {
                                        if(GM_getValue('unrivalUd','666')!=getCookie('_uid')){
                                            stop = true;
                                            logs.addLog('\u591a\u8d26\u53f7\u540c\u5237\u4f1a\u5bfc\u81f4\u5f02\u5e38\uff0c\u8bf7\u5173\u95ed\u6240\u6709\u6d4f\u89c8\u5668\u7a97\u53e3\u540e\u91cd\u8bd5','red');
                                        }
                                        try{
                                            busyThread -=1;
                                            let ispass = JSON.parse(res.responseText);
                                            first = false;
                                            if(ispass['isPassed']&&_w.top.unrivalReviewMode=='0'){
                                                logs.addLog('视频任务已完成','green');
                                                missionList['m'+item['jobid']]['running']=false;
                                                missionList['m'+item['jobid']]['done']=true;
                                                clearInterval(loop);
                                                logs.addLog('5秒后自动刷新当前页面');
                                                window.setTimeout(function() {
                                                    window.location.reload();
                                                },5000)
                                            }else if(isdrag == '4'){
                                                if(_w.top.unrivalReviewMode=='1'){
                                                    logs.addLog('视频已观看完毕','green');
                                                    logs.addLog('5秒后自动刷新当前页面');
                                                    window.setTimeout(function() {
                                                        window.location.reload();
                                                    },5000)
                                                }else{
                                                    logs.addLog('视频已观看完毕，但视频任务未完成','red');
                                                }
                                                missionList['m'+item['jobid']]['running']=false;
                                                missionList['m'+item['jobid']]['done']=true;
                                                try{
                                                    clearInterval(loop);
                                                }catch(e){

                                                }
                                                logs.addLog('5秒后自动刷新当前页面');
                                                window.setTimeout(function() {
                                                    window.location.reload();
                                                },5000)
                                            }else{
                                                logs.addLog(item['name']+'已观看'+_bold_playTime+'秒，剩余大约'+String(item['duration']-_bold_playTime)+'秒');
                                            }
                                        }catch(e){
                                            console.log(e);
                                            if(res.responseText.indexOf('验证码')>=0){
                                                logs.addLog('已被超星风控，请<a href="'+reportsUrl+'" target="_blank">点我处理</a>，60秒后自动刷新页面','red');
                                                missionList['m'+item['jobid']]['running']=false;
                                                clearInterval(loop);
                                                stop = true;
                                                setTimeout(function(){
                                                    _l.reload();
                                                },60000);
                                                return;
                                            }
                                            if(rt=='0.9'){
                                                if(first){
                                                    logs.addLog('超星返回错误信息，尝试更换参数','orange');
                                                    rt='1';
                                                    times = -3;
                                                }else{
                                                    logs.addLog('超星返回错误信息，十秒后重试(1)','red');
                                                    times = -10;
                                                }
                                                return;
                                            }else{
                                                if(first){
                                                    rt='0.9';
                                                }
                                                logs.addLog('超星返回错误信息，十秒后重试(2)','red');
                                                times = -10;
                                                console.log(res.responseText);
                                                return;
                                            }
                                        }
                                    },
                                    onerror:function(err){
                                        console.log(err);
                                        if(err.error.indexOf('@connect list')>=0){
                                            logs.addLog('请添加安全网址，将 【 //@connect      '+_h+' 】方括号里的内容(不包括方括号)添加到脚本代码内指定位置，否则脚本无法正常运行，如图所示：','red');
                                            logs.addLog('<img src="https://pan-yz.chaoxing.com/thumbnail/0,0,0/609a8b79cbd6a91d10c207cf2b5f368d">');
                                            stop = true;
                                        }else{
                                            logs.addLog('观看视频失败','red');
                                            logs.addLog('错误原因：'+err.error,'red');
                                        }
                                        missionList['m'+item['jobid']]['running']=false;
                                        clearInterval(loop);
                                    }
                                });
                            },
                            onerror:function(err){
                                console.log(err);
                                logs.addLog('获取视频enc失败，请检查脚本插件是否有完整的访问权限，具体请见脚本下载页','red');
                                missionList['m'+item['jobid']]['running']=false;
                                clearInterval(loop);
                            }
                        });
                    }
                    times+=1;
                },1000);
                missionList['m'+item['jobid']]['running']=true;
        },
        doDocument=(item)=>{
            missionList['m'+item['jobid']]['running']=true;
            logs.addLog('开始刷文档：'+item['name']);
            setTimeout(function(){
                busyThread += 1;
                GM_xmlhttpRequest({
                    method: "get",
                    url: _p+'//'+_h+'/ananas/job/document?jobid='+item['jobid']+'&knowledgeid='+chapterId+'&courseid='+courseId+'&clazzid='+classId+'&jtoken='+item['jtoken'],
                    onload: function(res) {
                        try{
                            busyThread -= 1;
                            let ispass = JSON.parse(res.responseText);
                            if(ispass['status']){
                                logs.addLog('文档任务已完成','green');
                            }else{
                                logs.addLog('文档已阅读完成，但任务点未完成','red');
                            }
                            
                        }catch(err){
                            console.log(err);
                            console.log(res.responseText);
                            logs.addLog('解析文档内容失败','red');
                        }
                        missionList['m'+item['jobid']]['running']=false;
                        missionList['m'+item['jobid']]['done']=true;
                    },
                    onerror:function(err){
                        console.log(err);
                        if(err.error.indexOf('@connect list')>=0){
                            logs.addLog('请添加安全网址，将 【 //@connect      '+_h+' 】方括号里的内容(不包括方括号)添加到脚本代码内指定位置，否则脚本无法正常运行，如图所示：','red');
                            logs.addLog('<img src="https://pan-yz.chaoxing.com/thumbnail/0,0,0/609a8b79cbd6a91d10c207cf2b5f368d">');
                            stop = true;
                        }else{
                            logs.addLog('阅读文档失败','red');
                            logs.addLog('错误原因：'+err.error,'red');
                        }
                        missionList['m'+item['jobid']]['running']=false;
                        missionList['m'+item['jobid']]['done']=true;
                    }
                });
            },parseInt(Math.random()*2000+9000,10))
        },
        doWork = (item)=>{
            missionList['m'+item['jobid']]['running']=true;
            logs.addLog('开始刷章节测试：'+item['name']);
            logs.addLog('您设置的答题正确率为：'+String(accuracy)+'%，只有在高于此正确率时才会提交测试','blue');
            logs.addLog('您设置的题库接口为：'+ctUrl,'blue');
            _d.getElementById('workPanel').style.display = 'block';
            _d.getElementById('frame_content').src=_p+'//'+_h+'/work/phone/work?workId='+item['jobid'].replace('work-','')+'&courseId='+courseId+'&clazzId='+classId+'&knowledgeId='+chapterId+'&jobId='+item['jobid']+'&enc='+item['enc'];
            _w.top.unrivalWorkInfo='';
            _w.top.unrivalDoneWorkId='';
            setInterval(function(){
                if(_w.top.unrivalWorkInfo!=''){
                    logs.addLog(_w.top.unrivalWorkInfo);
                    _w.top.unrivalWorkInfo='';
                }
            },100);
            let checkcross=setInterval(function(){
                if(_w.top.unrivalWorkDone==false){
                    clearInterval(checkcross);
                    return;
                }
                let ifW = _d.getElementById('frame_content').contentWindow;
                try{
                    ifW.location.href;
                }catch(e){
                    console.log(e);
                    if(e.message.indexOf('cross-origin')!=-1){
                        clearInterval(checkcross);
                        _w.top.unrivalWorkDone = true;
                        return;
                    }
                }
            },2000);
            let workDoneInterval = setInterval(function(){
                if(_w.top.unrivalWorkDone){
                    _w.top.unrivalWorkDone = false;
                    clearInterval(workDoneInterval);
                    _w.top.unrivalDoneWorkId = '';
                    _d.getElementById('workPanel').style.display = 'none';
                    _d.getElementById('frame_content').src='';
                    setTimeout(function(){
                        missionList['m'+item['jobid']]['running']=false;
                        missionList['m'+item['jobid']]['done']=true;
                    },5000);
                }
            },500);
        },
        missionList = [];
    if(jobList.length<=0){
        if(jumpType!=2){
            _w.top.jump = true;
            logs.addLog('此页无任务，5秒后自动下一章','green');
        }else{
            logs.addLog('此页无任务，用户设置为不跳转，脚本已结束运行，如需自动跳转，请编辑脚本代码参数','green');
        }
        return;
    }
    for(let i=0,l=jobList.length;i<l;i++){
        let item = jobList[i];
        if(item['type']=='video'){
            video_getReady(item);
        }else if(item['type']=='document'){
            missionList['m'+item['jobid']]={
                'type':'document',
                'jtoken':item['jtoken'],
                'jobid':item['jobid'],
                'name':item['property']['name'],
                'done':false,
                'running':false
            };
            _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'[文档]'+item['property']['name']+`
                                </div>
                            </div>`
        }else if(item['type']=='workid'&&_w.top.unrivalDoWork=='1'){
            missionList['m'+item['jobid']]={
                'type':'work',
                'workid':item['property']['workid'],
                'jobid':item['jobid'],
                'name':item['property']['title'],
                'enc':item['enc'],
                'done':false,
                'running':false
            };
            _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'[章节测试]'+item['property']['title']+`
                                </div>
                            </div>`
        }else{
            try{
                let jobName = item['property']['name'];
                if(jobName==undefined){
                    jobName = item['property']['title'];
                }
                _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'已跳过：'+jobName+`
                                </div>
                            </div>`
            }catch(e){
            }
        }
    }
    loopjob();
}else if(_l.href.indexOf("mycourse/studentstudy") >0){
    try{
        _w.unrivalScriptList.push('Fuck me please');
    }catch(e){
        _w.unrivalScriptList = ['Fuck me please'];
    }
    function checkOffline(){
        let dleft = _d.getElementsByClassName('left');
        if(dleft.length==1){
            let img=dleft[0].getElementsByTagName('img');
            if(img.length==1){
                if(img[0].src.indexOf('loading.gif')!=-1){
                    return true;
                }
            }
        }
        return false;
    }
    setInterval(function(){
        if(checkOffline()){
            setTimeout(function(){
                if(checkOffline()){
                    _l.reload();
                }
            },10000)
        }
    },3000);
    _d.addEventListener('visibilitychange', function () {
        let isH = _d.hidden;
        if (isH) {
            document.title = '【【脚本已停止运行】】';
        }else {
            document.title = '学生学习页面';
        }
    });
    _w.unrivalgetTeacherAjax = _w.getTeacherAjax;
    _w.getTeacherAjax=(courseid,classid,cid)=>{
        if(cid==getQueryVariable('chapterId')){
            return;
        }
        _w.top.unrivalPageRd = '';
        _w.unrivalgetTeacherAjax(courseid,classid,cid);
    }
    if(disableMonitor == 1){
        _w.appendChild = _w.Element.prototype.appendChild;
        _w.Element.prototype.appendChild = function(){
            try{
                if(arguments[0].src.indexOf('detect.chaoxing.com')>0){
                    return;
                }
            }catch(e){}
            _w.appendChild.apply(this, arguments);
        };
    }
    
    _w.jump = false;
    setInterval(function(){
        if(getQueryVariable('mooc2')=='1'){
            let tabs= _d.getElementsByClassName('posCatalog_select');
            for(let i=0,l=tabs.length;i<l;i++){
                let tabId = tabs[i].getAttribute('id');
                if(tabId.indexOf('cur')>=0&&tabs[i].getAttribute('class')=='posCatalog_select'){
                    tabs[i].setAttribute('onclick',"getTeacherAjax('"+courseId+"','"+classId+"','"+tabId.replace('cur','')+"');");
                }
            }
        }else{
            let h4s = _d.getElementsByTagName('h4'),
                h5s = _d.getElementsByTagName('h5');
            for(let i=0,l=h4s.length;i<l;i++){
                if(h4s[i].getAttribute('id').indexOf('cur')>=0){
                    h4s[i].setAttribute('onclick',"getTeacherAjax('"+courseId+"','"+classId+"','"+h4s[i].getAttribute('id').replace('cur','')+"');");
                }
            }
            for(let i=0,l=h5s.length;i<l;i++){
                if(h5s[i].getAttribute('id').indexOf('cur')>=0){
                    h5s[i].setAttribute('onclick',"getTeacherAjax('"+courseId+"','"+classId+"','"+h5s[i].getAttribute('id').replace('cur','')+"');");
                }
            }
        }
    },1000);
    setInterval(function(){
        let but = null;
        if(_w.jump){
            _w.jump = false;
            _w.top.unrivalDoneWorkId = '';
            _w.jjump =(rd)=>{
                if(rd!=_w.top.unrivalPageRd){
                    return;
                }
                try{
                    setTimeout(function(){
                        if(jumpType == 1){
                            if(getQueryVariable('mooc2')=='1'){
                                but = _d.getElementsByClassName('jb_btn jb_btn_92 fs14 prev_next next');
                            }else{
                                but = _d.getElementsByClassName('orientationright');
                            }
                            try{
                                setTimeout(function(){
                                    if(rd!=_w.top.unrivalPageRd){
                                        return;
                                    }
                                    but[0].click();
                                },2000);
                            }catch(e){
                            }
                            return;
                        }
                        if(getQueryVariable('mooc2')=='1'){
                            let ul = _d.getElementsByClassName('prev_ul')[0],
                                lis = ul.getElementsByTagName('li');
                            for(let i=0,l=lis.length;i<l;i++){
                                if(lis[i].getAttribute('class')=='active'){
                                    if(i+1>=l){
                                        break;
                                    }else{
                                        try{
                                            lis[i+1].click();
                                        }catch(e){}
                                        return;
                                    }
                                }
                            }
                            let tabs= _d.getElementsByClassName('posCatalog_select');
                            for(let i=0,l=tabs.length;i<l;i++){
                                if(tabs[i].getAttribute('class')=='posCatalog_select posCatalog_active'){
                                    while(i+1<tabs.length){
                                        let nextTab= tabs[i+1];
                                        if((nextTab.innerHTML.includes('icon_Completed prevTips')&&_w.top.unrivalReviewMode=='0')||nextTab.innerHTML.includes('catalog_points_er prevTips')){
                                            i++;
                                            continue;
                                        }
                                        if(nextTab.id.indexOf('cur')<0){
                                            i++;
                                            continue;
                                        }
                                        let clickF = setInterval(function(){
                                            if(rd!=_w.top.unrivalPageRd){
                                                clearInterval(clickF);
                                                return;
                                            }
                                            nextTab.click();
                                        },2000);
                                        break;
                                    }
                                    break;
                                }
                            }
                        }else{
                            let div = _d.getElementsByClassName('tabtags')[0],
                                spans = div.getElementsByTagName('span');
                                for(let i=0,l=spans.length;i<l;i++){
                                    if(spans[i].getAttribute('class').indexOf('currents')>=0){
                                        if(i+1==l){
                                            break;
                                        }else{
                                            try{
                                                spans[i+1].click();
                                            }catch(e){}
                                            return;
                                        }
                                    }
                                }
                            let tabs= _d.getElementsByTagName('span'),
                                newTabs = [];
                            for(let i=0,l=tabs.length;i<l;i++){
                                if(tabs[i].getAttribute('style')!=null&&tabs[i].getAttribute('style').indexOf('cursor:pointer;height:18px;')>=0){
                                    newTabs.push(tabs[i]);
                                }
                            }
                            tabs = newTabs;
                            for(let i=0,l=tabs.length;i<l;i++){
                                if(tabs[i].parentNode.getAttribute('class')=='currents'){
                                    while(i+1<tabs.length){
                                        let nextTab= tabs[i+1].parentNode;
                                        if((nextTab.innerHTML.includes('roundpoint  blue')&&_w.top.unrivalReviewMode=='0')||nextTab.innerHTML.includes('roundpointStudent  lock')){
                                            i++;
                                            continue;
                                        }
                                        if(nextTab.id.indexOf('cur')<0){
                                            i++;
                                            continue;
                                        }
                                        let clickF = setInterval(function(){
                                            if(rd!=_w.top.unrivalPageRd){
                                                clearInterval(clickF);
                                                return;
                                            }
                                            nextTab.click();
                                        },2000);
                                        break;
                                    }
                                    break;
                                }
                            }
                        }
                    },2000);
                }catch(e){
                }
            }
            _w.onReadComplete1();
            setTimeout('jjump("'+_w.top.unrivalPageRd+'")',2856);
        }
    },200);
}else if(_l.href.indexOf("work/phone/doHomeWork") >0){
    var allow = true,
        wIdE = _d.getElementById('workLibraryId')||_d.getElementById('oldWorkId'),
        wid = wIdE.value;
    GM_xmlhttpRequest({
        method: "GET",
        headers: {
            'Content-type': 'application/x-www-form-urlencoded'
        },
        url:'http://api.7j112.com/chaoXing/v1/collectInfo.php?courseid='+courseId+'&workid='+wid,
        onload: function(res) {
            try{
                if(!res.responseText.includes('success')){
                    allow = false;
                }
            }catch(e){
                allow = false;
            }
        },
        onerror:function(err){
            console.log(err);
        }
    });
    _w.top.unrivalWorkDone = false;
    _w.aalert = _w.alert;
    _w.alert=(msg)=>{
        if(msg=='保存成功'){
            _w.top.unrivalDoneWorkId=getQueryVariable('workId');
            return;
        }
        aalert(msg);
    }
    if(_w.top.unrivalDoneWorkId==getQueryVariable('workId')){
        _w.top.unrivalWorkDone = true;
        return;
    }
    _w.cconfirm = _w.confirm;
    _w.confirm=(msg)=>{
        if(msg=='确认提交？'||msg.includes('您还有未做完的')){
            return true;
        }
        _w.cconfirm(msg);
    }
    var questionList = [],
        questionsElement = _d.getElementsByClassName('Py-mian1'),
        questionNum = questionsElement.length,
        totalQuestionNum = questionNum;
    for(let i=0;i<questionNum;i++){
        let questionElement = questionsElement[i],
            title = questionElement.getElementsByClassName('Py-m1-title fs16')[0].innerHTML.replace(/(<([^>]+)>)/ig, "").replace(/[0-9]{1,3}.\[(.*?)\]/ig,''),
            idElements = questionElement.getElementsByTagName('input'),
            questionId = '0';
        for(let z=0,k=idElements.length;z<k;z++){
            try{
                if(idElements[z].getAttribute('name').indexOf('answer')>=0){
                    questionId = idElements[z].getAttribute('name').replace('type','');
                    break;
                }
            }catch(e){
                console.log(e);
                continue;
            }
        }
        let question = title;
        if(questionId=='0'||question==''){
            continue;
        }
        typeE = questionElement.getElementsByTagName('input');
        if(typeE==null||typeE==[]){
            continue;
        }
        let typeN = 'fuckme';
        for(let g=0,h=typeE.length;g<h;g++){
            if(typeE[g].id=='answertype'+questionId.replace('answer','').replace('check','')){
                typeN = typeE[g].value;
                break;
            }
        }
        if(['0','1','3'].indexOf(typeN)<0){
            continue;
        }
        type={'0':'单选题','1':'多选题','3':'判断题'}[typeN];
        let optionList = {
            length:0
        };
        if(['单选题','多选题'].indexOf(type)>=0){
            let answersElements = questionElement.getElementsByClassName('answerList')[0].getElementsByTagName('li');
            for(let x=0,j=answersElements.length;x<j;x++){
                let optionE = answersElements[x],
                    sample = /(<([^>]+)>)/ig,
                    optionTextE = optionE.innerHTML.replace(sample, "").replace(/(^\s*)|(\s*$)/g, ""),
                    optionText = optionTextE.slice(1).replace(/(^\s*)|(\s*$)/g, ""),
                    optionValue = optionTextE.slice(0,1),
                    optionId = optionE.getAttribute('id-param');
                if(optionText==''){
                    break;
                }
                optionList[optionText]={
                    'id':optionId,
                    'value':optionValue
                }
                optionList.length++;
            }
            if(answersElements.length!=optionList.length){
                continue;
            }
        }
        questionList.push({
            'question':question,
            'type':type,
            'questionid':questionId,
            'options':optionList
        });
    }
    var nowTime=-2000,
        busyThread = questionList.length;
    for(let i=0,l=questionList.length;i<l;i++){
        nowTime+=parseInt(Math.random()*2000+2000,10);
        let qu = questionList[i];
        setTimeout(function(){
            if(!allow){
                _w.top.unrivalWorkInfo = '暂时无法作答此题';
                return;
            }
            let param = 'tm=' + encodeURIComponent(qu['question']) + '&question=' + encodeURIComponent(qu['question']);
            if(ctUrl.includes('icodef')){
                param += '&type=' + {'单选题':'0','多选题':'1','判断题':'3'}[qu['type']]+'&id='+wid;
            }
            GM_xmlhttpRequest({
                method: "POST",
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded',
                    'Authorization': token,
                },
                url:ctUrl,
                data: param,
                onload: function(res) {
                    if(!allow){
                        _w.top.unrivalWorkInfo = '暂时无法作答此题';
                        return;
                    }
                    busyThread-=1;
                    try{

                        let choiceEs = _d.getElementsByTagName('li'),
                            responseText = res.responseText;
                        try{
                            var result = responseText.match(/"answer"[\s]*:[\s]*"(.*?)"/ig)[0].replace(/"answer"[\s]*:[\s]*"/ig,'').slice(0,-1);
                        }catch(e){
                            try{
                                var result = responseText.match(/"data"[\s]*:[\s]*"(.*?)"/ig)[0].replace(/"data"[\s]*:[\s]*"/ig,'').slice(0,-1);
                            }catch(e){
                                try{
                                    var result = responseText.match(/"result"[\s]*:[\s]*"(.*?)"/ig)[0].replace(/"result"[\s]*:[\s]*"/ig,'').slice(0,-1);
                                }catch(e){
                                    try{
                                        var result = responseText.match(/"msg"[\s]*:[\s]*"(.*?)"/ig)[0].replace(/"msg"[\s]*:[\s]*"/ig,'').slice(0,-1);
                                    }catch(e){
                                        try{
                                            var result = responseText.match(/:[\s]*"(.*?)"/ig)[0].replace(/:[\s]*"/ig,'').slice(0,-1);
                                        }catch(e){
                                            _w.top.unrivalWorkInfo = '答案解析失败';
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                        _w.top.unrivalWorkInfo = '题目：'+qu['question']+'：'+result;
                        switch(qu['type']){
                            case '判断题':(function(){
                                let answer = 'abaabaaba';
                                if('正确是对√Tri'.indexOf(result)>=0){
                                    answer = 'true';
                                }else if('错误否错×Fwr'.indexOf(result)>=0){
                                    answer = 'false';
                                }
                                for(let u=0,k=choiceEs.length;u<k;u++){
                                    if(choiceEs[u].getAttribute('val-param')==answer&&choiceEs[u].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                        choiceEs[u].click();
                                        questionNum-=1;
                                        return;
                                    }
                                }
                                if(randomDo==1&&accuracy<100){
                                    _w.top.unrivalWorkInfo = qu['question']+'：未找到正确答案，自动选【错】';
                                    for(let u=0,k=choiceEs.length;u<k;u++){
                                        if(choiceEs[u].getElementsByTagName('em').length<1){
                                            continue;
                                        }
                                        if(choiceEs[u].getAttribute('val-param')=='false'&&choiceEs[u].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                            choiceEs[u].click();
                                            return;
                                        }
                                    }
                                }
                            })();
                            break;
                            case '单选题':(function(){
                                let answerData = result;
                                for(let option in qu['options']){
                                    if(trim(option)==trim(answerData)||trim(option).includes(trim(answerData))||trim(answerData).includes(trim(option))){
                                        for(let y=0,j=choiceEs.length;y<j;y++){
                                            if(choiceEs[y].getElementsByTagName('em').length<1){
                                                continue;
                                            }
                                            if(choiceEs[y].getElementsByTagName('em')[0].getAttribute('id-param')==qu['options'][option]['value']&&choiceEs[y].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                                if(!choiceEs[y].getAttribute('class').includes('cur')){
                                                    choiceEs[y].click();
                                                }
                                                questionNum-=1;
                                                return;
                                            }
                                        }
                                    }
                                }
                                if(randomDo==1&&accuracy<100){
                                    _w.top.unrivalWorkInfo = qu['question']+'：未找到正确答案，自动选【B】';
                                    for(let y=0,j=choiceEs.length;y<j;y++){
                                        if(choiceEs[y].getElementsByTagName('em').length<1){
                                            continue;
                                        }
                                        if(choiceEs[y].getElementsByTagName('em')[0].getAttribute('id-param')=='B'&&choiceEs[y].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                            if(!choiceEs[y].getAttribute('class').includes('cur')){
                                                choiceEs[y].click();
                                            }
                                            return;
                                        }
                                    }
                                }
                            })();
                            break;
                            case '多选题':(function(){
                                let answerData = result,
                                    hasAnswer = false;
                                for(let option in qu['options']){
                                    if(answerData.indexOf(trim(option))>=0){
                                        for(let y=0,j=choiceEs.length;y<j;y++){
                                            if(choiceEs[y].getElementsByTagName('em').length<1){
                                                continue;
                                            }
                                            if(choiceEs[y].getElementsByTagName('em')[0].getAttribute('id-param')==qu['options'][option]['value']&&choiceEs[y].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                                if(!choiceEs[y].getAttribute('class').includes('cur')){
                                                    choiceEs[y].click();
                                                }
                                                hasAnswer = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if(hasAnswer){
                                    questionNum-=1;
                                }else if(randomDo==1&&accuracy<100){
                                    _w.top.unrivalWorkInfo = qu['question']+'：未找到正确答案，自动全选';
                                    for(let y=0,j=choiceEs.length;y<j;y++){
                                        if(choiceEs[y].getElementsByTagName('em').length<1){
                                            continue;
                                        }
                                        if(choiceEs[y].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                            if(!choiceEs[y].getAttribute('class').includes('cur')){
                                                choiceEs[y].click();
                                            }
                                        }
                                    }
                                }
                            })();
                            break;
                        }    
                    }catch(e){
                        if(res.responseText.length<50){
                            _w.top.unrivalWorkInfo = qu['question']+':'+res.responseText;
                        }
                        console.log(e);
                    }
                },
                onerror:function(err){
                    _w.top.unrivalWorkInfo = '查题错误，服务器连接失败';
                    console.log(err);
                    busyThread-=1;
                }
            });
        },nowTime);
    }
    var workInterval = setInterval(function(){
        if(busyThread!=0){
            return;
        }
        clearInterval(workInterval);
        if(Math.floor((totalQuestionNum-questionNum)/totalQuestionNum)*100>=accuracy&&_w.top.unrivalAutoSubmit=='1'){
            _w.top.unrivalDoneWorkId=getQueryVariable('workId');
            _w.top.unrivalWorkInfo = '正确率符合标准，已提交答案';
            setTimeout(function(){
                submitCheckTimes();
            },parseInt(Math.random()*2000+3000,10));
        }else if(_w.top.unrivalAutoSave==1){
            _w.top.unrivalWorkInfo = '正确率不符合标准或未设置自动提交，已自动保存答案';
            setTimeout(function(){
                _w.top.unrivalDoneWorkId=getQueryVariable('workId');
                _w.noSubmit();
            },2000);
        }else{
            _w.top.unrivalWorkInfo = '用户设置为不自动保存答案，请手动提交或保存作业';
        }
    },1000);
}else if(_l.href.includes('work/phone/selectWorkQuestionYiPiYue')){
    _w.top.unrivalWorkDone = true;
    _w.top.unrivalDoneWorkId = getQueryVariable('workId');
}else if(_l.href.includes('stat2-ans.chaoxing.com/task/s/index')){
    if(_w.top==_w){
        return;
    }
    _d.getElementsByClassName('page-container studentStatistic')[0].setAttribute('class','studentStatistic');
    _d.getElementsByClassName('page-item item-task-list minHeight390')[0].remove();
    _d.getElementsByClassName('subNav clearfix')[0].remove();
    setInterval(function(){
        _l.reload();
    },90000);
}else if(_l.href.includes('passport2.')&&_l.href.includes('login?refer=http')&&autoLogin==1){
    if(!(/^1[3456789]\d{9}$/.test(phoneNumber))){
        alert('自动登录的手机号填写错误，无法登陆')
        return;
    }
    if(password==''){
        alert('未填写登录密码，无法登陆')
        return;
    }
    GM_xmlhttpRequest({
        method: "get",
        url: 'https://passport2-api.chaoxing.com/v11/loginregister?cx_xxt_passport=json&uname='+phoneNumber+'&code='+encodeURIComponent(password),
        onload: function(res) {
            try{
                let ispass = JSON.parse(res.responseText);
                if(ispass['status']){
                    _l.href=decodeURIComponent(getQueryVariable('refer'));
                }else{
                    alert(ispass['mes']);
                }
            }catch(err){
                console.log(res.responseText);
                alert('登陆失败');
            }
        },
        onerror:function(err){
            alert('登陆错误');      
        }
    });
}else if(_l.href.includes('unrivalxxtbackground')){
    _d.getElementsByTagName("html")[0].innerHTML=`
    <!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>超星学习通自动化脚本挂机</title>
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport">
        <link href="https://z.chaoxing.com/yanshi/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="row" style="margin: 10px;">
            <div class="col-md-6 col-md-offset-3">
                <div class="header clearfix">
                    <h3 class="text-muted" style="margin-top: 20px;margin-bottom: 0;float: left;">超星学习通自动化脚本挂机&ensp;</h3>
                </div>
                <hr style="margin-top: 10px;margin-bottom: 20px;">
                <div class="panel panel-info">
                    <div class="panel-heading">任务列表</div>
                    <div class="panel-body" id='joblist'>
                    </div>
                </div>
                <div class="panel panel-info">
                    <div class="panel-heading">运行日志</div>
                    <div class="panel-body">
                        <div id="result" style="overflow:auto;line-height: 30px;">
                            <div id="log">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
    `;
    var logs = {
        "logArry": [],
        "addLog": function(str, color = "black") {
            if (this.logArry.length >= 50) {
                this.logArry.splice(0, 1);
            }
            var nowTime = new Date();
            var nowHour = (Array(2).join(0) + nowTime.getHours()).slice(-2);
            var nowMin = (Array(2).join(0) + nowTime.getMinutes()).slice(-2);
            var nowSec = (Array(2).join(0) + nowTime.getSeconds()).slice(-2);
            this.logArry.push("<span style='color: " + color + "'>[" + nowHour + ":" + nowMin + ":" + nowSec + "] " + str + "</span>");
            let logStr = "";
            for (let logI = 0, logLen = this.logArry.length; logI < logLen; logI++) {
                logStr += this.logArry[logI] + "<br>";
            }
            _d.getElementById('log').innerHTML = logStr;
            var logElement = _d.getElementById('log');
            logElement.scrollTop = logElement.scrollHeight;
        }
    };
    logs.addLog('此页面不必保持在最前端，后台会自动进行任务','green');
    setInterval(function(){
        logs.addLog('此页面不必保持在最前端，后台会自动进行任务','green');
        logs.addLog('如想禁用后台刷视频功能，请关闭脚本并重启浏览器','blue');
    },120000)
    GM_addValueChangeListener('unrivalxxtbackgroundinfo', function(name, old_value, new_value, remote) {
        if(old_value!=new_value){
            logs.addLog(new_value);
        }
    });
    setInterval(function(){
        if(Math.round(new Date() / 1000)-parseInt(GM_getValue('unrivalBackgroundVideoEnable','6'))>15){
            logs.addLog('超星自动化脚本挂机可能运行异常，如页面无反应，请尝试重启脚本猫或重启浏览器(脚本猫0.9.0版本有此问题)');
        }
    },10000);
    var loopShow = ()=>{
        let jobList = GM_getValue('unrivalBackgroundList','1');
        if(jobList=='1'){
            _d.getElementById('joblist').innerHTML='请将“超星学习通自动化脚本”升级到最新版并重启浏览器';
        }else{
            try{
                let jobHtml = '';
                for(let i=0,l=jobList.length;i<l;i++){
                    let status = '';
                    if(jobList[i]['done']){
                        status = '已完成';
                    }else if(parseInt(jobList[i]['playTime'])>0){
                        status = '进行中';
                    }else{
                        status = '等待中';
                    }
                    if(jobList[i]['review']){
                        status+='：复习模式';
                    }
                    jobHtml+= `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'['+status+']'+jobList[i]['name']+`
                                </div>
                            </div>`
                    }
                _d.getElementById('joblist').innerHTML = jobHtml;
            }catch(e){
                _d.getElementById('joblist').innerHTML='请将“超星自动化脚本挂机”升级到最新版并重启浏览器！';
            }
        }  
    }
    loopShow();
    setInterval(loopShow,10000);
}else if(_l.href.includes('scriptcat.org/script-show-page/')){
    if(_l.href.includes('379')){
        let b=_d.getElementsByClassName('q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle bg-primary text-white q-btn--actionable q-focusable q-hoverable text-caption')[0];
            b.removeAttribute('href');
        if(!isCat){
            b.onclick=function(){
                if(confirm('此脚本仅支持脚本猫，禁止使用其他脚本管理器安装\n请停用或卸载其他脚本管理器\n点击确认进入脚本猫安装页面')){
                    let url='https://docs.scriptcat.org/use/#%E5%AE%89%E8%A3%85%E6%89%A9%E5%B1%95'
                    if(isEdge){
                        url='https://microsoftedge.microsoft.com/addons/detail/scriptcat/liilgpjgabokdklappibcjfablkpcekh';
                    }else if(isFf){
                        url='https://addons.mozilla.org/zh-CN/firefox/addon/scriptcat/';
                    }
                    setTimeout(function(){
                        GM_openInTab(url, { active: true, insert: true, setParent :true });
                    },2000);
                }
            }
        }else{
            b.onclick=function(){
                alert('安装/更新后请重启浏览器（别忘了启用脚本）');
            }
        }
    }else if(_l.href.includes('336')){
        if(!isCat){
            let b=_d.getElementsByClassName('q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle bg-primary text-white q-btn--actionable q-focusable q-hoverable text-caption')[0];
            b.removeAttribute('href');
            b.onclick=function(){
                alert('强烈建议使用脚本猫运行此脚本，使用其他脚本管理器将无法对接后台挂机脚本');
            }
        }
    }
}
})();
