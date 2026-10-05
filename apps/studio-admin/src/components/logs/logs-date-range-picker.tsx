import * as React from "react";
import { LogsDateRangePickerCore, type LogsDateRangePickerCoreProps } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";

export { PRESET_VALUES, HISTORICAL_SHORTCUTS } from "@k2net/ui";

export type LogsDateRangePickerProps = Omit<LogsDateRangePickerCoreProps, "translateFn" | "onResetNotify">;

export function LogsDateRangePicker(props: LogsDateRangePickerProps) {
  const { t } = useTranslation();

  return (
    <LogsDateRangePickerCore
      {...props}
      translateFn={(key) => t(key)}
      onResetNotify={() => {
        toast.success("Time range filter reset to default (Last 1 hour)");
      }}
    />
  );
}
