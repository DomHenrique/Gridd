import { supabase } from './supabase';
import { initializeGooglePhotos } from './google-photos';
import { getEnvVar } from '../config/env';
// This function will try to auto-create tables. 
// NOTE: This requires a postgres function 'exec_sql' to be created in Supabase first, 
// OR purely client-side DDL is blocked by default. 
// We will attempt to use the 'postgres' (service role) way if possible or guide the user.

// import schemaSql from '../database/schema_v1.sql?raw'; // Vite specific raw import

let isInitializing = false;

export const initializeSystem = async () => {
    if (isInitializing) return;
    isInitializing = true;

    console.log('[System] Initializing...');

    // Initialize Google Photos integration
    await initializeGooglePhotos();

    // 1. Check if tables exist
    const { error: profileError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    const { error: leadsError } = await supabase.from('leads').select('count', { count: 'exact', head: true });
    
    // If either profiles OR leads is missing (42P01: undefined_table), try to create/update tables
    if ((profileError && profileError.code === '42P01') || (leadsError && leadsError.code === '42P01')) {
         console.warn('[System] Tables missing or incomplete. Attempting auto-creation/migration...');
         await createTables();
    } else if (profileError || leadsError) {
         console.error('[System] Connection error:', profileError || leadsError);
         return;
    } else {
         console.log('[System] Database tables found.');
    }

    // 2. Ensure Superuser
    await ensureSuperUser();

    console.log('[System] Initialization Complete.');
};

const createTables = async () => {
    console.info('[System] INFORMAÇÃO: As tabelas automáticas não estão configuradas ou falharam.');
    console.warn('[System] IMPORTANTE: Execute manualmente o conteúdo de "database/schema_v1.sql" no SQL Editor do Supabase.');
    
    // Simplificamos omitindo o fetch que gera erro no Vite dev server
    // Para uma automação real, recomendamos o uso de Supabase Migrations CLI.
};

const ensureSuperUser = async () => {
    const adminEmail = getEnvVar('VITE_ADMIN_EMAIL');
    const adminPassword = getEnvVar('VITE_ADMIN_PASSWORD');
    const companyDomain = getEnvVar('VITE_COMPANY_DOMAIN');

    if (!adminEmail || !adminPassword || !companyDomain) {
        console.warn('[System] Admin credentials or company domain not found in .env. Skipping auto-creation.');
        return;
    }

    // Domain validation
    if (!adminEmail.endsWith(`@${companyDomain}`)) {
        console.error(`[System] CRITICAL: Admin email (${adminEmail}) does not belong to the company domain (${companyDomain}).`);
        console.info(`DICA: Atualize VITE_ADMIN_EMAIL no arquivo .env para um email terminado em @${companyDomain}`);
        return;
    }

    // Global Superuser check
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'superuser');
    
    if (countError) {
        console.error('[System] Erro ao verificar superusuários existentes:', countError.message);
    } else if (count && count > 0) {
        console.log(`[System] ${count} superusuário(s) encontrados no banco. Pulando auto-provisionamento.`);
        return;
    }

    console.log(`[System] Nenhum superusuário encontrado. Iniciando configuração para: ${adminEmail}`);

    // Tenta login. Se falhar com credenciais inválidas, tenta cadastro.
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
    });

    if (signInData.user) {
        console.log('[System] Admin logado com sucesso.');
        await ensureAdminProfile(signInData.user.id, adminEmail);
    } else {
        if (signInError?.message?.includes('Email not confirmed')) {
            console.error('[System] ERRO: O e-mail do Admin ainda não foi confirmado no Supabase.');
            console.warn('[System] SOLUÇÃO: Vá em Auth > Providers > Email e desative "Confirm Email", ou use o SQL de confirmação manual.');
            isInitializing = false; // Permite tentar de novo após ajuste
            return;
        }

        // Se o erro for "Invalid login credentials", significa que o usuário não existe.
        // Tentamos o SignUp.
        console.log('[System] Admin não encontrado ou senha incorreta. Tentando criar conta (SignUp)...');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword,
            options: {
                data: {
                    full_name: 'System Admin'
                }
            }
        });

        if (signUpData.user) {
             console.log('[System] Conta de Admin criada com sucesso via Auth.');
             await ensureAdminProfile(signUpData.user.id, adminEmail);
        } else {
             if (signUpError?.message?.includes('after')) {
                 console.warn('[System] SEGURANÇA: O Supabase bloqueou a criação temporariamente (Rate Limit).');
                 console.info(`DICA: Aguarde 60 segundos SEM RECARREGAR a página. O email configurado é: ${adminEmail}`);
             } else {
                 console.error('[System] Erro crítico ao criar Admin:', signUpError?.message || 'Erro desconhecido');
                 console.info('DICA: Verifique se o e-mail de confirmação está desativado no Supabase (Auth > Settings).');
             }
        }
    }
};

const ensureAdminProfile = async (userId: string, email: string) => {
    // Rely on DB Trigger for creation. We just check if it exists and upgrade if needed.
    // Wait a bit to allow trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (!profile) {
        console.warn('[System] Profile not found via trigger yet. This might be an existing user without a profile.');
        console.info('DICA: Delete o usuário atual no Supabase (Auth > Users) e recarregue a página para testar o fluxo completo do Trigger.');
    } else if (profile.role !== 'superuser') {
        // Upgrade to superuser if trigger didn't catch the domain (fallback)
        const { error } = await supabase.from('profiles').update({ role: 'superuser' }).eq('id', userId);
        if (error) console.error('[System] Failed to upgrade Admin role:', error);
        else console.log('[System] Admin upgraded to superuser.');
    } else {
        console.log('[System] Admin profile is ready and has superuser role.');
    }
};

// GoogleTokenService has been moved to its own file: services/googleTokenService.ts
