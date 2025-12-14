/* 
🥳脚本功能: 起点读书 广告列表接口适配（配合主脚本使用）
🔗关联脚本: qidian.js（主脚本）、qd.js（广告完成接口）
⏰使用场景: 福利中心-每日视频福利/限时彩蛋 广告列表加载回调
[rewrite local]
https\:\/\/h5\.if\.qidian\.com\/argus\/api\/v1\/video\/adv\/mainPage url script-response-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qd2.js
[MITM]
hostname = h5.if.qidian.com
*/
const $ = new Env("起点读书-广告列表接口");

// 配置读取（复用主脚本BoxJs配置，无需额外设置）
$.task1Count = $.getdata("qd_task1_count") ? Math.max(Number($.getdata("qd_task1_count")), 1) : 8;
$.task2Count = $.getdata("qd_task2_count") ? Math.max(Number($.getdata("qd_task2_count")), 1) : 3;

// 核心接口处理（优化数据适配、防风控篡改）
(async () => {
  try {
    // 获取原始响应体
    const rawBody = $response.body || "{}";
    const originData = JSON.parse(rawBody);
    $.log(`📥收到原始响应 - 接口状态: ${originData.Result === 0 ? "正常" : "异常"}`);

    // 校验原始响应合法性
    if (originData.Result !== 0 || !originData.Data || !originData.Data.list) {
      $.log("⚠️原始响应无效，返回默认数据");
      $.done({ body: JSON.stringify(getDefaultData()) });
      return;
    }

    // 适配广告列表数据（按自定义次数调整，与主脚本任务数同步）
    const adaptedData = JSON.parse(JSON.stringify(originData));
    const taskType = judgeTaskType(adaptedData.Data.list);

    if (taskType === "task1") {
      // 每日视频福利：调整列表长度为自定义次数
      adaptedData.Data.list = adaptTaskList(adaptedData.Data.list, $.task1Count);
      $.log(`🎯适配任务1 - 广告列表长度: ${$.task1Count}`);
    } else if (taskType === "task2") {
      // 限时彩蛋：调整列表长度为自定义次数
      adaptedData.Data.list = adaptTaskList(adaptedData.Data.list, $.task2Count);
      $.log(`🎯适配任务2 - 广告列表长度: ${$.task2Count}`);
    }

    // 增加防风控标识（模拟真实用户数据）
    adaptedData.Data.requestId = generateRandomStr(32); // 随机请求ID
    adaptedData.Data.timestamp = new Date().getTime();
    adaptedData.Message = "success";
    adaptedData.Result = 0;

    $.log(`🎉适配完成 - 返回处理后数据`);
    $.done({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(adaptedData)
    });
  } catch (e) {
    $.logErr("❌接口处理异常", e);
    // 异常兜底：返回默认广告列表数据，避免App空白
    $.done({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(getDefaultData())
    });
  }
})();

/**
 * 判定任务类型（任务1=每日视频福利，任务2=限时彩蛋）
 * @param {Array} list - 原始广告列表
 * @returns {string} task1/task2/unknown
 */
function judgeTaskType(list) {
  if (!list.length) return "unknown";
  // 按广告标题/标识区分任务类型（适配起点读书默认规则）
  const task1Keywords = ["每日视频福利", "阅点", "连续观看"];
  const task2Keywords = ["限时彩蛋", "惊喜", "额外奖励"];
  
  const firstItemTitle = (list[0].title || list[0].taskName || "").toLowerCase();
  if (task1Keywords.some(k => firstItemTitle.includes(k.toLowerCase()))) {
    return "task1";
  } else if (task2Keywords.some(k => firstItemTitle.includes(k.toLowerCase()))) {
    return "task2";
  }
  return "unknown";
}

/**
 * 适配广告列表长度（复制原始数据填充，保持格式一致）
 * @param {Array} originList - 原始列表
 * @param {number} targetLength - 目标长度
 * @returns {Array} 适配后列表
 */
function adaptTaskList(originList, targetLength) {
  if (originList.length >= targetLength) {
    return originList.slice(0, targetLength); // 超过目标长度则截取
  }
  // 不足则复制原始数据填充（避免格式异常）
  const adaptedList = [...originList];
  while (adaptedList.length < targetLength) {
    const randomItem = originList[Math.floor(Math.random() * originList.length)];
    // 修改唯一标识，避免App识别重复
    const newItem = JSON.parse(JSON.stringify(randomItem));
    newItem.id = generateRandomStr(16);
    newItem.advertId = generateRandomStr(24);
    adaptedList.push(newItem);
  }
  return adaptedList;
}

/**
 * 生成默认兜底数据（避免App空白）
 * @returns {Object} 默认响应数据
 */
function getDefaultData() {
  return {
    Result: 0,
    Message: "success",
    Data: {
      list: [
        {
          id: generateRandomStr(16),
          advertId: generateRandomStr(24),
          title: "默认广告",
          taskName: "福利任务",
          awardNum: 1,
          awardType: 1,
          watchTime: 15, // 广告时长（秒）
          status: 1 // 可观看状态
        }
      ],
      requestId: generateRandomStr(32),
      timestamp: new Date().getTime()
    }
  };
}

/**
 * 生成随机字符串（防重复、防风控）
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomStr(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

// 精简环境类（仅保留接口脚本必需功能）
function Env(t) {
  return new (class {
    constructor(t) {
      (this.name = t),
        (this.logs = []),
        (this.startTime = new Date().getTime()),
        this.log("", `📌${this.name} - 开始处理`);
    }
    // 环境适配（覆盖主流代理工具）
    isSurge() { return "undefined" != typeof $environment && $environment["surge-version"]; }
    isQuanX() { return "undefined" != typeof $task; }
    isLoon() { return "undefined" != typeof $loon; }
    isShadowrocket() { return "undefined" != typeof $rocket; }
    isStash() { return "undefined" != typeof $environment && $environment["stash-version"]; }

    // 数据存储（复用主脚本BoxJs配置）
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
