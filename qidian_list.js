/* 
📌脚本功能: 获取起点读书任务ID
触发方式: 我 → 福利中心（进入页面即可触发）
重写配置:
[rewrite local]
https://h5.if.qidian.com/argus/api/v1/video/adv/mainPage url script-response-body https://raw.githubusercontent.com/github6662/k/refs/heads/main/qidian_list.js
[MITM]
hostname = h5.if.qidian.com
*/
const $ = new Env("起点读书-任务信息获取");

try {
  // 解析接口响应
  const resp = JSON.parse($response.body);
  if (!resp.Data?.VideoBenefitModule?.TaskList) {
    throw new Error("接口响应格式错误");
  }

  // 获取基础任务ID（前两个Task）
  const taskList = resp.Data.VideoBenefitModule.TaskList;
  const taskId1 = taskList[0]?.TaskId;
  const taskId2 = taskList[1]?.TaskId;
  
  // 获取额外任务ID（精准匹配标题）
  const extraTaskList = resp.Data.CountdownBenefitModule?.TaskList || [];
  const extraTask = extraTaskList.find(
    task => task.Title === "额外看3次小视频得奖励"
  );
  const taskIdExtra = extraTask?.TaskId;

  // 验证并保存
  if (taskId1 && taskId2 && taskIdExtra) {
    $.setdata(taskId1, "qd_taskId");
    $.setdata(taskIdExtra, "qd_taskId_2");
    $.log(`🎉任务信息获取成功`);
    $.log(`任务1ID: ${taskId1}`);
    $.log(`额外任务ID: ${taskIdExtra}`);
    $.msg($.name, "获取成功", `任务1ID: ${taskId1}\n额外任务ID: ${taskIdExtra}`);
  } else {
    throw new Error(`缺少任务ID\n基础任务1: ${taskId1 ? "存在" : "缺失"}\n基础任务2: ${taskId2 ? "存在" : "缺失"}\n额外任务: ${taskIdExtra ? "存在" : "缺失"}`);
  }
} catch (err) {
  $.logErr(`🔴获取失败: ${err.message}`);
  $.msg($.name, "获取失败", err.message);
} finally {
  $.done();
}

// 同主脚本的简化版Env类（直接复制）
function Env(name) { /* 与qidian.js一致，此处省略重复代码 */ }
