import { Zap } from "lucide-react";
import { TEXT_DETAIL } from "@/lib/text";

const STYLES: Record<string, {
  icon: React.ReactNode;
  label: string;
  border: string;
  bg: string;
  text: string;
  title: string;
}> = {
  Default: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    ),
    label:  "Creator Fees",
    border: "border-zinc-500/40",
    bg:     "bg-zinc-500/10",
    text:   "text-zinc-400",
    title:  "Default Mode — creator earns fees from every trade",
  },
  Cashback: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
        <path d="M19.3788 15.1057C20.9258 11.4421 19.5373 7.11431 16.0042 5.0745C13.4511 3.60046 10.4232 3.69365 8.03452 5.0556L7.04216 3.31879C10.028 1.61639 13.8128 1.4999 17.0042 3.34245C21.4949 5.93513 23.2139 11.4848 21.1217 16.112L22.4635 16.8867L18.2984 19.1008L18.1334 14.3867L19.3788 15.1057ZM4.62961 8.89968C3.08263 12.5633 4.47116 16.8911 8.00421 18.9309C10.5573 20.4049 13.5851 20.3118 15.9737 18.9499L16.9661 20.6867C13.9803 22.389 10.1956 22.5055 7.00421 20.663C2.51357 18.0703 0.794565 12.5206 2.88672 7.89342L1.54492 7.11873L5.70999 4.90463L5.87505 9.61873L4.62961 8.89968ZM8.50421 14.0027H14.0042C14.2804 14.0027 14.5042 13.7788 14.5042 13.5027C14.5042 13.2266 14.2804 13.0027 14.0042 13.0027H10.0042C8.6235 13.0027 7.50421 11.8834 7.50421 10.5027C7.50421 9.122 8.6235 8.00271 10.0042 8.00271H11.0042V7.00271H13.0042V8.00271H15.5042V10.0027H10.0042C9.72807 10.0027 9.50421 10.2266 9.50421 10.5027C9.50421 10.7788 9.72807 11.0027 10.0042 11.0027H14.0042C15.3849 11.0027 16.5042 12.122 16.5042 13.5027C16.5042 14.8834 15.3849 16.0027 14.0042 16.0027H13.0042V17.0027H11.0042V16.0027H8.50421V14.0027Z" />
      </svg>
    ),
    label:  "Cashback Mode",
    border: "border-emerald-500/40",
    bg:     "bg-emerald-500/10",
    text:   "text-emerald-400",
    title:  "Cashback Coins — 100% of creator fees go back to traders",
  },
  Mayhem: {
    icon: <Zap className="w-4 h-4 shrink-0" />,
    label:  "Mayhem Mode",
    border: "border-orange-500/40",
    bg:     "bg-orange-500/10",
    text:   "text-orange-400",
    title:  "Mayhem Mode — AI trading agent active for first 24h of coin life",
  },
  Agent: {
    icon: (
      <svg width="16" height="16" viewBox="8 8 24 24" fill="currentColor" className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M20.2734 8.27344C20.8871 8.27344 21.3845 8.76379 21.3845 9.36868L21.3845 10.4639L26.9401 10.4639C28.1674 10.4639 29.1623 11.4446 29.1623 12.6544L29.1623 20.3211C29.1623 21.1318 28.7154 21.8397 28.0512 22.2185L28.0512 23.1531L29.948 25.0228C30.3819 25.4505 30.3819 26.144 29.948 26.5717C29.5141 26.9994 28.8106 26.9994 28.3767 26.5717L27.6968 25.9016C26.7073 29.0147 23.758 31.2734 20.2734 31.2734C16.7889 31.2734 13.8395 29.0147 12.8501 25.9016L12.1702 26.5717C11.7363 26.9994 11.0328 26.9994 10.5989 26.5717C10.165 26.144 10.165 25.4505 10.5989 25.0228L12.4957 23.1531L12.4957 22.2185C11.8314 21.8397 11.3845 21.1318 11.3845 20.3211L11.3845 12.6544C11.3845 11.4446 12.3795 10.4639 13.6068 10.4639L19.1623 10.4639L19.1623 9.36868C19.1623 8.76379 19.6598 8.27344 20.2734 8.27344ZM13.6068 12.6544L13.6068 20.3211L26.9401 20.3211L26.9401 12.6544L13.6068 12.6544Z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M16.9401 14.8449C17.5538 14.8449 18.0512 15.3352 18.0512 15.9401L18.0512 17.0353C18.0512 17.6402 17.5538 18.1306 16.9401 18.1306C16.3265 18.1306 15.829 17.6402 15.829 17.0353L15.829 15.9401C15.829 15.3352 16.3265 14.8449 16.9401 14.8449ZM23.6068 14.8449C24.2204 14.8449 24.7179 15.3352 24.7179 15.9401L24.7179 17.0353C24.7179 17.6402 24.2204 18.1306 23.6068 18.1306C22.9931 18.1306 22.4957 17.6402 22.4957 17.0353L22.4957 15.9401C22.4957 15.3352 22.9931 14.8449 23.6068 14.8449Z" />
      </svg>
    ),
    label:  "Agent Mode",
    border: "border-sky-500/40",
    bg:     "bg-sky-500/10",
    text:   "text-sky-400",
    title:  "Tokenized Agent — automated buyback & burn via deposited revenue",
  },
};

export function CreationModeBadge({ mode }: { mode: string }) {
  const style = STYLES[mode];
  if (!style) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${TEXT_DETAIL} font-semibold ${style.border} ${style.bg} ${style.text}`}
      title={style.title}
    >
      {style.icon}
      {style.label}
    </span>
  );
}
