<!-- specsfy:framework:start -->
@.specsfy/Spec.md
<!-- specsfy:framework:end -->
<!-- common-rules:extension:router:start -->
## common-rules

Para criar, ajustar ou reparar uma extensão local (hook, regra ou este
próprio roteador), acione a skill `common-rules-extension-creator` em vez
de ler `.common-rules/extensions/` diretamente.
<!-- common-rules:extension:router:end -->
<!-- common-rules:extension:config-language-rule:start -->
## common-rules: language

Read `.common-rules/config.yaml` before generating a document or deciding
what language to answer in. Reply in the conversation's language. Write a
generated document in `language.default`, unless its path matches one of
`language.exceptions`. Notice when the conversation reveals a value that
`config.yaml` is missing or has out of date, and offer to update it.
<!-- common-rules:extension:config-language-rule:end -->
