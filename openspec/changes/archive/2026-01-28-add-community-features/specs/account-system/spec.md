# 账户系统

## ADDED Requirements

### Requirement: 注册
系统 SHALL 允许用户使用邮箱和密码进行注册。

#### Scenario: 用户使用新邮箱注册
- **GIVEN** 用户处于注册页面
- **WHEN** 用户输入有效的邮箱和密码
- **THEN** 创建一个新账户
- **AND** 密码以安全方式存储（哈希处理）
- **AND** 用户自动登录

#### Scenario: 用户使用已存在的邮箱注册
- **GIVEN** "test@example.com" 的账户已存在
- **WHEN** 用户尝试使用 "test@example.com" 注册
- **THEN** 系统提示“账户已存在”
- **AND** 将用户重定向到登录页面

### Requirement: 登录
系统 SHALL 允许用户进行身份验证。

#### Scenario: 用户成功登录
- **GIVEN** 已注册用户
- **WHEN** 用户输入正确的凭据
- **THEN** 用户收到身份验证令牌 (JWT)
- **AND** 启用社区功能的访问权限

#### Scenario: 未授权的访问尝试
- **GIVEN** 游客用户
- **WHEN** 用户尝试受限操作（如点赞、评论）
- **THEN** 出现登录弹窗