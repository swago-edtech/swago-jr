import type { Config } from "tailwindcss";

const config: Config = {
  // ⬇️⬇️ THIS PART WAS MISSING ⬇️⬇️
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ⬆️⬆️ END OF MISSING PART ⬆️⬆️
  theme: {
    extend: {
      colors: {
        swago: {
          teal: "hsl(174, 72%, 56%)",
          purple: "hsl(259, 81%, 64%)",
          orange: "hsl(22, 91%, 64%)",
          pink: "hsl(326, 91%, 64%)",
          yellow: "hsl(45, 93%, 58%)",
          "sky-blue": "hsl(204, 81%, 59%)",
        },
      },
    },
  },
  // ⬇️⬇️ THIS IS THE LINE TO ADD ⬇️⬇️
  plugins: [require("@tailwindcss/line-clamp")],
};
export default config;