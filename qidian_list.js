/* 
🥳起点读书 - 广告列表接口（优化版）
🔗关联主脚本: qidian.js
📌功能: 适配广告列表长度，与主脚本任务数同步
[rewrite local]
https\:\/\/h5\.if\.qidian\.com\/argus\/api\/v1\/video\/adv\/mainPage url script-response-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qidian_list.js
[MITM]
hostname = h5.if.qidian.com
*/
const $ = new Env("起点读书-广告列表接口");

// 读取主脚本配置（保持同步）
const config = {
  task1Count: $.getdata("qd_task1_count") ? Math.max(Number($.getdata("qd_task1_count")), 1) : 8,
  task2Count: $.getdata("qd_task2_count") ? Math.max(Number($.getdata("qd_task2_count")), 1) : 3
};

// 核心处理逻辑（优化任务识别+数据适配）
(async () => {
  try {
    // 解析原始响应
    const rawBody = $response.body || "{}";
    const originData = JSON.parse(rawBody);
    
    $.log(`📥收到原始响应 - 结果码: ${originData.Result || "未知"}`);
    
    // 校验原始响应有效性
    if (originData.Result !== 0 || !originData.Data?.list || !Array.isArray(originData.Data.list)) {
      $.log("⚠️原始响应无效，返回默认广告列表");
      return sendResponse(getDefaultList());
    }
    
    // 深拷贝避免污染原始数据
    const adaptedData = JSON.parse(JSON.stringify(originData));
    const taskType = getTaskType(adaptedData.Data.list);
    const targetLength = taskType === "task1" ? config.task1Count : taskType === "task2" ? config.task2Count : adaptedData.Data.list.length;
    
    // 适配列表长度
    adaptedData.Data.list = adaptListLength(adaptedData.Data.list, targetLength);
    // 增加防风控字段
    adaptedData.Data.requestId = generateRandomStr(32);
    adaptedData.Data.timestamp = Date.now();
    adaptedData.Data.sign = generateRandomStr(24);
    adaptedData.Result = 0;
    adaptedData.Message = "success";
    
    $.log(`🎉适配完成 - 任务类型: ${taskType === "task1" ? "每日视频福利" : taskType === "task2" ? "限时彩蛋" : "未知"} | 列表长度: ${adaptedData.Data.list.length}`);
    sendResponse(adaptedData);
  } catch (e) {
    $.logErr("❌接口处理异常", e);
    // 异常兜底：返回默认列表
    sendResponse(getDefaultList());
  }
})();

/**
 * 识别任务类型（每日视频福利/限时彩蛋）
 * @param {Array} list 广告列表
 * @returns {string} task1/task2/unknown
 */
function getTaskType(list) {
  const task1Keywords = ["每日视频福利", "阅点", "连续观看", "日常福利"];
  const task2Keywords = ["限时彩蛋", "惊喜", "额外奖励", "彩蛋任务"];
  
  const firstItem = list[0] || {};
  const title = (firstItem.title || firstItem.taskName || firstItem.desc || "").toLowerCase();
  
  if (task1Keywords.some(k => title.includes(k.toLowerCase()))) return "task1";
  if (task2Keywords.some(k => title.includes(k.toLowerCase()))) return "task2";
  return "unknown";
}

/**
 * 适配列表长度（复制/截取原始数据）
 * @param {Array} list 原始列表
 * @param {number} target 目标长度
 * @returns {Array} 适配后列表
 */
function adaptListLength(list, target) {
  if (list.length >= target) return list.slice(0, target);
  
  const adaptedList = [...list];
  while (adaptedList.length < target) {
    // 随机复制原始项并修改唯一标识
    const randomItem = JSON.parse(JSON.stringify(list[Math.floor(Math.random() * list.length)]));
    randomItem.id = generateRandomStr(16);
    randomItem.advertId = generateRandomStr(24);
    randomItem.createTime = Date.now() - Math.floor(Math.random() * 3600000); // 随机创建时间
    adaptedList.push(randomItem);
  }
  return adaptedList;
}

/**
 * 生成默认广告列表（兜底用）
 * @returns {object} 默认响应数据
 */
function getDefaultList() {
  return {
    Result: 0,
    Message: "success",
    Data: {
      list: Array.from({ length: 3 }, (_, i) => ({
        id: generateRandomStr(16),
        advertId: generateRandomStr(24),
        title: i === 0 ? "默认福利广告" : `福利广告${i + 1}`,
        taskName: "福利任务",
        awardNum: 1,
        awardType: 1,
        watchTime: 15, // 广告时长（秒）
        status: 1, // 可观看状态
        createTime: Date.now() - Math.floor(Math.random() * 7200000),
        expireTime: Date.now() + 86400000 // 24小时后过期
      })),
      requestId: generateRandomStr(32),
      timestamp: Date.now(),
      sign: generateRandomStr(24)
    }
  };
}

/**
 * 发送响应数据
 * @param {object} data 响应数据
 */
function sendResponse(data) {
  $.done({
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache",
      "Server": "qidian-ad-list-server"
    },
    body: JSON.stringify(data)
  });
}

/**
 * 生成随机字符串（防风控）
 * @param {number} length 长度
 * @returns {string} 随机字符串
 */
function generateRandomStr(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// 精简环境类（仅保留必需功能）
function Env(name) {
  return new (class {
    constructor(name) {
      this.name = name;
      this.logs = [];
      this.log(`📌${name} - 开始处理响应`);
    }
    // 环境判断
    isSurge() { return typeof $environment?.["surge-version"] !== "undefined"; }
    isQuanX() { return typeof $task !== "undefined"; }
    isLoon() { return typeof $loon !== "undefined"; }
    isShadowrocket() { return typeof $rocket !== "undefined"; }
    isStash() { return typeof $environment?.["stash-version"] !== "undefined"; }
    // 数据存储（仅读取主脚本配置）
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
