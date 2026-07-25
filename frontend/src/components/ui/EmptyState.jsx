import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

export const EmptyState = ({
  icon: Icon = FileQuestion,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed my-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600 max-w-md">{description}</p>
      {(primaryActionText || secondaryActionText) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {secondaryActionText && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionText}
            </Button>
          )}
          {primaryActionText && (
            <Button variant="primary" onClick={onPrimaryAction}>
              {primaryActionText}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
