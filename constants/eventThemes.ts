export type EventTheme =
  | "toro"
  | "toro_embolado"
  | "confeti"
  | "furgoneta"
  | "charanga"
  | "discomovil"
  | "desencajonada"
  | "cena_patronal"
  | "chupinazo"
  | "encierro";

export const EVENT_THEME_OPTIONS: { value: EventTheme; label: string }[] = [
  { value: "toro", label: "Toro" },
  { value: "toro_embolado", label: "Toro embolado" },
  { value: "confeti", label: "Oleada de confeti" },
  { value: "furgoneta", label: "Furgoneta DJ" },
  { value: "charanga", label: "Charanga" },
  { value: "discomovil", label: "Discomóvil" },
  { value: "desencajonada", label: "Desencajonada de toro" },
  { value: "cena_patronal", label: "Cena patronal" },
  { value: "chupinazo", label: "Chupinazo" },
  { value: "encierro", label: "Encierro" },
];

export function isEventTheme(value: string): value is EventTheme {
  return EVENT_THEME_OPTIONS.some((option) => option.value === value);
}
