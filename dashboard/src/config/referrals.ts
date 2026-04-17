// Replace placeholder codes with your actual referral IDs
const REFERRAL_CODES: Record<string, string> = {
  Binance: "YOUR_BINANCE_REF",
  Bybit: "YOUR_BYBIT_REF",
  Bitget: "YOUR_BITGET_REF",
  Ondo: "YOUR_ONDO_REF",
  Turtle: "YOUR_TURTLE_REF",
  Huma: "YOUR_HUMA_REF",
};

const REFERRAL_BASE_URLS: Record<string, string> = {
  Binance:
    "https://www.binance.com/en/activity/referral-entry?fromActivityPage=true&ref=",
  Bybit: "https://www.bybit.com/invite?ref=",
  Bitget: "https://www.bitget.com/referral/register?clacCode=",
  Ondo: "https://ondo.finance/referral/",
  Turtle: "https://turtle.club/ref/",
  Huma: "https://app.huma.finance/?ref=",
};

export function getReferralLink(platform: string): string | null {
  const base = REFERRAL_BASE_URLS[platform];
  const code = REFERRAL_CODES[platform];
  if (!base || !code) return null;
  return `${base}${code}`;
}
