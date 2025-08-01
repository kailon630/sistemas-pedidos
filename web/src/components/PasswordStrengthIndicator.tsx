import React from 'react';
import { getPasswordStrengthColor, getPasswordStrengthText } from '../utils/passwordValidation';
import type { PasswordValidation } from '../types/profile';

interface PasswordStrengthIndicatorProps {
  validation: PasswordValidation;
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  validation, 
  password 
}) => {
  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de força */}
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded ${
              level <= validation.score
                ? getPasswordStrengthColor(validation.score)
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Texto da força */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${
          validation.score <= 1 ? 'text-red-600' :
          validation.score <= 2 ? 'text-yellow-600' :
          validation.score <= 3 ? 'text-blue-600' : 'text-green-600'
        }`}>
          {getPasswordStrengthText(validation.score)}
        </span>
      </div>

      {/* Feedback */}
      {validation.feedback.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          {validation.feedback.map((msg, index) => (
            <div key={index} className="flex items-center space-x-1">
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;