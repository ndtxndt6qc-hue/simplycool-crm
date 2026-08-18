import { calculateQRReferenceChecksum, calculateSCORReferenceChecksum, isQRIBAN } from "swissqrbill/utils";

export function usesQrIban(iban: string | null, qrIban: string | null): boolean {
  const account = qrIban || iban || "";
  return isQRIBAN(account);
}

export function paymentAccount(iban: string | null, qrIban: string | null): string {
  return (qrIban || iban || "").replace(/\s/g, "");
}

export function generateReference(invoiceId: number, iban: string | null, qrIban: string | null): string | undefined {
  const account = qrIban || iban;
  if (!account) return undefined;

  if (isQRIBAN(account)) {
    const base = String(invoiceId).padStart(26, "0");
    return base + calculateQRReferenceChecksum(base);
  }

  const base = String(invoiceId).padStart(21, "0");
  return `RF${calculateSCORReferenceChecksum(base)}${base}`;
}
