'use client';

import { User, Baby } from '@phosphor-icons/react';

interface PatientAvatarProps {
  sexe: 'M' | 'F';
  dateNaissance: string;
  size?: number;
  className?: string;
}

function getAge(dateNaissance: string): number {
  const birth = new Date(dateNaissance);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
  return years;
}

export default function PatientAvatar({ sexe, dateNaissance, size = 24, className = '' }: PatientAvatarProps) {
  const age = getAge(dateNaissance);
  const isChild = age < 18;
  const isMale = sexe === 'M';

  let bgClass: string;
  if (isChild) {
    bgClass = isMale
      ? 'bg-gradient-to-br from-sky-400 to-blue-500'
      : 'bg-gradient-to-br from-pink-300 to-rose-400';
  } else {
    bgClass = isMale
      ? 'bg-gradient-to-br from-blue-500 to-blue-700'
      : 'bg-gradient-to-br from-rose-400 to-rose-600';
  }

  const containerSize = Math.round(size * 1.6);
  const iconSize = size;
  const Icon = isChild ? Baby : User;

  return (
    <div
      className={`rounded-xl flex items-center justify-center ${bgClass} ${className}`}
      style={{ width: containerSize, height: containerSize }}
    >
      <Icon size={iconSize} weight="duotone" className="text-white" />
    </div>
  );
}
