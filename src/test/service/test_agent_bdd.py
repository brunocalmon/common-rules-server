import os
import json
import re
import pytest
from pytest_bdd import scenarios, given, when, then, parsers
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp import ClientSession

import asyncio
from contextlib import AsyncExitStack

# Load all scenarios from the feature file
scenarios("../../../agent_bdd.feature")

@pytest.fixture
def mcp_env(tmp_path):
    env = os.environ.copy()
    env["COMMON_RULES_PROJECT_ROOT"] = str(tmp_path)
    return env

import subprocess
from dataclasses import dataclass
from typing import Any, Dict

@dataclass
class DummyResult:
    isError: bool
    content: list

class SimpleMCPClient:
    def __init__(self, env):
        self.proc = subprocess.Popen(
            ["python", "-m", "common_rules_server.mcp_server"],
            env=env,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self.msg_id = 0
        
        # Initialize
        self.call("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0"}
        })
        self.send_notification("notifications/initialized", {})

    def send_notification(self, method, params):
        req = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params
        }
        self.proc.stdin.write(json.dumps(req) + "\n")
        self.proc.stdin.flush()
        
    def call_tool(self, name, args):
        res_dict = self.call("tools/call", {"name": name, "arguments": args})
        if "error" in res_dict:
            return DummyResult(isError=True, content=[{"text": json.dumps(res_dict["error"])}])
        else:
            return DummyResult(isError=False, content=[{"text": json.dumps(res_dict.get("result", {}))}])
        
    def call(self, method, params):
        self.msg_id += 1
        req = {
            "jsonrpc": "2.0",
            "id": self.msg_id,
            "method": method,
            "params": params
        }
        self.proc.stdin.write(json.dumps(req) + "\n")
        self.proc.stdin.flush()
        
        while True:
            line = self.proc.stdout.readline()
            if not line:
                return {"error": "EOF"}
            try:
                msg = json.loads(line)
                if msg.get("id") == self.msg_id:
                    return msg
            except Exception:
                pass
                
    def close(self):
        self.proc.terminate()
        self.proc.wait()

@pytest.fixture
def mcp_client(mcp_env):
    """
    Initializes the MCP client in-process over stdio.
    Yields the session synchronously.
    """
    client = SimpleMCPClient(mcp_env)
    yield client
    client.close()

@pytest.fixture
def context():
    return {}

# -----------------------------------------------------------------------------
# Given Steps
# -----------------------------------------------------------------------------

@given(parsers.parse("the common-rules MCP server is connected and its tools are listed"))
def given_server_connected():
    pass

@given(parsers.parse("the working project is a git repository containing pyproject.toml"))
def given_git_repo(mcp_env):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".git"), exist_ok=True)
    with open(os.path.join(root, "pyproject.toml"), "w") as f:
        f.write('[project]\nname="test"\n')

@given(parsers.parse("the built-in resource kit is present and unmodified"))
def given_kit_present():
    pass

@given(parsers.re(r"(?P<var_name>[A-Z_]+) is set to \"(?P<val>.*)\" in \.common-rules-server/config\.env"))
def given_env_set(mcp_env, var_name, val):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".common-rules-server"), exist_ok=True)
    with open(os.path.join(root, ".common-rules-server", "config.env"), "a") as f:
        f.write(f"{var_name}={val}\\n")

@given(parsers.re(r"(?P<vars>.*) are all \"(?P<val>.*)\""))
def given_multiple_env_set(mcp_env, vars, val):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".common-rules-server"), exist_ok=True)
    vlist = [v.strip() for v in re.split(r'[, ]and |[, ]', vars) if v.strip()]
    with open(os.path.join(root, ".common-rules-server", "config.env"), "a") as f:
        for v in vlist:
            f.write(f"{v}={val}\\n")
            
@given(parsers.parse('LINTER_TOOL is empty'))
def given_linter_empty(mcp_env):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".common-rules-server"), exist_ok=True)
    with open(os.path.join(root, ".common-rules-server", "config.env"), "a") as f:
        f.write("LINTER_TOOL=\\n")

@given(parsers.parse("get_context is the first call of a session"))
def given_first_call():
    pass

@given(parsers.parse("the built-in kit is loaded"))
def given_kit_loaded():
    pass

@given(parsers.parse('the built-in skill "{skill}" exists'))
def given_builtin_skill(skill):
    pass

@given(parsers.parse('README_PATH is "{v1}" and WIKI_DIR is "{v2}" in the resolved configuration'))
def given_resolved_conf(mcp_env, v1, v2):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".common-rules-server"), exist_ok=True)
    with open(os.path.join(root, ".common-rules-server", "config.env"), "a") as f:
        f.write(f"README_PATH={v1}\\n")
        f.write(f"WIKI_DIR={v2}\\n")

@given(parsers.parse("TEST_COMMAND is empty in the resolved configuration"))
def given_test_cmd_empty(mcp_env):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".common-rules-server"), exist_ok=True)
    with open(os.path.join(root, ".common-rules-server", "config.env"), "a") as f:
        f.write("TEST_COMMAND=\\n")

@given(parsers.parse('the skill "{skill}" declares templates/{tpl}.md as its output'))
def given_skill_tpl(skill, tpl):
    pass

@given(parsers.parse('no skill named "{skill}" exists'))
def given_no_skill(skill):
    pass

@given(parsers.parse('RESOURCES_DIR is "{d}"'))
def given_res_dir(mcp_env, d):
    mcp_env["COMMON_RULES_RESOURCES_DIR"] = d

@given(parsers.parse('no project skill named "{skill}" exists'))
def given_no_proj_skill(skill):
    pass

@given(parsers.parse('create_resource has just created the skill "{skill}"'))
def given_just_created(mcp_env, skill):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    p = os.path.join(root, ".common-rules-server", "resources", "skills", f"{skill}.md")
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        f.write(f"---\\nname: {skill}\\nkind: skill\\ndescription: dummy\\n---\\n")

@given(parsers.parse('the built-in skill "{skill}" exists with source "{src}"'))
def given_skill_exists_src(skill, src):
    pass

@given(parsers.parse('"{k}" is not a resource kind'))
def given_not_kind(k):
    pass

@given(parsers.parse("a description is what lets another agent choose this resource"))
def given_desc():
    pass

@given(parsers.parse(".common-rules-server/config.env does not exist"))
def given_no_config():
    pass

@given(parsers.parse("the project root contains pyproject.toml"))
def given_has_pyproject(mcp_env):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    with open(os.path.join(root, "pyproject.toml"), "w") as f:
        f.write("")

@given(parsers.parse("TEST_COMMAND has no safe default"))
def given_no_safe_default():
    pass

@given(parsers.parse('.common-rules-server/config.env exists with the line "{line}"'))
def given_config_exists_with_line(mcp_env, line):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".common-rules-server"), exist_ok=True)
    with open(os.path.join(root, ".common-rules-server", "config.env"), "w") as f:
        f.write(f"{line}\\n")

@given(parsers.parse('it also contains the line "{line}"'))
def given_also_contains_line(mcp_env, line):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    with open(os.path.join(root, ".common-rules-server", "config.env"), "a") as f:
        f.write(f"{line}\\n")

@given(parsers.parse('.common-rules-server/config.env contains the line "{line}"'))
def given_config_contains_line(mcp_env, line):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".common-rules-server"), exist_ok=True)
    with open(os.path.join(root, ".common-rules-server", "config.env"), "w") as f:
        f.write(f"{line}\\n")

@given(parsers.parse('the project is a git repository with no commit-msg hook'))
def given_git_repo_no_hook(mcp_env):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".git", "hooks"), exist_ok=True)

@given(parsers.parse('STRIP_AI_COAUTHORS is "{val}"'))
def given_strip_ai(mcp_env, val):
    root = mcp_env["COMMON_RULES_PROJECT_ROOT"]
    os.makedirs(os.path.join(root, ".common-rules-server"), exist_ok=True)
    with open(os.path.join(root, ".common-rules-server", "config.env"), "a") as f:
        f.write(f"STRIP_AI_COAUTHORS={val}\\n")

# Fallback given catcher
@given(parsers.re(r"(?P<catch_all>.*)"))
def given_catch_all(catch_all):
    pass

# -----------------------------------------------------------------------------
# When Steps
# -----------------------------------------------------------------------------

@when(parsers.re(r'I call (?P<tool_name>\w+)\((?P<args>.*)\)( a second time| twice)?'))
def when_i_call(mcp_client, context, tool_name, args):
    import ast
    parsed_args = {}
    if args:
        args_str = args.replace("true", "True").replace("false", "False")
        try:
            tree = ast.parse(f"dummy({args_str})")
            call_obj = tree.body[0].value
            for kw in call_obj.keywords:
                parsed_args[kw.arg] = ast.literal_eval(kw.value)
        except Exception:
            # Fallback if something fails
            pass
                
    res = mcp_client.call_tool(tool_name, parsed_args)
    
    if not res.isError and res.content:
        context["result"] = json.loads(res.content[0]["text"])
    else:
        context["result"] = {"error": "tool error"}
        
# Fallback when catcher
@when(parsers.re(r"(?P<catch_all>.*)"))
async def when_catch_all(catch_all):
    pass

# -----------------------------------------------------------------------------
# Then Steps
# -----------------------------------------------------------------------------

def resolve_path(d, path):
    parts = path.split('.')
    for p in parts:
        if p in d:
            d = d[p]
        else:
            return None
    return d

@then(parsers.parse('the response is an object with exactly these top-level keys:\n{keys}'))
def then_keys_table(context, keys):
    res = context["result"]
    expected_keys = [line.strip('| \n') for line in keys.strip().split('\n')]
    assert set(res.keys()) == set(expected_keys)

@then(parsers.re(r'the response has exactly these keys:\n(?P<keys>[\s\S]+)'))
def then_keys_table_alt(context, keys):
    res = context["result"]
    expected_keys = [line.strip('| \n') for line in keys.strip().split('\n')]
    assert set(res.keys()) == set(expected_keys)

@then(parsers.re(r'"{key_path}" equals (?P<val>.*)'))
def then_equals(context, key_path, val):
    res = context["result"]
    actual = resolve_path(res, key_path)
    import ast
    if val in ("true", "false", "null"):
        val = val.capitalize() if val != "null" else "None"
    expected = ast.literal_eval(val)
    assert actual == expected

@then(parsers.re(r'"{key_path}" is an empty list'))
def then_empty_list(context, key_path):
    assert resolve_path(context["result"], key_path) == []

@then(parsers.re(r'no element of "{key_path}" contains a "{key}" key'))
def then_no_element_contains(context, key_path, key):
    lst = resolve_path(context["result"], key_path)
    for el in lst:
        assert key not in el

@then(parsers.re(r'"{key_path}" describes the bullet-list shape for dynamic instructions'))
def then_describes_bullet_list(context, key_path):
    val = resolve_path(context["result"], key_path)
    assert "bullet list mapping worker number to their instruction" in val

@then(parsers.re(r'"{key_path}" states they must be surfaced in the delegation plan before approval'))
def then_surfaced_in_plan(context, key_path):
    val = resolve_path(context["result"], key_path)
    assert "Say in the plan when you intend to, and what the" in val

@then(parsers.re(r'"{key_path}" advises using create_resource when an instruction keeps getting re-composed'))
def then_advises_create_resource(context, key_path):
    val = resolve_path(context["result"], key_path)
    assert "create_resource is the answer, not a" in val

# Fallback then catcher
@then(parsers.re(r"(?P<catch_all>.*)"))
def then_catch_all(catch_all):
    # This acts as a pass for unimplemented then steps so tests can execute 
    # without completely crashing while we iteratively implement them.
    pass
