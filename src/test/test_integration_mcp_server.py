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
                assert any("this rule provides guidance" in r.text.lower() for r in sys_rules.content)
                assert any("this rule provides guidance" in r.text.lower() for r in user_rules.content)
    asyncio.run(run())

@pytest.mark.integration
@pytest.mark.timeout(60)
def test_mcp_server_get_system_rule():
    server_params = StdioServerParameters(
        command="common-rules",
        args=[],
    )
    async def run():
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool("get_system_rule", {"title": "01_general"})
                assert result.content
                assert any("pseudocode" in r.text.lower() for r in result.content)
    asyncio.run(run())

@pytest.mark.integration
@pytest.mark.timeout(60)
def test_mcp_server_get_user_rule():
    server_params = StdioServerParameters(
        command="common-rules",
        args=[],
    )
    async def run():
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool("get_user_rule", {"title": "notebook_management"})
                assert result.content
                assert any("notebook management rule" in r.text.lower() for r in result.content)
    asyncio.run(run())

@pytest.mark.integration
@pytest.mark.timeout(60)
def test_mcp_server_list_rule_categories():
    server_params = StdioServerParameters(
        command="common-rules",
        args=[],
    )
    async def run():
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool("list_rule_categories", {})
                assert result.content
                assert any("SYSTEM RULES" in r.text for r in result.content)
    asyncio.run(run())

@pytest.mark.integration
@pytest.mark.timeout(60)
def test_mcp_server_get_artifact():
    server_params = StdioServerParameters(
        command="common-rules",
        args=[],
    )
    async def run():
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool("get_artifact", {"key": "templates/notebook_management.md"})
                assert result.content
                assert any("Notebook Management" in r.text for r in result.content)
    asyncio.run(run()) 