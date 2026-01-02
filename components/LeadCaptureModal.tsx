import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { BRAND } from '../constants';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    jobTitle: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateBusinessEmail = (email: string) => {
    const publicDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'uol.com.br', 'bol.com.br'];
    const domain = email.split('@')[1];
    return !publicDomains.includes(domain?.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validate Business Email
    if (!validateBusinessEmail(formData.email)) {
      setError('Por favor, utilize um e-mail corporativo. E-mails públicos não são aceitos.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Insert into Supabase
      const { error: insertError } = await supabase.from('leads').insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.companyName,
        job_title: formData.jobTitle
      });

      if (insertError) throw insertError;

      // 3. Send to Webhook (if configured)
      // Use window._env_ fallback for runtime variable support
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL || (window as any)._env_?.VITE_WEBHOOK_URL;
      if (webhookUrl) {
        // We don't necessarily want to block the user if the webhook fails, 
        // but we'll try to send it.
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            source: 'Gridd360 Asset Manager - Talk to Specialist',
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error('Webhook error:', err));
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ fullName: '', email: '', phone: '', companyName: '', jobTitle: '' });
      }, 3000);

    } catch (err: any) {
      console.error('Lead capture error:', err);
      setError('Ocorreu um erro ao enviar seus dados. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative" style={{ borderRadius: '1rem' }}>
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: '#f8f9fa' }}>
          <h3 className="font-bold text-lg text-slate-800 m-0">Falar com Especialista</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                <CheckCircle size={32} />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Mensagem Recebida!</h4>
              <p className="text-slate-600">Nossa equipe entrará em contato em breve.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Preencha os dados abaixo para que nossos especialistas entendam melhor sua necessidade.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-200">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">NOME COMPLETO *</label>
                  <input
                    name="fullName"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 transition-all outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Seu nome"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">E-MAIL CORPORATIVO *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 transition-all outline-none"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nome@suaempresa.com"
                  />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">TELEFONE (WHATSAPP) *</label>
                    <input
                      name="phone"
                      type="tel"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 transition-all outline-none"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Company */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">NOME DA EMPRESA *</label>
                        <input
                            name="companyName"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 transition-all outline-none"
                            value={formData.companyName}
                            onChange={handleChange}
                            placeholder="Empresa Ltda"
                        />
                    </div>
                    {/* Job Title */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">CARGO *</label>
                        <input
                            name="jobTitle"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 transition-all outline-none"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            placeholder="Gerente de Mkt"
                        />
                    </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ backgroundColor: BRAND.primaryColor }}
                  >
                    {isSubmitting ? 'Enviando...' : 'Falar com Especialista'}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-2">
                    Aceitamos apenas domínios corporativos.
                  </p>
                </div>

              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
