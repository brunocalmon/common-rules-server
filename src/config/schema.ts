export interface LanguageException {
  id: string;
  paths: string[];
  language: string;
  reason: string;
}

export interface LanguageSection {
  default: string;
  exceptions: LanguageException[];
}

export interface ProjectSection {
  prog_lang: string;
  runtime: string;
  package_manager: string;
  framework: string;
  test_framework: string;
  documentation_style: string;
}

export interface SystemSection {
  os: string;
  distro: string;
  ram_gb: number | null;
  cpu: string;
  gpu: string;
  baremetal: boolean | null;
  container: boolean | null;
}

export interface GitGroup {
  description: string;
  paths: string[];
  ignored: boolean;
}

export interface GitSection {
  default: "ignored" | "tracked";
  groups: Record<string, GitGroup>;
}

export interface ConfigDocument {
  language: LanguageSection;
  project: ProjectSection;
  system: SystemSection;
  git: GitSection;
}

/** Every key the schema requires present — used to prove NFR-001 (never omitted). */
export const SCHEMA_KEYS: string[] = [
  "language.default",
  "language.exceptions",
  "project.prog_lang",
  "project.runtime",
  "project.package_manager",
  "project.framework",
  "project.test_framework",
  "project.documentation_style",
  "system.os",
  "system.distro",
  "system.ram_gb",
  "system.cpu",
  "system.gpu",
  "system.baremetal",
  "system.container",
  "git.default",
  "git.groups.common_rules_config",
  "git.groups.common_rules_state",
  "git.groups.specsfy",
  "git.groups.installed_skills",
  "git.groups.code_review_graph",
  "git.groups.context_mode",
];

export interface PlatformEnvironment {
  platform(): string;
}

/**
 * Fixed label-to-key mapping for `sync.ts` (DEC-003) — lives here so the
 * schema module stays the single place that names every `project.*` key.
 */
export const STACK_LABEL_TO_PROJECT_KEY: Record<string, keyof ProjectSection> = {
  Linguagem: "prog_lang",
  Runtime: "runtime",
  Testes: "test_framework",
  Framework: "framework",
  "Gerenciador de pacotes": "package_manager",
};

/** Pure default builder (FR-001–FR-004) — real evidence where known, empty otherwise, never omitted. */
export function buildDefaultConfig(env: PlatformEnvironment): ConfigDocument {
  return {
    language: {
      default: "en_US",
      exceptions: [
        {
          id: "specsfy_specs",
          paths: ["specs/**/spec.md"],
          language: "pt_BR",
          reason:
            "validadores do Specsfy (validate_spec.mjs, verify_acceptance.mjs) fazem parsing de títulos de seção em português",
        },
        {
          id: "specsfy_docs_managed_block",
          paths: ["docs/**/*.md"],
          language: "pt_BR",
          reason:
            "build_documentation.mjs gera o bloco gerenciado (<!-- specsfy:documentator:start/end -->) com prosa em português fixa no próprio script; --check falha se divergir",
        },
      ],
    },
    project: {
      prog_lang: "",
      runtime: "",
      package_manager: "",
      framework: "",
      test_framework: "",
      documentation_style: "",
    },
    system: {
      os: env.platform(),
      distro: "",
      ram_gb: null,
      cpu: "",
      gpu: "",
      baremetal: null,
      container: null,
    },
    git: {
      default: "ignored",
      groups: {
        common_rules_config: {
          description: "O próprio config.yaml — compartilhado pelo time por padrão",
          paths: [".common-rules/config.yaml"],
          ignored: false,
        },
        common_rules_state: {
          description: "Estado operacional do common-rules (install.json, extensions.json, quarantine/)",
          paths: [".common-rules/install.json", ".common-rules/extensions.json", ".common-rules/quarantine/"],
          ignored: true,
        },
        specsfy: {
          description: "Artefatos do Specsfy — já tratados como fonte normativa versionada pelo próprio contrato do framework",
          paths: [".specsfy/", "specs/", "PROJECT.md", "INTERFACE.md", "DESIGNSYSTEM.MD"],
          ignored: false,
        },
        installed_skills: {
          description: "Skills entregues por common-rules, mattpocock ou Specsfy — reinstaláveis, como dependências",
          paths: [".claude/skills/", ".agents/skills/"],
          ignored: true,
        },
        code_review_graph: {
          description: "Saída de análise do code-review-graph — caminho ainda não inspecionado neste projeto",
          paths: [],
          ignored: true,
        },
        context_mode: {
          description: "Estado de sessão/uso de contexto do context-mode — caminho ainda não inspecionado neste projeto",
          paths: [],
          ignored: true,
        },
      },
    },
  };
}
