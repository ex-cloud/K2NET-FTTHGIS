import type { AttenuationBudgetParams } from "../types";

export const SPLITTER_INSERTION_LOSS: Record<number, number> = {
  1: 0.0,
  2: 3.6,   // 1:2 Splitter ~3.6 dB
  4: 7.2,   // 1:4 Splitter ~7.2 dB
  8: 10.5,  // 1:8 Splitter ~10.5 dB
  16: 13.8, // 1:16 Splitter ~13.8 dB
  32: 17.1, // 1:32 Splitter ~17.1 dB
  64: 20.5, // 1:64 Splitter ~20.5 dB
};

/**
 * Calculates theoretical optical link budget attenuation loss in dB
 * Formula: FiberLoss (α * L) + SpliceLoss (N * 0.05) + ConnectorLoss (N * 0.3) + SplittersLoss
 */
export function calculateOpticalAttenuation(params: AttenuationBudgetParams): {
  totalLossDb: number;
  fiberLossDb: number;
  spliceLossDb: number;
  connectorLossDb: number;
  splitterLossDb: number;
  isWithinStandard: boolean; // Standard GPON budget is typically max 28 dB
} {
  const fiberAlpha = params.fiberAttenuationDbPerKm ?? 0.35; // dB/km @ 1310nm standard G.652D
  const fiberLossDb = Number((params.fiberLengthKm * fiberAlpha).toFixed(2));

  const spliceLossDb = Number(((params.spliceCount ?? 0) * 0.05).toFixed(2));
  const connectorLossDb = Number(((params.connectorCount ?? 2) * 0.3).toFixed(2));

  let splitterLossDb = 0;
  if (params.splitterRatios && params.splitterRatios.length > 0) {
    splitterLossDb = params.splitterRatios.reduce(
      (acc, ratio) => acc + (SPLITTER_INSERTION_LOSS[ratio] ?? 0),
      0
    );
  }
  splitterLossDb = Number(splitterLossDb.toFixed(2));

  const totalLossDb = Number(
    (fiberLossDb + spliceLossDb + connectorLossDb + splitterLossDb).toFixed(2)
  );

  return {
    totalLossDb,
    fiberLossDb,
    spliceLossDb,
    connectorLossDb,
    splitterLossDb,
    isWithinStandard: totalLossDb <= 28.0,
  };
}
