import { Check, CheckCheck } from 'lucide-react';

const STATUS_COLORS = {
  sent: '#9AAAB4',
  delivered: '#9AAAB4',
  read: '#53BDEB',
};

export default function Tick({ status = 'sent', size = 14 }) {
  if (status === 'delivered' || status === 'read') {
    return <CheckCheck size={size} color={STATUS_COLORS[status]} aria-label={status} />;
  }

  return <Check size={size} color={STATUS_COLORS.sent} aria-label="sent" />;
}
