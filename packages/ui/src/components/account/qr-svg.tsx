import * as React from "react";
import QRCode from "qrcode";

export interface QrSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrSvg({ value, size = 180, className = "" }: QrSvgProps) {
  const [svgHtml, setSvgHtml] = React.useState<string>("");

  React.useEffect(() => {
    if (!value) return;
    let isMounted = true;
    QRCode.toString(value, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((svg) => {
        if (isMounted) setSvgHtml(svg);
      })
      .catch((err) => {
        console.error("QR Code generation error:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [value]);

  if (!svgHtml) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-muted/40 rounded border border-border text-xs text-muted-foreground"
      >
        Generating QR...
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded bg-white p-1.5 shadow-sm flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
