import * as React from "react";
import {
  LogsTimeRangeInlinePillCore,
  type LogsTimeRangeInlinePillCoreProps,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export type LogsTimeRangeInlinePillProps = Omit<LogsTimeRangeInlinePillCoreProps, "translateFn">;

export function LogsTimeRangeInlinePill(props: LogsTimeRangeInlinePillProps) {
  const { t } = useTranslation();
  return <LogsTimeRangeInlinePillCore {...props} translateFn={(k) => t(k)} />;
}
