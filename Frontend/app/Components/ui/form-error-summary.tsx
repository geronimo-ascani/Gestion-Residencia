import { useEffect, useRef } from "react";

export interface FormErrorItem {
  id: string;
  message: string;
}

export interface FormErrorSummaryProps {
  errors: FormErrorItem[];
  title?: string;
}

/**
 * Focusable error summary for forms that can fail with multiple errors.
 * Complements the inline field errors: it links each message to its field and
 * receives focus after a failed submission.
 */
export function FormErrorSummary({
  errors,
  title = "Revisa estos campos:",
}: FormErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  if (errors.length === 0) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-3 focus-visible:outline-none dark:border-red-900 dark:bg-red-950/50"
    >
      <p className="text-sm font-medium text-red-800 dark:text-red-200">
        {title}
      </p>
      <ul className="mt-1 list-disc pl-5 text-sm text-red-700 dark:text-red-300">
        {errors.map((error) => (
          <li key={error.id}>
            <a href={`#${error.id}`} className="underline underline-offset-2">
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
