import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        swago: {
          teal: "hsl(174, 72%, 56%)",
          purple: "hsl(259, 81%, 64%)",
          orange: "hsl(22, 91%, 64%)",
          pink: "hsl(326, 91%, 64%)",
          // Add these two colors for the carousel
          yellow: "hsl(45, 93%, 58%)",
          "sky-blue": "hsl(204, 81%, 59%)",
        },
      },
    },
  },
  plugins: [],
};
export default config;