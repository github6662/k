/*
 * 📌 脚本名称：起点读书-自动看视频 (完整版)
 * ⚙️ 变量说明：
 *    - qd_taskId: 任务ID1 (自动获取)
 *    - qd_taskId_2: 任务ID2 (自动获取)
 *    - qd_session: 广告1的请求体 (自动获取)
 *    - qd_session_2: 广告2的请求体 (自动获取)
 */

const $ = new Env("起点读书");

// --- ⚙️ 用户配置区域 ---
const config = {
    // 任务1 (视频奖励) 执行次数，通常是 8 次
    task1_count: 8,
    // 任务2 (额外看3次) 执行次数，通常是 3 次
    task2_count: 3,
    // 每次请求的间隔时间 (秒)，建议设置 15-20 秒，避免请求过快被风控
    timeout: 20
};

// --- 🚀 主逻辑 ---
!(async () => {
    $.log(`\n🔔 ${$.name} 开始执行...`);
    
    // 获取存储的必要数据
    const data = {
        id1: $.getdata('qd_taskId'),
        id2: $.getdata('qd_taskId_2'),
        sess1: $.getdata('qd_session'),
        sess2: $.getdata('qd_session_2')
    };

    let hasRun = false;

    // --- 执行任务 1 ---
    if (data.id1 && data.sess1) {
        $.log(`\n📺 [任务1] 开始执行 (计划执行 ${config.task1_count} 次)`);
        await runTaskLoop(data.sess1, config.task1_count, "任务1");
        hasRun = true;
    } else {
        $.log(`\n⚠️ [任务1] 无法执行：缺少 TaskID 或 Session，请先运行重写脚本获取。`);
    }

    // --- 执行任务 2 ---
    if (data.id2 && data.sess2) {
        $.log(`\n📺 [任务2] 开始执行 (计划执行 ${config.task2_count} 次)`);
        await runTaskLoop(data.sess2, config.task2_count, "任务2");
        hasRun = true;
    } else {
        $.log(`\n⚠️ [任务2] 无法执行：缺少 TaskID 或 Session，请先运行重写脚本获取。`);
    }

    if (!hasRun) {
        $.msg($.name, "❌ 任务未执行", "请先去起点读书App手动观看一次视频以获取Cookie和ID");
    }

})()
.catch((e) => $.logErr(e))
.finally(() => {
    $.log(`\n🔔 ${$.name} 执行完毕`);
    $.done();
});

// --- 🛠 辅助函数 ---

// 循环执行任务的通用函数
async function runTaskLoop(sessionStr, count, taskName) {
    for (let i = 0; i < count; i++) {
        $.log(`👉 [${taskName}] 第 ${i + 1}/${count} 次请求...`);
        
        await doRequest(sessionStr);

        // 如果不是最后一次，则等待指定时间
        if (i < count - 1) {
            $.log(`⏳ 等待 ${config.timeout} 秒...`);
            await $.wait(config.timeout * 1000);
        }
    }
}

// 发送网络请求
function doRequest(sessionStr) {
    return new Promise((resolve) => {
        try {
            const reqData = JSON.parse(sessionStr);
            // 确保 headers 对象存在
            reqData.headers = reqData.headers || {};
            
            // 发送 POST 请求
            $.post(reqData, (error, response, data) => {
                if (error) {
                    $.log(`❌ 请求网络错误: ${error}`);
                } else {
                    try {
                        const res = JSON.parse(data);
                        if (res.Result === 0) {
                            $.log(`✅ 成功获励`);
                        } else {
                            $.log(`🔴 失败: ${res.Message || res.msg || JSON.stringify(res)}`);
                        }
                    } catch (e) {
                        $.log(`⚠️ 响应非JSON格式: ${data}`);
                    }
                }
                resolve();
            });
        } catch (e) {
            $.log(`❌ Session 解析失败: ${e}`);
            resolve();
        }
    });
}

// --- 🧩 通用工具 Env ---
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $environment&&$environment["surge-version"]}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"},timeout:r};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs||require("fs"),this.path=this.path||require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}writedata(){if(this.isNode()){this.fs=this.fs||require("fs"),this.path=this.path||require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isShadowrocket()||this.isLoon()||this.isStash()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isShadowrocket()||this.isLoon()||this.isStash()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got||require("got"),this.cktough=this.cktough||require("tough-cookie"),this.ckjar=this.ckjar||new this.cktough.CookieJar,t&&(t.headers=t.headers||{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isShadowrocket()||this.isLoon()||this.isStash()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,headers:i,body:r}=t;e(null,{status:s,statusCode:s,headers:i,body:r},r)},t=>e(t.error,null,null))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,headers:i,rawBody:r}=t;e(null,{status:s,statusCode:s,headers:i,rawBody:r,body:r},r)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isShadowrocket()||this.isLoon()||this.isStash())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,headers:i,body:r}=t;e(null,{status:s,statusCode:s,headers:i,body:r},r)},t=>e(t.error,null,null));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,headers:i,rawBody:r}=t;e(null,{status:s,statusCode:s,headers:i,rawBody:r,body:r},r)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()||this.isStash()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,i=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":i}}if(this.isSurge()||this.isStash()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()||this.isStash()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============📣系统通知📣=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash())&&$done(t)}}
