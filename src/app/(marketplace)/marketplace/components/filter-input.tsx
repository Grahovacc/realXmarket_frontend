import { InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const FilterInput = ({
  label,
  value,
  className,
  onChange,
  type,
  ...props
}: InputProps) => {
  return (
    <div className="flex w-full flex-col gap-2">
      {label ? <p className="text-[16px]/[24px] font-medium uppercase">{label}</p> : null}

      <input
        value={value}
        onChange={onChange}
        className={cn(
          'flex h-10 w-full rounded-md border border-caption bg-background px-4 py-2 text-sm placeholder:text-muted-foreground'
        )}
        {...props}
      />
    </div>
  );
};
