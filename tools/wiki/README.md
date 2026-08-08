# Wiki generators

The wiki under `.docs/` is generated. Navigation — breadcrumbs, previous/next
links — is derived from a single ordered page list rather than written by hand,
which is what makes broken links impossible rather than merely fixed.

| Script | Builds |
|---|---|
| `build_template.py` | `.docs/template` — the reusable structure, for any project |
| `build_project_wiki.py` | `.docs/claude` — this project's wiki, tracker and findings |
| `wikigen.py` | Shared: page assembly, navigation, link checking |

```bash
uv run python tools/wiki/build_project_wiki.py
```

Both scripts report broken links and exit having verified every relative link
resolves.

## Editing

Edit the page list inside the build script, not the output. Generated files are
overwritten.

`build_project_wiki.py` preserves directories it does not generate — currently
`history/`. It once wiped the whole tree and deleted 3,541 lines of hand-written
content while reporting only that documentation had been updated, so anything
added to `.docs/claude` by hand must be listed in `PRESERVE`.
