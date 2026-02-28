# 项目信息卡 / Project Info Card

---

## 中文版

**项目名称**: Census Dashboard

**一句话描述**: 一个可视化美国人口普查数据的交互式仪表盘

**解决的问题**: 美国人口普查局的数据虽然公开免费，但原始API返回的数据格式很难看懂。这个项目把枯燥的数字变成好看的图表，还加了中英双语支持，方便不同语言背景的人探索美国人口、经济、种族分布等数据。

**类型**: 个人项目 / 学习实验

**技术栈**: React + Recharts + Vite + Census Bureau API

**开发时间**: 断断续续几天

**完成度**: 基本完成（能用，还在迭代）

**最得意的地方**:
- 中英双语切换丝滑，语言偏好还能记住
- 图表动画效果不错，数据加载时有loading状态
- 直接调用官方API拿实时数据，不是写死的假数据

**踩过的坑**:
- Census API 的数据格式很奇葩，返回的是 `[[headers], [row1], [row2]...]` 这种数组套数组，得写转换逻辑
- 有些数据在 ACS 1-year estimates 里没有（比如失业率细分），只能用 fallback 值
- 不带 API key 每天只能请求 500 次，调试的时候差点用完

---

## English Version

**Project Name**: Census Dashboard

**One-liner**: An interactive dashboard visualizing U.S. Census data

**Problem Solved**: The U.S. Census Bureau has tons of free public data, but the raw API responses are painful to read. This project turns boring numbers into pretty charts, with bilingual support (English/Chinese) so people from different backgrounds can explore population, economic, and demographic data easily.

**Type**: Personal Project / Learning Experiment

**Tech Stack**: React + Recharts + Vite + Census Bureau API

**Dev Time**: A few days on and off

**Status**: Mostly done (usable, still iterating)

**Proudest Parts**:
- Smooth bilingual toggle that remembers your preference
- Nice chart animations with proper loading states
- Real-time data from official API, not hardcoded fake data

**Lessons Learned**:
- Census API data format is weird — returns `[[headers], [row1], [row2]...]` nested arrays, had to write transformation logic
- Some data isn't available in ACS 1-year estimates (like detailed unemployment), had to use fallback values
- Without an API key you only get 500 requests/day — almost ran out while debugging

---

**GitHub**: [your-repo-link]

**Live Demo**: `npm run dev` → http://localhost:5173/
