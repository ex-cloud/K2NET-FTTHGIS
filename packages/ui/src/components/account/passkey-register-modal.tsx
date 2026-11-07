import * as React from "react";
import { Key, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../dialog";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { AccountLabels } from "./account-types";

export interface WebauthnRegisterChallengeData {
  challenge: string;
  rp: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  timeout?: number;
  attestation?: string;
}

export interface PasskeyRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels?: AccountLabels;
  onFetchChallenge: () => Promise<WebauthnRegisterChallengeData>;
  onVerify: (payload: {
    credentialId: string;
    clientDataJSON: string;
    attestationObject: string;
    deviceName: string;
  }) => Promise<{ success: boolean; message?: string }>;
  onSuccess: () => void;
}

export function base64UrlToBuffer(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function detectDefaultDeviceName(): string {
  if (typeof navigator === "undefined") return "Passkey Security Key";
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows Hello";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Touch ID";
  if (/Android/i.test(ua)) return "Android Biometrics";
  if (/iPhone|iPad/i.test(ua)) return "Face ID / Touch ID";
  if (/Linux/i.test(ua)) return "Linux FIDO2 Key";
  return "Passkey (FIDO2)";
}

export function PasskeyRegisterModal({
  open,
  onOpenChange,
  labels,
  onFetchChallenge,
  onVerify,
  onSuccess,
}: PasskeyRegisterModalProps) {
  const [deviceName, setDeviceName] = React.useState("");
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setDeviceName(detectDefaultDeviceName());
      setErrorMessage(null);
      setIsRegistering(false);
      setIsSuccess(false);
    }
  }, [open]);

  const handleStartRegistration = async () => {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setErrorMessage(
        labels?.passkeyUnsupported ||
          "WebAuthn / Passkey is not supported by your browser. Please use Chrome, Edge, Safari, or Firefox."
      );
      return;
    }

    try {
      setIsRegistering(true);
      setErrorMessage(null);

      // 1. Fetch registration challenge from backend
      const challengeData = await onFetchChallenge();

      // 2. Invoke browser WebAuthn prompt
      const challengeBuffer = base64UrlToBuffer(challengeData.challenge);
      const userIdBuffer = base64UrlToBuffer(challengeData.user.id);

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: challengeBuffer as unknown as BufferSource,
          rp: challengeData.rp,
          user: {
            id: userIdBuffer as unknown as BufferSource,
            name: challengeData.user.name,
            displayName: challengeData.user.displayName,
          },
          pubKeyCredParams: (challengeData.pubKeyCredParams as unknown as PublicKeyCredentialParameters[]) || [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            userVerification: "preferred",
            residentKey: "preferred",
          },
          timeout: challengeData.timeout || 60000,
          attestation: (challengeData.attestation as AttestationConveyancePreference) || "none",
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("No credential was returned by the authenticator.");
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const rawIdBase64 = bufferToBase64Url(credential.rawId);
      const clientDataBase64 = bufferToBase64Url(response.clientDataJSON);
      const attestationBase64 = bufferToBase64Url(response.attestationObject);

      // 3. Send verification payload to backend
      const verifyRes = await onVerify({
        credentialId: rawIdBase64,
        clientDataJSON: clientDataBase64,
        attestationObject: attestationBase64,
        deviceName: deviceName.trim() || detectDefaultDeviceName(),
      });

      if (!verifyRes.success) {
        throw new Error(verifyRes.message || "Failed to verify passkey registration");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setErrorMessage(
            labels?.passkeyCancelled ||
              "Passkey registration was cancelled or timed out. You can try again whenever you are ready."
          );
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage("An unexpected error occurred during passkey registration.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleFinish = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Key className="size-4 text-muted-foreground" />
            <span>{labels?.passkeyModalTitle || "Register Security Key / Passkey (FIDO2)"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {labels?.passkeyModalDesc ||
              "Enable fast, phishing-resistant authentication using Windows Hello, Touch ID, or a FIDO2 security key."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 space-y-4 text-center">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                {labels?.passkeySuccessTitle || "Passkey Registered Successfully"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {labels?.passkeySuccessDesc ||
                  "You can now use your biometric sensor, Windows PIN, or security key for instant 2FA and passwordless login."}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleFinish}
              className="mt-2 text-xs font-medium"
            >
              <span>{labels?.doneBtn || "Done"}</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {errorMessage && (
              <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="passkeyDeviceName" className="text-xs font-medium">
                {labels?.passkeyDeviceNameLabel || "Device / Passkey Name"}
              </Label>
              <Input
                id="passkeyDeviceName"
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder={labels?.passkeyDeviceNamePlaceholder || "e.g. Work Laptop Windows Hello"}
                disabled={isRegistering}
                className="h-8 text-xs bg-background/80"
              />
              <p className="text-[11px] text-muted-foreground">
                {labels?.passkeyDeviceNameHint ||
                  "A recognizable name to distinguish this device from other registered keys."}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-border/80 bg-muted/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <span>{labels?.passkeyHowItWorksTitle || "How It Works"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {labels?.passkeyHowItWorksDesc ||
                  "When you click 'Register', your operating system will display a prompt to scan your fingerprint, facial scan, or enter your device PIN. Your biometrics never leave your device."}
              </p>
            </div>

            <DialogFooter className="pt-2 sm:justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isRegistering}
                className="text-xs"
              >
                <span>{labels?.cancelBtn || "Cancel"}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleStartRegistration}
                disabled={isRegistering}
                className="text-xs font-medium gap-1.5"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{labels?.passkeyRegistering || "Verifying..."}</span>
                  </>
                ) : (
                  <>
                    <Key className="size-3.5" />
                    <span>{labels?.passkeyRegisterBtn || "Register Passkey"}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
