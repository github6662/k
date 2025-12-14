/* 
🥳起点读书 - 广告完成接口（优化版）
🔗关联主脚本: qidian_main.js
[rewrite local]
https\:\/\/h5\.if\.qidian\.com\/argus\/api\/v1\/video\/adv\/finishWatch url script-request-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qidian_finish.js
[MITM]
hostname = h5.if.qidian.com
*/
const $ = new Env("起点读书-广告完成接口");

$.timeout = $.getdata("qd_timeout") ? Math.max(Number($.getdata("qd_timeout")), 5) : 20;
$.session = $.getdata("qd_session") || "";
$.session_2 = $.getdata("qd_session_2") || "";

(async () => {
  try {
    const rawBody = $request.body || "{}";
    const requestBody = JSON.parse(rawBody);
    $.log(`📥收到请求 - taskId: ${requestBody.taskId || "未知"}`);

    if (!requestBody.taskId) {
      $.logErr("❌请求无效：缺少taskId");
      $.done({ body: JSON.stringify({ Result: -1, Message: "无效请求" }) });
      return;
    }

    const successResp = {
      Result: 0,
      Message: "success",
      Data: {
        awardNum: 1,
        awardType: 1,
        taskId: requestBody.taskId,
        finishTime: new Date().getTime()
      }
    };

    $.log(`🎉模拟成功响应 - taskId: ${requestBody.taskId}`);
    $.done({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(successResp)
    });
  } catch (e) {
    $.logErr("❌接口处理异常", e);
    $.done({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ Result: -2, Message: "接口处理异常" })
    });
  }
})();

function Env(t) {
  return new (class {
    constructor(t) {
      (this.name = t),
        (this.logs = []),
        (this.startTime = new Date().getTime()),
        this.log("", `📌${this.name} - 开始处理`);
    }
    isSurge() { return "undefined" != typeof $environment && $environment["surge-version"]; }
    isQuanX() { return "undefined" != typeof $task; }
    isLoon() { return "undefined" != typeof $loon; }
    isShadowrocket() { return "undefined" != typeof $rocket; }
    isStash() { return "undefined" != typeof $environment && $environment["stash-version"]; }
    getdata(t) {
      try {
        if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
          return $persistentStore.read(t) || "";
        } else if (this.isQuanX()) {
          return $prefs.valueForKey(t) || "";
        }
        return "";
      } catch (e) { return ""; }
    }
    log(...t) { console.log(t.join("\n")); }
    logErr(t, s) { const errMsg = s instanceof Error ? s.message : s; this.log(`❌${this.name} - 错误: ${t}`, errMsg); }
    done(t = {}) {
      const costTime = (new Date().getTime() - this.startTime) / 1000;
      this.log(`📌${this.name} - 处理结束 | 耗时: ${costTime.toFixed(1)}s`);
      (this.isSurge() || this.isShadowrocket() || this.isQuanX() || this.isLoon() || this.isStash()) ? $done(t) : console.log("执行完成");
    }
  })(t);
}
