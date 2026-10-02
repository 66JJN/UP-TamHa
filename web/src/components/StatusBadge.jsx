import { CLAIM_STATUS_LABELS, REPORT_LABELS, STATUS_LABELS } from '../constants/appData.js';

export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{STATUS_LABELS[status] || status}</span>;
}

export function ReportBadge({ type }) {
  return <span className={`report-badge report-${type.toLowerCase()}`}>{REPORT_LABELS[type] || type}</span>;
}

export function ClaimBadge({ status }) {
  return <span className={`status-badge claim-${status.toLowerCase()}`}>{CLAIM_STATUS_LABELS[status] || status}</span>;
}

