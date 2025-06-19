#!/usr/bin/env python3
"""
MCP Debug Client

A development tool for testing and debugging the Common Rules MCP server.
This client provides an interactive interface to:
- Connect to the local MCP server
- List available tools and resources
- Execute tool calls with custom arguments
- Debug server responses

Usage:
    python tools/debug_client.py

The client will automatically find and use the correct Python environment
and server module from the project structure.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the src directory to Python path for proper module imports
project_root = Path(__file__).parent.parent.absolute()
src_dir = str(project_root / "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from mcp import ClientSession, StdioServerParameters, types
from mcp.client.stdio import stdio_client


async def display_tools(session: ClientSession):
    """Display available tools with human-readable names"""
    tools_response = await session.list_tools()
    print("\nAvailable Tools:")
    print("---------------")
    for tool in tools_response.tools:
        print(f"\nTool: {tool.name}")
        if tool.description:
            print(f"Description: {tool.description}")
        print(f"Schema: {tool.inputSchema}")


async def display_resources(session: ClientSession):
    """Display available resources with human-readable names"""
    resources_response = await session.list_resources()
    print("\nAvailable Resources:")
    print("-------------------")
    for resource in resources_response.resources:
        print(f"\nResource: {resource.name}")
        print(f"URI: {resource.uri}")


async def debug_session():
    """Main debug session"""
    # Get the absolute path to the server module
    server_script = os.path.join(src_dir, "common_rules_server", "mcp_server.py")
    
    # Ensure the server script exists
    if not os.path.exists(server_script):
        print(f"Error: Server script not found at {server_script}")
        return

    # Create server parameters for local connection
    server_params = StdioServerParameters(
        command=sys.executable,  # Use the current Python interpreter
        args=[server_script],  # Use direct script path instead of -m
        env={
            "PYTHONPATH": src_dir,  # Ensure Python can find our modules
            "PYTHONUNBUFFERED": "1"  # Disable output buffering
        },
        cwd=os.path.dirname(server_script)  # Set working directory to server location
    )

    print(f"Debug Information:")
    print(f"Project root: {project_root}")
    print(f"Python interpreter: {sys.executable}")
    print(f"Python path: {src_dir}")
    print(f"Server script: {server_script}")
    print(f"Working directory: {os.path.dirname(server_script)}")
    print("\nConnecting to MCP server...")

    try:
        async with stdio_client(server_params) as (read, write):
            try:
                async with ClientSession(read, write) as session:
                    # Initialize the connection
                    await session.initialize()
                    print("Connected successfully!")

                    # Display available tools and resources
                    await display_tools(session)
                    await display_resources(session)

                    print("\nEntering interactive mode...")
                    print("Commands:")
                    print("- list_tools: Display available tools")
                    print("- list_resources: Display available resources")
                    print("- call <tool_name> <args_json>: Call a tool")
                    print("- quit: Exit the client")

                    while True:
                        try:
                            command = input("\nEnter command: ").strip()
                            
                            if command == "quit":
                                break
                            elif command == "list_tools":
                                await display_tools(session)
                            elif command == "list_resources":
                                await display_resources(session)
                            elif command.startswith("call "):
                                import json
                                parts = command.split(" ", 2)
                                if len(parts) < 3:
                                    print("Usage: call <tool_name> <args_json>")
                                    continue
                                
                                tool_name = parts[1]
                                try:
                                    args = json.loads(parts[2])
                                    result = await session.call_tool(tool_name, args)
                                    print("\nTool Result:")
                                    print(json.dumps(result.dict(), indent=2))
                                except json.JSONDecodeError:
                                    print("Error: Arguments must be valid JSON")
                                except Exception as e:
                                    print(f"Error calling tool: {str(e)}")
                            else:
                                print("Unknown command")
                        
                        except Exception as e:
                            print(f"Error: {str(e)}")
            except Exception as e:
                print(f"Session error: {str(e)}")
    except Exception as e:
        print(f"Connection error: {str(e)}")


def main():
    """Entry point with proper signal handling"""
    try:
        asyncio.run(debug_session())
    except KeyboardInterrupt:
        print("\nClient terminated by user")
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main() 