const BASE_URL = 'http://localhost:19880/api/v1/mcp';

/**
 * 获取所有已启动服务器的工具列表
 */
export async function listMcpTools() {
    try {
        const response = await fetch(`${BASE_URL}/tools`);
        if (!response.ok) throw new Error('Failed to fetch MCP tools');
        return await response.json();
    } catch (error) {
        console.error('Error listing MCP tools:', error);
        return { tools: [] };
    }
}

/**
 * 调用指定的 MCP 工具
 * @param {string} serverName 服务器名称
 * @param {string} toolName 工具名称
 * @param {object} arguments 工具参数
 */
export async function callMcpTool(serverName, toolName, args = {}) {
    try {
        const response = await fetch(`${BASE_URL}/tools/${toolName}/call`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                server_name: serverName,
                arguments: args
            }),
        });
        if (!response.ok) throw new Error('Failed to call MCP tool');
        return await response.json();
    } catch (error) {
        console.error('Error calling MCP tool:', error);
        throw error;
    }
}

/**
 * 获取 MCP 服务器状态列表
 */
export async function getMcpServers() {
    const { tools } = await listMcpTools();
    const servers = {};
    tools.forEach(tool => {
        const name = tool._server_name;
        if (!servers[name]) {
            servers[name] = { name, status: 'running', tools: [] };
        }
        servers[name].tools.push(tool);
    });
    return Object.values(servers);
}

/**
 * 获取所有配置中的服务器列表
 */
export async function getAllServers() {
    try {
        const response = await fetch(`${BASE_URL}/servers`);
        if (!response.ok) throw new Error('Failed to fetch servers');
        return await response.json();
    } catch (error) {
        console.error('Error getting all servers:', error);
        return { servers: [] };
    }
}

/**
 * 获取上次活跃的服务器列表
 */
export async function getLastActiveServers() {
    try {
        const response = await fetch(`${BASE_URL}/server/state`);
        if (!response.ok) throw new Error('Failed to fetch server state');
        return await response.json();
    } catch (error) {
        console.error('Error fetching last active servers:', error);
        return { last_active_servers: [] };
    }
}

/**
 * 启动指定服务器
 */
export async function startMcpServer(name) {
    await fetch(`${BASE_URL}/server/${name}/start`, { method: 'POST' });
}

/**
 * 停止指定服务器
 */
export async function stopMcpServer(name) {
    await fetch(`${BASE_URL}/server/${name}/stop`, { method: 'POST' });
}