import React, { useState, useEffect } from 'react';
import { ExportSettings, UserProfile } from '../types';
import {
  FileSpreadsheet,
  User,
  Hash,
  Clock,
  StickyNote,
  AlertCircle,
  CheckCircle,
  Users,
  X,
  RotateCcw,
  AlertTriangle,
  Database,
  Check,
  CheckSquare,
  BarChart3,
  Lock,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Building
} from 'lucide-react';
import {
  saveEmployeeMapping,
  normalizeEmployeeId,
} from '../utils/employeeDirectory';
import { getTeamForSapId } from '../utils/teamDatabase';
import { useLanguage } from '../i18n/LanguageContext';

interface ExportCardProps {
  exportSettings: ExportSettings;
  onChangeSettings: (settings: ExportSettings) => void;
  onExport: () => void;
  onSubmitToTeamLeader?: () => void;
  onNavigateTab?: (tab: 'team_leader_approvals' | 'manager_overview' | 'employee_ledger') => void;
  overtimeCount: number;
  missingReasonsCount: number;
  unresolvedAbsencesCount?: number;
  onOpenStickyNotes: () => void;
  onOpenDirectory?: () => void;
  currentUser?: UserProfile;
}

export const ExportCard: React.FC<ExportCardProps> = ({
  exportSettings,
  onChangeSettings,
  onExport,
  onSubmitToTeamLeader,
  onNavigateTab,
  overtimeCount,
  missingReasonsCount,
  unresolvedAbsencesCount = 0,
  onOpenStickyNotes,
  onOpenDirectory,
  currentUser,
}) => {
  const { t } = useLanguage();

  // Handle SAP / Employee ID Input with Strict Numeric Enforcement
  const handleIdChange = (rawId: string) => {
    // Strictly enforce numeric digits only
    const numericId = rawId.replace(/[^0-9]/g, '');

    if (!numericId) {
      onChangeSettings({
        ...exportSettings,
        employeeId: '',
      });
      return;
    }

    const team = getTeamForSapId(numericId);
    onChangeSettings({
      ...exportSettings,
      employeeId: numericId,
      teamId: team?.id || exportSettings.teamId,
      teamName: team?.name || exportSettings.teamName,
      teamLeaderSapId: team?.leaderSapId || exportSettings.teamLeaderSapId,
      teamLeaderName: team?.leaderName || exportSettings.teamLeaderName,
    });
  };

  // Handle Employee Name change (Strict Letters Only - accepts English and Arabic characters)
  const handleNameChange = (rawName: string) => {
    // Strip digits only, preserving letters in all languages
    const lettersOnlyName = rawName.replace(/[0-9\d]/g, '');
    const cleanId = normalizeEmployeeId(exportSettings.employeeId);
    const team = getTeamForSapId(cleanId);

    onChangeSettings({
      ...exportSettings,
      name: lettersOnlyName,
      teamId: exportSettings.teamId || team?.id,
      teamName: exportSettings.teamName || team?.name,
      teamLeaderSapId: exportSettings.teamLeaderSapId || team?.leaderSapId,
      teamLeaderName: exportSettings.teamLeaderName || team?.leaderName,
    });
  };

  const handleBlurSave = () => {
    const cleanId = normalizeEmployeeId(exportSettings.employeeId);
    const cleanName = exportSettings.name.trim();
    const team = getTeamForSapId(cleanId);
    if (cleanId && cleanName) {
      saveEmployeeMapping(cleanId, cleanName, {
        teamId: exportSettings.teamId || team?.id,
        teamName: exportSettings.teamName || team?.name,
        teamLeaderSapId: exportSettings.teamLeaderSapId || team?.leaderSapId,
        teamLeaderName: exportSettings.teamLeaderName || team?.leaderName,
      });
    }
  };

  const handleClearId = () => {
    onChangeSettings({
      ...exportSettings,
      employeeId: '',
    });
  };

  const handleClearName = () => {
    onChangeSettings({
      ...exportSettings,
      name: '',
    });
  };

  const update = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    onChangeSettings({ ...exportSettings, [key]: value });
  };

  const isSapValid = Boolean(
    exportSettings.employeeId?.trim() &&
    /^[0-9]+$/.test(exportSettings.employeeId.trim())
  );

  const isNameValid = Boolean(
    exportSettings.name?.trim() &&
    exportSettings.name.trim().toLowerCase() !== 'employee name' &&
    exportSettings.name.trim().toLowerCase() !== 'no employee name set'
  );

  const hasMissingItems =
    missingReasonsCount > 0 ||
    unresolvedAbsencesCount > 0 ||
    !isSapValid ||
    !isNameValid;

  const rawTeam = exportSettings.employeeId ? getTeamForSapId(exportSettings.employeeId) : null;
  const isSubmitterLeader = (rawTeam && normalizeEmployeeId(rawTeam.leaderSapId) === normalizeEmployeeId(exportSettings.employeeId)) || currentUser?.role === 'team_leader';

  const assignedTeam = exportSettings.teamName 
    ? { 
        name: exportSettings.teamName, 
        leaderName: exportSettings.teamLeaderName, 
        leaderSapId: exportSettings.teamLeaderSapId,
        managerName: exportSettings.managerName,
        managerSapId: exportSettings.managerSapId
      }
    : rawTeam;

  const assignedApproverName = isSubmitterLeader
    ? (assignedTeam?.managerName || exportSettings.managerName || 'Operations Director')
    : (assignedTeam?.leaderName || exportSettings.teamLeaderName || 'Team Leader');

  const assignedApproverSap = isSubmitterLeader
    ? (assignedTeam?.managerSapId || exportSettings.managerSapId || '1001')
    : (assignedTeam?.leaderSapId || exportSettings.teamLeaderSapId || '2001');

  const assignedApproverRole = isSubmitterLeader ? t('role.manager', 'Reporting Manager') : t('role.team_leader', 'Team Leader');
  const assignedTeamName = assignedTeam?.name || exportSettings.teamName || 'Operations Team Alpha';

  return (
    <div className="bg-card border-2 border-primary/40 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between gap-5">
      {/* Card Header & Quick Tools */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-foreground font-bold">
                {t('export.card_title')}
              </h2>
            </div>
          </div>

          {/* Quick Helper Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenDirectory && (
              <button
                type="button"
                onClick={onOpenDirectory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-muted/60 hover:bg-muted text-foreground border border-border transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                title="Manage local employee database"
              >
                <Database className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('export.emp_db')}</span>
              </button>
            )}

            {(exportSettings.employeeId || exportSettings.name) && (
              <button
                type="button"
                onClick={handleClearId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                title="Clear entered ID & Name"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('export.reset_profile')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenStickyNotes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
              title="Import overtime reasons from Sticky Notes"
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>{t('export.sticky_notes')}</span>
            </button>
          </div>
        </div>

        {/* Parameter Blocks Header & Approver Information */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-foreground">
              {t('export.params_title')}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{assignedApproverRole}: {assignedApproverName} (SAP #{assignedApproverSap})</span>
          </div>
        </div>

        {/* 3 Dedicated Parameter Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Block 1: SAP ID with Strict Numeric Input */}
          <div
            className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between min-w-0 relative"
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 truncate">
                <Hash className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{t('export.sap_label')}</span>
              </label>
              {isSapValid ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shrink-0 whitespace-nowrap">
                    {t('export.sap_valid')}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearId}
                    className="p-0.5 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete / Clear SAP ID"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shrink-0 whitespace-nowrap">
                  {t('export.sap_numbers_only')}
                </span>
              )}
            </div>

            <div className="space-y-2 relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={exportSettings.employeeId}
                  onChange={(e) => handleIdChange(e.target.value)}
                  onBlur={handleBlurSave}
                  placeholder={t('export.sap_placeholder')}
                  className={`w-full min-w-0 bg-background rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-foreground focus:outline-hidden transition-all ${
                    isSapValid
                      ? 'border border-border focus:border-amber-500'
                      : 'border border-amber-500/60 focus:border-amber-400 placeholder:text-amber-400/60'
                  }`}
                />
                {exportSettings.employeeId && (
                  <button
                    type="button"
                    onClick={handleClearId}
                    className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-muted transition-colors cursor-pointer"
                    title="Clear entered number"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Block 2: Employee Name */}
          <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{t('export.name_label')}</span>
              </label>
              {isNameValid ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shrink-0 whitespace-nowrap">
                    {t('export.name_set')}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearName}
                    className="p-0.5 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete / Clear Employee Name"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shrink-0 whitespace-nowrap">
                  {t('export.name_type')}
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                inputMode="text"
                value={exportSettings.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={handleBlurSave}
                placeholder={t('export.name_placeholder')}
                className={`w-full min-w-0 bg-background rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-foreground focus:outline-hidden transition-all ${
                  isNameValid
                    ? 'border border-border focus:border-amber-500'
                    : 'border border-amber-500/60 focus:border-amber-400 placeholder:text-amber-400/60'
                }`}
              />
              {exportSettings.name && (
                <button
                  type="button"
                  onClick={handleClearName}
                  className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-muted transition-colors cursor-pointer"
                  title="Delete / Clear name"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Block 3: Shift End ("From" Time) */}
          <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{t('export.shift_end_label')}</span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shrink-0 whitespace-nowrap">
                {t('export.name_set')}
              </span>
            </div>

            <div>
              <input
                type="time"
                value={exportSettings.shiftEnd}
                onChange={(e) => update('shiftEnd', e.target.value)}
                className="w-full min-w-0 bg-background border border-border focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`mt-4 p-3.5 rounded-2xl border transition-all text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            !isSapValid || !isNameValid
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : unresolvedAbsencesCount > 0
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : missingReasonsCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : overtimeCount > 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-muted/30 border-border text-muted-foreground'
          }`}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            {!isSapValid ? (
              <>
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">
                  {t('export.err_sap')}
                </span>
              </>
            ) : !isNameValid ? (
              <>
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">
                  {t('export.err_name')}
                </span>
              </>
            ) : unresolvedAbsencesCount > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold">
                  {t('export.err_absent').replace('{count}', String(unresolvedAbsencesCount))}
                </span>
              </>
            ) : missingReasonsCount > 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">
                  {t('export.err_reasons').replace('{count}', String(missingReasonsCount))}
                </span>
              </>
            ) : overtimeCount > 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">
                  {t('export.all_verified').replace('{sap}', exportSettings.employeeId).replace('{name}', exportSettings.name).replace('{count}', String(overtimeCount))} {assignedTeam ? `(${assignedTeam.name})` : ''}
                </span>
              </>
            ) : (
              <span>
                {t('export.no_ot')}
              </span>
            )}
          </div>

          {missingReasonsCount > 0 && isSapValid && isNameValid && (
            <button
              type="button"
              onClick={onOpenStickyNotes}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 shrink-0 shadow-2xs cursor-pointer whitespace-nowrap"
            >
              {t('export.fill_sticky')}
            </button>
          )}
        </div>
      </div>

      {/* Main Action Buttons Grid */}
      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {onSubmitToTeamLeader && (
          <button
            type="button"
            disabled={!isSapValid || !isNameValid || hasMissingItems}
            onClick={onSubmitToTeamLeader}
            className={`w-full py-3.5 px-5 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 ${
              !isSapValid || !isNameValid
                ? 'bg-muted/50 text-muted-foreground border border-border cursor-not-allowed opacity-60'
                : hasMissingItems
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 active:scale-[0.99] cursor-pointer'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 active:scale-[0.99] cursor-pointer'
            }`}
          >
            {!isSapValid || !isNameValid ? (
              <Lock className="w-4 h-4 shrink-0 text-muted-foreground" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">
              {!isSapValid
                ? t('export.lock_sap')
                : !isNameValid
                ? t('export.lock_name')
                : hasMissingItems
                ? `${t('export.complete_missing')} (${missingReasonsCount + unresolvedAbsencesCount})`
                : `${isSubmitterLeader ? t('export.submit_to_mgr', 'Submit to Manager:') : t('export.submit_btn', 'Submit to Team Leader:')} ${assignedApproverName} (${overtimeCount} ${t('rules.hrs')})`}
            </span>
          </button>
        )}

        <button
          type="button"
          disabled={!isSapValid || !isNameValid || hasMissingItems || overtimeCount === 0}
          onClick={() => {
            if (!isSapValid) {
              alert(t('val.invalid_sap_numeric'));
              return;
            }
            if (!isNameValid) {
              alert(t('val.cannot_export_name'));
              return;
            }
            if (hasMissingItems) {
              alert(t('val.missing_reasons_export'));
              return;
            }
            if (overtimeCount === 0) {
              alert(t('val.no_ot_export'));
              return;
            }
            onExport();
          }}
          className={`w-full py-3.5 px-5 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 ${
            !isSapValid || !isNameValid
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 cursor-not-allowed opacity-60'
              : hasMissingItems
              ? 'bg-muted/50 text-muted-foreground border border-amber-500/30 cursor-not-allowed opacity-60'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.99] cursor-pointer'
          } ${!onSubmitToTeamLeader ? 'sm:col-span-2' : ''}`}
        >
          {!isSapValid || !isNameValid ? (
            <Lock className="w-4 h-4 shrink-0 text-rose-400" />
          ) : hasMissingItems ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
          )}
          <span className="truncate">
            {!isSapValid
              ? t('export.lock_sap')
              : !isNameValid
              ? t('export.lock_name_excel')
              : missingReasonsCount > 0
              ? `${t('export.complete_missing')} (${missingReasonsCount})`
              : unresolvedAbsencesCount > 0
              ? t('val.missing_absent_export')
              : `${t('export.export_btn')} (${overtimeCount})`}
          </span>
        </button>
      </div>
    </div>
  );
};
