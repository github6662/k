/* 
🥳起点读书 - 广告完成接口（优化版）
🔗关联主脚本: qidian.js
📌功能: 模拟广告观看完成响应，适配主脚本配置
[rewrite local]
https\:\/\/h5\.if\.qidian\.com\/argus\/api\/v1\/video\/adv\/finishWatch url script-request-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qd.js
[MITM]
hostname = h5.if.qidian.com
*/
const $ = new Env("起点读书-广告完成接口");

// 核心处理逻辑（强化防风控+异常兜底）
(async () => {
  try {
    // 解析原始请求
    const rawBody = $request.body || "{}";
    const reqData = JSON.parse(rawBody);
    const taskId = reqData.taskId || reqData.TaskId || "";
    
    $.log(`📥收到请求 - taskId: ${taskId || "未知"}`);
    
    // 校验请求合法性
    if (!taskId) {
      $.logErr("❌无效请求", "缺少taskId参数");
      return sendResponse(-1, "无效请求：缺少taskId");
    }
    
    // 模拟真实成功响应（添加随机因子防风控）
    const successData = {
      Result: 0,
      Message: "success",
      Data: {
        awardNum: 1, // 固定奖励数量（与App一致）
        awardType: 1, // 1=阅点（适配默认规则）
        taskId: taskId,
        finishTime: Date.now(),
        requestId: generateRandomStr(32), // 随机请求ID
        sign: generateRandomStr(16) // 模拟签名字段
      }
    };
    
    $.log(`🎉模拟成功响应 - taskId: ${taskId}`);
    sendResponse(0, "success", successData.Data);
  } catch (e) {
    $.logErr("❌接口处理异常", e);
    // 异常兜底响应（避免App报错）
    sendResponse(-2, "接口处理异常", { retry: true });
  }
})();

/**
 * 统一响应发送函数
 * @param {number} code 结果码（0=成功）
 * @param {string} msg 提示信息
 * @param {object} data 响应数据
 */
function sendResponse(code, msg, data = {}) {
  const response = {
    Result: code,
    Message: msg,
    Data: data,
    Timestamp: Date.now()
  };
  
  $.done({
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache",
      "Server": "qidian-ad-server" // 模拟真实服务器标识
    },
    body: JSON.stringify(response)
  });
}

/**
 * 生成随机字符串（防风控重复）
 * @param {number} length 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomStr(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// 精简环境类（仅保留接口必需功能）
function Env(name) {
  return new (class {
    constructor(name) {
      this.name = name;
      this.logs = [];
      this.log(`📌${name} - 开始处理请求`);
    }
    // 环境判断
    isSurge() { return typeof $environment?.["surge-version"] !== "undefined"; }
    isQuanX() { return typeof $task !== "undefined"; }
    isLoon() { return typeof $loon !== "undefined"; }
    isShadowrocket() { return typeof $rocket !== "undefined"; }
    isStash() { return typeof $environment?.["stash-version"] !== "undefined"; }
    // 日志方法
    log(...args) {
      const msg = args.join("\n");
      this.logs.push(msg);
      console.log(msg);
    }
    logErr(title, err) {
      const msg = err instanceof Error ? err.message : err;
      this.log(`❌${title}: ${msg}`);
    }
    done(data = {}) {
      (this.isSurge() || this.isShadowrocket() || this.isQuanX() || this.isLoon() || this.isStash()) ? $done(data) : console.log("响应发送完成");
    }
  })(name);
}
