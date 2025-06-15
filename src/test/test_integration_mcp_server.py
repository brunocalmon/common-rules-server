import pytest
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import asyncio

@pytest.mark.integration
@pytest.mark.timeout(60)
def test_mcp_server_get_system_and_user_rules():
    server_params = StdioServerParameters(
        command="common-rules",
        args=[],
    )
    async def run():
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                sys_rules = await session.call_tool("get_system_rules", {})
                user_rules = await session.call_tool("get_user_rules", {})
                assert sys_rules.content
                assert user_rules.content
                assert any("General System Rule" in r.text for r in sys_rules.content)
    asyncio.run(run()) 