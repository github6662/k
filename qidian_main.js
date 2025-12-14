/* 
🥳脚本功能: 自动观看起点读书广告
支持工具: QuantumultX/Surge/Loon/Shadowrocket/Stash
可配置参数（BoxJs）:
  - qd_task1_count: 任务1执行次数（默认8）
  - qd_task2_count: 任务2执行次数（默认3）
  - qd_timeout: 间隔时间(秒，默认20，0=无间隔)
  - qd_debug: 是否开启调试（true/false，默认false）
重写配置:
[rewrite local]
https://h5.if.qidian.com/argus/api/v1/video/adv/finishWatch url script-request-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qidian_finish.js
https://h5.if.qidian.com/argus/api/v1/video/adv/mainPage url script-response-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qd2.js
[MITM]
hostname = h5.if.qidian.com
定时任务:
[task local]
30 10 * * * https://raw.githubusercontent.com/github6662/k/refs/heads/main/qidian.js, img-url=https://raw.githubusercontent.com/chxm1023/Script_X/main/icon/qidian.png, tag=起点读书, enabled=true
BoxJs地址:
https://raw.githubusercontent.com/MCdasheng/QuantumultX/main/mcdasheng.boxjs.json
⚠️注意: 无间隔请求可能导致账号风险，谨慎设置qd_timeout=0
*/
const $ = new Env("起点读书-自动看广告");

// 配置参数（优先读取BoxJs，无则用默认）
const config = {
  task1Count: $.getdata("qd_task1_count") || 8,
  task2Count: $.getdata("qd_task2_count") || 3,
  timeout: $.getdata("qd_timeout") ? Number($.getdata("qd_timeout")) : 20,
  debug: $.getdata("qd_debug") === "true",
};

// 必要参数校验
const requiredData = [
  { key: "qd_taskId", name: "任务1ID" },
  { key: "qd_taskId_2", name: "任务2ID" },
  { key: "qd_session", name: "广告1会话" },
  { key: "qd_session_2", name: "广告2会话" },
];
const missing = requiredData.filter(item => !$.getdata(item.key));
if (missing.length > 0) {
  const msg = `缺少必要信息: ${missing.map(item => item.name).join("、")}\n请先执行任务信息和广告信息获取脚本`;
  $.log(`⚠️${msg}`);
  $.msg($.name, "执行失败", msg);
  $.done();
}

// 主逻辑
(async () => {
  $.log(`🟡开始执行，任务1: ${config.task1Count}次，任务2: ${config.task2Count}次，间隔: ${config.timeout}秒`);
  // 执行任务1
  for (let i = 0; i < config.task1Count; i++) {
    $.log(`\n🟡任务1第${i+1}/${config.task1Count}次`);
    await executeTask($.getdata("qd_session"));
    if (i < config.task1Count - 1) await $.wait(config.timeout * 1000);
  }
  // 执行任务2
  for (let j = 0; j < config.task2Count; j++) {
    $.log(`\n🟡任务2第${j+1}/${config.task2Count}次`);
    await executeTask($.getdata("qd_session_2"));
    if (j < config.task2Count - 1) await $.wait(config.timeout * 1000);
  }
  $.msg($.name, "执行完成", `任务1: ${config.task1Count}次\n任务2: ${config.task2Count}次`);
})()
.catch(err => {
  $.logErr(`🔴执行异常: ${err.message}`);
  $.msg($.name, "执行异常", err.message);
})
.finally(() => $.done());

// 执行单个广告任务
async function executeTask(sessionStr) {
  try {
    const session = JSON.parse(sessionStr);
    // 验证会话有效性
    if (!session.url || !session.headers) throw new Error("会话信息无效");
    
    const resp = await $.http.post(session);
    const result = JSON.parse(resp.body);
    
    if (config.debug) $.log(`📝响应: ${resp.body}`);
    if (result.Result === 0) {
      $.log("🎉观看成功");
    } else {
      $.log(`🔴观看失败: ${result.Message || "未知错误"}`);
      $.msg($.name, "观看失败", result.Message || "未知错误");
    }
  } catch (err) {
    $.log(`🔴任务执行失败: ${err.message}`);
    throw err; // 抛出错误终止后续执行
  }
}

// 简化版Env类（仅保留必要功能）
function Env(name) {
  return {
    name,
    getdata(key) {
      return $persistentStore?.read(key) || $prefs?.valueForKey(key) || null;
    },
    setdata(value, key) {
      return $persistentStore?.write(value, key) || $prefs?.setValueForKey(value, key) || false;
    },
    msg(title, subtitle, content, url) {
      const options = url ? (
        $notify ? { "open-url": url } : { url }
      ) : {};
      $notification?.post(title, subtitle, content, options) || $notify?.(title, subtitle, content, options);
    },
    log(...args) {
      console.log(`[${this.name}]`, ...args);
    },
    logErr(...args) {
      console.error(`[${this.name}错误]`, ...args);
    },
    wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    done(data = {}) {
      $done?.(data);
    },
    http: {
      post(options) {
        return new Promise((resolve, reject) => {
          const callback = (err, resp, body) => {
            if (err) return reject(err);
            resolve({ ...resp, body });
          };
          if ($httpClient) $httpClient.post(options, callback);
          else if ($task) $task.fetch(options).then(resolve).catch(reject);
          else reject(new Error("不支持的工具"));
        });
      }
    }
  };
}
