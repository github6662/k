/* 
🥳脚本功能: 起点读书 广告完成接口适配（配合主脚本使用）
🔗关联主脚本: qidian.js（优化版）
⏰使用场景: 福利中心-每日视频福利/限时彩蛋 广告完成回调
[rewrite local]
https\:\/\/h5\.if\.qidian\.com\/argus\/api\/v1\/video\/adv\/finishWatch url script-request-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qd.js
[MITM]
hostname = h5.if.qidian.com
*/
const $ = new Env("起点读书-广告完成接口");

// 核心配置（读取主脚本BoxJs配置，无需额外设置）
$.timeout = $.getdata("qd_timeout") ? Math.max(Number($.getdata("qd_timeout")), 5) : 20;
$.session = $.getdata("qd_session") || "";
$.session_2 = $.getdata("qd_session_2") || "";

// 接口请求处理（优化格式校验、响应模拟）
(async () => {
  try {
    // 获取原始请求体
    const rawBody = $request.body || "{}";
    const requestBody = JSON.parse(rawBody);
    $.log(`📥收到请求 - taskId: ${requestBody.taskId || "未知"}`);

    // 校验请求合法性
    if (!requestBody.taskId) {
      $.logErr("❌请求无效：缺少taskId");
      $.done({ body: JSON.stringify({ Result: -1, Message: "无效请求" }) });
      return;
    }

    // 模拟成功响应（适配App校验逻辑，避免重复请求）
    const successResp = {
      Result: 0,
      Message: "success",
      Data: {
        awardNum: 1, // 奖励数量（与App一致）
        awardType: 1, // 奖励类型（1=阅点，适配默认规则）
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
    // 异常兜底响应（避免App报错）
    $.done({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ Result: -2, Message: "接口处理异常" })
    });
  }
})();

// 精简环境类（仅保留核心功能，适配接口脚本场景）
function Env(t) {
  return new (class {
    constructor(t) {
      (this.name = t),
        (this.logs = []),
        (this.startTime = new Date().getTime()),
        this.log("", `📌${this.name} - 开始处理`);
    }
    // 环境适配（覆盖主流工具）
    isSurge() { return "undefined" != typeof $environment && $environment["surge-version"]; }
    isQuanX() { return "undefined" != typeof $task; }
    isLoon() { return "undefined" != typeof $loon; }
    isShadowrocket() { return "undefined" != typeof $rocket; }
    isStash() { return "undefined" != typeof $environment && $environment["stash-version"]; }

    // 数据存储（复用主脚本配置）
    getdata(t) {
      try {
        if (this.isSurge() || this.isShadowrocket() || this.isLoon() || this.isStash()) {
          return $persistentStore.read(t) || "";
        } else if (this.isQuanX()) {
          return $prefs.valueForKey(t) || "";
        }
        return "";
      } catch (e) {
        return "";
      }
    }

    // 日志&工具方法
    log(...t) {
      t.length > 0 && this.logs.push(...t);
      console.log(t.join("\n"));
    }
    logErr(t, s) {
      const errMsg = s instanceof Error ? s.message : s;
      this.log(`❌${this.name} - 错误: ${t}`, errMsg);
    }
    done(t = {}) {
      const costTime = (new Date().getTime() - this.startTime) / 1000;
      this.log(`📌${this.name} - 处理结束 | 耗时: ${costTime.toFixed(1)}s`);
      (this.isSurge() || this.isShadowrocket() || this.isQuanX() || this.isLoon() || this.isStash()) ? $done(t) : console.log("执行完成");
    }
  })(t);
}
