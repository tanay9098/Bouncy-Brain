import React, { createContext, useContext, useState } from 'react';

interface EnergyContextType {
  energy: number;
  setEnergy: (level: number) => void;
}

const EnergyContext = createContext<EnergyContextType | null>(null);

export function EnergyProvider({ children }: { children: React.ReactNode }) {
  const [energy, setEnergy] = useState(3);

  return (
    <EnergyContext.Provider value={{ energy, setEnergy }}>
      {children}
    </EnergyContext.Provider>
  );
}

export function useEnergy() {
  const ctx = useContext(EnergyContext);
  if (!ctx) throw new Error('useEnergy must be used within EnergyProvider');
  return ctx;
}
