/* 
🥳起点读书自动看广告 - 主脚本（优化版）
🔗关联脚本: qd.js（广告完成接口）、qd2.js（广告列表接口）
📌功能: 自动执行每日视频福利+限时彩蛋广告任务
[task local]
30 10 * * * https://raw.githubusercontent.com/github6662/k/refs/heads/main/qidian.js, img-url=https://raw.githubusercontent.com/chxm1023/Script_X/main/icon/qidian.png, tag=起点读书, enabled=true
[MITM]
hostname = h5.if.qidian.com
*/
const $ = new Env("起点读书-自动看广告");

// 统一配置读取（与子脚本同步，支持BoxJs自定义）
$.config = {
  taskId: $.getdata("qd_taskId") || "",
  taskId_2: $.getdata("qd_taskId_2") || "",
  session: $.getdata("qd_session") || "",
  session_2: $.getdata("qd_session_2") || "",
  timeout: $.getdata("qd_timeout") ? Math.max(Number($.getdata("qd_timeout")), 5) : 20, // 最低5s防风控
  task1Count: $.getdata("qd_task1_count") ? Math.max(Number($.getdata("qd_task1_count")), 1) : 8,
  task2Count: $.getdata("qd_task2_count") ? Math.max(Number($.getdata("qd_task2_count")), 1) : 3,
  retryTimes: 1, // 统一重试次数
  reqTimeout: 30000 // 统一请求超时（30s）
};

// 配置校验（优化提示精度）
const validateConfig = () => {
  const missing = [];
  $.config.taskId || missing.push("每日视频福利(taskId)");
  $.config.taskId_2 || missing.push("限时彩蛋(taskId_2)");
  $.config.session || missing.push("每日视频福利(session)");
  $.config.session_2 || missing.push("限时彩蛋(session_2)");
  
  if (missing.length) {
    const tip = `⚠️配置缺失：${missing.join("、")}\n请通过抓包获取（福利中心各看1次广告）`;
    $.log(tip);
    $.msg($.name, "配置不完整", tip);
    return false;
  }
  // 校验session格式
  try {
    JSON.parse($.config.session);
    JSON.parse($.config.session_2);
  } catch (e) {
    const tip = "⚠️session配置格式错误（需为完整JSON）";
    $.logErr(tip, e);
    $.msg($.name, "配置格式错误", tip);
    return false;
  }
  return true;
};

// 主执行逻辑（优化流程清晰度）
(async () => {
  if (!validateConfig()) return $.done();
  
  $.log(`📋任务启动 - 每日视频福利: ${$.config.task1Count}次 | 限时彩蛋: ${$.config.task2Count}次 | 间隔: ${$.config.timeout}s`);
  
  try {
    // 执行每日视频福利
    await runTask("每日视频福利", $.config.session, $.config.task1Count);
    // 执行限时彩蛋（间隔3s切换任务）
    await $.wait(3000);
    await runTask("限时彩蛋", $.config.session_2, $.config.task2Count);
    
    $.log("\n✅所有任务执行完毕！");
    $.msg($.name, "执行成功", `每日视频福利: ${$.config.task1Count}次\n限时彩蛋: ${$.config.task2Count}次`);
  } catch (e) {
    $.logErr("❌任务执行异常", e);
    $.msg($.name, "执行失败", `异常原因：${e.message}`);
  } finally {
    $.done();
  }
})();

/**
 * 统一任务执行函数（优化重试逻辑）
 * @param {string} taskName 任务名称
 * @param {string} session 任务配置
 * @param {number} count 执行次数
 */
async function runTask(taskName, session, count) {
  let successCount = 0;
  const taskConfig = JSON.parse(session);
  
  for (let i = 0; i < count; i++) {
    $.log(`\n🟡${taskName} - 第${i + 1}/${count}次`);
    const result = await requestWithRetry(taskConfig, taskName);
    result && successCount++;
    // 最后一次不等待
    if (i < count - 1) await $.wait($.config.timeout * 1000);
  }
  
  $.log(`🔵${taskName}完成 - 成功: ${successCount}/${count}次`);
  if (successCount < count) {
    $.msg($.name, `${taskName}部分失败`, `成功: ${successCount}次 | 失败: ${count - successCount}次`);
  }
}

/**
 * 带重试的请求函数（统一错误处理）
 * @param {object} config 请求配置
 * @param {string} taskName 任务名称
 * @returns {boolean} 是否成功
 */
async function requestWithRetry(config, taskName) {
  for (let retry = 0; retry <= $.config.retryTimes; retry++) {
    try {
      const resp = await $.http.post({ ...config, timeout: $.config.reqTimeout });
      const data = JSON.parse(resp.body || "{}");
      
      if (resp.statusCode === 200 && data.Result === 0) {
        $.log("🎉请求成功");
        return true;
      }
      
      $.log(`🔴${retry > 0 ? "重试" : "首次"}失败 - 状态码: ${resp.statusCode} | 错误码: ${data.Result || "未知"}`);
      if (retry < $.config.retryTimes) {
        $.log(`🔄${retry + 1}/${$.config.retryTimes}次重试...`);
        await $.wait(3000);
      }
    } catch (e) {
      $.logErr(`❌${retry > 0 ? "重试" : "首次"}请求异常`, e);
      if (retry < $.config.retryTimes) {
        $.log(`🔄${retry + 1}/${$.config.retryTimes}次重试...`);
        await $.wait(3000);
      }
    }
  }
  return false;
}

// 通用环境类（精简+兼容优化）
function Env(name) {
  return new (class {
    constructor(name) {
      this.name = name;
      this.logs = [];
      this.startTime = Date.now();
      this.log(`📌${name} - 启动时间: ${new Date().toLocaleString()}`);
    }
    // 环境判断
    isSurge() { return typeof $environment?.["surge-version"] !== "undefined"; }
    isQuanX() { return typeof $task !== "undefined"; }
    isLoon() { return typeof $loon !== "undefined"; }
    isShadowrocket() { return typeof $rocket !== "undefined"; }
    isStash() { return typeof $environment?.["stash-version"] !== "undefined"; }
    // 数据存储
    getdata(key) {
      try {
        if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
          return $persistentStore.read(key) || "";
        } else if (this.isQuanX()) {
          return $prefs.valueForKey(key) || "";
        }
      } catch (e) { $.logErr("获取配置失败", e); }
      return "";
    }
    // 网络请求
    http = {
      post: (config) => new Promise((resolve, reject) => {
        const opts = { ...config };
        this.isSurge() && (opts.headers = { ...opts.headers, "X-Surge-Skip-Scripting": false });
        if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
          $httpClient.post(opts, (err, resp, body) => err ? reject(err) : resolve({ ...resp, body }));
        } else if (this.isQuanX()) {
          $task.fetch(opts).then(resp => resolve({
            statusCode: resp.statusCode,
            headers: resp.headers,
            body: resp.body
          })).catch(reject);
        }
      })
    };
    // 工具方法
    wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    log(...args) {
      const msg = args.join("\n");
      this.logs.push(msg);
      console.log(msg);
    }
    logErr(title, err) {
      const msg = err instanceof Error ? err.message : err;
      this.log(`❌${title}: ${msg}`);
    }
    msg(title = this.name, subtitle = "", content = "") {
      if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
        $notification.post(title, subtitle, content);
      } else if (this.isQuanX()) {
        $notify(title, subtitle, content);
      }
      this.log(`📢通知: ${title}\n${subtitle}\n${content}`);
    }
    done(data = {}) {
      const cost = (Date.now() - this.startTime) / 1000;
      this.log(`📌${this.name} - 执行结束 | 耗时: ${cost.toFixed(1)}s`);
      (this.isSurge() || this.isShadowrocket() || this.isQuanX() || this.isLoon() || this.isStash()) ? $done(data) : console.log("执行完成");
    }
  })(name);
}
