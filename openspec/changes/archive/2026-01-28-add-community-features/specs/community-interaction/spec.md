# 社区互动

## ADDED Requirements

### Requirement: 互动响应
系统 SHALL 管理用户的点赞和踩。

#### Scenario: 点赞提示词
- **GIVEN** 已登录用户正在查看提示词
- **WHEN** 用户点击“点赞”
- **THEN** 点赞数增加
- **AND** 作者收到通知

### Requirement: 评论
系统 SHALL 管理用户评论。

#### Scenario: 在提示词下评论
- **GIVEN** 已登录用户
- **WHEN** 用户在提示词下发布评论
- **THEN** 评论出现在列表中
- **AND** 作者收到通知

### Requirement: 通知
系统 SHALL 管理用户提醒。

#### Scenario: 接收通知
- **GIVEN** 一个拥有已发布提示词的用户
- **WHEN** 有人点赞、评论，或者订阅的提示词有更新
- **THEN** 用户在通知中心看到新条目
- **AND** 通知按类型分类（互动、评论、更新）