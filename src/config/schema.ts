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
            "Specsfy's own validators (validate_spec.mjs, verify_acceptance.mjs) parse Portuguese section titles",
        },
        {
          id: "specsfy_docs_managed_block",
          paths: ["docs/**/*.md"],
          language: "pt_BR",
          reason:
            "build_documentation.mjs generates the managed block (<!-- specsfy:documentator:start/end -->) with Portuguese prose hardcoded in the script itself; --check fails if it diverges",
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
          description: "config.yaml itself — shared across the team by default",
          paths: [".common-rules/config.yaml"],
          ignored: false,
        },
        common_rules_state: {
          description: "common-rules operational state (install.json, extensions.json, quarantine/)",
          paths: [".common-rules/install.json", ".common-rules/extensions.json", ".common-rules/quarantine/"],
          ignored: true,
        },
        specsfy: {
          description: "Specsfy artifacts — already treated as versioned normative source by the framework's own contract",
          paths: [".specsfy/", "specs/", "PROJECT.md", "INTERFACE.md", "DESIGNSYSTEM.MD"],
          ignored: false,
        },
        installed_skills: {
          description: "Skills delivered by common-rules, mattpocock or Specsfy — reinstallable, like dependencies",
          paths: [".claude/skills/", ".agents/skills/"],
          ignored: true,
        },
        code_review_graph: {
          description: "code-review-graph analysis output — path not yet inspected in this project",
          paths: [],
          ignored: true,
        },
        context_mode: {
          description: "context-mode session/context-usage state — path not yet inspected in this project",
          paths: [],
          ignored: true,
        },
      },
    },
  };
}
