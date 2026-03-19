/**
 * PII Masking Utility
 * Protects sensitive client data in admin views.
 */
export const maskPII = (data: any): any => {
    if (!data) return data;

    if (Array.isArray(data)) {
        return data.map(maskPII);
    }

    if (typeof data === 'object') {
        const masked = { ...data };
        
        // Fields to mask
        const fieldsToMask = ['whatsapp', 'email', 'phone', 'clientWhatsapp', 'clientEmail'];

        for (const key in masked) {
            if (fieldsToMask.includes(key) && typeof masked[key] === 'string' && masked[key]) {
                const val = masked[key];
                if (val.length <= 6) {
                    masked[key] = '***';
                } else {
                    // Show first 4 and last 2 characters
                    masked[key] = `${val.substring(0, 4)}...${val.substring(val.length - 2)}`;
                }
            } else if (typeof masked[key] === 'object') {
                masked[key] = maskPII(masked[key]);
            }
        }
        return masked;
    }

    return data;
};
