<!-- specsfy:framework:start -->
@.specsfy/Spec.md
<!-- specsfy:framework:end -->
<!-- common-rules:extension:router:start -->
## common-rules

<!-- maestro:extension:router:start -->
## maestro

To create, adjust or repair a local extension (a hook, a rule, or this
router itself), trigger the `maestro-extension-creator` skill
instead of reading `.maestro/extensions/` directly.
<!-- maestro:extension:router:end -->
<!-- maestro:extension:config-language-rule:start -->
## maestro: language

Read `.maestro/config.yaml` before generating a document or deciding
what language to answer in. Reply in the conversation's language. Write a
generated document in `language.default`, unless its path matches one of
`language.exceptions`. Notice when the conversation reveals a value that
`config.yaml` is missing or has out of date, and offer to update it.
<!-- maestro:extension:config-language-rule:end -->
