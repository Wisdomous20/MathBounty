import { ethers } from "ethers";
import {
  hasFunctionSelector,
  MATH_BOUNTY_ADDRESS,
  MATH_BOUNTY_DEPLOY_BLOCK,
  MATH_BOUNTY_FUNCTION_SIGNATURES,
  type MathBountySubmitMethod,
} from "@/lib/contracts";

type ContractDebugProvider = {
  getCode: (address: string) => Promise<string>;
  getNetwork?: () => Promise<ethers.Network>;
  getBlockNumber?: () => Promise<number>;
};

type ContractDebugDetails = Record<string, unknown>;

const LOG_PREFIX = "[MathBounty:contract]";
const EXPECTED_CHAIN_ID = "11155111";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function sanitizeText(value: unknown) {
  if (typeof value !== "string") return value;

  return value
    .replace(/"data":\s*"0x[0-9a-fA-F]+"/g, '"data":"[hex redacted]"')
    .replace(/0x[0-9a-fA-F]{64,}/g, "[hex redacted]");
}

function summarizeHex(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("0x")) return value;
  if (value.length <= 74) return value;

  const byteLength = Math.max(0, (value.length - 2) / 2);
  return `${value.slice(0, 10)}...${value.slice(-8)} (${byteLength} bytes)`;
}

function summarizeTransaction(value: unknown) {
  const transaction = asRecord(value);
  if (!transaction) return null;

  return {
    to: transaction.to,
    from: transaction.from,
    value: transaction.value,
    data: summarizeHex(transaction.data),
  };
}

function summarizeRevert(value: unknown) {
  const revert = asRecord(value);
  if (!revert) return value ?? null;

  return {
    name: revert.name,
    signature: revert.signature,
    args: Array.isArray(revert.args) ? revert.args : undefined,
  };
}

function summarizeInfo(value: unknown) {
  const info = asRecord(value);
  const error = asRecord(info?.error);
  if (!info && !error) return null;

  return {
    error: error
      ? {
          code: error.code,
          message: sanitizeText(error.message),
          data: summarizeHex(error.data),
        }
      : undefined,
    requestUrl: info?.requestUrl,
    responseStatus: info?.responseStatus,
  };
}

export function normalizeContractError(error: unknown) {
  const candidate = asRecord(error);

  return {
    name: error instanceof Error ? error.name : undefined,
    code: candidate?.code,
    action: candidate?.action,
    shortMessage: sanitizeText(candidate?.shortMessage),
    message: sanitizeText(error instanceof Error ? error.message : candidate?.message),
    reason: candidate?.reason,
    data: summarizeHex(candidate?.data),
    revert: summarizeRevert(candidate?.revert),
    transaction: summarizeTransaction(candidate?.transaction),
    info: summarizeInfo(candidate?.info),
  };
}

export function logContractEvent(label: string, details?: ContractDebugDetails) {
  console.info(LOG_PREFIX, label, details ?? {});
}

export function logContractError(
  label: string,
  error: unknown,
  details?: ContractDebugDetails
) {
  console.error(LOG_PREFIX, label, {
    ...(details ?? {}),
    error: normalizeContractError(error),
  });
}

export async function getMathBountyDiagnostics(provider: ContractDebugProvider) {
  const [networkResult, blockResult, codeResult] = await Promise.allSettled([
    provider.getNetwork?.(),
    provider.getBlockNumber?.(),
    provider.getCode(MATH_BOUNTY_ADDRESS),
  ]);

  const network =
    networkResult.status === "fulfilled" ? networkResult.value : undefined;
  const blockNumber =
    blockResult.status === "fulfilled" ? blockResult.value : undefined;
  const bytecode = codeResult.status === "fulfilled" ? codeResult.value : null;
  const selectors =
    bytecode && bytecode !== "0x"
      ? Object.fromEntries(
          Object.entries(MATH_BOUNTY_FUNCTION_SIGNATURES).map(
            ([name, signature]) => [
              name,
              hasFunctionSelector(bytecode, signature),
            ]
          )
        )
      : null;

  return {
    expectedChainId: EXPECTED_CHAIN_ID,
    chainId: network?.chainId?.toString(),
    networkName: network?.name,
    blockNumber,
    contractAddress: MATH_BOUNTY_ADDRESS,
    deployBlock: MATH_BOUNTY_DEPLOY_BLOCK,
    codeBytes:
      bytecode && bytecode !== "0x" ? Math.max(0, (bytecode.length - 2) / 2) : 0,
    selectors,
    diagnosticsError:
      codeResult.status === "rejected"
        ? normalizeContractError(codeResult.reason)
        : undefined,
  };
}

export async function logMathBountyDiagnostics(
  label: string,
  provider: ContractDebugProvider,
  details?: ContractDebugDetails
) {
  try {
    logContractEvent(label, {
      ...(details ?? {}),
      ...(await getMathBountyDiagnostics(provider)),
    });
  } catch (error: unknown) {
    logContractError("Failed to collect contract diagnostics", error, {
      originalLabel: label,
      ...(details ?? {}),
    });
  }
}

export async function resolveMathBountySubmitMethod(
  provider: ContractDebugProvider
): Promise<MathBountySubmitMethod> {
  const bytecode = await provider.getCode(MATH_BOUNTY_ADDRESS);
  const supportsSubmitSolution = hasFunctionSelector(
    bytecode,
    MATH_BOUNTY_FUNCTION_SIGNATURES.submitSolution
  );
  const supportsSubmitAnswer = hasFunctionSelector(
    bytecode,
    MATH_BOUNTY_FUNCTION_SIGNATURES.submitAnswer
  );

  if (supportsSubmitSolution) return "submitSolution";
  if (supportsSubmitAnswer) return "submitAnswer";

  return "submitSolution";
}
