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
        scrollbar: "EEEEEE"
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatComplex: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(10px, -10px) rotate(5deg)' },
          '50%': { transform: 'translate(-10px, 10px) rotate(-5deg)' },
          '75%': { transform: 'translate(5px, -5px) rotate(3deg)' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)' },
        },
      },
      animation: {
        fadeInHighlight: 'fadeInHighlight 0.1s infinite alternate',
        fadeInGradientSticker: 'fadeInGradientSticker 0.5s ease-out forwards',
        gradientText: 'gradientText 2.0s infinite alternate',
        float: 'float 3s ease-in-out infinite',
        floatComplex: 'floatComplex 4s linear infinite',
      },
    },
  },
  plugins: [],
};
