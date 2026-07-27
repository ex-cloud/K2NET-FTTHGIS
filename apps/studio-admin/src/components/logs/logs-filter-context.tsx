"use client";

import React, { createContext, useContext, useState } from "react";

export type LogFilterState = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  timeRange: string;
  setTimeRange: (val: string) => void;
  isLivePaused: boolean;
  setIsLivePaused: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTypes: Record<string, boolean>;
  toggleType: (key: string) => void;
  selectedLevels: Record<string, boolean>;
  toggleLevel: (key: string) => void;
};

const LogsFilterContext = createContext<LogFilterState | undefined>(undefined);

export function LogsFilterProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("1h");
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    api_gateway: true,
    postgis_db: true,
    spring_boot: true,
    keycloak_auth: true,
    go_gateways: true,
  });
  const [selectedLevels, setSelectedLevels] = useState<Record<string, boolean>>({
    success: true,
    warning: true,
    error: true,
  });

  const toggleType = (key: string) => {
    setSelectedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleLevel = (key: string) => {
    setSelectedLevels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <LogsFilterContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        timeRange,
        setTimeRange,
        isLivePaused,
        setIsLivePaused,
        selectedTypes,
        toggleType,
        selectedLevels,
        toggleLevel,
      }}
    >
      {children}
    </LogsFilterContext.Provider>
  );
}

export function useLogsFilter() {
  const context = useContext(LogsFilterContext);
  if (!context) {
    return {
      searchQuery: "",
      setSearchQuery: () => {},
      timeRange: "1h",
      setTimeRange: () => {},
      isLivePaused: false,
      setIsLivePaused: () => {},
      selectedTypes: {
        api_gateway: true,
        postgis_db: true,
        spring_boot: true,
        keycloak_auth: true,
        go_gateways: true,
      },
      toggleType: () => {},
      selectedLevels: { success: true, warning: true, error: true },
      toggleLevel: () => {},
    };
  }
  return context;
}
