/* 
🥳脚本功能: 自动观看 起点读书 广告
任务1: 福利中心 --> 每日视频福利（默认8次）
任务2: 福利中心 --> 限时彩蛋（默认3次）
⏰定时任务: 每日10:30自动执行（可修改）
📦BoxJs配置: https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/mcdasheng.boxjs.json
@params:
    "qd_session": 任务1会话信息（必填）
    "qd_session_2": 任务2会话信息（必填）
    "qd_taskId": 任务1ID（必填）
    "qd_taskId_2": 任务2ID（必填）
    "qd_timeout": 间隔时间(秒)，默认20s（建议≥5s防黑号）
    "qd_retry": 失败重试次数，默认2次（新增）
    "qd_task1_count": 任务1执行次数，默认8次（新增自定义）
    "qd_task2_count": 任务2执行次数，默认3次（新增自定义）
*/
const $ = new Env("起点读书-优化版");

// 配置参数（支持BoxJs自定义）
const CONFIG = {
  task1Count: $.getdata("qd_task1_count") || 8,
  task2Count: $.getdata("qd_task2_count") || 3,
  timeout: ($.getdata("qd_timeout") || 20) * 1000,
  retryTimes: $.getdata("qd_retry") || 2,
  session1: $.getdata("qd_session"),
  session2: $.getdata("qd_session_2"),
  taskId1: $.getdata("qd_taskId"),
  taskId2: $.getdata("qd_taskId_2"),
};

// 参数校验
const validateConfig = () => {
  const missing = [];
  !CONFIG.session1 && missing.push("qd_session（任务1会话）");
  !CONFIG.session2 && missing.push("qd_session_2（任务2会话）");
  !CONFIG.taskId1 && missing.push("qd_taskId（任务1ID）");
  !CONFIG.taskId2 && missing.push("qd_taskId_2（任务2ID）");
  
  if (missing.length) {
    const msg = `⚠️缺失必要配置：\n${missing.join("\n")}\n请通过重写获取`;
    $.log(msg), $.msg($.name, "配置错误", msg);
    return false;
  }
  return true;
};

// 带重试的任务执行函数
async function runTask(session, taskName, index) {
  let retry = 0;
  while (retry <= CONFIG.retryTimes) {
    try {
      const options = JSON.parse(session);
      const resp = await $.http.post(options);
      const obj = JSON.parse(resp.body);
      
      if (obj.Result === 0) {
        $.log(`🎉${taskName} 第${index}次 执行成功`);
        return true;
      } else {
        throw new Error(`返回码非0：${JSON.stringify(obj)}`);
      }
    } catch (e) {
      retry++;
      if (retry > CONFIG.retryTimes) {
        $.log(`🔴${taskName} 第${index}次 执行失败（已重试${CONFIG.retryTimes}次）：${e.message}`);
        return false;
      }
      $.log(`⚠️${taskName} 第${index}次 失败，${retry}次重试中...`);
      await $.wait(CONFIG.timeout);
    }
  }
}

// 主流程
(async () => {
  if (!validateConfig()) return $.done();
  
  $.log(`🟡开始执行任务（任务1:${CONFIG.task1Count}次 | 任务2:${CONFIG.task2Count}次 | 间隔:${CONFIG.timeout/1000}s）`);
  
  // 执行任务1
  for (let i = 1; i <= CONFIG.task1Count; i++) {
    await runTask(CONFIG.session1, "任务1（每日视频）", i);
    await $.wait(CONFIG.timeout);
  }
  
  // 执行任务2
  for (let i = 1; i <= CONFIG.task2Count; i++) {
    await runTask(CONFIG.session2, "任务2（限时彩蛋）", i);
    await $.wait(CONFIG.timeout);
  }
  
  $.log("✅所有任务执行完毕！");
  $.msg($.name, "执行成功", `任务1完成${CONFIG.task1Count}次\n任务2完成${CONFIG.task2Count}次`);
})()
  .catch((e) => {
    $.logErr("❌主流程异常：", e);
    $.msg($.name, "执行失败", e.message);
  })
  .finally(() => $.done());

// 基础Env类（保留原功能，优化错误捕获）
function Env(t, s) {
  class e {
    constructor(t) { this.env = t; }
    send(t, s = "GET") {
      t = "string" == typeof t ? { url: t } : t;
      const e = "POST" === s ? this.post : this.get;
      return new Promise((s, i) => e.call(this, t, (t, e, r) => t ? i(t) : s(e)));
    }
    get(t) { return this.send.call(this.env, t); }
    post(t) { return this.send.call(this.env, t, "POST"); }
  }
  return new (class {
    constructor(t, s) {
      (this.name = t), (this.http = new e(this)), (this.logs = []), (this.startTime = Date.now());
      Object.assign(this, s), this.log("", `📌${this.name} 启动成功！`);
    }
    isQuanX() { return "undefined" != typeof $task; }
    isSurge() { return "undefined" != typeof $environment && $environment["surge-version"]; }
    isLoon() { return "undefined" != typeof $loon; }
    isShadowrocket() { return "undefined" != typeof $rocket; }
    isStash() { return "undefined" != typeof $environment && $environment["stash-version"]; }
    getdata(t) {
      return this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()
        ? $persistentStore.read(t)
        : this.isQuanX() ? $prefs.valueForKey(t) : null;
    }
    msg(s, e = "", i = "", r) {
      const o = (t) => {
        if (!t) return;
        if (this.isLoon()) return { openUrl: t.url || t.openUrl };
        if (this.isQuanX()) return { "open-url": t.url || t.openUrl };
        return { url: t.url || t.openUrl };
      };
      !this.isMute && (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()
        ? $notification.post(s, e, i, o(r))
        : this.isQuanX() && $notify(s, e, i, o(r)));
      this.log(`📢通知：${s}\n${e}\n${i}`);
    }
    log(...t) { console.log(t.join("\n")), this.logs.push(...t); }
    logErr(t) { console.error(`❌错误：${t.stack || t}`), this.logs.push(`❌错误：${t.stack || t}`); }
    wait(t) { return new Promise(s => setTimeout(s, t)); }
    done(t = {}) {
      const e = (Date.now() - this.startTime) / 1000;
      this.log("", `📌${this.name} 执行结束！耗时：${e.toFixed(1)}s`),
      this.isSurge() || this.isShadowrocket() || this.isQuanX() || this.isLoon() || this.isStash() ? $done(t) : process.exit(0);
    }
  })(t, s);
}
