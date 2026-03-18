import { useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

export type Currency = "IDR" | "USD";

interface ExchangeRateData {
    rates: {
        IDR: number;
    };
    time_last_update_unix: number;
}

const API_URL = "https://open.er-api.com/v6/latest/USD"; // Free, reliable, updates daily

export function useCurrency() {
    // Persist preference in local storage. Default to IDR since the agency is based there.
    const [currency, setCurrency] = useLocalStorage<Currency>("dfd-currency-pref", "IDR");
    
    // Cache the exchange rate to avoid hitting the API on every render/reload
    // 1 USD = X IDR
    const [exchangeRate, setExchangeRate] = useLocalStorage<number>("dfd-exchange-rate-idr", 15500); // Sensible fallback
    const [lastFetchTime, setLastFetchTime] = useLocalStorage<number>("dfd-exchange-rate-time", 0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchExchangeRate() {
            // Only fetch if data is older than 12 hours (43200000 ms)
            const now = Date.now();
            if (now - lastFetchTime < 43200000) {
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error("Failed to fetch exchange rate");
                
                const data: ExchangeRateData = await response.json();
                
                if (data && data.rates && data.rates.IDR) {
                    setExchangeRate(data.rates.IDR);
                    setLastFetchTime(now);
                }
            } catch (error: unknown) {
                console.error("Currency API Error:", error);
                // Keep using the last cached rate if it fails
            } finally {
                setIsLoading(false);
            }
        }

        fetchExchangeRate();
    }, [lastFetchTime, setExchangeRate, setLastFetchTime]);

    // Format a number based on current currency
    const formatPrice = (amountInIdr: number | string | null | undefined): string => {
        if (!amountInIdr) return "";
        const numericAmount = Number(amountInIdr);
        
        if (numericAmount === 0) return "Custom Code";

        if (currency === "IDR") {
            return new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(numericAmount);
        } else {
            // Convert to USD and round up to nearest $10 for clean agency pricing
            // (e.g. $942 becomes $950, $98 becomes $100). Or just standard rounding.
            // Let's use clean standard rounding to nearest dollar first.
            const usdAmount = Math.ceil(numericAmount / exchangeRate);
            
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(usdAmount);
        }
    };

    const toggleCurrency = () => {
        setCurrency((prev: Currency) => (prev === "IDR" ? "USD" : "IDR"));
    };

    return {
        currency,
        setCurrency,
        toggleCurrency,
        exchangeRate, // 1 USD in IDR
        formatPrice,
        isLoading
    };
}
