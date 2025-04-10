module.exports = {
  mode: 'jit',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        customBg: "#FEFAEE",
        sidebarBg: "#FFFFFF",
        accentOrange: "#F49D85",
        accentGreen: "#AEDFB4",
        accentGray: "#D3D3D3",
        cardBg: "#FFFFFF",
        hoverText: "#EB373E",
        lightOrange: "#F5D194",
      },
      keyframes: {
        fadeInHighlight: {
          '0%': { opacity: 0, transform: 'translateY(-2px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeInGradientSticker: {
          '0%': { opacity: 0, transform: 'translateY(-5px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        gradientText: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        fadeInHighlight: 'fadeInHighlight 0.1s infinite alternate',
        fadeInGradientSticker: 'fadeInGradientSticker 0.5s ease-out forwards',
        gradientText: 'gradientText 2.0s infinite alternate',
      },
    },
  },
  plugins: [],
};
