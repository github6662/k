/* 
🥳脚本功能: 自动观看 起点读书 广告
任务1: 福利中心 --> 每日视频福利（默认8次）
任务2: 福利中心 --> 限时彩蛋（默认3次）
⏰默认配置: 间隔20s（BoxJs可修改，建议≥5s防黑号）
🎯重写脚本（不变）:
[rewrite local]
https\:\/\/h5\.if\.qidian\.com\/argus\/api\/v1\/video\/adv\/finishWatch url script-request-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qd.js
https\:\/\/h5\.if\.qidian\.com\/argus\/api\/v1\/video\/adv\/mainPage url script-response-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qd2.js
[MITM]
hostname = h5.if.qidian.com
⏰定时任务（不变）:
[task local]
30 10 * * * https://raw.githubusercontent.com/github6662/k/refs/heads/main/qidian.js, img-url=https://raw.githubusercontent.com/chxm1023/Script_X/main/icon/qidian.png, tag=起点读书, enabled=true
📦BoxJs地址（不变）:
https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/mcdasheng.boxjs.json
@params: 
    "qd_session"（必填）
    "qd_session_2"（必填）
    "qd_taskId"（必填）
    "qd_taskId_2"（必填）
    "qd_timeout": 间隔时间（默认20s，建议≥5s）
    "qd_task1_count": 任务1执行次数（默认8次，可自定义）
    "qd_task2_count": 任务2执行次数（默认3次，可自定义）
*/
const $ = new Env("起点读书-优化版");

// 读取配置（新增自定义执行次数配置）
$.taskId = $.getdata("qd_taskId");
$.taskId_2 = $.getdata("qd_taskId_2");
$.session = $.getdata("qd_session");
$.session_2 = $.getdata("qd_session_2");
$.timeout = $.getdata("qd_timeout") ? Math.max(Number($.getdata("qd_timeout")), 5) : 20; // 最低5s间隔防黑号
$.task1Count = $.getdata("qd_task1_count") ? Math.max(Number($.getdata("qd_task1_count")), 1) : 8;
$.task2Count = $.getdata("qd_task2_count") ? Math.max(Number($.getdata("qd_task2_count")), 1) : 3;

// 配置校验（优化提示逻辑，避免重复弹窗）
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

// 主执行逻辑（优化错误重试、日志清晰度）
(async () => {
  $.log(`📋任务开始 - 任务1: ${$.task1Count}次 | 任务2: ${$.task2Count}次 | 间隔: ${$.timeout}s`);
  // 执行任务1
  for (let i = 0; i < $.task1Count; i++) {
    $.log(`\n🟡任务1 - 第${i + 1}/${$.task1Count}次`);
    await executeTask($.session, "任务1");
    if (i < $.task1Count - 1) await $.wait($.timeout * 1000); // 最后一次不等待
  }
  // 执行任务2
  for (let j = 0; j < $.task2Count; j++) {
    $.log(`\n🟡任务2 - 第${j + 1}/${$.task2Count}次`);
    await executeTask($.session_2, "任务2");
    if (j < $.task2Count - 1) await $.wait($.timeout * 1000); // 最后一次不等待
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

/**
 * 执行单个广告任务（新增错误重试、响应校验）
 * @param {string} session - 任务配置
 * @param {string} taskName - 任务名称
 */
async function executeTask(session, taskName) {
  try {
    // 解析配置（增加格式校验）
    let options = JSON.parse(session);
    if (!options.url || !options.method) throw new Error("配置格式错误（缺少url或method）");

    // 发送请求（增加超时控制）
    const resp = await $.http.post({ ...options, timeout: 30000 }); // 30s超时
    const obj = JSON.parse(resp.body || "{}");

    // 结果判断（优化状态码识别）
    if (resp.statusCode === 200 && obj.Result === 0) {
      $.log("🎉执行成功");
      return true;
    } else {
      // 重试逻辑（最多1次重试）
      $.log(`🔴首次执行失败 - 状态码: ${resp.statusCode} | 错误码: ${obj.Result || "未知"}`);
      $.log(`📝响应内容: ${resp.body || "无"}`);
      $.log("🔄开始重试...");
      await $.wait(3000); // 重试间隔3s
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

// 基础环境类（优化兼容性、减少冗余）
function Env(t, s) {
  class e {
    constructor(t) {
      this.env = t;
    }
    send(t, s = "GET") {
      t = "string" == typeof t ? { url: t } : t;
      const e = "POST" === s ? this.post : this.get;
      return new Promise((s, i) => e.call(this, t, (t, e, r) => t ? i(t) : s(e)));
    }
    get(t) {
      return this.send.call(this.env, t);
    }
    post(t) {
      return this.send.call(this.env, t, "POST");
    }
  }
  return new (class {
    constructor(t, s) {
      (this.name = t),
        (this.http = new e(this)),
        (this.dataFile = "box.dat"),
        (this.logs = []),
        (this.isMute = !1),
        (this.logSeparator = "\n"),
        (this.encoding = "utf-8"),
        (this.startTime = new Date().getTime()),
        Object.assign(this, s),
        this.log("", `📌${this.name} - 开始执行`);
    }
    // 环境判断（精简逻辑）
    isSurge() { return "undefined" != typeof $environment && $environment["surge-version"]; }
    isQuanX() { return "undefined" != typeof $task; }
    isLoon() { return "undefined" != typeof $loon; }
    isShadowrocket() { return "undefined" != typeof $rocket; }
    isStash() { return "undefined" != typeof $environment && $environment["stash-version"]; }
    isNode() { return "undefined" != typeof module && !!module.exports; }

    // 数据存储（优化异常处理）
    getdata(t) {
      try {
        if (/^@/.test(t)) {
          const [, e, i] = /^@(.*?)\.(.*?)$/.exec(t);
          const r = this.getval(e) || "{}";
          return JSON.parse(r)[i] || "";
        }
        return this.getval(t) || "";
      } catch (e) {
        return "";
      }
    }
    setdata(t, s) {
      try {
        if (/^@/.test(s)) {
          const [, i, r] = /^@(.*?)\.(.*?)$/.exec(s);
          const o = JSON.parse(this.getval(i) || "{}");
          o[r] = t;
          return this.setval(JSON.stringify(o), i);
        }
        return this.setval(t, s);
      } catch (e) {
        return !1;
      }
    }
    getval(t) {
      if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
        return $persistentStore.read(t) || "";
      } else if (this.isQuanX()) {
        return $prefs.valueForKey(t) || "";
      } else if (this.isNode()) {
        const fs = require("fs"), path = require("path");
        const file = path.resolve(this.dataFile);
        return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file))[t] || "" : "";
      }
      return "";
    }
    setval(t, s) {
      if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
        return $persistentStore.write(t, s);
      } else if (this.isQuanX()) {
        return $prefs.setValueForKey(t, s);
      } else if (this.isNode()) {
        const fs = require("fs"), path = require("path");
        const file = path.resolve(this.dataFile);
        const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
        data[s] = t;
        fs.writeFileSync(file, JSON.stringify(data));
        return !0;
      }
      return !1;
    }

    // 网络请求（优化超时、 headers 处理）
    get(t, s = () => {}) {
      this.request(t, "GET", s);
    }
    post(t, s = () => {}) {
      t.method = "POST";
      !t.headers && (t.headers = {});
      !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded");
      this.request(t, "POST", s);
    }
    request(t, method, callback) {
      const opts = { ...t };
      opts.timeout = opts.timeout || 30000; // 默认30s超时
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
      } else if (this.isNode()) {
        const got = require("got");
        got(opts).then(
          (resp) => callback(null, { statusCode: resp.statusCode, headers: resp.headers, body: resp.body }, resp.body),
          (err) => callback(err.message, err.response || null, err.response?.body || null)
        );
      }
    }

    // 工具方法（精简冗余）
    wait(t) { return new Promise((s) => setTimeout(s, t)); }
    log(...t) {
      t.length > 0 && (this.logs = [...this.logs, ...t]);
      console.log(t.join(this.logSeparator));
    }
    logErr(t, s) {
      const errMsg = s instanceof Error ? s.message : s;
      this.log("", `❌${this.name} - 错误: ${t}`, errMsg);
    }
    msg(title = this.name, subtitle = "", content = "", extra = {}) {
      if (this.isMute) return;
      const notifyOpts = this.formatNotifyOpts(extra);
      if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
        $notification.post(title, subtitle, content, notifyOpts);
      } else if (this.isQuanX()) {
        $notify(title, subtitle, content, notifyOpts);
      }
      this.log(`\n📢通知: ${title}\n${subtitle}\n${content}`);
    }
    formatNotifyOpts(t) {
      if (!t) return {};
      if (this.isQuanX()) return { "open-url": t.url || t["open-url"], "media-url": t["media-url"] };
      if (this.isLoon()) return { openUrl: t.url || t["open-url"], mediaUrl: t["media-url"] };
      return { url: t.url || t["open-url"] };
    }
    done(t = {}) {
      const costTime = (new Date().getTime() - this.startTime) / 1000;
      this.log("", `📌${this.name} - 执行结束 | 耗时: ${costTime.toFixed(1)}s`);
      (this.isSurge() || this.isShadowrocket() || this.isQuanX() || this.isLoon() || this.isStash()) ? $done(t) : this.isNode() && process.exit(0);
    }
  })(t, s);
}
