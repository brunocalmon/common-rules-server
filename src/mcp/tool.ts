import { z } from "zod";
import { runSetup, TARGET_SETTINGS } from "../setup/run.js";
import { readRecordFile } from "../setup/write.js";
import { RECORD_PATH } from "../setup/record.js";
import { detectEnvironment } from "../setup/env.js";
import { validateRoot } from "./root.js";

export const TOOL_NAME = "setup";

export const TOOL_DESCRIPTION =
  "Configura um projeto: instala os hooks que ligam os subsistemas ao ciclo do agente " +
  "e grava o registro da instalação. Exige a raiz do projeto como caminho absoluto.";

/**
 * Esquema de entrada declarado ao cliente.
 *
 * `project_root` é obrigatório porque o processo servidor não sabe em que
 * projeto está: a observação de `R-001` encontrou três servidores em execução,
 * nenhum com a raiz correta como diretório de trabalho.
 */
export const inputShape = {
  project_root: z
    .string()
    .describe("Caminho absoluto da raiz do projeto a configurar. Caminho relativo é recusado."),
};

/**
 * Forma da resposta, declarada ao cliente.
 *
 * O SDK valida `structuredContent` contra este esquema apenas no caminho de
 * sucesso; a recusa é explicitamente isenta, de modo que declarar a saída não
 * impede a tool de reportar erro.
 */
export const outputShape = {
  root: z.string().describe("Raiz do projeto que recebeu a configuração."),
  target: z.string().describe("Caminho, relativo à raiz, do arquivo de configuração do alvo."),
  changed: z.boolean().describe("Falso quando o projeto já estava configurado e nada foi escrito."),
  hooks: z
    .array(z.object({ name: z.string(), event: z.string() }))
    .describe("Hooks instalados, com o evento em que cada um foi registrado."),
};

export interface SetupToolResult {
  // O SDK tipa o retorno da tool com assinatura de índice, para acomodar campos
  // do protocolo como `_meta`. Sem ela a compilação recusa o handler.
  [campo: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
  structuredContent?: {
    root: string;
    target: string;
    changed: boolean;
    hooks: { name: string; event: string }[];
  };
}

const texto = (t: string): { type: "text"; text: string }[] => [{ type: "text", text: t }];

const recusar = (motivo: string): SetupToolResult => ({ isError: true, content: texto(motivo) });

/**
 * Executa a configuração sobre a raiz informada.
 *
 * Toda decisão de onde ler e escrever vem do argumento. Este módulo não
 * consulta diretório de trabalho nem variável de ambiente, e repassa a raiz
 * explicitamente a cada chamada, para que o comportamento não dependa de onde
 * o processo foi iniciado.
 */
export async function executeSetup(args: { project_root?: unknown }): Promise<SetupToolResult> {
  const raiz = validateRoot(args.project_root);
  if (!raiz.ok) return recusar(raiz.reason);

  try {
    // Ler o registro anterior é o que torna a reexecução idempotente. Na fatia
    // 1b a lógica existia mas não funcionava pela linha de comando, porque
    // ninguém repassava este valor.
    const anterior = readRecordFile(raiz.root, RECORD_PATH);
    const resultado = runSetup({
      env: detectEnvironment(raiz.root),
      root: raiz.root,
      write: true,
      previous: anterior,
    });

    return {
      content: texto(resultado.report),
      structuredContent: {
        root: raiz.root,
        target: TARGET_SETTINGS,
        changed: resultado.written.length > 0,
        hooks: resultado.installed.map((h) => ({ name: h.name, event: h.event })),
      },
    };
  } catch (erro) {
    // Falha jamais vira sucesso parcial: quem chamou precisa saber que a
    // configuração não ocorreu, e por quê.
    const causa = erro instanceof Error ? erro.message : String(erro);
    return recusar(`a configuração falhou em ${raiz.root}: ${causa}`);
  }
}
