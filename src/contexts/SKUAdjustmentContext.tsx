import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SKUAdjustment {
  sku: string;
  adjustedPrice: number;
  adjustedMargin: number;
  originalPrice: number;
  originalMargin: number;
}

interface SKUAdjustmentContextType {
  adjustments: Record<string, SKUAdjustment>;
  updateSKUAdjustment: (adjustment: SKUAdjustment) => void;
  clearSKUAdjustment: (sku: string) => void;
  getSKUAdjustment: (sku: string) => SKUAdjustment | null;
  hasAdjustment: (sku: string) => boolean;
  hasAnyAdjustments: () => boolean;
  clearAllAdjustments: () => void;
}

const SKUAdjustmentContext = createContext<SKUAdjustmentContextType | undefined>(undefined);

interface SKUAdjustmentProviderProps {
  children: ReactNode;
}

export function SKUAdjustmentProvider({ children }: SKUAdjustmentProviderProps) {
  const [adjustments, setAdjustments] = useState<Record<string, SKUAdjustment>>({});

  const updateSKUAdjustment = (adjustment: SKUAdjustment) => {
    setAdjustments(prev => ({
      ...prev,
      [adjustment.sku]: adjustment
    }));
  };

  const clearSKUAdjustment = (sku: string) => {
    setAdjustments(prev => {
      const { [sku]: removed, ...rest } = prev;
      return rest;
    });
  };

  const getSKUAdjustment = (sku: string): SKUAdjustment | null => {
    return adjustments[sku] || null;
  };

  const hasAdjustment = (sku: string): boolean => {
    return sku in adjustments;
  };

  const hasAnyAdjustments = (): boolean => {
    return Object.keys(adjustments).length > 0;
  };

  const clearAllAdjustments = () => {
    setAdjustments({});
  };

  const value = {
    adjustments,
    updateSKUAdjustment,
    clearSKUAdjustment,
    getSKUAdjustment,
    hasAdjustment,
    hasAnyAdjustments,
    clearAllAdjustments
  };

  return (
    <SKUAdjustmentContext.Provider value={value}>
      {children}
    </SKUAdjustmentContext.Provider>
  );
}

export function useSKUAdjustment() {
  const context = useContext(SKUAdjustmentContext);
  if (context === undefined) {
    throw new Error('useSKUAdjustment must be used within a SKUAdjustmentProvider');
  }
  return context;
}