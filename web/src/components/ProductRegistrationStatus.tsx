import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface ProductRegistrationStatusProps {
  status: 'pending' | 'approved' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
}

const ProductRegistrationStatus: React.FC<ProductRegistrationStatusProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const configs = {
    pending: {
      icon: Clock,
      label: 'Pendente',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    approved: {
      icon: CheckCircle,
      label: 'Aprovado',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    rejected: {
      icon: XCircle,
      label: 'Rejeitado',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <span className={`
      inline-flex items-center border rounded-full font-medium
      ${config.className} ${sizeClasses[size]}
    `}>
      <Icon size={iconSizes[size]} className="mr-1.5" />
      {config.label}
    </span>
  );
};

export default ProductRegistrationStatus;