import { supabase } from './supabase';

export const GoogleTokenService = {
    /**
     * Saves Google Photos tokens to Supabase app_settings table.
     * This requires the user to be a superuser (enforced by RLS).
     */
    saveTokens: async (tokens: any) => {
        console.log('[GoogleTokenService] Saving tokens to Supabase...');
        const { error } = await supabase.from('app_settings').upsert({
            key: 'google_photos_tokens',
            value: tokens,
            updated_at: new Date().toISOString()
        });
        
        if (error) {
            console.error('[GoogleTokenService] Failed to save tokens:', error);
            throw error;
        }
        console.log('[GoogleTokenService] Tokens saved successfully.');
    },

    /**
     * Retrieves Google Photos tokens from Supabase app_settings table.
     */
    getTokens: async () => {
        console.log('[GoogleTokenService] Fetching tokens from Supabase...');
        const { data, error } = await supabase.from('app_settings')
            .select('value')
            .eq('key', 'google_photos_tokens')
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                console.log('[GoogleTokenService] No tokens found in database.');
                return null;
            }
            console.error('[GoogleTokenService] Error fetching tokens:', error);
            return null;
        }
        
        console.log('[GoogleTokenService] Tokens retrieved successfully.');
        return data?.value;
    }
};
