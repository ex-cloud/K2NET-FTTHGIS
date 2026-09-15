import { useState, useRef, useEffect } from "react";

export function useWizardProvisioning() {
  const [provisioningStage, setProvisioningStage] = useState(1);
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, []);

  const startProvisioningStageTicker = () => {
    setProvisioningStage(1);
    const startTime = Date.now();
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);

    stageTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 12500) {
        setProvisioningStage(5);
      } else if (elapsed > 9000) {
        setProvisioningStage(4);
      } else if (elapsed > 4000) {
        setProvisioningStage(3);
      } else if (elapsed > 1500) {
        setProvisioningStage(2);
      } else {
        setProvisioningStage(1);
      }
    }, 500);
  };

  const stopProvisioningStageTicker = () => {
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  };

  return {
    provisioningStage,
    setProvisioningStage,
    startProvisioningStageTicker,
    stopProvisioningStageTicker,
  };
}
