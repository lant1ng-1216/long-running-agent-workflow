# 工作流源码基准清单

本清单说明仓库中保留的阶段门源文件基准，以及外层可移植工具的边界。`source-snapshot/` 中的文件用于保持所选源逻辑可追溯；一般使用者从外层的 CLI、配置和模板开始，不需要直接运行快照脚本。

## 工作流如何运转

项目负责人先确认目标、范围、阶段顺序、验收条件和安全边界。编码 Agent 每次完成一个阶段，逐条自查并附上证据，再运行该阶段真实检查。阶段门随后：

1. 由本地基线检查脚本结果、自查完整性、阻塞项、延后项和风险标记。
2. 在评审服务可用时，将阶段目标、验收条件、自查结论、证据摘要和变更文件列表交给 Jev，取得 `status`、`nextAction`、`riskLevel` 与置信度。
3. 只有证据完整、验收项全部通过、检查成功、评审允许低风险继续且置信度达到门槛时，才写入 `advance` 并更新本地阶段状态。

检查或具体实现问题可在既定范围内返工、复测后复审；证据不足时应补充新的证据，不得原样重提或降低门槛。评审器不可用、低置信度、风险过高或阶段存在阻塞时，阶段不会被标记为通过。只有真正涉及负责人判断、范围变化、外部授权、安全边界，或多轮返工无进展时才应交回给人。

## 基准文件清单

下表中的“来源路径”是选取这些文件时的相对路径；目标路径位于本仓库 `source-snapshot/` 下。14 个文件已逐项进行字节一致性比对。

| 来源路径 | 快照路径 | 用途 |
| --- | --- | --- |
| `AGENTS.md` | `source-snapshot/AGENTS.md` | 编码 Agent 的阶段执行、复核、返工与授权边界约定 |
| `docs/JEV_PHASE_GATE.md` | `source-snapshot/docs/JEV_PHASE_GATE.md` | 阶段门调用、验收和推进规则 |
| `docs/JEV_SHADOW_MODE.md` | `source-snapshot/docs/JEV_SHADOW_MODE.md` | 评审边界、传入证据和影子模式说明 |
| `src/jev/types.ts` | `source-snapshot/src/jev/types.ts` | 评审证据和决策数据类型 |
| `src/jev/baseline.ts` | `source-snapshot/src/jev/baseline.ts` | 本地确定性基线判断 |
| `src/jev/jev-client.ts` | `source-snapshot/src/jev/jev-client.ts` | Jev 与 AI Gateway 结构化评审调用 |
| `src/jev/shadow-gate.ts` | `source-snapshot/src/jev/shadow-gate.ts` | 评审一致性、置信度、安全条件和阶段转换决策 |
| `src/jev/state-collector.ts` | `source-snapshot/src/jev/state-collector.ts` | 读取并校验阶段证据 |
| `src/jev/phase-state.ts` | `source-snapshot/src/jev/phase-state.ts` | 保存阶段转换状态 |
| `src/jev/record.ts` | `source-snapshot/src/jev/record.ts` | 追加阶段评审记录 |
| `src/jev/report-sync.ts` | `source-snapshot/src/jev/report-sync.ts` | 将阶段门摘要同步到项目报告的原始实现 |
| `scripts/run-jev-gate.ts` | `source-snapshot/scripts/run-jev-gate.ts` | 运行允许的检查、评审证据、保存并输出决策 |
| `scripts/run-jev-shadow.ts` | `source-snapshot/scripts/run-jev-shadow.ts` | 影子模式评审执行入口 |
| `scripts/test-jev-shadow.ts` | `source-snapshot/scripts/test-jev-shadow.ts` | 基线规则和模拟评审状态转换测试 |

## 外层可移植工具做了什么

`src/`、`bin/`、`templates/` 和 `examples/` 在快照之外。它们提供项目本地配置、命令行入口、逐条 Agent 自查报告、状态/记录路径和最小示例。外层工具将项目配置中的验收证据并入评审状态，并保留 Jev 对状态、下一动作和风险三类判断各自的置信度；总体置信度仍使用三者最低值，不通过降低门槛来推进阶段。

命令行不会检查完整代码差异，也不会自行编辑或修复源码。具体修复由当前编码 Agent 根据评审结果实施；完成修复后，应更新自查证据、重跑检查，再进入同一阶段门。自动化测试通过模拟决策覆盖这些状态变化，但不是一次真实大模型端到端改码测试。

## 不包含的材料

- 产品本身的业务实现、网站、品牌资产、数据和项目开发历史。
- 真实 `.env`、API Key、钱包材料、个人信息、私有对话、原始截图和运行记录。
- 原产品仓库的 Git 历史或嵌套仓库。
- 未经负责人批准的社交媒体文案。

示例项目使用合成内容。提交任何示例时，都应确认它不包含真实产品或私有数据。

## 当前分发状态

本仓库已在 GitHub 公开，并采用 MIT 许可证。npm 公共包尚未发布；当前使用方式是克隆仓库、安装依赖并在本地构建。发布状态不改变高影响操作需要单独授权的规则。
