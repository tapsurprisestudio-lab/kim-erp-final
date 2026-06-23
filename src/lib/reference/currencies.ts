const priorityCodes = ["LYD", "USD", "EUR", "GBP", "SAR", "AED", "KWD", "JOD", "EGP", "TRY"];

export function currencyName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function currencySymbol(code: string) {
  try {
    return (
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol"
      })
        .formatToParts(1)
        .find((part) => part.type === "currency")?.value ?? code
    );
  } catch {
    return code;
  }
}

export function getIsoCurrencies() {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  const codes = supported?.("currency") ?? priorityCodes;
  return [...new Set([...priorityCodes, ...codes])].map((code, index) => ({
    code,
    name: currencyName(code),
    symbol: currencySymbol(code),
    priority: priorityCodes.includes(code) ? priorityCodes.indexOf(code) : index + 100
  }));
}
