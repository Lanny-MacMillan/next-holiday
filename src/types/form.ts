export interface FormField {
  id: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'number'
    | 'date'
    | 'url'
    | 'checkbox'
    | 'email'
    | 'tel';
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  step?: string;
  min?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface FormConfig {
  fields: FormField[];
  submitText: string;
  cardClassName?: string;
  showAddressBook?: boolean;
  submitButtonColor?: string;
}
