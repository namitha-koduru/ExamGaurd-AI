/**
 * ExamGuard AI - Institutional Examination Portal Login
 * True multi-tenant authentication with institution selector and isolation
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Institution } from '../../types';
import { Logo } from '../../components/common/Logo';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('inst-vignan');
  const [institutionRegistrationId, setInstitutionRegistrationId] = useState<string>('VIGNAN-UNIV-DEMO');
  const [email, setEmail] = useState<string>('elena.examiner@smartexam.edu');
  const [password, setPassword] = useState<string>('password123');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadInstitutions() {
      try {
        const list = await api.getInstitutions();
        setInstitutions(list);
        if (list.length > 0) {
          const defaultInst = list.find((i) => i.id === 'inst-vignan') || list[0];
          setSelectedInstitutionId(defaultInst.id);
          setInstitutionRegistrationId(defaultInst.registrationId);
        }
      } catch (err) {
        console.warn('Failed to load institutions:', err);
      }
    }
    loadInstitutions();
  }, []);

  const handleInstitutionChange = (instId: string) => {
    setSelectedInstitutionId(instId);
    const target = institutions.find((i) => i.id === instId);
    if (target) {
      setInstitutionRegistrationId(target.registrationId);
      // If switching to VIT, adjust sample credentials for seamless testing
      if (instId === 'inst-vit') {
        setEmail('examiner@university.edu');
      } else if (instId === 'inst-vignan') {
        setEmail('elena.examiner@smartexam.edu');
      } else if (instId === 'inst-srm') {
        setEmail('maya.chen@student.edu');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(
        email.trim(),
        password,
        selectedInstitutionId || undefined,
        institutionRegistrationId || undefined
      );
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Invalid institutional credentials. Please verify your institution, email, and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCredential = (
    instId: string,
    regId: string,
    quickEmail: string,
    quickPass = 'password123'
  ) => {
    setSelectedInstitutionId(instId);
    setInstitutionRegistrationId(regId);
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMessage(null);
  };

  const selectedInstObj = institutions.find((i) => i.id === selectedInstitutionId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans antialiased text-slate-900 dark:text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-5 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Institutional Home</span>
        </button>

        <div className="mb-4">
          <Logo size={42} subtitle="Institutional Examination Portal" />
        </div>

        <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign In to Examination Portal
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Select your verified institution and enter authorized credentials.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-7 px-6 shadow-sm rounded-xl sm:px-9">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Institution Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Institution
                </label>
                {selectedInstObj?.isSampleSandbox && (
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Sample / Sandbox
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedInstitutionId}
                  onChange={(e) => handleInstitutionChange(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} {inst.isSampleSandbox ? '· [Sample Sandbox]' : ''}
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Institution Registration ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Institution Registration ID
              </label>
              <div className="mt-1.5 relative">
                <input
                  type="text"
                  required
                  value={institutionRegistrationId}
                  onChange={(e) => setInstitutionRegistrationId(e.target.value.toUpperCase())}
                  placeholder="e.g. VIGNAN-UNIV-DEMO or VIT-TECH-DEMO"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Email / User ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email / User ID
              </label>
              <div className="mt-1.5 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Institutional Onboarding CTA */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Can't find your institution?</span>
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Register Institution
            </button>
          </div>

          {/* Quick Sign In for Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Quick Evaluator Profiles
              </span>
              <span className="text-[10px] text-slate-400">One-click testing</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickCredential(
                    'inst-vignan',
                    'VIGNAN-UNIV-DEMO',
                    'elena.examiner@smartexam.edu'
                  )
                }
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Elena Rostova · Examiner
                  </span>
                  <span className="text-[10px] text-slate-500">Vignan University (Faculty)</span>
                </div>
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">Load</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickCredential(
                    'inst-vit',
                    'VIT-TECH-DEMO',
                    'examiner@university.edu'
                  )
                }
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Dr. Sarah Jenkins · Examiner
                  </span>
                  <span className="text-[10px] text-slate-500">VIT (Faculty)</span>
                </div>
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">Load</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickCredential(
                    'inst-vignan',
                    'VIGNAN-UNIV-DEMO',
                    'alex.student@smartexam.edu'
                  )
                }
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Alex Rivera · Examinee
                  </span>
                  <span className="text-[10px] text-slate-500">Vignan University (Student)</span>
                </div>
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">Load</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
