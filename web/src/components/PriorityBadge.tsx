import React from 'react';
import { AlertTriangle, TrendingUp, Clock, TrendingDown } from 'lucide-react';

type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

interface PriorityBadgeProps {
  priority?: PriorityLevel;
  size?: 'small' | 'normal';
  showLabel?: boolean;
}

const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgente',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <AlertTriangle size={12} />
  },
  high: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <TrendingUp size={12} />
  },
  normal: {
    label: 'Normal',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock size={12} />
  },
  low: {
    label: 'Baixa',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <TrendingDown size={12} />
  }
};

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority = 'normal', 
  size = 'small',
  showLabel = false 
}) => {
  const config = PRIORITY_CONFIG[priority];
  
  if (priority === 'normal' && !showLabel) {
    return null; // Não mostra badge para prioridade normal se não for explicitamente solicitado
  }

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium border ${config.color} ${
        size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
      title={`Prioridade: ${config.label}`}
    >
      {config.icon}
      {showLabel && <span className="ml-1">{config.label}</span>}
    </span>
  );
};

export default PriorityBadge;