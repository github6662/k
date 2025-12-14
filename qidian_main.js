/* 
🥳起点读书自动看广告 - 主脚本（优化版）
🔗关联脚本: qidian_finish.js（完成接口）、qidian_list.js（列表接口）
📌功能: 自动执行每日视频福利+限时彩蛋广告任务
[task local]
30 10 * * * https://raw.githubusercontent.com/github6662/k/refs/heads/main/qidian_main.js, img-url=https://raw.githubusercontent.com/chxm1023/Script_X/main/icon/qidian.png, tag=起点读书, enabled=true
*/
const $ = new Env("起点读书-自动看广告");

// 读取配置（BoxJs统一配置）
$.taskId = $.getdata("qd_taskId");
$.taskId_2 = $.getdata("qd_taskId_2");
$.session = $.getdata("qd_session");
$.session_2 = $.getdata("qd_session_2");
$.timeout = $.getdata("qd_timeout") ? Math.max(Number($.getdata("qd_timeout")), 5) : 20;
$.task1Count = $.getdata("qd_task1_count") ? Math.max(Number($.getdata("qd_task1_count")), 1) : 8;
$.task2Count = $.getdata("qd_task2_count") ? Math.max(Number($.getdata("qd_task2_count")), 1) : 3;

// 配置校验
const missingConfigs = [];
!$.taskId && missingConfigs.push("任务1(taskId)");
!$.taskId_2 && missingConfigs.push("任务2(taskId_2)");
!$.session && missingConfigs.push("广告1(session)");
!$.session_2 && missingConfigs.push("广告2(session_2)");

if (missingConfigs.length > 0) {
  const tip = `⚠️配置缺失：${missingConfigs.join("、")}\n请通过重写获取信息`;
  $.log(tip);
  $.msg($.name, "配置不完整", tip);
  $.done();
}

// 主执行逻辑
(async () => {
  $.log(`📋任务开始 - 任务1: ${$.task1Count}次 | 任务2: ${$.task2Count}次 | 间隔: ${$.timeout}s`);
  // 执行任务1
  for (let i = 0; i < $.task1Count; i++) {
    $.log(`\n🟡任务1 - 第${i + 1}/${$.task1Count}次`);
    await executeTask($.session, "每日视频福利");
    if (i < $.task1Count - 1) await $.wait($.timeout * 1000);
  }
  // 执行任务2
  for (let j = 0; j < $.task2Count; j++) {
    $.log(`\n🟡任务2 - 第${j + 1}/${$.task2Count}次`);
    await executeTask($.session_2, "限时彩蛋");
    if (j < $.task2Count - 1) await $.wait($.timeout * 1000);
  }
})()
  .catch((e) => {
    $.logErr("❌整体执行异常", e);
    $.msg($.name, "执行失败", `异常原因：${e.message}`);
  })
  .finally(() => {
    $.log("\n✅所有任务执行完毕");
    $.done();
  });

// 单个任务执行函数
async function executeTask(session, taskName) {
  try {
    let options = JSON.parse(session);
    if (!options.url || !options.method) throw new Error("配置格式错误（缺少url或method）");

    const resp = await $.http.post({ ...options, timeout: 30000 });
    const obj = JSON.parse(resp.body || "{}");

    if (resp.statusCode === 200 && obj.Result === 0) {
      $.log("🎉执行成功");
      return true;
    } else {
      $.log(`🔴首次执行失败 - 状态码: ${resp.statusCode} | 错误码: ${obj.Result || "未知"}`);
      $.log(`📝响应内容: ${resp.body || "无"}`);
      $.log("🔄开始重试...");
      await $.wait(3000);
      const retryResp = await $.http.post({ ...options, timeout: 30000 });
      const retryObj = JSON.parse(retryResp.body || "{}");
      if (retryResp.statusCode === 200 && retryObj.Result === 0) {
        $.log("🎉重试成功");
        return true;
      } else {
        $.log(`🔴重试失败 - 状态码: ${retryResp.statusCode} | 错误码: ${retryObj.Result || "未知"}`);
        $.msg($.name, `${taskName}执行失败`, `请检查配置或网络`);
        return false;
      }
    }
  } catch (e) {
    $.logErr(`❌${taskName}执行异常`, e);
    $.msg($.name, `${taskName}异常`, `异常原因：${e.message}`);
    return false;
  }
}

// 环境类（兼容主流工具）
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
      (this.name = t),
        (this.http = new e(this)),
        (this.logs = []),
        (this.startTime = new Date().getTime()),
        Object.assign(this, s),
        this.log("", `📌${this.name} - 开始执行`);
    }
    isSurge() { return "undefined" != typeof $environment && $environment["surge-version"]; }
    isQuanX() { return "undefined" != typeof $task; }
    isLoon() { return "undefined" != typeof $loon; }
    isShadowrocket() { return "undefined" != typeof $rocket; }
    isStash() { return "undefined" != typeof $environment && $environment["stash-version"]; }
    getdata(t) {
      try {
        if (/^@/.test(t)) {
          const [, e, i] = /^@(.*?)\.(.*?)$/.exec(t);
          const r = this.getval(e) || "{}";
          return JSON.parse(r)[i] || "";
        }
        return this.getval(t) || "";
      } catch (e) { return ""; }
    }
    getval(t) {
      if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
        return $persistentStore.read(t) || "";
      } else if (this.isQuanX()) {
        return $prefs.valueForKey(t) || "";
      }
      return "";
    }
    get(t, s = () => {}) { this.request(t, "GET", s); }
    post(t, s = () => {}) { t.method = "POST"; !t.headers && (t.headers = {}); !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"); this.request(t, "POST", s); }
    request(t, method, callback) {
      const opts = { ...t, timeout: t.timeout || 30000 };
      if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
        this.isSurge() && ((opts.headers = opts.headers || {}), opts.headers["X-Surge-Skip-Scripting"] = !1);
        $httpClient[method.toLowerCase()](opts, (err, resp, body) => {
          resp && (resp.body = body, resp.statusCode = resp.status || resp.statusCode);
          callback(err, resp, body);
        });
      } else if (this.isQuanX()) {
        $task.fetch(opts).then(
          (resp) => callback(null, { statusCode: resp.statusCode, headers: resp.headers, body: resp.body }, resp.body),
          (err) => callback(err.error || "请求失败", null, null)
        );
      }
    }
    wait(t) { return new Promise((s) => setTimeout(s, t)); }
    log(...t) { console.log(t.join("\n")); }
    logErr(t, s) { const errMsg = s instanceof Error ? s.message : s; this.log(`❌${this.name} - 错误: ${t}`, errMsg); }
    msg(title = this.name, subtitle = "", content = "") {
      if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
        $notification.post(title, subtitle, content);
      } else if (this.isQuanX()) {
        $notify(title, subtitle, content);
      }
      this.log(`📢通知: ${title}\n${subtitle}\n${content}`);
    }
    done(t = {}) {
      const costTime = (new Date().getTime() - this.startTime) / 1000;
      this.log(`📌${this.name} - 执行结束 | 耗时: ${costTime.toFixed(1)}s`);
      (this.isSurge() || this.isShadowrocket() || this.isQuanX() || this.isLoon() || this.isStash()) ? $done(t) : console.log("执行完成");
    }
  })(t, s);
}
